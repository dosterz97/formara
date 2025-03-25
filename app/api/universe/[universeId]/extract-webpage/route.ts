import { db } from "@/lib/db/drizzle";
import { getTeamForUser, getUser } from "@/lib/db/queries";
import { universes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// This file should be placed at: app/api/universe/[universeId]/extract-webpage/route.ts

// Define the Jina AI Reader API endpoint and key
// Jina AI Reader uses a simple URL-based API with Authorization header
const JINA_AI_READER_BASE_URL = "https://r.jina.ai/";
const JINA_AI_API_KEY = process.env.JINA_AI_API_KEY;

// Initialize OpenAI
const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

// Define entity types and statuses for OpenAI prompt
const ENTITY_TYPES = [
	"character",
	"location",
	"item",
	"event",
	"concept",
	"organization",
	"other",
];
const ENTITY_STATUSES = [
	"active",
	"inactive",
	"deceased",
	"historical",
	"conceptual",
	"unknown",
];

// POST endpoint to handle web page extraction using Jina AI
export async function POST(
	request: NextRequest,
	{ params }: { params: { universeId: string } }
) {
	try {
		const { universeId } = await params;

		if (!universeId) {
			return NextResponse.json(
				{ error: "Universe ID is required" },
				{ status: 400 }
			);
		}

		// Authenticate user and check team access
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const teamData = await getTeamForUser(user.id);
		if (!teamData) {
			return NextResponse.json({ error: "No team for user" }, { status: 500 });
		}

		// Get the universe to check permissions
		const universe = await db
			.select()
			.from(universes)
			.where(eq(universes.id, universeId))
			.limit(1);

		if (!universe || universe.length === 0) {
			return NextResponse.json(
				{ error: "Universe not found" },
				{ status: 404 }
			);
		}

		// Check if the universe belongs to the user's team
		if (universe[0].teamId !== teamData.id) {
			return NextResponse.json(
				{ error: "Unauthorized access to universe" },
				{ status: 403 }
			);
		}

		// Parse request body to get the URL
		const { url } = await request.json();

		if (!url || typeof url !== "string") {
			return NextResponse.json(
				{ error: "Valid URL is required" },
				{ status: 400 }
			);
		}

		// Verify URL format
		try {
			new URL(url);
		} catch (error) {
			return NextResponse.json(
				{ error: "Invalid URL format" },
				{ status: 400 }
			);
		}

		// Call Jina AI Reader API to extract content
		const jinaResponse = await fetchJinaAIContent(url);

		console.log("JINA RES:", jinaResponse);

		// Process extracted content to identify potential entities
		const entityAnalysis = await analyzeEntities(jinaResponse.data);

		console.log(entityAnalysis);

		return NextResponse.json({
			message: "Content extraction successful",
			jinaData: jinaResponse,
			entitySuggestions: entityAnalysis.entities,
			summary: entityAnalysis.summary,
		});
	} catch (error: any) {
		console.error("Error extracting content from web page:", error);
		return NextResponse.json(
			{
				error: "Failed to extract content",
				details: error.message || "Unknown error",
			},
			{ status: 500 }
		);
	}
}

// Helper function to fetch content from Jina AI Reader API
async function fetchJinaAIContent(url: string) {
	if (!JINA_AI_API_KEY) {
		throw new Error("Jina AI API key is not configured");
	}

	try {
		// Encode the URL properly to handle special characters
		const encodedUrl = encodeURIComponent(url);
		const jinaReaderUrl = `${JINA_AI_READER_BASE_URL}${encodedUrl}`;

		const response = await fetch(jinaReaderUrl, {
			method: "GET",
			headers: {
				Accept: "application/json",
				Authorization: `Bearer ${JINA_AI_API_KEY}`,
			},
		});

		if (!response.ok) {
			throw new Error(
				`Jina AI Reader error (${response.status}): ${response.statusText}`
			);
		}

		// Return the full response data
		return await response.json();
	} catch (error) {
		console.error("Error calling Jina AI Reader API:", error);
		throw error;
	}
}

// Helper function to use OpenAI to analyze the content for potential entities
async function analyzeEntities(jinaData: any) {
	if (!process.env.OPENAI_API_KEY) {
		throw new Error("OpenAI API key is not configured");
	}

	const content =
		jinaData.content || jinaData.text || jinaData.description || "";
	const title = jinaData.title || "";

	console.log(content, title);

	const prompt = `
  Analyze the following content extracted from a web page titled "${title}" and identify potential entities that could be added to a universe database.
  
  For each entity you identify, provide:
  1. name: The name of the entity
  2. entity_type: One of [${ENTITY_TYPES.join(", ")}]
  3. description: A brief description of the entity
  4. status: One of [${ENTITY_STATUSES.join(", ")}]
  
  Also provide a summary of the content in 2-3 paragraphs.
  
  Content:
  ${content.substring(0, 6000)} ${content.length > 6000 ? "...(truncated)" : ""}
  
  Return your response as a JSON object with the following structure:
  {
    "summary": "Brief summary of the content",
    "entities": [
      {
        "name": "Entity name",
        "entity_type": "One of the valid entity types",
        "description": "Brief description",
        "status": "One of the valid statuses"
      },
      // Additional entities...
    ]
  }
  `;

	try {
		const completion = await openai.chat.completions.create({
			messages: [{ role: "user", content: prompt }],
			model: "gpt-4-turbo-preview",
			response_format: { type: "json_object" },
		});

		const responseContent = completion.choices[0]?.message?.content;

		if (!responseContent) {
			return {
				summary: "Failed to analyze content with AI.",
				entities: [],
			};
		}

		// Parse the JSON response
		try {
			return JSON.parse(responseContent);
		} catch (e) {
			console.error("Failed to parse OpenAI response as JSON:", e);
			return {
				summary: "Error parsing AI analysis results.",
				entities: [],
			};
		}
	} catch (error) {
		console.error("Error calling OpenAI API:", error);
		return {
			summary: "Error analyzing content with AI.",
			entities: [],
		};
	}
}
