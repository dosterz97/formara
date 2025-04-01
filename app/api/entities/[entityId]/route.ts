import { db } from "@/lib/db/drizzle";
import { deleteEntityVector, updateEntityVector } from "@/lib/db/qdrant-client";
import { getTeamForUser, getUser } from "@/lib/db/queries";
import { entities, Entity, universes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET a specific entity
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ entityId: string }> }
) {
	try {
		const { entityId } = await params;

		if (!entityId) {
			return NextResponse.json(
				{ error: "Entity ID is required" },
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

		// Get the entity
		const entity = await db
			.select({
				entity: entities,
				universe: universes,
			})
			.from(entities)
			.innerJoin(universes, eq(entities.universeId, universes.id))
			.where(eq(entities.id, entityId))
			.limit(1);

		if (!entity || entity.length === 0) {
			return NextResponse.json({ error: "Entity not found" }, { status: 404 });
		}

		// Check if the entity's universe belongs to the user's team
		if (entity[0].universe.teamId !== teamData.id) {
			return NextResponse.json(
				{ error: "Unauthorized access to entity" },
				{ status: 403 }
			);
		}

		return NextResponse.json(entity[0].entity);
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
	{ params }: { params: Promise<{ entityId: string }> }
) {
	try {
		const { entityId } = await params;

		if (!entityId) {
			return NextResponse.json(
				{ error: "Entity ID is required" },
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

		// Get the entity along with its universe to check permissions
		const entityWithUniverse = await db
			.select({
				entity: entities,
				universe: universes,
			})
			.from(entities)
			.innerJoin(universes, eq(entities.universeId, universes.id))
			.where(eq(entities.id, entityId))
			.limit(1);

		if (!entityWithUniverse || entityWithUniverse.length === 0) {
			return NextResponse.json({ error: "Entity not found" }, { status: 404 });
		}

		const existingEntity = entityWithUniverse[0].entity;
		const universe = entityWithUniverse[0].universe;

		// Check if the entity's universe belongs to the user's team
		if (universe.teamId !== teamData.id) {
			return NextResponse.json(
				{ error: "Unauthorized access to entity" },
				{ status: 403 }
			);
		}

		const body = await request.json();

		// Validate required fields
		if (!body.name || body.name.trim() === "") {
			return NextResponse.json({ error: "Name is required" }, { status: 400 });
		}

		// Update the entity
		const updateData: Partial<Entity> = {
			name: body.name,
			description:
				body.description !== undefined
					? body.description
					: existingEntity.description,
			entityType:
				body.entityType !== undefined
					? body.entityType
					: existingEntity.entityType,
			basicAttributes:
				body.basicAttributes !== undefined
					? body.basicAttributes
					: existingEntity.basicAttributes,
			status: body.status !== undefined ? body.status : existingEntity.status,
			voiceId:
				body.voiceId !== undefined ? body.voiceId : existingEntity.voiceId,
			updatedAt: new Date(),
		};

		const [updatedEntity] = await db
			.update(entities)
			.set(updateData)
			.where(eq(entities.id, entityId))
			.returning();

		// If this universe uses vector embeddings, update the vector for this entity
		if (universe.vectorNamespace) {
			await updateEntityVector(updatedEntity, universe);
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
	{ params }: { params: Promise<{ entityId: string }> }
) {
	try {
		const { entityId } = await params;

		if (!entityId) {
			return NextResponse.json(
				{ error: "Entity ID is required" },
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

		// Get the entity along with its universe to check permissions
		const entityWithUniverse = await db
			.select({
				entity: entities,
				universe: universes,
			})
			.from(entities)
			.innerJoin(universes, eq(entities.universeId, universes.id))
			.where(eq(entities.id, entityId))
			.limit(1);

		if (!entityWithUniverse || entityWithUniverse.length === 0) {
			return NextResponse.json({ error: "Entity not found" }, { status: 404 });
		}

		const existingEntity = entityWithUniverse[0].entity;
		const universe = entityWithUniverse[0].universe;

		// Check if the entity's universe belongs to the user's team
		if (universe.teamId !== teamData.id) {
			return NextResponse.json(
				{ error: "Unauthorized access to entity" },
				{ status: 403 }
			);
		}

		// Delete the entity
		await db.delete(entities).where(eq(entities.id, entityId));

		// If this universe uses vector embeddings, delete the vector for this entity
		if (universe.vectorNamespace) {
			await deleteEntityVector(existingEntity, universe);
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
