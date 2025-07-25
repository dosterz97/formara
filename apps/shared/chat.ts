import { GoogleGenAI } from "@google/genai";
import { eq } from "drizzle-orm";
import { botModeration, bots } from "../web/lib/db/schema";
import { db } from "./db";
import { DEFAULT_MODERATION_THRESHOLDS, moderateContent } from "./moderation";
import { constructPrompt, formatKnowledgeSources } from "./prompt";
import { searchKnowledge } from "./qdrant-client";

// Initialize Gemini client
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface ChatRequest {
	botId: string;
	message: string;
	chatHistory?: Array<any>;
}

export interface ChatResponse {
	response: string;
	knowledgeSources: Array<{
		name: string;
		content: string;
		score: number;
	}>;
	timings: { [key: string]: number };
	prompt: any;
	moderationResult?: any;
}

export interface ChatError {
	error: string;
	moderationResult?: any;
}

export async function processChat(
	request: ChatRequest
): Promise<ChatResponse | ChatError> {
	const startTime = Date.now();
	const timings: { [key: string]: number } = {};

	try {
		const { botId, message, chatHistory = [] } = request;

		if (!message || typeof message !== "string") {
			return { error: "Message is required" };
		}

		console.log(`Chat request for bot ${botId}:`, message);

		// Get bot details and moderation settings
		const botFetchStart = Date.now();
		const [bot, moderationSettings] = await Promise.all([
			db.select().from(bots).where(eq(bots.id, botId)).limit(1),
			db
				.select()
				.from(botModeration)
				.where(eq(botModeration.botId, botId))
				.limit(1),
		]);
		timings.botFetch = Date.now() - botFetchStart;

		if (bot.length === 0) {
			return { error: "Bot not found" };
		}

		const botData = bot[0];
		console.log("Moderation settings:", moderationSettings[0]);

		// Check content with moderation if enabled
		try {
			const moderationResult = await moderateContent(message, {
				enabled: moderationSettings[0]?.enabled ?? false,
				toxicityThreshold:
					moderationSettings[0]?.toxicityThreshold ??
					DEFAULT_MODERATION_THRESHOLDS.toxicityThreshold,
				harassmentThreshold:
					moderationSettings[0]?.harassmentThreshold ??
					DEFAULT_MODERATION_THRESHOLDS.harassmentThreshold,
				sexualContentThreshold:
					moderationSettings[0]?.sexualContentThreshold ??
					DEFAULT_MODERATION_THRESHOLDS.sexualContentThreshold,
				spamThreshold:
					moderationSettings[0]?.spamThreshold ??
					DEFAULT_MODERATION_THRESHOLDS.spamThreshold,
			});
			console.log("Moderation result:", moderationResult);

			if (moderationResult.violation) {
				// Find the highest scoring category
				const scores = [
					{ type: "Toxicity", score: moderationResult.toxicityScore },
					{ type: "Harassment", score: moderationResult.harassmentScore },
					{
						type: "Sexual Content",
						score: moderationResult.sexualContentScore,
					},
					{ type: "Spam", score: moderationResult.spamScore },
				];
				const highestScore = scores.reduce((prev, current) =>
					prev.score > current.score ? prev : current
				);

				console.log("Content violation detected:", highestScore);
				return {
					error: `Your message was flagged for ${highestScore.type.toLowerCase()} content. Please keep the chat family-friendly.`,
					moderationResult,
				};
			}

			// Limit chat history to last 20 messages (10 exchanges)
			const limitedChatHistory = chatHistory.slice(-20);

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
				description: botData.description || undefined,
				knowledgeSources: knowledgeSources,
				userMessage: message,
				chatHistory: limitedChatHistory,
			});

			// Generate response using Gemini
			const genAIStart = Date.now();
			const result = await genAI.models.generateContent({
				model: "gemini-2.5-flash-preview-05-20",
				contents: fullPrompt,
			});
			timings.genAIGeneration = Date.now() - genAIStart;

			if (!result.text) {
				throw new Error("No response text from Gemini");
			}

			// Return the response with all metadata
			return {
				response: result.text,
				knowledgeSources,
				timings,
				prompt: fullPrompt,
				moderationResult, // Include moderation results even if not flagged
			};
		} catch (error) {
			console.error("Error in content moderation:", error);
			// Continue with message processing if moderation fails
			return { error: "Content moderation failed" };
		}
	} catch (error: any) {
		console.error("Error in chat processing:", error);
		return { error: error.message || "Failed to process chat request" };
	}
}
