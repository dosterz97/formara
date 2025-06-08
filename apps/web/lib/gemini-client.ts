import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini API
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

/**
 * Generate embeddings for a text using Gemini's embedding model
 * @param text The text to generate embeddings for
 * @returns A promise that resolves to an array of numbers representing the embedding
 */
export async function generateEmbedding(text: string): Promise<number[]> {
	try {
		const result = await genAI.models.embedContent({
			model: "text-embedding-004",
			contents: text,
		});

		if (!result.embeddings?.[0]?.values) {
			throw new Error("No embedding values returned from Gemini");
		}

		return result.embeddings[0].values;
	} catch (error) {
		console.error("Error generating embedding:", error);
		throw error;
	}
}

/**
 * Generate embeddings for multiple texts using Gemini's embedding model
 * @param texts Array of texts to generate embeddings for
 * @returns A promise that resolves to an array of embeddings
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
	try {
		const results = await Promise.all(
			texts.map((text) => generateEmbedding(text))
		);
		return results;
	} catch (error) {
		console.error("Error generating embeddings:", error);
		throw error;
	}
}
