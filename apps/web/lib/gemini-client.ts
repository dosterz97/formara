import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Get the embedding model
const embeddingModel = genAI.getGenerativeModel({
	model: "text-embedding-004",
});

/**
 * Generate embeddings for a text using Gemini's embedding model
 * @param text The text to generate embeddings for
 * @returns A promise that resolves to an array of numbers representing the embedding
 */
export async function generateEmbedding(text: string): Promise<number[]> {
	try {
		const result = await embeddingModel.embedContent(text);
		const embedding = result.embedding;
		return embedding.values;
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
