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

const mockGenerateText = () => {
	return {
		response: {
			messages: [
				{
					type: "text",
					content: "This is a mock response.",
					role: "assistant",
				},
			],
		},
	};
};

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
};

export async function POST(req: Request) {
	const {
		messages,
		entity,
		options,
	}: { messages: CoreMessage[]; entity: Entity; options?: FormoraChatOptions } =
		await req.json();

	const universeId = entity.universeId;
	console.log(universeId);
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

	// Get the specific universe by ID
	const universeResult = await db
		.select()
		.from(universes)
		.where(eq(universes.id, universeId))
		.limit(1);

	if (!universeResult || universeResult.length === 0) {
		return NextResponse.json({ error: "Universe not found" }, { status: 404 });
	}

	const universe = universeResult[0];

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

	console.log("universe", universe);
	const results = await searchEntities("Who is darth vader", universe, 3);

	console.log("results: ", results);

	const contextItems = results.map((r) => {
		const entityName = r.payload.name;
		const description = wrapText(r.payload.description, 80);
		return `${entityName}: ${description}`;
	});

	const system = dedent`
    You are ${updatedEntity.name}.

    ${updatedEntity.description}

    You are chatting with someone from your universe.
    Do not refer to your self as an AI, stay in character.

    ======================================================== 
    Context - Here is some information that will be helpful.
    ======================================================== 
  
    ${contextItems.join("\n\n")}
  `;

	console.log(system);

	const { response } = await generateText({
		model: openai("gpt-4"),
		system,
		messages,
	});

	// const { response } = mockGenerateText();

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
				error: "Failed to generate audio",
			});
		}
	}

	// Default text-only response
	return Response.json({ messages: response.messages });
}
