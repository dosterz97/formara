import { db } from "@/lib/db/drizzle";
import { createEntityVector } from "@/lib/db/qdrant-client";
import { getTeamForUser, getUser } from "@/lib/db/queries";
import { entities, Entity, universes } from "@/lib/db/schema";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import slugify from "slugify";

// This file should be placed at: app/api/universe/[universeId]/entities/batch/route.ts

// POST endpoint to handle batch upload of entities as JSON
export async function POST(
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

		// Authenticate user and check team access
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const teamData = await getTeamForUser(user.id);
		if (!teamData) {
			return NextResponse.json({ error: "No team for user" }, { status: 500 });
		}

		// Get the universe to check permissions and get metadata
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

		// Check if the universe belongs to the user's team
		if (universe[0].teamId !== teamData.id) {
			return NextResponse.json(
				{ error: "Unauthorized access to universe" },
				{ status: 403 }
			);
		}

		// Parse JSON body
		const { entities: entitiesData } = await request.json();

		if (
			!entitiesData ||
			!Array.isArray(entitiesData) ||
			entitiesData.length === 0
		) {
			return NextResponse.json(
				{ error: "Valid entities array is required" },
				{ status: 400 }
			);
		}

		// Process and insert entities
		const results = {
			success: 0,
			failed: 0,
			errors: [] as { index: number; name: string; error: string }[],
			createdEntities: [] as any[],
		};

		for (let i = 0; i < entitiesData.length; i++) {
			try {
				const entityData = entitiesData[i];
				const entity = await processEntity(entityData, universeId, user.id);

				// Insert entity into database
				const [createdEntity] = await db
					.insert(entities)
					.values(entity)
					.returning();

				// If this universe uses vector embeddings, create the vector for this entity
				if (universe[0].vectorNamespace) {
					await createEntityVector(createdEntity, universe[0]);
				}

				results.success++;
				results.createdEntities.push(createdEntity);
			} catch (error: any) {
				results.failed++;
				results.errors.push({
					index: i,
					name: entitiesData[i]?.name || "Unknown entity",
					error: error.message || "Unknown error",
				});
			}
		}

		return NextResponse.json({
			message: "Entities batch processing completed",
			results,
		});
	} catch (error) {
		console.error("Error processing entities batch upload:", error);
		return NextResponse.json(
			{ error: "Failed to process entities batch upload" },
			{ status: 500 }
		);
	}
}

// Helper function to process and validate an entity from JSON
async function processEntity(
	entityData: Record<string, any>,
	universeId: string,
	userId: string
): Promise<Omit<Entity, "id" | "createdAt" | "updatedAt">> {
	// Validate required fields
	if (
		!entityData.name ||
		typeof entityData.name !== "string" ||
		entityData.name.trim() === ""
	) {
		throw new Error("Name is required");
	}

	if (!entityData.entity_type && !entityData.entityType) {
		throw new Error("Entity type is required");
	}

	// Handle both camel case and snake case
	const entityType = (
		entityData.entity_type || entityData.entityType
	).toLowerCase();

	if (!isValidEntityType(entityType)) {
		throw new Error(`Invalid entity type: ${entityType}`);
	}

	// Create slug from name if not provided
	const slug =
		entityData.slug &&
		typeof entityData.slug === "string" &&
		entityData.slug.trim() !== ""
			? slugify(entityData.slug)
			: slugify(entityData.name);

	// Set basic attributes
	const basicAttributes: Record<string, any> =
		entityData.basicAttributes || entityData.basic_attributes || {};

	// Process status if provided
	let status = "active";
	if (
		entityData.status &&
		typeof entityData.status === "string" &&
		entityData.status.trim() !== ""
	) {
		if (!isValidEntityStatus(entityData.status.toLowerCase())) {
			throw new Error(`Invalid entity status: ${entityData.status}`);
		}
		status = entityData.status.toLowerCase();
	}

	// Create entity object
	return {
		universeId,
		slug,
		name: entityData.name.trim(),
		entityType: entityType as any, // Cast to enum type
		description: entityData.description || null,
		status: status as any, // Cast to enum type
		basicAttributes,
		vectorId: entityData.vectorId || randomUUID(), // Generate a random UUID for vector ID if not provided
		voiceId: entityData.voiceId || entityData.voice_id || null,
		createdBy: userId,
	};
}

// Helper function to check if entity type is valid
function isValidEntityType(type: string): boolean {
	// Updated to match your schema
	const validTypes = [
		"character",
		"location",
		"item",
		"event",
		"concept",
		"organization",
		"other",
	];
	return validTypes.includes(type);
}

// Helper function to check if entity status is valid
function isValidEntityStatus(status: string): boolean {
	// Updated to match your schema
	const validStatuses = [
		"active",
		"inactive",
		"deceased",
		"historical",
		"conceptual",
		"unknown",
	];
	return validStatuses.includes(status);
}
