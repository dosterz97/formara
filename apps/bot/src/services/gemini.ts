import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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
		const model = genAI.getGenerativeModel({
			model: "gemini-2.0-flash",
		});

		const context = `You are ${characterData.name}. ${characterData.description}

Character Attributes:
${Object.entries(characterData.attributes)
	.map(([key, value]) => `- ${key}: ${value}`)
	.join("\n")}

Keep responses concise and in character, reflecting the personality defined above.`;

		const prompt = `${context}\n\nUser message: "${userMessage}"\n\nRespond in character:`;
		const result = await model.generateContent(prompt);

		const response = result.response.text();
		return response || "I am unable to generate a response at this time.";
	} catch (error) {
		console.error("Error generating bot response:", error);
		return "I apologize, but I am unable to process your message right now.";
	}
}
