import { db } from "@/lib/db/drizzle";
import { createEntityVector } from "@/lib/db/qdrant-client";
import { getTeamForUser, getUser } from "@/lib/db/queries";
import { entities, Entity, universes } from "@/lib/db/schema";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import slugify from "slugify";

// This file should be placed at: app/api/universes/[universeId]/entities/upload/route.ts

// POST endpoint to handle CSV upload for entities
export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ universeId: string }> }
) {
	try {
		const { universeId } = await params;

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

		// Parse form data with CSV file
		const formData = await request.formData();
		const csvFile = formData.get("file") as File | null;

		if (!csvFile) {
			return NextResponse.json(
				{ error: "CSV file is required" },
				{ status: 400 }
			);
		}

		// Check file type
		if (!csvFile.name.endsWith(".csv")) {
			return NextResponse.json(
				{ error: "Uploaded file must be a CSV" },
				{ status: 400 }
			);
		}

		// Read and parse CSV content
		const csvText = await csvFile.text();
		const parsedEntities = parseCSV(csvText);

		if (parsedEntities.errors.length > 0) {
			return NextResponse.json(
				{
					error: "CSV validation failed",
					details: parsedEntities.errors,
				},
				{ status: 400 }
			);
		}

		// Process and insert entities
		const results = {
			success: 0,
			failed: 0,
			errors: [] as { row: number; error: string }[],
		};

		for (let i = 0; i < parsedEntities.data.length; i++) {
			try {
				const entityData = parsedEntities.data[i];
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
			} catch (error: any) {
				results.failed++;
				results.errors.push({
					row: i + 2, // +2 because index is 0-based and we skip the header row
					error: error.message || "Unknown error",
				});
			}
		}

		return NextResponse.json({
			message: "CSV processing completed",
			results,
		});
	} catch (error) {
		console.error("Error processing CSV upload:", error);
		return NextResponse.json(
			{ error: "Failed to process CSV upload" },
			{ status: 500 }
		);
	}
}

// Helper function to parse CSV
function parseCSV(csvText: string) {
	// Use Papa Parse for robust CSV parsing
	// This is a simplified implementation for this endpoint

	const lines = csvText
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line.length > 0);

	if (lines.length < 2) {
		return {
			data: [],
			errors: ["CSV must contain a header row and at least one data row"],
		};
	}

	// Parse headers safely
	const headerLine = lines[0];
	const headers = parseCSVLineRobust(headerLine).map((header) =>
		header.trim().toLowerCase()
	);

	const requiredFields = ["name", "entity_type"];
	const missingRequiredFields = requiredFields.filter(
		(field) => !headers.includes(field)
	);

	if (missingRequiredFields.length > 0) {
		return {
			data: [],
			errors: [
				`CSV is missing required columns: ${missingRequiredFields.join(
					", "
				)}. Required columns are: ${requiredFields.join(", ")}`,
			],
		};
	}

	const data = [];
	const errors = [];

	for (let i = 1; i < lines.length; i++) {
		const values = parseCSVLineRobust(lines[i]);

		if (values.length !== headers.length) {
			errors.push(
				`Row ${i + 1} has ${values.length} columns, expected ${headers.length}`
			);
			continue;
		}

		const row: Record<string, string> = {};
		headers.forEach((header, index) => {
			// Preserve the original string including quotes for JSON fields
			row[header] = values[index];
		});

		data.push(row);
	}

	return { data, errors };
}

// More robust CSV line parser that preserves JSON structure
function parseCSVLineRobust(line: string): string[] {
	const result: string[] = [];
	let currentField = "";
	let insideQuotes = false;
	let i = 0;

	while (i < line.length) {
		const char = line[i];

		// Handle quotes
		if (char === '"') {
			// Check if this is an escaped quote
			if (i + 1 < line.length && line[i + 1] === '"') {
				// Add a single quote to the field and skip the next quote
				currentField += '"';
				i += 2;
				continue;
			}

			// Toggle quote state
			insideQuotes = !insideQuotes;
			i++;
			continue;
		}

		// If we hit a comma and we're not inside quotes, end the field
		if (char === "," && !insideQuotes) {
			result.push(currentField);
			currentField = "";
			i++;
			continue;
		}

		// Otherwise, add the character to the current field
		currentField += char;
		i++;
	}

	// Don't forget the last field
	result.push(currentField);

	return result;
}

// Helper function to process and validate an entity from CSV
async function processEntity(
	entityData: Record<string, string>,
	universeId: string,
	userId: string
): Promise<Omit<Entity, "id" | "createdAt" | "updatedAt">> {
	// Validate required fields
	if (!entityData.name || entityData.name.trim() === "") {
		throw new Error("Name is required");
	}

	if (!entityData.entity_type || entityData.entity_type.trim() === "") {
		throw new Error("Entity type is required");
	}

	// Validate entity type
	const entityType = entityData.entity_type.toLowerCase();
	if (!isValidEntityType(entityType)) {
		throw new Error(`Invalid entity type: ${entityType}`);
	}

	// Create slug from name if not provided
	const slug =
		entityData.slug && entityData.slug.trim() !== ""
			? slugify(entityData.slug)
			: slugify(entityData.name);

	// Set basic attributes to an empty object
	const basicAttributes: Record<string, any> = {};

	// Process status if provided
	let status = "active";
	if (entityData.status && entityData.status.trim() !== "") {
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
		imageUrl: entityData.imageUrl || null,
		description: entityData.description || null,
		status: status as any, // Cast to enum type
		basicAttributes,
		vectorId: randomUUID(), // Generate a random UUID for vector ID
		voiceId: entityData.voice_id || null,
		createdBy: userId,
	};
}

// Helper function to check if entity type is valid
function isValidEntityType(type: string): boolean {
	// This will depend on your pgEntityTypeEnum definition
	// You might need to adjust this based on your actual enum values
	const validTypes = ["character", "location", "item", "concept", "faction"];
	return validTypes.includes(type);
}

// Helper function to check if entity status is valid
function isValidEntityStatus(status: string): boolean {
	// This will depend on your pgEntityStatusEnum definition
	// You might need to adjust this based on your actual enum values
	const validStatuses = ["active", "inactive", "draft", "archived"];
	return validStatuses.includes(status);
}

// Removed JSON parsing helper as we no longer need to parse JSON from CSV
