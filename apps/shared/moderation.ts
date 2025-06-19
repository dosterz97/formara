import { GoogleGenAI } from "@google/genai";

// Initialize Gemini client
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// Default moderation thresholds
export const DEFAULT_MODERATION_THRESHOLDS = {
	toxicityThreshold: 0.7,
	harassmentThreshold: 0.7,
	sexualContentThreshold: 0.7,
	spamThreshold: 0.7,
} as const;

interface ModerationResult {
	violation: boolean;
	toxicityScore: number;
	harassmentScore: number;
	sexualContentScore: number;
	spamScore: number;
	violationType?: string;
	violationMessage?: string;
}

interface ModerationSettings {
	enabled: boolean;
	toxicityThreshold: number;
	harassmentThreshold: number;
	sexualContentThreshold: number;
	spamThreshold: number;
}

const MODERATION_PROMPT = `
You are a content moderator. Your task is to analyze the provided input and classify it based on the following categories:

* Toxicity: Rude, disrespectful, or unreasonable language.
* Harassment: Harass, intimidate, or bully others.
* Sexual Content: Sexually suggestive or explicit content.
* Spam: Unwanted, repetitive, or promotional content.

Output should be in JSON format with scores from 0.0 to 1.0 for each category:
{
  "toxicityScore": 0.0-1.0,
  "harassmentScore": 0.0-1.0,
  "sexualContentScore": 0.0-1.0,
  "spamScore": 0.0-1.0
}

Input: {input}`;

export async function moderateContent(
	content: string,
	settings?: ModerationSettings
): Promise<ModerationResult> {
	// If moderation is disabled or no settings provided, return no violation
	if (!settings?.enabled) {
		return {
			violation: false,
			toxicityScore: 0,
			harassmentScore: 0,
			sexualContentScore: 0,
			spamScore: 0,
		};
	}

	try {
		const model = genAI.models.generateContent;
		const prompt = MODERATION_PROMPT.replace("{input}", content);

		const result = await model({
			model: "gemini-2.0-flash",
			contents: prompt,
		});

		if (!result.text) {
			throw new Error("No response from Gemini");
		}

		// Clean up the response text in case it has markdown formatting
		let cleanedResponse = result.text.trim();
		if (cleanedResponse.startsWith("```json")) {
			cleanedResponse = cleanedResponse.substring(7).trim();
		}
		if (cleanedResponse.endsWith("```")) {
			cleanedResponse = cleanedResponse
				.substring(0, cleanedResponse.length - 3)
				.trim();
		}

		// Parse the response as JSON
		const moderationResult = JSON.parse(cleanedResponse) as ModerationResult;

		console.log("shared: Moderation result:", moderationResult);

		// Check if any score exceeds its corresponding threshold
		const hasViolation =
			moderationResult.toxicityScore > settings.toxicityThreshold ||
			moderationResult.harassmentScore > settings.harassmentThreshold ||
			moderationResult.sexualContentScore > settings.sexualContentThreshold ||
			moderationResult.spamScore > settings.spamThreshold;

		let violationType: string | undefined;
		let violationMessage: string | undefined;

		if (hasViolation) {
			// Find the highest scoring category
			const scores = [
				{ type: "Toxicity", score: moderationResult.toxicityScore },
				{ type: "Harassment", score: moderationResult.harassmentScore },
				{ type: "Sexual Content", score: moderationResult.sexualContentScore },
				{ type: "Spam", score: moderationResult.spamScore },
			];
			const highestScore = scores.reduce((prev, current) =>
				prev.score > current.score ? prev : current
			);

			violationType = highestScore.type;
			violationMessage = `your message was flagged for ${highestScore.type.toLowerCase()} content. Please keep the chat family-friendly.`;
		}

		return {
			...moderationResult,
			violation: hasViolation,
			violationType,
			violationMessage,
		};
	} catch (error) {
		console.error("Error in content moderation:", error);
		// Default to safe if moderation fails
		return {
			violation: false,
			toxicityScore: 0,
			harassmentScore: 0,
			sexualContentScore: 0,
			spamScore: 0,
		};
	}
}
