import { GoogleGenAI } from "@google/genai";
import dedent from "dedent";

// Initialize the Gemini API
const googleGenAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

interface CharacterData {
	name: string;
	description: string;
	attributes: Record<string, any>;
}

export async function generateBotResponse(
	userMessage: string,
	characterData: CharacterData
): Promise<string> {
	try {
		const context = dedent`
			You are ${characterData.name}. ${characterData.description}

			Character Attributes:
			${Object.entries(characterData.attributes)
				.map(([key, value]) => `- ${key}: ${value}`)
				.join("\n")}

			Writing Style Guidelines:
			- Use simple language with short sentences
			- Be direct and concise
			- Keep a natural tone
			- Avoid marketing language and hype
			- Stay away from fluff and unnecessary words
			- Focus on clarity
			- Write as you normally speak
			- Be honest and straightforward
			- Don't use AI-giveaway phrases or clichés

			Keep responses concise and in character, following these writing guidelines.
		`;

		const prompt = `${context}\n\nUser message: "${userMessage}"\n\nRespond in character:`;

		// const allModels = await googleGenAI.models.list();
		// console.log(allModels);

		const response = await googleGenAI.models.generateContent({
			model: "gemini-2.5-flash-preview-05-20",
			contents: prompt,
		});

		return response.text || "I am unable to generate a response at this time.";
	} catch (error) {
		console.error("Error generating bot response:", error);
		return "I apologize, but I am unable to process your message right now.";
	}
}
