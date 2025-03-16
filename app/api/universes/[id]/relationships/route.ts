// File: app/api/universes/[id]/relationships/route.ts
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/drizzle";
import { entities, universes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
	params: {
		id: string;
	};
}

// GET all relationships for a universe
export async function GET(request: NextRequest, { params }: RouteParams) {
	try {
		const session = await auth();
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id: universeId } = params;

		// Get universe to check permissions
		const [universe] = await db
			.select()
			.from(universes)
			.where(eq(universes.id, parseInt(universeId)));

		if (!universe) {
			return NextResponse.json(
				{ error: "Universe not found" },
				{ status: 404 }
			);
		}

		// Check team ownership
		if (universe.teamId !== session.user.teamId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
		}

		// Get all relationships from Qdrant
		const { getRelationships } = await import("@/lib/db/qdrant-client");
		const relationships = await getRelationships(universe);

		// Enhance with entity names
		const enhancedRelationships = await Promise.all(
			relationships.map(async (rel) => {
				const [sourceEntity] = await db
					.select()
					.from(entities)
					.where(eq(entities.id, rel.sourceEntityId));

				const [targetEntity] = await db
					.select()
					.from(entities)
					.where(eq(entities.id, rel.targetEntityId));

				return {
					...rel,
					sourceEntityName: sourceEntity?.name || "Unknown Entity",
					targetEntityName: targetEntity?.name || "Unknown Entity",
				};
			})
		);

		return NextResponse.json(enhancedRelationships);
	} catch (error) {
		console.error("Error fetching relationships:", error);
		return NextResponse.json(
			{ error: "Failed to fetch relationships" },
			{ status: 500 }
		);
	}
}

// POST create a new relationship
export async function POST(request: NextRequest, { params }: RouteParams) {
	try {
		const session = await auth();
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id: universeId } = params;
		const body = await request.json();

		// Validate required fields
		if (
			!body.sourceEntityId ||
			!body.targetEntityId ||
			!body.relationshipType
		) {
			return NextResponse.json(
				{
					error:
						"Source entity, target entity, and relationship type are required",
				},
				{ status: 400 }
			);
		}

		// Get universe to check permissions
		const [universe] = await db
			.select()
			.from(universes)
			.where(eq(universes.id, parseInt(universeId)));

		if (!universe) {
			return NextResponse.json(
				{ error: "Universe not found" },
				{ status: 404 }
			);
		}

		// Check team ownership
		if (universe.teamId !== session.user.teamId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
		}

		// Verify both entities exist and belong to this universe
		const [sourceEntity] = await db
			.select()
			.from(entities)
			.where(eq(entities.id, body.sourceEntityId))
			.where(eq(entities.universeId, parseInt(universeId)));

		const [targetEntity] = await db
			.select()
			.from(entities)
			.where(eq(entities.id, body.targetEntityId))
			.where(eq(entities.universeId, parseInt(universeId)));

		if (!sourceEntity || !targetEntity) {
			return NextResponse.json(
				{ error: "One or both entities not found in this universe" },
				{ status: 404 }
			);
		}

		// Create relationship in Qdrant
		const { addRelationship } = await import("@/lib/db/qdrant-client");

		const relationship = {
			type: body.relationshipType,
			description: body.description || "",
			properties: body.properties || {},
		};

		const relationshipId = await addRelationship(
			universe,
			body.sourceEntityId,
			body.targetEntityId,
			relationship
		);

		return NextResponse.json(
			{
				id: relationshipId,
				sourceEntityId: body.sourceEntityId,
				targetEntityId: body.targetEntityId,
				sourceEntityName: sourceEntity.name,
				targetEntityName: targetEntity.name,
				relationshipType: relationship.type,
				description: relationship.description,
				properties: relationship.properties,
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error("Error creating relationship:", error);
		return NextResponse.json(
			{ error: "Failed to create relationship" },
			{ status: 500 }
		);
	}
}

// File: app/api/relationships/[id]/route.ts

interface RouteParams {
	params: {
		id: string;
	};
}

// GET relationship by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
	try {
		const session = await auth();
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = params;
		const { searchParams } = new URL(request.url);
		const universeId = searchParams.get("universeId");

		if (!universeId) {
			return NextResponse.json(
				{ error: "universeId is required" },
				{ status: 400 }
			);
		}

		// Get universe to check permissions
		const [universe] = await db
			.select()
			.from(universes)
			.where(eq(universes.id, parseInt(universeId)));

		if (!universe) {
			return NextResponse.json(
				{ error: "Universe not found" },
				{ status: 404 }
			);
		}

		// Check team ownership
		if (universe.teamId !== session.user.teamId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
		}

		// Get relationship from Qdrant
		const { getRelationshipById } = await import("@/lib/db/qdrant-client");
		const relationship = await getRelationshipById(universe, id);

		if (!relationship) {
			return NextResponse.json(
				{ error: "Relationship not found" },
				{ status: 404 }
			);
		}

		// Enhance with entity names
		const [sourceEntity] = await db
			.select()
			.from(entities)
			.where(eq(entities.id, relationship.sourceEntityId));

		const [targetEntity] = await db
			.select()
			.from(entities)
			.where(eq(entities.id, relationship.targetEntityId));

		return NextResponse.json({
			...relationship,
			sourceEntityName: sourceEntity?.name || "Unknown Entity",
			targetEntityName: targetEntity?.name || "Unknown Entity",
		});
	} catch (error) {
		console.error("Error fetching relationship:", error);
		return NextResponse.json(
			{ error: "Failed to fetch relationship" },
			{ status: 500 }
		);
	}
}

// PUT update relationship
export async function PUT(request: NextRequest, { params }: RouteParams) {
	try {
		const session = await auth();
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = params;
		const body = await request.json();

		// Validate required fields
		if (
			!body.sourceEntityId ||
			!body.targetEntityId ||
			!body.relationshipType ||
			!body.universeId
		) {
			return NextResponse.json(
				{
					error:
						"Source entity, target entity, relationship type, and universeId are required",
				},
				{ status: 400 }
			);
		}

		// Get universe to check permissions
		const [universe] = await db
			.select()
			.from(universes)
			.where(eq(universes.id, body.universeId));

		if (!universe) {
			return NextResponse.json(
				{ error: "Universe not found" },
				{ status: 404 }
			);
		}

		// Check team ownership
		if (universe.teamId !== session.user.teamId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
		}

		// Update relationship in Qdrant
		const { updateRelationship } = await import("@/lib/db/qdrant-client");

		const relationship = {
			id,
			sourceEntityId: body.sourceEntityId,
			targetEntityId: body.targetEntityId,
			type: body.relationshipType,
			description: body.description || "",
			properties: body.properties || {},
		};

		await updateRelationship(universe, relationship);

		// Get entity names for response
		const [sourceEntity] = await db
			.select()
			.from(entities)
			.where(eq(entities.id, body.sourceEntityId));

		const [targetEntity] = await db
			.select()
			.from(entities)
			.where(eq(entities.id, body.targetEntityId));

		return NextResponse.json({
			id,
			sourceEntityId: body.sourceEntityId,
			targetEntityId: body.targetEntityId,
			sourceEntityName: sourceEntity?.name || "Unknown Entity",
			targetEntityName: targetEntity?.name || "Unknown Entity",
			relationshipType: body.relationshipType,
			description: body.description || "",
			properties: body.properties || {},
		});
	} catch (error) {
		console.error("Error updating relationship:", error);
		return NextResponse.json(
			{ error: "Failed to update relationship" },
			{ status: 500 }
		);
	}
}

// DELETE relationship
export async function DELETE(request: NextRequest, { params }: RouteParams) {
	try {
		const session = await auth();
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = params;
		const { searchParams } = new URL(request.url);
		const universeId = searchParams.get("universeId");

		if (!universeId) {
			return NextResponse.json(
				{ error: "universeId is required" },
				{ status: 400 }
			);
		}

		// Get universe to check permissions
		const [universe] = await db
			.select()
			.from(universes)
			.where(eq(universes.id, parseInt(universeId)));

		if (!universe) {
			return NextResponse.json(
				{ error: "Universe not found" },
				{ status: 404 }
			);
		}

		// Check team ownership
		if (universe.teamId !== session.user.teamId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
		}

		// Delete relationship from Qdrant
		const { deleteRelationship } = await import("@/lib/db/qdrant-client");
		await deleteRelationship(universe, id);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error deleting relationship:", error);
		return NextResponse.json(
			{ error: "Failed to delete relationship" },
			{ status: 500 }
		);
	}
}
