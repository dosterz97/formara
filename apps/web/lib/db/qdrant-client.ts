import { QdrantClient } from "@qdrant/js-client-rest";
import { createHash } from "crypto";
import OpenAI from "openai";

// Initialize OpenAI client for embeddings
const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Qdrant client for vector storage
const qdrantClient = new QdrantClient({
	url: process.env.QDRANT_URL || "http://localhost:6333",
	apiKey: process.env.QDRANT_API_KEY,
});

/**
 * Converts a UUID string to a numeric ID suitable for Qdrant
 * @param uuid The UUID string to convert
 * @returns A numeric ID derived from the UUID
 */
function uuidToNumericId(uuid: string): number {
	// Create a consistent hash of the UUID
	const hash = createHash("md5").update(uuid).digest("hex");

	// Take the first 8 characters of the hash and convert to a number
	// This gives us a 32-bit integer, which should be sufficient for most cases
	return parseInt(hash.substring(0, 8), 16);
}

/**
 * Creates knowledge vector in Qdrant
 * @param knowledge The knowledge object
 * @param botId The bot ID this knowledge belongs to
 * @returns vector id
 */
export async function createKnowledgeVector(knowledge: {
	id: string;
	name: string;
	content: string;
	botId: string;
}): Promise<string> {
	try {
		console.log("Creating knowledge vector for:", knowledge);
		const collectionName = `bot_${knowledge.botId}_knowledge`;

		// Convert UUID to numeric ID for Qdrant
		const numericId = uuidToNumericId(knowledge.id);
		console.log(
			`Converting knowledge UUID ${knowledge.id} to numeric ID: ${numericId}`
		);

		// Format the knowledge for embedding
		const formattedKnowledge = `Name: ${knowledge.name}\n\nContent: ${knowledge.content}`;
		console.log("Formatted knowledge for embedding:", formattedKnowledge);

		// Generate embedding using OpenAI
		const embeddingResponse = await openai.embeddings.create({
			model: "text-embedding-ada-002",
			input: formattedKnowledge,
		});

		const embedding = embeddingResponse.data[0].embedding;
		console.log("Got embedding with length:", embedding.length);

		// Create collection if it doesn't exist
		try {
			const collections = await qdrantClient.getCollections();
			if (!collections.collections.some((c) => c.name === collectionName)) {
				await qdrantClient.createCollection(collectionName, {
					vectors: {
						size: 1536, // OpenAI embeddings size
						distance: "Cosine",
					},
					optimizers_config: {
						default_segment_number: 2,
					},
					replication_factor: 1,
				});
				console.log(`Created collection ${collectionName}`);
			}
		} catch (collectionError) {
			console.error("Error creating collection:", collectionError);
		}

		const payload = {
			knowledge_id: knowledge.id,
			bot_id: knowledge.botId,
			name: knowledge.name,
			content: knowledge.content,
			created_at: new Date().toISOString(),
		};

		// Verify embedding is the expected length
		if (embedding.length !== 1536) {
			throw new Error(
				`Embedding has incorrect length: ${embedding.length}, expected 1536`
			);
		}

		// Store in Qdrant with numeric ID
		await qdrantClient.upsert(collectionName, {
			wait: true,
			points: [
				{
					id: numericId,
					vector: embedding,
					payload: payload,
				},
			],
		});

		// Return the numeric ID as a string for storage in database
		const vectorId = numericId.toString();
		console.log(
			`Created vector for knowledge ${knowledge.name} (UUID: ${knowledge.id}) for bot ${knowledge.botId}`
		);
		return vectorId;
	} catch (error: any) {
		console.error("Error creating knowledge vector:", error?.message || error);
		throw new Error(
			`Failed to create knowledge vector: ${error?.message || "Unknown error"}`
		);
	}
}

/**
 * Searches for relevant knowledge in Qdrant
 * @param query The search query
 * @param botId The bot ID to search knowledge for
 * @param limit Maximum number of results to return
 * @param threshold Minimum similarity score threshold
 * @returns Array of relevant knowledge with scores
 */
export async function searchKnowledge(
	query: string,
	botId: string,
	limit: number = 5,
	threshold: number = 0.7
): Promise<Array<{ id: string; score: number; payload: any }>> {
	try {
		const collectionName = `bot_${botId}_knowledge`;

		// Generate embedding for the query
		const embeddingResponse = await openai.embeddings.create({
			model: "text-embedding-ada-002",
			input: query,
		});

		const queryEmbedding = embeddingResponse.data[0].embedding;

		// Search for similar vectors
		const searchResponse = await qdrantClient.search(collectionName, {
			vector: queryEmbedding,
			limit: limit,
			score_threshold: threshold,
			with_payload: true,
		});

		console.log(
			`Found ${searchResponse.length} relevant knowledge entries for query: ${query}`
		);

		return searchResponse.map((result) => ({
			id: (result.payload?.knowledge_id as string) || result.id.toString(),
			score: result.score,
			payload: result.payload,
		}));
	} catch (error: any) {
		console.error("Error searching knowledge:", error?.message || error);
		throw new Error(
			`Failed to search knowledge: ${error?.message || "Unknown error"}`
		);
	}
}

/**
 * Deletes knowledge vector from Qdrant
 * @param vectorId The vector ID to delete
 * @param botId The bot ID this knowledge belongs to
 * @returns Promise<void>
 */
export async function deleteKnowledgeVector(
	vectorId: string,
	botId: string
): Promise<void> {
	try {
		const collectionName = `bot_${botId}_knowledge`;

		// Convert string vector ID back to numeric ID for Qdrant
		const numericId = parseInt(vectorId, 10);

		if (isNaN(numericId)) {
			throw new Error(`Invalid vector ID: ${vectorId}`);
		}

		console.log(
			`Deleting vector ${vectorId} (numeric: ${numericId}) from collection ${collectionName}`
		);

		// Delete the vector from Qdrant
		await qdrantClient.delete(collectionName, {
			wait: true,
			points: [numericId],
		});

		console.log(`Successfully deleted vector ${vectorId} from Qdrant`);
	} catch (error: any) {
		console.error("Error deleting knowledge vector:", error?.message || error);
		throw new Error(
			`Failed to delete knowledge vector: ${error?.message || "Unknown error"}`
		);
	}
}

/**
 * Updates knowledge vector in Qdrant
 * @param knowledge The updated knowledge object
 * @param botId The bot ID this knowledge belongs to
 * @returns Promise<void>
 */
export async function updateKnowledgeVector(knowledge: {
	id: string;
	name: string;
	content: string;
	vectorId: string;
	botId: string;
}): Promise<void> {
	try {
		const collectionName = `bot_${knowledge.botId}_knowledge`;

		// Convert string vector ID to numeric ID for Qdrant
		const numericId = parseInt(knowledge.vectorId, 10);

		if (isNaN(numericId)) {
			throw new Error(`Invalid vector ID: ${knowledge.vectorId}`);
		}

		console.log(
			`Updating vector ${knowledge.vectorId} (numeric: ${numericId}) for knowledge ${knowledge.name}`
		);

		// Format the knowledge for embedding
		const formattedKnowledge = `Name: ${knowledge.name}\n\nContent: ${knowledge.content}`;

		// Generate new embedding using OpenAI
		const embeddingResponse = await openai.embeddings.create({
			model: "text-embedding-ada-002",
			input: formattedKnowledge,
		});

		const embedding = embeddingResponse.data[0].embedding;

		const payload = {
			knowledge_id: knowledge.id,
			bot_id: knowledge.botId,
			name: knowledge.name,
			content: knowledge.content,
			updated_at: new Date().toISOString(),
		};

		// Update the vector in Qdrant
		await qdrantClient.upsert(collectionName, {
			wait: true,
			points: [
				{
					id: numericId,
					vector: embedding,
					payload: payload,
				},
			],
		});

		console.log(
			`Successfully updated vector ${knowledge.vectorId} for knowledge ${knowledge.name}`
		);
	} catch (error: any) {
		console.error("Error updating knowledge vector:", error?.message || error);
		throw new Error(
			`Failed to update knowledge vector: ${error?.message || "Unknown error"}`
		);
	}
}

/**
 * Clears all knowledge vectors from a bot's collection
 * @param botId The bot ID whose knowledge to clear
 * @returns Promise<void>
 */
export async function clearBotKnowledge(botId: string): Promise<void> {
	try {
		const collectionName = `bot_${botId}_knowledge`;

		console.log(`Clearing all knowledge from collection ${collectionName}`);

		// Check if collection exists
		const collections = await qdrantClient.getCollections();
		const collectionExists = collections.collections.some(
			(c) => c.name === collectionName
		);

		if (collectionExists) {
			// Get all points in the collection
			const points = await qdrantClient.scroll(collectionName, {
				limit: 1000, // Adjust this number based on your needs
				with_payload: true,
			});

			if (points.points && points.points.length > 0) {
				// Delete all points by their IDs
				const pointIds = points.points.map((point) => point.id);
				await qdrantClient.delete(collectionName, {
					wait: true,
					points: pointIds,
				});
				console.log(
					`Successfully cleared ${pointIds.length} points from collection ${collectionName}`
				);
			} else {
				console.log(`Collection ${collectionName} is already empty`);
			}
		} else {
			console.log(
				`Collection ${collectionName} does not exist, nothing to clear`
			);
		}
	} catch (error: any) {
		console.error("Error clearing bot knowledge:", error?.message || error);
		throw new Error(
			`Failed to clear bot knowledge: ${error?.message || "Unknown error"}`
		);
	}
}

/**
 * Deletes the entire knowledge collection for a bot
 * @param botId The bot ID whose knowledge collection to delete
 * @returns Promise<void>
 */
export async function deleteBotKnowledgeCollection(
	botId: string
): Promise<void> {
	try {
		const collectionName = `bot_${botId}_knowledge`;

		console.log(`Deleting knowledge collection ${collectionName}`);

		// Check if collection exists before trying to delete
		const collections = await qdrantClient.getCollections();
		const collectionExists = collections.collections.some(
			(c) => c.name === collectionName
		);

		if (collectionExists) {
			await qdrantClient.deleteCollection(collectionName);
			console.log(
				`Successfully deleted knowledge collection ${collectionName}`
			);
		} else {
			console.log(
				`Knowledge collection ${collectionName} does not exist, skipping deletion`
			);
		}
	} catch (error: any) {
		console.error(
			"Error deleting bot knowledge collection:",
			error?.message || error
		);
		throw new Error(
			`Failed to delete bot knowledge collection: ${
				error?.message || "Unknown error"
			}`
		);
	}
}

/**
 * Scrolls through knowledge entries in Qdrant
 * @param botId The bot ID to scroll knowledge for
 * @param limit Maximum number of results to return per page
 * @param offset Offset for pagination
 * @returns Array of knowledge entries with their vectors
 */
export async function scrollKnowledge(
	botId: string,
	limit: number = 20,
	offset: number = 0
): Promise<Array<{ id: string; payload: any }>> {
	try {
		const collectionName = `bot_${botId}_knowledge`;

		// Scroll through vectors
		const scrollResponse = await qdrantClient.scroll(collectionName, {
			limit: limit,
			offset: offset,
			with_payload: true,
		});

		console.log(
			`Scrolled ${scrollResponse.points.length} knowledge entries for bot ${botId}`
		);

		return scrollResponse.points.map((point) => ({
			id: (point.payload?.knowledge_id as string) || point.id.toString(),
			payload: point.payload,
		}));
	} catch (error: any) {
		console.error("Error scrolling knowledge:", error?.message || error);
		throw new Error(
			`Failed to scroll knowledge: ${error?.message || "Unknown error"}`
		);
	}
}
