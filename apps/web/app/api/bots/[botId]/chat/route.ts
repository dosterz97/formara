import { constructPrompt, formatKnowledgeSources } from "@/lib/chat/prompt";
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
		let knowledgeSources: Array<{
			name: string;
			content: string;
			score: number;
		}> = [];
		try {
			const knowledgeResults = await searchKnowledge(message, botId, 5, 0.7);
			knowledgeSources = formatKnowledgeSources(knowledgeResults);
			console.log(
				`Found ${knowledgeSources.length} relevant knowledge entries`
			);
		} catch (error) {
			console.warn("No relevant knowledge found or search failed:", error);
			// Continue without knowledge base if search fails
		}
		timings.knowledgeSearch = Date.now() - knowledgeSearchStart;

		// Construct the prompt using shared utility
		const fullPrompt = constructPrompt({
			systemPrompt: botData.systemPrompt || undefined,
			description: botData.description || undefined,
			knowledgeSources: knowledgeSources,
			userMessage: message,
		});

		// Generate response using Gemini
		const genAIStart = Date.now();
		const model = genAI.getGenerativeModel({
			model: "gemini-2.0-flash",
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
			prompt: fullPrompt,
			timings: {
				total: timings.total,
				botFetch: timings.botFetch,
				knowledgeSearch: timings.knowledgeSearch,
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
