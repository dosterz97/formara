import { db } from "@/lib/db/drizzle";
import { deleteUniverseCollection } from "@/lib/db/qdrant-client";
import { getTeamForUser, getUser } from "@/lib/db/queries";
import { entities, universes } from "@/lib/db/schema";
import { count, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
	request: NextRequest,
	{ params }: { params: { universeSlug: string } }
) {
	try {
		// Await the params object before destructuring
		const { universeSlug } = await params;

		console.log(universeSlug);
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

		// Get the specific universe by ID
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

		// Verify the universe belongs to the user's team
		if (universe.teamId !== teamData.id) {
			return NextResponse.json(
				{ error: "Unauthorized access to universe" },
				{ status: 403 }
			);
		}

		// Count entities for this universe
		const entityCount = await db
			.select({ count: count() })
			.from(entities)
			.where(eq(entities.universeId, universe.id));

		const universeData = {
			...universe,
			entityCount: entityCount[0]?.count || 0,
		};

		return NextResponse.json(universeData);
	} catch (error) {
		console.error("Error fetching universe:", error);
		return NextResponse.json(
			{ error: "Failed to fetch universe" },
			{ status: 500 }
		);
	}
}

// PUT/PATCH to update a universe
export async function PUT(
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

		// Check if universe exists and belongs to user's team
		const existingUniverseResult = await db
			.select()
			.from(universes)
			.where(eq(universes.slug, universeSlug))
			.limit(1);

		if (!existingUniverseResult || existingUniverseResult.length === 0) {
			return NextResponse.json(
				{ error: "Universe not found" },
				{ status: 404 }
			);
		}

		const existingUniverse = existingUniverseResult[0];

		if (existingUniverse.teamId !== teamData.id) {
			return NextResponse.json(
				{ error: "Unauthorized access to universe" },
				{ status: 403 }
			);
		}

		const body = await request.json();

		// Update universe
		const updateData = {
			name: body.name !== undefined ? body.name : existingUniverse.name,
			description:
				body.description !== undefined
					? body.description
					: existingUniverse.description,
			rules: body.rules !== undefined ? body.rules : existingUniverse.rules,
			status: body.status !== undefined ? body.status : existingUniverse.status,
			updatedAt: new Date(),
		};

		const [updatedUniverse] = await db
			.update(universes)
			.set(updateData)
			.where(eq(universes.slug, universeSlug))
			.returning();

		return NextResponse.json(updatedUniverse);
	} catch (error) {
		console.error("Error updating universe:", error);
		return NextResponse.json(
			{ error: "Failed to update universe" },
			{ status: 500 }
		);
	}
}

// DELETE a universe by slug
export async function DELETE(
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

		// Authenticate user
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Get user's team
		const teamData = await getTeamForUser(user.id);
		if (!teamData) {
			return NextResponse.json({ error: "No team for user" }, { status: 500 });
		}

		// Find universe by slug to get its vector namespace and ID
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

		// Verify the universe belongs to the user's team
		if (universe.teamId !== teamData.id) {
			return NextResponse.json(
				{ error: "Unauthorized access to universe" },
				{ status: 403 }
			);
		}

		// Start transaction for database operations
		const result = await db.transaction(async (tx) => {
			// First, delete all entities belonging to this universe
			await tx.delete(entities).where(eq(entities.universeId, universe.id));

			// Then delete the universe
			await tx.delete(universes).where(eq(universes.id, universe.id));

			return { success: true };
		});

		// Delete the Qdrant collection
		if (universe.vectorNamespace) {
			try {
				await deleteUniverseCollection(universe);
			} catch (error) {
				console.error("Failed to delete vector collection:", error);
				// Continue even if vector collection deletion fails
			}
		}

		return NextResponse.json(
			{ message: "Universe and its entities successfully deleted" },
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error deleting universe:", error);
		return NextResponse.json(
			{ error: "Failed to delete universe" },
			{ status: 500 }
		);
	}
}
