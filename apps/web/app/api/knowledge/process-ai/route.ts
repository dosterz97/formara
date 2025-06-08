import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

// Initialize Gemini
const googleGenAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(req: Request) {
	try {
		const { text: inputText, botId } = await req.json();

		if (!inputText || !botId) {
			return NextResponse.json(
				{ error: "Text and botId are required" },
				{ status: 400 }
			);
		}

		// Create a prompt for Gemini to structure the knowledge
		const prompt = `Please analyze the following text and break it down into distinct knowledge entries. 
    For each entry, provide a name and content. The content should be clear, concise, and well-structured.
    Format the response as a JSON array of objects with 'name' and 'content' fields.
    
    Text to analyze:
    ${inputText}
    
    Respond with ONLY the raw JSON array, no markdown formatting, no code blocks, no additional text or explanation.`;

		const response = await googleGenAI.models.generateContent({
			model: "gemini-2.5-flash-preview-05-20",
			contents: prompt,
		});

		if (!response.text) {
			throw new Error("No response text from Gemini");
		}

		// Clean the response text by removing any markdown formatting
		const cleanedText = response.text
			.replace(/```json\s*/g, "") // Remove ```json prefix
			.replace(/```\s*$/g, "") // Remove ``` suffix
			.trim(); // Remove any extra whitespace

		// Parse the JSON response
		let knowledgeEntries;
		try {
			knowledgeEntries = JSON.parse(cleanedText);
		} catch (error) {
			console.error("Failed to parse Gemini response:", error);
			console.error("Raw response:", response.text);
			console.error("Cleaned text:", cleanedText);
			return NextResponse.json(
				{ error: "Failed to process AI response" },
				{ status: 500 }
			);
		}

		// Validate and format the entries
		const formattedEntries = knowledgeEntries.map((entry: any) => ({
			name: entry.name || "Untitled Entry",
			content: entry.content || "",
			botId,
			createdAt: new Date().toISOString(),
		}));

		return NextResponse.json(formattedEntries);
	} catch (error) {
		console.error("Error processing text with AI:", error);
		return NextResponse.json(
			{ error: "Failed to process text with AI" },
			{ status: 500 }
		);
	}
}
