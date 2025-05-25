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

/*
// TODO: Restore these functions when Entity and Universe types are available

export async function createUniverseCollection(universe: Universe): Promise<void> { ... }
export async function deleteUniverseCollection(universe: Universe): Promise<void> { ... }
export async function createEntityVector(entity: Entity, universe: Universe): Promise<string> { ... }
export async function updateEntityVector(entity: Entity, universe: Universe): Promise<void> { ... }
export async function deleteEntityVector(entity: Entity, universe: Universe): Promise<void> { ... }
export async function searchEntities(query: string, universe: Universe, limit?: number, threshold?: number): Promise<Array<{ id: string; score: number; payload: any }>> { ... }
*/
