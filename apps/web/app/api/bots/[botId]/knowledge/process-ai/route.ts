import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

// Initialize Gemini client
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ botId: string }> }
) {
	try {
		const { botId } = await params;
		const { text } = await request.json();

		if (!text || typeof text !== "string") {
			return NextResponse.json({ error: "Text is required" }, { status: 400 });
		}

		console.log(`Processing text with AI for bot ${botId}`);

		const model = genAI.models.generateContent;

		const prompt = `You are a JSON-only response bot. Your task is to analyze the following text and break it down into distinct, meaningful knowledge chunks. Each chunk should be self-contained and focused on a specific topic or concept.

IMPORTANT: You must respond with ONLY a valid JSON array, no other text, no markdown, no explanations.

Text to analyze:
${text}

Return a JSON array of objects with this exact format:
[
  {
    "name": "Descriptive chunk title",
    "content": "The content for this section..."
  }
]

Each chunk should:
- Have a clear, descriptive name
- Contain substantial content (at least 100 characters)
- Be self-contained and focused on one topic
- Use proper formatting and structure

Remember: Return ONLY the JSON array, nothing else.`;

		const result = await model({
			model: "gemini-2.0-flash",
			contents: prompt,
		});

		if (!result.text) {
			throw new Error("No response text from Gemini");
		}

		const responseText = result.text.trim();

		// Clean up the response text in case it has markdown formatting
		let cleanedResponse = responseText;
		if (cleanedResponse.startsWith("```json")) {
			cleanedResponse = cleanedResponse.substring(7).trim();
		}
		if (cleanedResponse.endsWith("```")) {
			cleanedResponse = cleanedResponse
				.substring(0, cleanedResponse.length - 3)
				.trim();
		}

		// Parse the response as JSON
		let chunks;
		try {
			chunks = JSON.parse(cleanedResponse);

			// Validate chunks format
			if (!Array.isArray(chunks)) {
				throw new Error("Response is not an array");
			}

			// Filter and validate chunks
			chunks = chunks
				.filter(
					(chunk: any) =>
						chunk &&
						typeof chunk === "object" &&
						typeof chunk.name === "string" &&
						typeof chunk.content === "string" &&
						chunk.content.trim().length > 0
				)
				.map((chunk: any) => ({
					name: chunk.name.trim(),
					content: chunk.content.trim(),
				}));

			if (chunks.length === 0) {
				throw new Error("No valid chunks generated");
			}
		} catch (e) {
			console.error(
				"Failed to parse AI response:",
				e,
				"Raw response:",
				responseText
			);
			return NextResponse.json(
				{ error: "Failed to parse AI response" },
				{ status: 500 }
			);
		}

		console.log(`Successfully processed text into ${chunks.length} chunks`);

		return NextResponse.json(chunks);
	} catch (e: any) {
		console.error("Error processing text:", e);
		return NextResponse.json(
			{ error: e.message || "Failed to process text" },
			{ status: 500 }
		);
	}
}
