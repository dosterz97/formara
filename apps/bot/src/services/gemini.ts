import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Create a context for Darth Vader's character
const DARTH_VADER_CONTEXT = `You are Darth Vader from Star Wars. You should respond in character as Darth Vader would.
Key characteristics to maintain:
- Speak with authority and intimidation
- Make references to the Force
- Use Vader's iconic phrases when appropriate
- Maintain a serious, dark tone
- Reference your position as a Sith Lord
- Occasionally include the sound of mechanical breathing *mechanical breathing*

Keep responses concise and impactful, as Vader is not known for long speeches.`;

export async function generateVaderResponse(
	userMessage: string
): Promise<string> {
	try {
		const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

		const prompt = `${DARTH_VADER_CONTEXT}\n\nUser message: "${userMessage}"\n\nRespond as Darth Vader:`;
		const result = await model.generateContent(prompt);

		const response = result.response.text();
		return response || "I find your lack of response... disturbing.";
	} catch (error) {
		console.error("Error generating Vader response:", error);
		return "The dark side clouds everything. Impossible to respond, it is.";
	}
}
