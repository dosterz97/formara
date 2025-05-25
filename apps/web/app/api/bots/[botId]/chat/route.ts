import { db } from "@/lib/db/drizzle";
import { searchKnowledge } from "@/lib/db/qdrant-client";
import { bots } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ botId: string }> }
) {
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
		const bot = await db.select().from(bots).where(eq(bots.id, botId)).limit(1);

		if (bot.length === 0) {
			return NextResponse.json({ error: "Bot not found" }, { status: 404 });
		}

		const botData = bot[0];

		// Search for relevant knowledge
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

		// Construct the system prompt
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

		// Generate response using OpenAI
		const completion = await openai.chat.completions.create({
			model: "gpt-4o-mini",
			messages: [
				{
					role: "system",
					content: systemPrompt,
				},
				{
					role: "user",
					content: message,
				},
			],
			max_tokens: 1000,
			temperature: 0.7,
		});

		const response =
			completion.choices[0]?.message?.content ||
			"I'm sorry, I couldn't generate a response.";

		console.log("Generated response:", response);

		return NextResponse.json({
			response,
			knowledgeSources: knowledgeSources.length > 0 ? knowledgeSources : null,
		});
	} catch (error: any) {
		console.error("Error in chat endpoint:", error);
		return NextResponse.json(
			{ error: error.message || "Failed to process chat request" },
			{ status: 500 }
		);
	}
}
