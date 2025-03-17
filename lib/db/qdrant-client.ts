import { QdrantClient } from "@qdrant/js-client-rest";
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
	} catch (error) {
		console.error("Error creating Qdrant collection:", error);
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
	} catch (error) {
		console.error("Error deleting Qdrant collection:", error);
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

		// Use a string ID for Qdrant (required for REST API)
		const vectorId = `entity-${entity.id}`;

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

		// Log the request before sending (only show first few dimensions)
		console.log(
			"Upsert request to",
			collectionName,
			"with point ID:",
			vectorId
		);

		// Make sure all payload values are properly formatted
		const payload = {
			entity_id: entity.id,
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

		// Check if the point already exists and delete it if it does
		try {
			const pointExists = await qdrantClient.retrieve(collectionName, {
				ids: [vectorId],
				with_payload: false,
				with_vector: false,
			});

			if (pointExists.length > 0) {
				console.log(`Point ${vectorId} already exists, deleting it first`);
				await qdrantClient.delete(collectionName, {
					points: [vectorId],
					wait: true,
				});
			}
		} catch (e) {
			// Ignore errors from retrieve - it could be that the point doesn't exist
			console.log(
				"Point retrieval error (likely doesn't exist yet):",
				e.message
			);
		}

		// Add a small delay to ensure any deletion completes
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Store in Qdrant with careful validation of all data
		await qdrantClient.upsert(collectionName, {
			wait: true,
			points: [
				{
					id: vectorId,
					vector: embedding,
					payload: payload,
				},
			],
		});

		console.log(
			`Created vector for entity ${entity.name} (ID: ${entity.id}) in universe ${universe.name}`
		);
		return vectorId;
	} catch (error) {
		// Improved error handling with detailed logging
		console.error("Error creating entity vector:", error.message);

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

		// Create a fallback vector ID if we have to return something
		// (though it's better to handle this error at a higher level)
		const fallbackId = `error-${entity.id}-${Date.now()}`;
		throw new Error(
			`Failed to create vector: ${error.message}, fallback ID: ${fallbackId}`
		);
	}
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
	} catch (error) {
		console.error(`Error verifying collection ${collectionName}:`, error);
		return false;
	}
}

/**
 * Creates entity vector using direct API with correct ID format
 */
export async function createEntityVectorDirect(
	entity: Entity,
	universe: Universe
): Promise<string> {
	try {
		const collectionName = universe.vectorNamespace;

		// Use a numeric ID - Qdrant requires either unsigned integers or UUIDs
		const numericId = entity.id;

		// Format the entity for embedding
		const formattedEntity = formatEntityForEmbedding(entity);

		// Generate embedding using OpenAI
		const embeddingResponse = await openai.embeddings.create({
			model: "text-embedding-ada-002",
			input: formattedEntity,
		});

		const embedding = embeddingResponse.data[0].embedding;

		// Build the request directly
		const qdrantUrl = process.env.QDRANT_URL || "http://localhost:6333";
		const apiKey = process.env.QDRANT_API_KEY || "";

		// Log the URL and ID format
		console.log(
			`Sending direct API request to: ${qdrantUrl}/collections/${collectionName}/points`
		);
		console.log(`Using numeric ID: ${numericId}`);

		// Prepare the request body with numeric ID
		const requestBody = {
			points: [
				{
					id: numericId, // Use the numeric ID directly
					vector: embedding,
					payload: {
						entity_id: entity.id,
						universe_id: entity.universeId,
						name: entity.name || "",
						type: entity.entityType || "default",
						description: entity.description || "",
					},
				},
			],
		};

		// Make the API call directly with fetch
		const response = await fetch(
			`${qdrantUrl}/collections/${collectionName}/points?wait=true`,
			{
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					"api-key": apiKey,
				},
				body: JSON.stringify(requestBody),
			}
		);

		// Check if the request was successful
		if (!response.ok) {
			const errorText = await response.text();
			console.error(
				`Qdrant API error: ${response.status} ${response.statusText}`
			);
			console.error(`Error response: ${errorText}`);
			throw new Error(
				`Qdrant API error: ${response.status} ${response.statusText}`
			);
		}

		// Return the vector ID as a string for storage in the database
		const vectorId = numericId.toString();
		console.log(
			`Vector created successfully for entity ${entity.id} with vectorId ${vectorId}`
		);
		return vectorId;
	} catch (error) {
		console.error("Error with direct API approach:", error);
		throw error;
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
			return createEntityVector(entity, universe);
		}

		// Check if point exists
		const pointExists = await qdrantClient.retrieve(collectionName, {
			ids: [entity.vectorId],
			with_payload: false,
			with_vector: false,
		});

		if (pointExists.length === 0) {
			// If point doesn't exist, create it
			return createEntityVector(entity, universe);
		}

		// Format the entity for embedding
		const formattedEntity = formatEntityForEmbedding(entity);

		// Generate new embedding using OpenAI
		const embeddingResponse = await openai.embeddings.create({
			model: "text-embedding-ada-002",
			input: formattedEntity,
		});

		const embedding = embeddingResponse.data[0].embedding;

		// Update in Qdrant
		await qdrantClient.upsert(collectionName, {
			wait: true,
			points: [
				{
					id: entity.vectorId,
					vector: embedding,
					payload: {
						entity_id: entity.id,
						universe_id: entity.universeId,
						name: entity.name,
						type: entity.entityType,
						description: entity.description,
						updated_at: new Date().toISOString(),
					},
				},
			],
		});

		console.log(
			`Updated vector for entity ${entity.name} (ID: ${entity.id}) in universe ${universe.name}`
		);
	} catch (error) {
		console.error("Error updating entity vector:", error);
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

		// Delete point from Qdrant
		await qdrantClient.delete(collectionName, {
			wait: true,
			points: [entity.vectorId],
		});

		console.log(
			`Deleted vector for entity ${entity.name} (ID: ${entity.id}) from universe ${universe.name}`
		);
	} catch (error) {
		console.error("Error deleting entity vector:", error);
		throw error;
	}
}

/**
 * Search for similar entities in a universe
 * @param query The search query text
 * @param universe The universe object
 * @param limit Maximum number of results to return
 * @returns Array of search results with scores
 */
export async function searchEntities(
	query: string,
	universe: Universe,
	limit: number = 10
): Promise<Array<{ id: string; score: number; payload: any }>> {
	try {
		const collectionName = universe.vectorNamespace;

		// Generate embedding for the query
		const embeddingResponse = await openai.embeddings.create({
			model: "text-embedding-ada-002",
			input: query,
		});

		const queryEmbedding = embeddingResponse.data[0].embedding;

		// Search in Qdrant
		const searchResults = await qdrantClient.search(collectionName, {
			vector: queryEmbedding,
			limit: limit,
			with_payload: true,
		});

		// Format results
		return searchResults.map((result) => ({
			id: result.id as string,
			score: result.score,
			payload: result.payload,
		}));
	} catch (error) {
		console.error("Error searching entities:", error);
		throw error;
	}
}
