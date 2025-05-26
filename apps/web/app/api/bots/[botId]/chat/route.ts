import { db } from "@/lib/db/drizzle";
import { searchKnowledge } from "@/lib/db/qdrant-client";
import { bots } from "@/lib/db/schema";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ botId: string }> }
) {
	const startTime = Date.now();
	const timings: { [key: string]: number } = {};

	try {
		const { botId } = await params;
		const { message } = await request.json();

		if (!message || typeof message !== "string") {
			return NextResponse.json(
				{ error: "Message is required" },
				{ status: 400 }
			);
		}

		console.log(`Chat request for bot ${botId}:`, message);

		// Get bot details
		const botFetchStart = Date.now();
		const bot = await db.select().from(bots).where(eq(bots.id, botId)).limit(1);
		timings.botFetch = Date.now() - botFetchStart;

		if (bot.length === 0) {
			return NextResponse.json({ error: "Bot not found" }, { status: 404 });
		}

		const botData = bot[0];

		// Search for relevant knowledge
		const knowledgeSearchStart = Date.now();
		let relevantKnowledge: string[] = [];
		let knowledgeSources: Array<{
			name: string;
			content: string;
			score: number;
		}> = [];
		try {
			const knowledgeResults = await searchKnowledge(message, botId, 3, 0.7);
			relevantKnowledge = knowledgeResults.map(
				(result) => `${result.payload?.name}: ${result.payload?.content}`
			);
			knowledgeSources = knowledgeResults.map((result) => ({
				name: result.payload?.name || "Untitled",
				content: result.payload?.content || "",
				score: result.score,
			}));
			console.log(
				`Found ${relevantKnowledge.length} relevant knowledge entries`
			);
		} catch (error) {
			console.warn("No relevant knowledge found or search failed:", error);
			// Continue without knowledge base if search fails
		}
		timings.knowledgeSearch = Date.now() - knowledgeSearchStart;

		// Construct the system prompt
		const promptConstructionStart = Date.now();
		const systemPrompt = `${
			botData.systemPrompt || "You are a helpful AI assistant."
		}

${
	relevantKnowledge.length > 0
		? `Here is some relevant information from the knowledge base:
${relevantKnowledge.join("\n\n")}

Please use this information to help answer the user's question. If the information doesn't help answer the question, you can still provide a helpful response based on your general knowledge.`
		: "No specific knowledge base information was found for this query. Please provide a helpful response based on your general knowledge."
}`;

		// Combine system prompt with user message for Gemini
		const fullPrompt = `${systemPrompt}

User: ${message}`;
		timings.promptConstruction = Date.now() - promptConstructionStart;

		// Generate response using Gemini
		const genAIStart = Date.now();
		const model = genAI.getGenerativeModel({
			model: "gemini-2.5-flash-preview-05-20",
		});
		const result = await model.generateContent(fullPrompt);
		const response = result.response;
		timings.genAIGeneration = Date.now() - genAIStart;

		const responseText =
			response.text() || "I'm sorry, I couldn't generate a response.";

		console.log("Generated response:", responseText);

		timings.total = Date.now() - startTime;

		return NextResponse.json({
			response: responseText,
			knowledgeSources: knowledgeSources.length > 0 ? knowledgeSources : null,
			timings: {
				total: timings.total,
				botFetch: timings.botFetch,
				knowledgeSearch: timings.knowledgeSearch,
				promptConstruction: timings.promptConstruction,
				genAIGeneration: timings.genAIGeneration,
			},
		});
	} catch (error: any) {
		console.error("Error in chat endpoint:", error);
		return NextResponse.json(
			{ error: error.message || "Failed to process chat request" },
			{ status: 500 }
		);
	}
}
