import { db } from "@/lib/db/drizzle";
import { deleteEntityVector, updateEntityVector } from "@/lib/db/qdrant-client";
import { getTeamForUser, getUser } from "@/lib/db/queries";
import { entities, universes } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET a specific entity
export async function GET(
	request: NextRequest,
	{ params }: { params: { universeId: string; entityId: string } }
) {
	console.log("GET");
	try {
		const { universeId, entityId } = await params;

		if (!universeId || !entityId) {
			return NextResponse.json(
				{ error: "Universe ID and Entity ID are required" },
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
		const universe = await db
			.select()
			.from(universes)
			.where(eq(universes.id, parseInt(universeId, 10)))
			.limit(1);

		if (!universe || universe.length === 0) {
			return NextResponse.json(
				{ error: "Universe not found" },
				{ status: 404 }
			);
		}

		if (universe[0].teamId !== teamData.id) {
			return NextResponse.json(
				{ error: "Unauthorized access to universe" },
				{ status: 403 }
			);
		}

		// Get the entity
		const entity = await db
			.select()
			.from(entities)
			.where(
				and(
					eq(entities.id, parseInt(entityId, 10)),
					eq(entities.universeId, parseInt(universeId, 10))
				)
			)
			.limit(1);

		if (!entity || entity.length === 0) {
			return NextResponse.json({ error: "Entity not found" }, { status: 404 });
		}

		console.log(entity);
		return NextResponse.json(entity[0]);
	} catch (error) {
		console.error("Error fetching entity:", error);
		return NextResponse.json(
			{ error: "Failed to fetch entity" },
			{ status: 500 }
		);
	}
}

// PUT update a specific entity
export async function PUT(
	request: NextRequest,
	{ params }: { params: { universeId: string; entityId: string } }
) {
	try {
		const { universeId, entityId } = await params;

		if (!universeId || !entityId) {
			return NextResponse.json(
				{ error: "Universe ID and Entity ID are required" },
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
		const universe = await db
			.select()
			.from(universes)
			.where(eq(universes.id, parseInt(universeId, 10)))
			.limit(1);

		if (!universe || universe.length === 0) {
			return NextResponse.json(
				{ error: "Universe not found" },
				{ status: 404 }
			);
		}

		if (universe[0].teamId !== teamData.id) {
			return NextResponse.json(
				{ error: "Unauthorized access to universe" },
				{ status: 403 }
			);
		}

		// Check if entity exists
		const existingEntity = await db
			.select()
			.from(entities)
			.where(
				and(
					eq(entities.id, parseInt(entityId, 10)),
					eq(entities.universeId, parseInt(universeId, 10))
				)
			)
			.limit(1);

		if (!existingEntity || existingEntity.length === 0) {
			return NextResponse.json({ error: "Entity not found" }, { status: 404 });
		}

		const body = await request.json();

		// Validate required fields
		if (!body.name || body.name.trim() === "") {
			return NextResponse.json({ error: "Name is required" }, { status: 400 });
		}

		// Update the entity
		const updateData = {
			name: body.name,
			description:
				body.description !== undefined
					? body.description
					: existingEntity[0].description,
			type: body.type !== undefined ? body.type : existingEntity[0].entityType,
			attributes:
				body.attributes !== undefined
					? body.attributes
					: existingEntity[0].basicAttributes,
			status:
				body.status !== undefined ? body.status : existingEntity[0].status,
			updatedAt: new Date(),
		};

		const [updatedEntity] = await db
			.update(entities)
			.set(updateData)
			.where(
				and(
					eq(entities.id, parseInt(entityId, 10)),
					eq(entities.universeId, parseInt(universeId, 10))
				)
			)
			.returning();

		// If this universe uses vector embeddings, you might need to update the vector for this entity
		if (universe[0].vectorNamespace) {
			await updateEntityVector(updatedEntity, universe[0]);
		}

		return NextResponse.json(updatedEntity);
	} catch (error) {
		console.error("Error updating entity:", error);
		return NextResponse.json(
			{ error: "Failed to update entity" },
			{ status: 500 }
		);
	}
}

// DELETE a specific entity
export async function DELETE(
	request: NextRequest,
	{ params }: { params: { universeId: string; entityId: string } }
) {
	try {
		const { universeId, entityId } = await params;

		if (!universeId || !entityId) {
			return NextResponse.json(
				{ error: "Universe ID and Entity ID are required" },
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
		const universe = await db
			.select()
			.from(universes)
			.where(eq(universes.id, parseInt(universeId, 10)))
			.limit(1);

		if (!universe || universe.length === 0) {
			return NextResponse.json(
				{ error: "Universe not found" },
				{ status: 404 }
			);
		}

		if (universe[0].teamId !== teamData.id) {
			return NextResponse.json(
				{ error: "Unauthorized access to universe" },
				{ status: 403 }
			);
		}

		// Check if entity exists
		const existingEntity = await db
			.select()
			.from(entities)
			.where(
				and(
					eq(entities.id, parseInt(entityId, 10)),
					eq(entities.universeId, parseInt(universeId, 10))
				)
			)
			.limit(1);

		if (!existingEntity || existingEntity.length === 0) {
			return NextResponse.json({ error: "Entity not found" }, { status: 404 });
		}

		// Delete the entity
		await db
			.delete(entities)
			.where(
				and(
					eq(entities.id, parseInt(entityId, 10)),
					eq(entities.universeId, parseInt(universeId, 10))
				)
			);

		// If this universe uses vector embeddings, delete the vector for this entity
		if (universe[0].vectorNamespace) {
			await deleteEntityVector(existingEntity[0], universe[0]);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error deleting entity:", error);
		return NextResponse.json(
			{ error: "Failed to delete entity" },
			{ status: 500 }
		);
	}
}
