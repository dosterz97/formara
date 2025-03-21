import { db } from "@/lib/db/drizzle";
import {
	createEntityVector,
	createUniverseCollection,
	verifyCollection,
} from "@/lib/db/qdrant-client";
import { getTeamForUser, getUser } from "@/lib/db/queries";
import { entities, universes } from "@/lib/db/schema";
import { count, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import slugify from "slugify";

// GET a specific universe by ID with its entities
// GET all entities for a universe
export async function GET(
	request: NextRequest,
	{ params }: { params: { universeSlug: string } }
) {
	try {
		const { universeSlug } = await params;

		if (!universeSlug) {
			return NextResponse.json(
				{ error: "Universe Slug is required" },
				{ status: 400 }
			);
		}

		const user = await getUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const teamData = await getTeamForUser(user.id);
		if (!teamData) {
			return NextResponse.json({ error: "No team for user" }, { status: 500 });
		}

		// Verify the universe exists and belongs to the user's team
		const universeResult = await db
			.select()
			.from(universes)
			.where(eq(universes.slug, universeSlug))
			.limit(1);

		if (!universeResult || universeResult.length === 0) {
			return NextResponse.json(
				{ error: "Universe not found" },
				{ status: 404 }
			);
		}

		const universe = universeResult[0];

		if (universe.teamId !== teamData.id) {
			return NextResponse.json(
				{ error: "Unauthorized access to universe" },
				{ status: 403 }
			);
		}

		// Get query params for pagination
		const searchParams = request.nextUrl.searchParams;
		const limit = parseInt(searchParams.get("limit") || "50");
		const offset = parseInt(searchParams.get("offset") || "0");
		const search = searchParams.get("search") || "";

		// Get entities with search and pagination
		let query = db
			.select()
			.from(entities)
			.where(eq(entities.universeId, universe.id));

		// // Add search if provided
		// if (search) {
		// 	// This is a basic implementation - you might want to use a more sophisticated
		// 	// search method like full-text search depending on your database
		// 	query = query.where(like(entities.name, `%${search}%`));
		// }

		// Add pagination
		const allEntities = await query.limit(limit).offset(offset);

		// console.log(allEntities);

		// Get total count for pagination
		const countResult = await db
			.select({ count: count() })
			.from(entities)
			.where(eq(entities.universeId, universe.id));

		const total = countResult[0]?.count || 0;

		return NextResponse.json({
			entities: allEntities,
			pagination: {
				total,
				limit,
				offset,
				hasMore: offset + allEntities.length < total,
			},
		});
	} catch (error) {
		console.error("Error fetching entities:", error);
		return NextResponse.json(
			{ error: "Failed to fetch entities" },
			{ status: 500 }
		);
	}
}

// POST create a new entity
export async function POST(
	request: NextRequest,
	{ params }: { params: { universeSlug: string } }
) {
	try {
		const { universeSlug } = await params;

		if (!universeSlug) {
			return NextResponse.json(
				{ error: "Universe slug is required" },
				{ status: 400 }
			);
		}

		const user = await getUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const teamData = await getTeamForUser(user.id);
		if (!teamData) {
			return NextResponse.json({ error: "No team for user" }, { status: 500 });
		}

		// Verify the universe exists and belongs to the user's team
		const universeResult = await db
			.select()
			.from(universes)
			.where(eq(universes.slug, universeSlug))
			.limit(1);

		if (!universeResult || universeResult.length === 0) {
			return NextResponse.json(
				{ error: "Universe not found" },
				{ status: 404 }
			);
		}

		const universe = universeResult[0];

		if (universe.teamId !== teamData.id) {
			return NextResponse.json(
				{ error: "Unauthorized access to universe" },
				{ status: 403 }
			);
		}

		const body = await request.json();

		// Validate required fields
		if (!body.name) {
			return NextResponse.json({ error: "Name is required" }, { status: 400 });
		}

		// await resetEntitySequence();

		const newEntity = {
			universeId: universe.id,
			name: body.name,
			slug: slugify(body.name, { lower: true, strict: true }),
			description: body.description || "",
			entityType: body.entityType || "character", // Make sure this matches your enum values
			basicAttributes: body.attributes || {},
			status: body.status || "active",
			vectorId: "pending", // Temporary placeholder that satisfies the NOT NULL constraint
			createdBy: user.id,
			createdAt: new Date(),
			updatedAt: new Date(),
		} satisfies Omit<typeof entities.$inferInsert, "id">;

		// console.log("newEntity", newEntity);
		const [entity] = await db.insert(entities).values(newEntity).returning();

		// For your entity update after vector creation:
		if (universe.vectorNamespace) {
			try {
				// First verify the collection
				const collectionValid = await verifyCollection(
					universe.vectorNamespace
				);

				if (!collectionValid) {
					console.log("Recreating collection...");
					await createUniverseCollection(universe);
				}

				const vectorId = await createEntityVector(entity, universe);

				await db
					.update(entities)
					.set({ vectorId })
					.where(eq(entities.id, entity.id));

				console.log(`Entity ${entity.id} updated with vectorId ${vectorId}`);
			} catch (error) {
				console.error(
					"Error with vector storage, continuing with entity creation:",
					error
				);
				// Set the entity ID as the vector ID as a fallback
				const fallbackVectorId = entity.id.toString();
				await db
					.update(entities)
					.set({ vectorId: fallbackVectorId })
					.where(eq(entities.id, entity.id));
			}
		}

		return NextResponse.json(entity, { status: 201 });
	} catch (error) {
		console.error("Error creating entity:", error);
		return NextResponse.json(
			{ error: "Failed to create entity" },
			{ status: 500 }
		);
	}
}

// Function to reset the sequence (call this only when needed)
async function resetEntitySequence() {
	await db.execute(sql`
	  SELECT setval('entities_id_seq', (SELECT MAX(id) FROM entities) + 1)
	`);
	console.log("Reset entities sequence to next available ID");
}
