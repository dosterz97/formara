import { QdrantClient } from "@qdrant/js-client-rest";
import { createHash } from "crypto";
import OpenAI from "openai";
import { Entity, Universe } from "./schema";

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
 * Creates a new Qdrant collection for a universe
 * @param universe The universe object
 */
export async function createUniverseCollection(
	universe: Universe
): Promise<void> {
	try {
		const collectionName = universe.vectorNamespace;

		// Check if collection already exists
		const collections = await qdrantClient.getCollections();
		if (collections.collections.some((c) => c.name === collectionName)) {
			console.log(`Collection ${collectionName} already exists`);
			return;
		}

		// Create the collection
		await qdrantClient.createCollection(collectionName, {
			vectors: {
				size: 1536, // OpenAI embeddings size (text-embedding-ada-002)
				distance: "Cosine",
			},
			optimizers_config: {
				default_segment_number: 2,
			},
			replication_factor: 1,
		});

		console.log(
			`Created collection ${collectionName} for universe ${universe.name}`
		);
	} catch (error: any) {
		console.error("Error creating Qdrant collection:", error?.message || error);
		throw error;
	}
}

/**
 * Deletes a Qdrant collection for a universe
 * @param universe The universe object
 */
export async function deleteUniverseCollection(
	universe: Universe
): Promise<void> {
	try {
		const collectionName = universe.vectorNamespace;

		// Check if collection exists
		const collections = await qdrantClient.getCollections();
		if (!collections.collections.some((c) => c.name === collectionName)) {
			console.log(`Collection ${collectionName} does not exist`);
			return;
		}

		// Delete the collection
		await qdrantClient.deleteCollection(collectionName);

		console.log(
			`Deleted collection ${collectionName} for universe ${universe.name}`
		);
	} catch (error: any) {
		console.error("Error deleting Qdrant collection:", error?.message || error);
		throw error;
	}
}

/**
 * Formats entity data for embedding
 * @param entity The entity object
 * @returns Formatted text for embedding
 */
function formatEntityForEmbedding(entity: Entity): string {
	// Format entity data into a structured text format for embedding
	const formattedText = [
		`Name: ${entity.name}`,
		`Type: ${entity.entityType || "default"}`,
		`Description: ${entity.description || ""}`,
	].join("\n\n");

	// Add formatted attributes if they exist
	if (
		entity.basicAttributes &&
		Object.keys(entity.basicAttributes).length > 0
	) {
		try {
			const attributesString = Object.entries(entity.basicAttributes)
				.map(
					([key, value]) =>
						`${key}: ${
							typeof value === "object" ? JSON.stringify(value) : value
						}`
				)
				.join("\n");

			return `${formattedText}\n\nAttributes:\n${attributesString}`;
		} catch (e) {
			// In case attributes are invalid or cause issues
			console.warn("Error formatting attributes for entity:", entity.id, e);
			return formattedText;
		}
	}

	return formattedText;
}

/**
 * Verifies a Qdrant collection exists and has the correct configuration
 */
export async function verifyCollection(
	collectionName: string
): Promise<boolean> {
	try {
		console.log(`Verifying collection: ${collectionName}`);

		// Check if the collection exists
		const collections = await qdrantClient.getCollections();
		if (!collections.collections.some((c) => c.name === collectionName)) {
			console.log(`Collection ${collectionName} does not exist`);
			return false;
		}

		// Get collection info to verify configuration
		const collectionInfo = await qdrantClient.getCollection(collectionName);
		console.log("Collection info:", JSON.stringify(collectionInfo, null, 2));

		// Verify vector size is 1536 for OpenAI embeddings
		const vectorSize = collectionInfo.config?.params?.vectors?.size;
		if (vectorSize !== 1536) {
			console.log(
				`Collection has incorrect vector size: ${vectorSize}, expected 1536`
			);
			return false;
		}

		console.log(`Collection ${collectionName} verified successfully`);
		return true;
	} catch (error: any) {
		console.error(
			`Error verifying collection ${collectionName}:`,
			error?.message || error
		);
		return false;
	}
}

/**
 * Creates entity vector in Qdrant
 * @param entity The entity object
 * @param universe The universe object
 * returns vector id
 */
export async function createEntityVector(
	entity: Entity,
	universe: Universe
): Promise<string> {
	try {
		const collectionName = universe.vectorNamespace;

		// Convert UUID to numeric ID for Qdrant
		const numericId = uuidToNumericId(entity.id);
		console.log(`Converting UUID ${entity.id} to numeric ID: ${numericId}`);

		// Format the entity for embedding
		const formattedEntity = formatEntityForEmbedding(entity);
		console.log("Formatted entity for embedding:", formattedEntity);

		// Generate embedding using OpenAI
		const embeddingResponse = await openai.embeddings.create({
			model: "text-embedding-ada-002",
			input: formattedEntity,
		});

		const embedding = embeddingResponse.data[0].embedding;
		console.log("Got embedding with length:", embedding.length);

		// Log the request before sending
		console.log("Upserting to collection:", collectionName);
		console.log("Using numeric ID:", numericId);

		// Make sure all payload values are properly formatted
		const payload = {
			entity_id: entity.id, // Store the original UUID in the payload
			universe_id: entity.universeId,
			name: entity.name || "",
			type: entity.entityType || "default",
			description: entity.description || "",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		};

		// Verify embedding is the expected length for the collection
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
			`Created vector for entity ${entity.name} (UUID: ${entity.id}) in universe ${universe.name}`
		);
		return vectorId;
	} catch (error: any) {
		// Improved error handling with detailed logging
		console.error("Error creating entity vector:", error?.message || error);

		if (error.response) {
			console.error("Error details:", {
				status: error.response.status,
				statusText: error.response.statusText,
			});

			try {
				// Try to parse and log the response data
				if (typeof error.response.data === "object") {
					console.error(
						"Error response data:",
						JSON.stringify(error.response.data, null, 2)
					);
				} else {
					const errorData = JSON.parse(error.response.data);
					console.error(
						"Error response data:",
						JSON.stringify(errorData, null, 2)
					);
				}
			} catch (e) {
				console.error("Raw error response:", error.response.data);
			}
		}

		// Create a fallback ID based on the entity UUID
		const fallbackId = uuidToNumericId(entity.id).toString();
		throw new Error(
			`Failed to create vector: ${
				error?.message || "Unknown error"
			}, fallback ID: ${fallbackId}`
		);
	}
}

/**
 * Updates entity vector in Qdrant
 * @param entity The updated entity object
 * @param universe The universe object
 */
export async function updateEntityVector(
	entity: Entity,
	universe: Universe
): Promise<void> {
	try {
		const collectionName = universe.vectorNamespace;

		// If no vectorId exists, create a new vector
		if (!entity.vectorId) {
			await createEntityVector(entity, universe);
			return;
		}

		// Convert to numeric ID for Qdrant
		let numericId: number;
		try {
			// First try to parse the existing vectorId as a number
			numericId = parseInt(entity.vectorId, 10);

			// If it's not a valid number, generate a new numeric ID from the UUID
			if (isNaN(numericId)) {
				console.log(
					`Invalid vectorId ${entity.vectorId}, generating from UUID instead`
				);
				numericId = uuidToNumericId(entity.id);
			}
		} catch {
			// If conversion fails, generate from UUID
			numericId = uuidToNumericId(entity.id);
		}

		// Check if point exists
		try {
			const pointExists = await qdrantClient.retrieve(collectionName, {
				ids: [numericId],
				with_payload: false,
				with_vector: false,
			});

			if (pointExists.length === 0) {
				// If point doesn't exist, create it
				await createEntityVector(entity, universe);
				return;
			}
		} catch (error) {
			// If retrieve fails, try to create a new vector
			console.log(`Error checking if vector exists, creating new: ${error}`);
			await createEntityVector(entity, universe);
			return;
		}

		// Format the entity for embedding
		const formattedEntity = formatEntityForEmbedding(entity);

		// Generate new embedding using OpenAI
		const embeddingResponse = await openai.embeddings.create({
			model: "text-embedding-ada-002",
			input: formattedEntity,
		});

		const embedding = embeddingResponse.data[0].embedding;

		// Update in Qdrant with numeric ID
		await qdrantClient.upsert(collectionName, {
			wait: true,
			points: [
				{
					id: numericId,
					vector: embedding,
					payload: {
						entity_id: entity.id, // Store the original UUID
						universe_id: entity.universeId,
						name: entity.name || "",
						type: entity.entityType || "default",
						description: entity.description || "",
						updated_at: new Date().toISOString(),
					},
				},
			],
		});

		console.log(
			`Updated vector for entity ${entity.name} (UUID: ${entity.id}) in universe ${universe.name}`
		);
	} catch (error: any) {
		console.error("Error updating entity vector:", error?.message || error);
		throw error;
	}
}

/**
 * Deletes entity vector from Qdrant
 * @param entity The entity object
 * @param universe The universe object
 */
export async function deleteEntityVector(
	entity: Entity,
	universe: Universe
): Promise<void> {
	try {
		const collectionName = universe.vectorNamespace;

		// If no vectorId, nothing to delete
		if (!entity.vectorId) {
			console.log(`No vectorId for entity ${entity.id}, nothing to delete`);
			return;
		}

		// Convert to numeric ID for Qdrant
		let numericId: number;
		try {
			// First try to parse the existing vectorId as a number
			numericId = parseInt(entity.vectorId, 10);

			// If it's not a valid number, generate from UUID
			if (isNaN(numericId)) {
				console.log(
					`Invalid vectorId ${entity.vectorId}, generating from UUID instead`
				);
				numericId = uuidToNumericId(entity.id);
			}
		} catch {
			// If conversion fails, generate from UUID
			numericId = uuidToNumericId(entity.id);
		}

		// Delete point from Qdrant using numeric ID
		await qdrantClient.delete(collectionName, {
			wait: true,
			points: [numericId],
		});

		console.log(
			`Deleted vector for entity ${entity.name} (UUID: ${entity.id}) from universe ${universe.name}`
		);
	} catch (error: any) {
		console.error("Error deleting entity vector:", error?.message || error);
		throw error;
	}
}
/**
 * Search for similar entities in a universe
 * @param query The search query text
 * @param universe The universe object
 * @param limit Maximum number of results to return
 * @param threshold Minimum relevance score threshold (0-1)
 * @returns Array of search results with scores
 */
export async function searchEntities(
	query: string,
	universe: Universe,
	limit: number = 10,
	threshold: number = 0.7
): Promise<Array<{ id: string; score: number; payload: any }>> {
	try {
		const collectionName = universe.vectorNamespace;

		// Generate embedding for the query
		const embeddingResponse = await openai.embeddings.create({
			model: "text-embedding-ada-002",
			input: query,
		});

		const queryEmbedding = embeddingResponse.data[0].embedding;

		// Search in Qdrant - request more results to allow for threshold filtering
		const searchResults = await qdrantClient.search(collectionName, {
			vector: queryEmbedding,
			limit: Math.min(limit * 2, 100), // Double the limit but cap at 100 to avoid excessive results
			with_payload: true,
		});

		// Format results - returning the original UUID from the payload
		// Apply threshold filter as part of the processing
		const filtered = searchResults
			.filter((r) => !!r.payload && r.score >= threshold) // Apply threshold filter
			.map((result) => {
				return {
					// @ts-expect-error filtering them out above...
					id: result.payload.entity_id as string, // Use the UUID stored in the payload
					score: result.score,
					payload: result.payload,
				};
			})
			.slice(0, limit); // Ensure we don't exceed the requested limit

		return filtered;
	} catch (error: any) {
		console.error("Error searching entities:", error?.message || error);
		throw error;
	}
}
