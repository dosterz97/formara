// import { QdrantClient } from "@qdrant/js-client-rest";
// import dotenv from "dotenv";
// import { eq } from "drizzle-orm";
// import OpenAI from "openai";
// import { v4 as uuidv4 } from "uuid";
// import { db } from "./drizzle";
// import {
// 	EntityWithMetadata,
// 	KnowledgeFact,
// 	Relationship,
// } from "./qdrant-client";
// import { entities, Universe, universes } from "./schema";

// dotenv.config();

// // Initialize OpenAI client
// const openai = new OpenAI({
// 	apiKey: process.env.OPENAI_API_KEY,
// });

// // Initialize Qdrant client
// const qdrantClient = new QdrantClient({
// 	url: process.env.QDRANT_URL,
// 	apiKey: process.env.QDRANT_API_KEY,
// 	https: true,
// });

// // Function to generate embeddings using OpenAI
// async function generateEmbedding(text: string): Promise<number[]> {
// 	try {
// 		const response = await openai.embeddings.create({
// 			model: "text-embedding-3-large",
// 			input: text,
// 			dimensions: 1536,
// 		});

// 		return response.data[0].embedding;
// 	} catch (error) {
// 		console.error("Error generating embedding:", error);
// 		throw error;
// 	}
// }

// // Function to create a new universe collection in Qdrant
// async function createUniverseCollection(universe: Universe): Promise<string> {
// 	try {
// 		console.log(`Creating collection for universe: ${universe.name}`);

// 		// Check if collection exists
// 		const collections = await qdrantClient.getCollections();
// 		if (
// 			collections.collections?.some((c) => c.name === universe.vectorNamespace)
// 		) {
// 			console.log(`Collection ${universe.vectorNamespace} already exists`);
// 			return universe.vectorNamespace;
// 		}

// 		// Create the collection
// 		await qdrantClient.createCollection(universe.vectorNamespace, {
// 			vectors: {
// 				size: 1536, // OpenAI embedding size
// 				distance: "Cosine",
// 			},
// 			optimizers_config: {
// 				default_segment_number: 2,
// 			},
// 			hnsw_config: {
// 				m: 16,
// 				ef_construct: 100,
// 			},
// 			on_disk_payload: true,
// 		});

// 		console.log(`Created collection: ${universe.vectorNamespace}`);

// 		// Create payload indexes for efficient filtering
// 		await qdrantClient.createPayloadIndex(universe.vectorNamespace, {
// 			field_name: "type",
// 			field_schema: "keyword",
// 		});

// 		await qdrantClient.createPayloadIndex(universe.vectorNamespace, {
// 			field_name: "tags",
// 			field_schema: "keyword",
// 		});

// 		await qdrantClient.createPayloadIndex(universe.vectorNamespace, {
// 			field_name: "entityType",
// 			field_schema: "keyword",
// 		});

// 		console.log(`Created payload indices for: ${universe.vectorNamespace}`);

// 		return universe.vectorNamespace;
// 	} catch (error) {
// 		console.error("Error creating universe collection:", error);
// 		throw error;
// 	}
// }

// // Function to create entity embedding and store in Qdrant
// async function createEntityEmbedding(
// 	universe: Universe,
// 	entity: EntityWithMetadata
// ): Promise<string> {
// 	try {
// 		// Generate a UUID for the point ID
// 		const vectorId = uuidv4();

// 		// Create embedding based on entity information
// 		const embedText = `${entity.name}. ${entity.description}. Type: ${entity.entityType}.`;
// 		const embedding = await generateEmbedding(embedText);

// 		// Store in Qdrant
// 		await qdrantClient.upsert(universe.vectorNamespace, {
// 			wait: true,
// 			points: [
// 				{
// 					id: vectorId,
// 					vector: embedding,
// 					payload: {
// 						id: entity.id,
// 						type: "entity",
// 						entityType: entity.entityType,
// 						name: entity.name,
// 						slug: entity.slug,
// 						description: entity.description,
// 						basicAttributes: entity.basicAttributes,
// 						status: entity.status,
// 						tags: entity.tags,
// 					},
// 				},
// 			],
// 		});

// 		console.log(`Created embedding for entity: ${entity.name}`);
// 		return vectorId;
// 	} catch (error) {
// 		console.error("Error creating entity embedding:", error);
// 		throw error;
// 	}
// }

// // Function to add a relationship between entities
// async function addRelationship(
// 	universe: Universe,
// 	sourceEntityId: number,
// 	targetEntityId: number,
// 	relationship: Relationship
// ): Promise<string> {
// 	try {
// 		// Generate a UUID for the point ID
// 		const relationshipId = uuidv4();

// 		// Create embedding based on relationship description
// 		const embedText = `Relationship: ${relationship.type}. ${relationship.description}`;
// 		const embedding = await generateEmbedding(embedText);

// 		// Store in Qdrant
// 		await qdrantClient.upsert(universe.vectorNamespace, {
// 			wait: true,
// 			points: [
// 				{
// 					id: relationshipId,
// 					vector: embedding,
// 					payload: {
// 						type: "relationship",
// 						sourceEntityId,
// 						targetEntityId,
// 						relationshipType: relationship.type,
// 						description: relationship.description,
// 						properties: relationship.properties,
// 					},
// 				},
// 			],
// 		});

// 		console.log(
// 			`Added relationship: ${sourceEntityId} ${relationship.type} ${targetEntityId}`
// 		);
// 		return relationshipId;
// 	} catch (error) {
// 		console.error("Error adding relationship:", error);
// 		throw error;
// 	}
// }

// // Function to add a knowledge fact
// async function addKnowledgeFact(
// 	universe: Universe,
// 	fact: KnowledgeFact
// ): Promise<string> {
// 	try {
// 		// Generate a UUID for the point ID
// 		const factId = uuidv4();

// 		// Create embedding based on knowledge fact
// 		const embedText = `${fact.title}. ${fact.content}`;
// 		const embedding = await generateEmbedding(embedText);

// 		// Store in Qdrant
// 		await qdrantClient.upsert(universe.vectorNamespace, {
// 			wait: true,
// 			points: [
// 				{
// 					id: factId,
// 					vector: embedding,
// 					payload: {
// 						id: fact.id,
// 						type: "knowledge",
// 						title: fact.title,
// 						content: fact.content,
// 						category: fact.category,
// 						tags: fact.tags,
// 					},
// 				},
// 			],
// 		});

// 		console.log(`Added knowledge fact: ${fact.title}`);
// 		return factId;
// 	} catch (error) {
// 		console.error("Error adding knowledge fact:", error);
// 		throw error;
// 	}
// }

// // Main seed function
// async function seedMCUData() {
// 	try {
// 		console.log("Starting MCU data seeding...");

// 		// Check environment variables
// 		if (!process.env.OPENAI_API_KEY) {
// 			throw new Error("OPENAI_API_KEY is not set in environment variables");
// 		}
// 		if (!process.env.QDRANT_URL || !process.env.QDRANT_API_KEY) {
// 			throw new Error(
// 				"QDRANT_URL or QDRANT_API_KEY is not set in environment variables"
// 			);
// 		}

// 		// Create MCU universe
// 		const mcuUniverse = {
// 			id: 1,
// 			teamId: 1,
// 			slug: "mcu",
// 			name: "Marvel Cinematic Universe",
// 			description: "The shared universe where The Avengers exist",
// 			rules: {
// 				allowedPowers: ["technology", "magic", "mutation", "cosmic"],
// 				timeTravel: true,
// 				multiverse: true,
// 			},
// 			status: "active" as const,
// 			vectorNamespace: "universe_mcu",
// 			createdAt: new Date(),
// 			updatedAt: new Date(),
// 			createdBy: 1,
// 		};

// 		try {
// 			// Insert universe into PostgreSQL
// 			await db.insert(universes).values({
// 				id: mcuUniverse.id,
// 				teamId: mcuUniverse.teamId,
// 				slug: mcuUniverse.slug,
// 				name: mcuUniverse.name,
// 				description: mcuUniverse.description,
// 				rules: mcuUniverse.rules,
// 				status: mcuUniverse.status,
// 				vectorNamespace: mcuUniverse.vectorNamespace,
// 				createdAt: mcuUniverse.createdAt,
// 				updatedAt: mcuUniverse.updatedAt,
// 				createdBy: mcuUniverse.createdBy,
// 			});
// 			console.log("Inserted MCU universe into PostgreSQL");
// 		} catch (e) {
// 			console.log("Universe already exists most likely.");
// 		}

// 		// Create Qdrant collection for the universe
// 		await createUniverseCollection(mcuUniverse);

// 		// Define 10 MCU entities to seed
// 		const mcuEntities: EntityWithMetadata[] = [
// 			// 1. Iron Man
// 			{
// 				id: 1,
// 				universeId: 1,
// 				slug: "iron-man",
// 				name: "Tony Stark",
// 				entityType: "character",
// 				description:
// 					"Genius billionaire playboy philanthropist who created the Iron Man suit",
// 				status: "active",
// 				basicAttributes: {
// 					species: "human",
// 					abilities: ["genius intellect", "engineering", "powered armor"],
// 					occupation: "industrialist, inventor",
// 					affiliations: ["Avengers", "Stark Industries"],
// 				},
// 				vectorId: "",
// 				createdAt: new Date(),
// 				updatedAt: new Date(),
// 				createdBy: 1,
// 				tags: ["hero", "avenger", "tech"],
// 			},

// 			// 2. Captain America
// 			{
// 				id: 2,
// 				universeId: 1,
// 				slug: "captain-america",
// 				name: "Steve Rogers",
// 				entityType: "character",
// 				description:
// 					"Super-soldier and World War II hero who was frozen and awakened in modern times",
// 				status: "active",
// 				basicAttributes: {
// 					species: "human (enhanced)",
// 					abilities: [
// 						"super strength",
// 						"enhanced durability",
// 						"combat mastery",
// 					],
// 					occupation: "soldier, Avenger",
// 					affiliations: ["Avengers", "US Army", "SHIELD"],
// 				},
// 				vectorId: "",
// 				createdAt: new Date(),
// 				updatedAt: new Date(),
// 				createdBy: 1,
// 				tags: ["hero", "avenger", "super-soldier"],
// 			},

// 			// 3. Thor
// 			{
// 				id: 3,
// 				universeId: 1,
// 				slug: "thor",
// 				name: "Thor Odinson",
// 				entityType: "character",
// 				description: "Asgardian god of thunder and former king of Asgard",
// 				status: "active",
// 				basicAttributes: {
// 					species: "asgardian",
// 					abilities: [
// 						"superhuman strength",
// 						"weather manipulation",
// 						"lightning control",
// 					],
// 					occupation: "warrior, former king",
// 					affiliations: ["Avengers", "Asgard", "Guardians of the Galaxy"],
// 				},
// 				vectorId: "",
// 				createdAt: new Date(),
// 				updatedAt: new Date(),
// 				createdBy: 1,
// 				tags: ["hero", "avenger", "asgardian"],
// 			},

// 			// 4. Black Widow
// 			{
// 				id: 4,
// 				universeId: 1,
// 				slug: "black-widow",
// 				name: "Natasha Romanoff",
// 				entityType: "character",
// 				description: "Former Russian spy and assassin who became an Avenger",
// 				status: "active",
// 				basicAttributes: {
// 					species: "human",
// 					abilities: ["espionage", "combat mastery", "marksmanship"],
// 					occupation: "spy, Avenger",
// 					affiliations: ["Avengers", "SHIELD", "former KGB"],
// 				},
// 				vectorId: "",
// 				createdAt: new Date(),
// 				updatedAt: new Date(),
// 				createdBy: 1,
// 				tags: ["hero", "avenger", "spy"],
// 			},

// 			// 5. Thanos
// 			{
// 				id: 5,
// 				universeId: 1,
// 				slug: "thanos",
// 				name: "Thanos",
// 				entityType: "character",
// 				description:
// 					"Titan warlord who sought the Infinity Stones to erase half of all life in the universe",
// 				status: "active",
// 				basicAttributes: {
// 					species: "titan",
// 					abilities: ["superhuman strength", "durability", "tactical genius"],
// 					occupation: "warlord",
// 					affiliations: ["Black Order"],
// 				},
// 				vectorId: "",
// 				createdAt: new Date(),
// 				updatedAt: new Date(),
// 				createdBy: 1,
// 				tags: ["villain", "titan", "infinity stones"],
// 			},

// 			// 6. Avengers Tower
// 			{
// 				id: 6,
// 				universeId: 1,
// 				slug: "avengers-tower",
// 				name: "Avengers Tower",
// 				entityType: "location",
// 				description:
// 					"Former headquarters of the Avengers team located in New York City",
// 				status: "active",
// 				basicAttributes: {
// 					locationType: "building",
// 					city: "New York City",
// 					features: ["advanced technology", "living quarters", "laboratories"],
// 					owner: "Tony Stark/Stark Industries",
// 				},
// 				vectorId: "",
// 				createdAt: new Date(),
// 				updatedAt: new Date(),
// 				createdBy: 1,
// 				tags: ["location", "headquarters", "new york"],
// 			},

// 			// 7. Infinity Gauntlet
// 			{
// 				id: 7,
// 				universeId: 1,
// 				slug: "infinity-gauntlet",
// 				name: "Infinity Gauntlet",
// 				entityType: "item",
// 				description:
// 					"Powerful gauntlet designed to harness the power of all six Infinity Stones",
// 				status: "active",
// 				basicAttributes: {
// 					itemType: "weapon/artifact",
// 					creator: "Eitri/Dwarves of Nidavellir",
// 					materials: ["uru metal"],
// 					powers: [
// 						"control of reality",
// 						"universe alteration",
// 						"omnipotence when completed",
// 					],
// 				},
// 				vectorId: "",
// 				createdAt: new Date(),
// 				updatedAt: new Date(),
// 				createdBy: 1,
// 				tags: ["artifact", "weapon", "infinity stones"],
// 			},

// 			// 8. Battle of New York
// 			{
// 				id: 8,
// 				universeId: 1,
// 				slug: "battle-of-new-york",
// 				name: "Battle of New York",
// 				entityType: "event",
// 				description:
// 					"First major conflict involving the assembled Avengers team against Loki and the Chitauri invasion",
// 				status: "historical",
// 				basicAttributes: {
// 					eventType: "battle",
// 					year: 2012,
// 					location: "New York City",
// 					participants: ["Avengers", "Loki", "Chitauri"],
// 					outcome: "Avengers victory",
// 				},
// 				vectorId: "",
// 				createdAt: new Date(),
// 				updatedAt: new Date(),
// 				createdBy: 1,
// 				tags: ["battle", "chitauri", "loki", "new york"],
// 			},

// 			// 9. SHIELD
// 			{
// 				id: 9,
// 				universeId: 1,
// 				slug: "shield",
// 				name: "S.H.I.E.L.D.",
// 				entityType: "organization",
// 				description:
// 					"Strategic Homeland Intervention, Enforcement and Logistics Division; an intelligence agency that dealt with superhuman threats",
// 				status: "active",
// 				basicAttributes: {
// 					orgType: "government agency",
// 					headquarters: "Triskelion",
// 					leadership: ["Nick Fury", "Maria Hill", "Phil Coulson"],
// 					purpose: "global security, superhuman monitoring",
// 				},
// 				vectorId: "",
// 				createdAt: new Date(),
// 				updatedAt: new Date(),
// 				createdBy: 1,
// 				tags: ["organization", "government", "intelligence"],
// 			},

// 			// 10. Wakanda
// 			{
// 				id: 10,
// 				universeId: 1,
// 				slug: "wakanda",
// 				name: "Wakanda",
// 				entityType: "location",
// 				description:
// 					"Technologically advanced African nation powered by vibranium, homeland of Black Panther",
// 				status: "active",
// 				basicAttributes: {
// 					locationType: "country",
// 					continent: "Africa",
// 					resources: ["vibranium"],
// 					ruler: "T'Challa/Black Panther",
// 					features: ["advanced technology", "vibranium mines", "isolationist"],
// 				},
// 				vectorId: "",
// 				createdAt: new Date(),
// 				updatedAt: new Date(),
// 				createdBy: 1,
// 				tags: ["location", "country", "vibranium", "black panther"],
// 			},
// 		];

// 		// Insert entities into PostgreSQL and create embeddings
// 		for (const entity of mcuEntities) {
// 			try {
// 				// Insert entity into PostgreSQL
// 				await db.insert(entities).values({
// 					id: entity.id,
// 					universeId: entity.universeId,
// 					slug: entity.slug,
// 					name: entity.name,
// 					entityType: entity.entityType,
// 					description: entity.description,
// 					status: entity.status,
// 					basicAttributes: entity.basicAttributes,
// 					vectorId: "", // Will update after creating embedding
// 					createdAt: entity.createdAt,
// 					updatedAt: entity.updatedAt,
// 					createdBy: entity.createdBy,
// 				});

// 				// Create embedding and get vector ID
// 				const vectorId = await createEntityEmbedding(mcuUniverse, entity);

// 				// Update vector ID in PostgreSQL
// 				await db
// 					.update(entities)
// 					.set({ vectorId })
// 					.where(eq(entities.id, entity.id));

// 				console.log(`Inserted ${entity.name} with vector ID: ${vectorId}`);
// 			} catch (e) {
// 				console.log(`${entity.name} already exists most likely.`);
// 				// Try to update embedding if entity exists
// 				try {
// 					const vectorId = await createEntityEmbedding(mcuUniverse, entity);
// 					await db
// 						.update(entities)
// 						.set({ vectorId })
// 						.where(eq(entities.id, entity.id));
// 					console.log(`Updated embedding for ${entity.name}: ${vectorId}`);
// 				} catch (embeddingError) {
// 					console.error(
// 						`Failed to update embedding for ${entity.name}:`,
// 						embeddingError
// 					);
// 				}
// 			}
// 		}

// 		// Add relationships between entities
// 		const relationships = [
// 			// Iron Man and Captain America - Civil War conflict
// 			{
// 				sourceId: 1, // Iron Man
// 				targetId: 2, // Captain America
// 				relationship: {
// 					type: "conflicted_with",
// 					description:
// 						"Tony Stark and Steve Rogers were on opposing sides during the Sokovia Accords conflict, leading to the Avengers Civil War",
// 					properties: {
// 						conflict_name: "Civil War",
// 						reconciled: true,
// 						key_battles: ["Leipzig Airport", "Siberia Hydra Base"],
// 					},
// 				},
// 			},

// 			// Thor and Loki - Brothers
// 			{
// 				sourceId: 3, // Thor
// 				targetId: 5, // Using Thanos here (normally would be Loki's ID)
// 				relationship: {
// 					type: "fought_against",
// 					description:
// 						"Thor fought against Thanos multiple times, most notably in Infinity War and Endgame",
// 					properties: {
// 						personal_grudge: true,
// 						key_battles: ["Asgardian Ship", "Wakanda", "Avengers Compound"],
// 						outcome: "Thor eventually helped defeat Thanos",
// 					},
// 				},
// 			},

// 			// Avengers Tower - Headquarters relationship
// 			{
// 				sourceId: 6, // Avengers Tower
// 				targetId: 1, // Iron Man
// 				relationship: {
// 					type: "owned_by",
// 					description:
// 						"Avengers Tower was owned and designed by Tony Stark before being sold",
// 					properties: {
// 						years_active: "2012-2016",
// 						previous_name: "Stark Tower",
// 						purpose: "Avengers headquarters and Stark personal residence",
// 					},
// 				},
// 			},

// 			// Thanos and Infinity Gauntlet
// 			{
// 				sourceId: 5, // Thanos
// 				targetId: 7, // Infinity Gauntlet
// 				relationship: {
// 					type: "wielded",
// 					description:
// 						"Thanos wielded the Infinity Gauntlet after collecting all six Infinity Stones",
// 					properties: {
// 						purpose: "To erase half of all life in the universe",
// 						outcome: "The Snap/Blip",
// 						timeline: "2018",
// 					},
// 				},
// 			},

// 			// Battle of New York and Avengers
// 			{
// 				sourceId: 8, // Battle of New York
// 				targetId: 1, // Iron Man (representing Avengers)
// 				relationship: {
// 					type: "featured",
// 					description:
// 						"The Battle of New York was the first major event where the Avengers fought together as a team",
// 					properties: {
// 						key_moment: "Iron Man redirected nuclear missile through portal",
// 						aftermath: "Avengers officially formed as team",
// 						significance: "Revealed existence of aliens to the world",
// 					},
// 				},
// 			},
// 		];

// 		// Add each relationship
// 		for (const rel of relationships) {
// 			try {
// 				const relationshipId = await addRelationship(
// 					mcuUniverse,
// 					rel.sourceId,
// 					rel.targetId,
// 					rel.relationship
// 				);
// 				console.log(`Added relationship with ID: ${relationshipId}`);
// 			} catch (e) {
// 				console.error("Error adding relationship:", e);
// 			}
// 		}

// 		// Add knowledge facts
// 		const knowledgeFacts: KnowledgeFact[] = [
// 			{
// 				id: "infinity-stones",
// 				title: "The Infinity Stones",
// 				content:
// 					"The Infinity Stones are six immensely powerful objects tied to different aspects of the universe, created by the Cosmic Entities. Each stone possesses unique capabilities: Space Stone (blue), Reality Stone (red), Power Stone (purple), Mind Stone (yellow), Time Stone (green), and Soul Stone (orange). Together in the Infinity Gauntlet, they grant the user godlike powers including the ability to alter reality on a universal scale.",
// 				category: "cosmic",
// 				tags: ["cosmic", "artifact", "thanos", "power"],
// 			},
// 			{
// 				id: "snap",
// 				title: "The Snap",
// 				content:
// 					"The Snap, also known as the Blip, was the cataclysmic event caused by Thanos using the Infinity Gauntlet to eliminate half of all living beings in the universe. The event occurred in 2018 and was reversed five years later when the Avengers managed to collect the Infinity Stones from different points in time and use them to bring everyone back.",
// 				category: "event",
// 				tags: ["thanos", "avengers", "infinity stones", "catastrophe"],
// 			},
// 			{
// 				id: "vibranium",
// 				title: "Vibranium",
// 				content:
// 					"Vibranium is a rare, extraterrestrial metallic element that landed as a meteorite in Wakanda. It is nearly indestructible and has the ability to absorb, store, and release kinetic energy. Vibranium was used to create Captain America's shield, the Black Panther suit, and powers Wakanda's advanced technology. It's considered the most valuable substance on Earth in the MCU.",
// 				category: "material",
// 				tags: ["wakanda", "technology", "captain america", "black panther"],
// 			},
// 		];

// 		// Add each knowledge fact
// 		for (const fact of knowledgeFacts) {
// 			try {
// 				const factId = await addKnowledgeFact(mcuUniverse, fact);
// 				console.log(`Added knowledge fact with ID: ${factId}`);
// 			} catch (e) {
// 				console.error("Error adding knowledge fact:", e);
// 			}
// 		}

// 		console.log("MCU seeding complete!");
// 	} catch (error) {
// 		console.error("Error in seed process:", error);
// 	}
// }

// // Run the seed function
// seedMCUData().catch(console.error);
