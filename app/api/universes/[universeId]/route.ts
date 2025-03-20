import { db } from "@/lib/db/drizzle";
import { deleteUniverseCollection } from "@/lib/db/qdrant-client";
import { getTeamForUser, getUser } from "@/lib/db/queries";
import { entities, universes } from "@/lib/db/schema";
import { count, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET a specific universe by ID
export async function GET(
	request: NextRequest,
	{ params }: { params: { universeId: string } }
) {
	try {
		// Await the params object before destructuring
		const { universeId } = await params;

		if (!universeId) {
			return NextResponse.json(
				{ error: "Universe ID is required" },
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
		const universe = await db
			.select()
			.from(universes)
			.where(eq(universes.id, universeId))
			.limit(1);

		if (!universe || universe.length === 0) {
			return NextResponse.json(
				{ error: "Universe not found" },
				{ status: 404 }
			);
		}

		// Verify the universe belongs to the user's team
		if (universe[0].teamId !== teamData.id) {
			return NextResponse.json(
				{ error: "Unauthorized access to universe" },
				{ status: 403 }
			);
		}

		// Count entities for this universe
		const entityCount = await db
			.select({ count: count() })
			.from(entities)
			.where(eq(entities.universeId, universeId));

		const universeData = {
			...universe[0],
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
	{ params }: { params: { universeId: string } }
) {
	try {
		const { universeId } = params;

		if (!universeId) {
			return NextResponse.json(
				{ error: "Universe ID is required" },
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
		const existingUniverse = await db
			.select()
			.from(universes)
			.where(eq(universes.id, universeId))
			.limit(1);

		if (!existingUniverse || existingUniverse.length === 0) {
			return NextResponse.json(
				{ error: "Universe not found" },
				{ status: 404 }
			);
		}

		if (existingUniverse[0].teamId !== teamData.id) {
			return NextResponse.json(
				{ error: "Unauthorized access to universe" },
				{ status: 403 }
			);
		}

		const body = await request.json();

		// Update universe
		const updateData = {
			name: body.name !== undefined ? body.name : existingUniverse[0].name,
			description:
				body.description !== undefined
					? body.description
					: existingUniverse[0].description,
			rules: body.rules !== undefined ? body.rules : existingUniverse[0].rules,
			status:
				body.status !== undefined ? body.status : existingUniverse[0].status,
			updatedAt: new Date(),
		};

		const [updatedUniverse] = await db
			.update(universes)
			.set(updateData)
			.where(eq(universes.id, universeId))
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

// DELETE a universe by ID
export async function DELETE(
	request: NextRequest,
	{ params }: { params: { universeId: string } }
) {
	try {
		const { universeId } = await params;

		if (!universeId) {
			return NextResponse.json(
				{ error: "Universe ID is required" },
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

		// Find universe to get its vector namespace (for Qdrant collection deletion)
		const [universe] = await db
			.select()
			.from(universes)
			.where(eq(universes.id, universeId))
			.limit(1);

		if (!universe) {
			return NextResponse.json(
				{ error: "Universe not found" },
				{ status: 404 }
			);
		}

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
			await tx.delete(entities).where(eq(entities.universeId, universeId));

			// Then delete the universe
			await tx.delete(universes).where(eq(universes.id, universeId));

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
