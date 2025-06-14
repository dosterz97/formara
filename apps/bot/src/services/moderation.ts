import { GoogleGenAI } from "@google/genai";

// Initialize Gemini client
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

interface ModerationResult {
	violation: boolean;
	harmType?: string;
	confidence?: number;
}

interface ModerationSettings {
	enabled: boolean;
}

const MODERATION_PROMPT = `You are a content moderator. Your task is to analyze the provided input and classify it based on the following harm types:

* Sexual: Sexually suggestive or explicit.
* CSAM: Exploits, abuses, or endangers children.
* Hate: Promotes violence against, threatens, or attacks people based on their protected characteristics.
* Harassment: Harass, intimidate, or bully others.
* Dangerous: Promotes illegal activities, self-harm, or violence towards oneself or others.
* Toxic: Rude, disrespectful, or unreasonable.
* Violent: Depicts violence, gore, or harm against individuals or groups.
* Profanity: Obscene or vulgar language.
* Illicit: Mentions illicit drugs, alcohol, firearms, tobacco, online gambling.

Output should be in JSON format: { "violation": true/false, "harmType": "type", "confidence": 0.0-1.0 }

Input: {input}`;

export async function moderateContent(
	content: string,
	settings?: ModerationSettings
): Promise<ModerationResult> {
	// If moderation is disabled or no settings provided, return no violation
	if (!settings?.enabled) {
		return { violation: false };
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

		// Validate the response format
		if (typeof moderationResult.violation !== "boolean") {
			throw new Error("Invalid response format: violation must be boolean");
		}

		return moderationResult;
	} catch (error) {
		console.error("Error in content moderation:", error);
		// Default to safe if moderation fails
		return { violation: false };
	}
}
