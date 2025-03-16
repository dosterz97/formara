import { QdrantClient } from "@qdrant/js-client-rest";
import dotenv from "dotenv";
import { Entity, Universe } from "./schema";

dotenv.config();

// Initialize Qdrant client
const qdrantClient = new QdrantClient({
	url: process.env.QDRANT_URL,
	apiKey: process.env.QDRANT_API_KEY,
	https: true,
});

// Display environment variables (sanitized)
console.log("Environment variables check:");
console.log(`QDRANT_URL exists: ${process.env.QDRANT_URL ? "Yes" : "No"}`);
console.log(
	`QDRANT_API_KEY exists: ${process.env.QDRANT_API_KEY ? "Yes" : "No"}`
);

// Define additional types for Qdrant metadata
export type EntityWithMetadata = Entity & {
	tags?: string[];
	relationships?: Array<{
		type: string;
		targetId: string;
		targetName: string;
		description?: string;
	}>;
};

export type KnowledgeFact = {
	id: string;
	title: string;
	content: string;
	category?: string;
	tags?: string[];
};

export type Relationship = {
	type: string;
	description?: string;
	properties?: Record<string, any>;
};

// Utility function to create a collection for a universe
export async function createUniverseCollection(
	universe: Universe
): Promise<void> {
	const collectionName = `universe_${universe.slug}`;

	try {
		console.log("Getting collections...");
		// Check if collection exists
		const collections = await qdrantClient.getCollections();
		if (collections.collections?.some((c) => c.name === collectionName)) {
			console.log(`Collection ${collectionName} already exists`);
			return;
		}

		console.log("Got collections...");

		// Create collection with appropriate schema
		await qdrantClient.createCollection(collectionName, {
			vectors: {
				size: 1536, // Size for OpenAI embeddings
				distance: "Cosine",
			},
			optimizers_config: {
				default_segment_number: 2,
			},
			replication_factor: 1,
			write_consistency_factor: 1,
			on_disk_payload: true,
		});

		console.log("Created collections...");

		// Create payload indexes for faster filtering
		await Promise.all([
			qdrantClient.createPayloadIndex(collectionName, {
				field_name: "content_type",
				field_schema: "keyword",
			}),
			qdrantClient.createPayloadIndex(collectionName, {
				field_name: "entity_type",
				field_schema: "keyword",
			}),
			qdrantClient.createPayloadIndex(collectionName, {
				field_name: "status",
				field_schema: "keyword",
			}),
			qdrantClient.createPayloadIndex(collectionName, {
				field_name: "tags",
				field_schema: "keyword",
			}),
		]);

		console.log(`Created collection ${collectionName}`);
	} catch (error) {
		console.error(`Error creating collection ${collectionName}:`, error);
		throw error;
	}
}

// Function to generate text representation of an entity for embedding
function generateEntityText(entity: EntityWithMetadata): string {
	const parts = [];

	// Basic information
	parts.push(`Name: ${entity.name}`);
	parts.push(`Type: ${entity.entityType}`);
	if (entity.description) {
		parts.push(`Description: ${entity.description}`);
	}

	// Add attributes if available
	const attributes = entity.basicAttributes || {};
	Object.entries(attributes).forEach(([key, value]) => {
		if (Array.isArray(value)) {
			parts.push(`${key}: ${value.join(", ")}`);
		} else {
			parts.push(`${key}: ${value}`);
		}
	});

	// Add tags if available
	if (entity.tags && entity.tags.length > 0) {
		parts.push(`Tags: ${entity.tags.join(", ")}`);
	}

	// Add relationships if available
	if (entity.relationships && entity.relationships.length > 0) {
		entity.relationships.forEach((rel) => {
			parts.push(`Relationship: ${rel.type} ${rel.targetName}`);
			if (rel.description) {
				parts.push(`  Description: ${rel.description}`);
			}
		});
	}

	return parts.join("\n");
}

// Function to get embeddings from OpenAI
async function getEmbedding(text: string): Promise<number[]> {
	try {
		// For simplicity, this example uses fake embeddings in the right dimension
		// In a real implementation, you would call the OpenAI API here
		// Or use a local model like @xenova/transformers

		// Creating a dummy embedding of the right size (1536 for OpenAI)
		const dummyEmbedding = Array(1536)
			.fill(0)
			.map(() => Math.random() * 2 - 1);

		// Normalize the embedding (important for cosine similarity)
		const magnitude = Math.sqrt(
			dummyEmbedding.reduce((sum, val) => sum + val * val, 0)
		);
		return dummyEmbedding.map((val) => val / magnitude);

		// In a real implementation, you would use something like:
		/*
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: text
      })
    });
    
    const data = await response.json();
    return data.data[0].embedding;
    */
	} catch (error) {
		console.error("Error generating embedding:", error);
		throw error;
	}
}

// Function to create embeddings for an entity and store in Qdrant
export async function createEntityEmbedding(
	universe: Universe,
	entity: EntityWithMetadata
): Promise<string> {
	const collectionName = `universe_${universe.slug}`;

	try {
		// Generate text representation of the entity
		const textRepresentation = generateEntityText(entity);

		// Generate embedding
		const embedding = await getEmbedding(textRepresentation);

		// Prepare the point
		const point = {
			id: entity.id.toString(),
			vector: embedding,
			payload: {
				name: entity.name,
				slug: entity.slug,
				description: entity.description || "",
				content_type: "entity",
				entity_type: entity.entityType,
				status: entity.status,
				attributes: entity.basicAttributes || {},
				tags: entity.tags || [],
				created_at: entity.createdAt.toISOString(),
				universe_id: entity.universeId,
			},
		};

		// Upsert the point
		await qdrantClient.upsert(collectionName, {
			points: [point],
		});

		console.log(`Created embedding for ${entity.name} with ID ${entity.id}`);
		return entity.id.toString();
	} catch (error) {
		console.error(`Error creating embedding for entity ${entity.name}:`, error);
		throw error;
	}
}

// Function to add knowledge fact to a universe collection
export async function addKnowledgeFact(
	universe: Universe,
	fact: KnowledgeFact
): Promise<string> {
	const collectionName = `universe_${universe.slug}`;

	try {
		// Generate text representation for embedding
		const textRepresentation = `${fact.title}\n${fact.content}`;

		// Generate embedding
		const embedding = await getEmbedding(textRepresentation);

		// Prepare the point
		const point = {
			id: `knowledge_${fact.id}`,
			vector: embedding,
			payload: {
				name: fact.title,
				description: fact.content,
				content_type: "knowledge",
				entity_type: "knowledge",
				category: fact.category || "general",
				tags: fact.tags || [],
				// Removed entity_relevance field - will rely on vector similarity
				universe_id: universe.id,
				created_at: new Date().toISOString(),
			},
		};

		// Upsert the point
		await qdrantClient.upsert(collectionName, {
			points: [point],
		});

		console.log(`Added knowledge fact: ${fact.title}`);
		return `knowledge_${fact.id}`;
	} catch (error) {
		console.error(`Error adding knowledge fact:`, error);
		throw error;
	}
}

// Function to add a relationship as a vector point
export async function addRelationship(
	universe: Universe,
	sourceId: number,
	targetId: number,
	relationship: Relationship
): Promise<string> {
	const collectionName = `universe_${universe.slug}`;

	try {
		// Get the source and target entities to use their names
		const [sourcePoint, targetPoint] = await Promise.all([
			qdrantClient.retrieve(collectionName, { ids: [sourceId.toString()] }),
			qdrantClient.retrieve(collectionName, { ids: [targetId.toString()] }),
		]);

		if (!sourcePoint.length || !targetPoint.length) {
			throw new Error("Source or target entity not found");
		}

		const sourceName = sourcePoint[0].payload?.name;
		const targetName = targetPoint[0].payload?.name;

		// Generate text representation
		const textRepresentation = `Relationship: ${sourceName} ${
			relationship.type
		} ${targetName}. ${relationship.description || ""}`;

		// Generate embedding
		const embedding = await getEmbedding(textRepresentation);

		// Generate a unique ID for the relationship
		const relationshipId = `rel_${sourceId}_${relationship.type}_${targetId}`;

		// Prepare the point
		const point = {
			id: relationshipId,
			vector: embedding,
			payload: {
				name: `${sourceName} ${relationship.type} ${targetName}`,
				description: relationship.description || "",
				content_type: "relationship",
				entity_type: "relationship",
				relationship_type: relationship.type,
				source_id: sourceId.toString(),
				source_name: sourceName,
				target_id: targetId.toString(),
				target_name: targetName,
				properties: relationship.properties || {},
				universe_id: universe.id,
				created_at: new Date().toISOString(),
			},
		};

		// Upsert the point
		await qdrantClient.upsert(collectionName, {
			points: [point],
		});

		console.log(
			`Added relationship: ${sourceName} ${relationship.type} ${targetName}`
		);
		return relationshipId;
	} catch (error) {
		console.error(`Error adding relationship:`, error);
		throw error;
	}
}

// Search function to find relevant entities and knowledge
export async function searchUniverse(
	universe: Universe,
	query: string,
	filters?: {
		entityType?: string;
		contentType?: string;
		tags?: string[];
	},
	limit: number = 10
): Promise<any[]> {
	const collectionName = `universe_${universe.slug}`;

	try {
		// Generate query embedding
		const queryEmbedding = await getEmbedding(query);

		// Build filter if needed
		let filter = undefined;
		if (filters) {
			const filterConditions = [];

			if (filters.entityType) {
				filterConditions.push({
					key: "entity_type",
					match: { value: filters.entityType },
				});
			}

			if (filters.contentType) {
				filterConditions.push({
					key: "content_type",
					match: { value: filters.contentType },
				});
			}

			if (filters.tags && filters.tags.length > 0) {
				filterConditions.push({
					key: "tags",
					match: { any: filters.tags },
				});
			}

			if (filterConditions.length > 0) {
				filter = { must: filterConditions };
			}
		}

		// Execute search
		const searchResults = await qdrantClient.search(collectionName, {
			vector: queryEmbedding,
			limit,
			filter,
			with_payload: true,
		});

		console.log(
			`Search for "${query}" returned ${searchResults.length} results`
		);
		return searchResults;
	} catch (error) {
		console.error(`Error searching universe:`, error);
		throw error;
	}
}

// Get entity knowledge - find knowledge relevant to a specific entity
export async function getEntityKnowledge(
	universe: Universe,
	entityId: number,
	query?: string,
	limit: number = 10
): Promise<any[]> {
	const collectionName = `universe_${universe.slug}`;

	try {
		// Get the entity to use its embedding as the starting point
		const entityPoints = await qdrantClient.retrieve(collectionName, {
			ids: [entityId.toString()],
			with_vector: true,
		});

		if (!entityPoints.length) {
			throw new Error(`Entity with ID ${entityId} not found`);
		}

		const entityVector = entityPoints[0].vector as number[];

		// If query is provided, use a hybrid approach
		let searchVector = entityVector;
		if (query) {
			const queryVector = await getEmbedding(query);

			// Combine vectors (70% entity, 30% query)
			searchVector = entityVector.map(
				(val, i) => val * 0.7 + queryVector[i] * 0.3
			);
		}

		// Search for related content, excluding the entity itself
		const searchResults = await qdrantClient.search(collectionName, {
			vector: searchVector,
			limit,
			filter: {
				must_not: [{ key: "id", match: { value: entityId.toString() } }],
			},
			with_payload: true,
		});

		// Process results - now using vector similarity as the only relevance factor
		const processedResults = searchResults.map((result) => {
			if (!result.payload) {
				return {
					...result,
					adjustedScore: result.score,
				};
			}

			// For relationships, slightly boost if this entity is involved
			let adjustedScore = result.score;
			if (result.payload.content_type === "relationship") {
				const entityIdStr = entityId.toString();
				if (
					result.payload.source_id === entityIdStr ||
					result.payload.target_id === entityIdStr
				) {
					// Apply a small boost to relationships directly involving the entity
					adjustedScore = Math.min(1.0, result.score * 1.1);
				}
			}

			return {
				...result,
				adjustedScore,
			};
		});

		// Sort by adjusted score
		return processedResults.sort((a, b) => b.adjustedScore - a.adjustedScore);
	} catch (error) {
		console.error(`Error getting entity knowledge:`, error);
		throw error;
	}
}
