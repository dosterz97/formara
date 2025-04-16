import { db } from "@/lib/db/drizzle";
import { searchEntities } from "@/lib/db/qdrant-client";
import { getTeamForUser, getUser } from "@/lib/db/queries";
import { Entity, entities, universes } from "@/lib/db/schema";
import { openai } from "@ai-sdk/openai";
import { CoreMessage, generateText } from "ai";
import dedent from "dedent";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// Eleven Labs API client
const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY;
const ELEVEN_LABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech";
// Default voice ID - you can replace with your preferred voice
const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel voice

/**
 * Helper function to wrap text at specified character width
 */
function wrapText(text: string, maxWidth: number): string {
	const words = text.split(" ");
	let lines = [];
	let currentLine = "";

	for (const word of words) {
		// Check if adding this word exceeds the max width
		if (currentLine.length + word.length + 1 > maxWidth) {
			lines.push(currentLine);
			currentLine = word;
		} else {
			// Add word to current line (with a space if not the first word)
			currentLine = currentLine.length === 0 ? word : `${currentLine} ${word}`;
		}
	}

	// Add the last line if not empty
	if (currentLine.length > 0) {
		lines.push(currentLine);
	}

	return lines.join("\n");
}

/**
 * Generate audio from text using Eleven Labs API
 */
async function generateAudio(
	text: string,
	voiceId: string
): Promise<ArrayBuffer> {
	if (!ELEVEN_LABS_API_KEY) {
		throw new Error("Eleven Labs API key is not configured");
	}

	const response = await fetch(`${ELEVEN_LABS_API_URL}/${voiceId}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"xi-api-key": ELEVEN_LABS_API_KEY,
		},
		body: JSON.stringify({
			text: text,
			model_id: "eleven_monolingual_v1",
			voice_settings: {
				stability: 0.5,
				similarity_boost: 0.75,
			},
		}),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Eleven Labs API error: ${response.status} ${errorText}`);
	}

	return await response.arrayBuffer();
}

export type FormoraChatOptions = {
	audio?: boolean;
	voiceId?: string;
	temperature?: number;
	relevanceThreshold?: number;
	maxSources?: number;
};

export async function POST(req: Request) {
	const {
		messages,
		entity,
		universe,
		options,
	}: {
		messages: CoreMessage[];
		entity: Entity;
		universe?: any;
		options?: FormoraChatOptions;
	} = await req.json();

	// Use the universe from the request if available, otherwise look it up
	let universeId = universe?.id || entity.universeId;
	let universeData = universe;

	console.log("Universe ID:", universeId);
	if (!universeId) {
		return NextResponse.json(
			{ error: "Universe id is required" },
			{ status: 400 }
		);
	}

	const user = await getUser();
	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const teamData = await getTeamForUser(user.id);
	if (!teamData) {
		return NextResponse.json({ error: "No team for user" }, { status: 500 });
	}

	// If universe data wasn't provided in the request, get it from the database
	if (!universeData) {
		// Get the specific universe by ID
		const universeResult = await db
			.select()
			.from(universes)
			.where(eq(universes.id, universeId))
			.limit(1);

		if (!universeResult || universeResult.length === 0) {
			return NextResponse.json(
				{ error: "Universe not found" },
				{ status: 404 }
			);
		}

		universeData = universeResult[0];
	}

	// Fetch the latest entity data to get the most up-to-date voice ID
	const latestEntityData = await db
		.select()
		.from(entities)
		.where(eq(entities.id, entity.id))
		.limit(1);

	if (!latestEntityData || latestEntityData.length === 0) {
		return NextResponse.json({ error: "Entity not found" }, { status: 404 });
	}

	// Use the freshly fetched entity data
	const updatedEntity = latestEntityData[0];

	// Get the latest message from the user to use for context search
	const latestUserMessage = [...messages]
		.reverse()
		.find((msg) => msg.role === "user");
	const searchQuery = latestUserMessage?.content || "general information";
	let queryText = "";

	// Handle different content types in the user message
	if (typeof searchQuery === "string") {
		queryText = searchQuery;
	} else if (Array.isArray(searchQuery)) {
		// Extract text from array of content parts
		queryText = searchQuery
			.filter((part) => part.type === "text" || "text" in part)
			.map((part) => {
				if (part.type === "text" && "text" in part) {
					return part.text;
				} else if ("text" in part) {
					return part.text;
				}
				return "";
			})
			.join(" ");
	}

	// Extract settings from options with defaults
	const temperature = options?.temperature || 0.7; // Default to 0.7 if not specified
	// const maxContextItems = options?.maxContextItems || 3; // Default to 3 if not specified

	const maxSources = options?.maxSources || 5; // Default to 5 if not specified
	const relevanceThreshold = options?.relevanceThreshold || 0.7; // Default to 0.7 if not specified

	console.log("Search settings:", {
		maxSources,
		relevanceThreshold,
		temperature,
		// maxContextItems,
	});

	console.log("Searching with query:", queryText);

	// Pass maxSources and relevanceThreshold to searchEntities
	const searchResults = await searchEntities(
		queryText,
		universeData,
		maxSources,
		relevanceThreshold
	);

	console.log("Search results:", searchResults);

	// Further limit to maxSources if needed
	const limitedResults = searchResults.slice(0, maxSources);

	const contextItems = limitedResults.map((r) => {
		const entityName = r.payload.name;
		const description = wrapText(r.payload.description, 80);
		return `${entityName}: ${description}`;
	});

	const system = dedent`
    You are ${updatedEntity.name}.

    ${updatedEntity.description}

    You are chatting with someone from your universe.
    Do not refer to yourself as an AI, stay in character.

    ======================================================== 
    Context - Here is some information that will be helpful.
    ======================================================== 
  
    ${contextItems.join("\n\n")}
  `;

	console.log(system);
	console.log(messages);

	const { response } = await generateText({
		model: openai("gpt-4"),
		system,
		messages,
		temperature,
	});

	// Extract the response text from the latest AI message
	let responseText = "";

	// Based on the error, we know response has a messages array
	// Get the last assistant message from the array
	if (response.messages && response.messages.length > 0) {
		// Get the last message (assuming it's from the assistant)
		const latestMessage = response.messages[response.messages.length - 1];

		// Check if it has a content property (CoreAssistantMessage should have this)
		if (
			latestMessage &&
			typeof latestMessage === "object" &&
			"content" in latestMessage
		) {
			const content = latestMessage.content;

			// Handle different content types
			if (typeof content === "string") {
				// If content is directly a string
				responseText = content;
			} else if (Array.isArray(content)) {
				// If content is an array of parts (TextPart | ToolCallPart)
				// Extract and concatenate all text parts
				responseText = content
					.filter((part) => part.type === "text" || "text" in part)
					.map((part) => {
						// Check if it's a TextPart or has a text property
						if (part.type === "text" && "text" in part) {
							return part.text;
						} else if ("text" in part) {
							return part.text;
						}
						return "";
					})
					.join(" ");
			}
		}
	}

	// If no text was found, use a default message
	if (!responseText) {
		console.error(
			"Could not extract response text from AI response:",
			JSON.stringify(response, null, 2)
		);
		responseText = "I'm sorry, but I couldn't generate a proper response.";
	}

	// Format search results for inclusion in the response
	const contextInfo = limitedResults.map((result) => ({
		id: result.id,
		name: result.payload.name,
		entityType: result.payload.entityType,
		description: result.payload.description,
		score: result.score,
	}));

	// If audio option is enabled and entity is a character, generate TTS
	if (options?.audio && updatedEntity.entityType === "character") {
		try {
			// Use voice priority:
			// 1. Voice specified in request options
			// 2. Entity's assigned voice
			// 3. Default voice
			const voiceId =
				options.voiceId || updatedEntity.voiceId || DEFAULT_VOICE_ID;

			console.log(`Generating audio with voice ID: ${voiceId}`);
			const audioBuffer = await generateAudio(responseText, voiceId);

			// Convert ArrayBuffer to Base64 string for transmission
			const audioBase64 = Buffer.from(audioBuffer).toString("base64");

			return Response.json({
				messages: response.messages,
				context: contextInfo, // Include context information
				audio: {
					data: audioBase64,
					format: "mp3",
				},
			});
		} catch (error) {
			console.error("TTS generation error:", error);
			// Fall back to text-only response on error
			return Response.json({
				messages: response.messages,
				context: contextInfo, // Still include context information
				error: "Failed to generate audio",
			});
		}
	}

	// Default text-only response with context information
	return Response.json({
		messages: response.messages,
		context: contextInfo,
	});
}
