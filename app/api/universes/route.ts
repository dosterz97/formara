// File: app/api/universes/route.ts
import { db } from "@/lib/db/drizzle";
import { createUniverseCollection } from "@/lib/db/qdrant-client";
import { getTeamForUser, getUser } from "@/lib/db/queries";
import { entities, universes } from "@/lib/db/schema";
import { count, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET all universes
export async function GET(request: NextRequest) {
	try {
		const user = await getUser();

		console.log(user);
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const teamData = await getTeamForUser(user.id);

		if (!teamData) {
			return NextResponse.json({ error: "No team for user" }, { status: 500 });
		}

		// Get all universes for the user's team
		const allUniverses = await db
			.select()
			.from(universes)
			.where(eq(universes.teamId, teamData.id));

		// Count entities for each universe
		const universeData = await Promise.all(
			allUniverses.map(async (universe) => {
				const entityCount = await db
					.select({ count: count() })
					.from(entities)
					.where(eq(entities.universeId, universe.id));

				return {
					...universe,
					entityCount: entityCount[0]?.count || 0,
				};
			})
		);

		return NextResponse.json(universeData);
	} catch (error) {
		console.error("Error fetching universes:", error);
		return NextResponse.json(
			{ error: "Failed to fetch universes" },
			{ status: 500 }
		);
	}
}

// POST create a new universe
export async function POST(request: NextRequest) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const teamData = await getTeamForUser(user.id);

		if (!teamData) {
			return NextResponse.json({ error: "No team for user" }, { status: 500 });
		}

		const body = await request.json();

		// Validate required fields
		if (!body.name || !body.slug) {
			return NextResponse.json(
				{ error: "Name and slug are required" },
				{ status: 400 }
			);
		}

		// Create vector namespace
		const vectorNamespace = `universe_${body.slug}`;

		// Insert universe into PostgreSQL
		const newUniverse = {
			teamId: teamData.id,
			name: body.name,
			slug: body.slug,
			description: body.description || "",
			rules: body.rules || {},
			status: body.status || "active",
			vectorNamespace,
			createdBy: user.id,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const [universe] = await db
			.insert(universes)
			.values(newUniverse)
			.returning();

		// Create Qdrant collection
		await createUniverseCollection(universe);

		return NextResponse.json(universe, { status: 201 });
	} catch (error) {
		console.error("Error creating universe:", error);
		return NextResponse.json(
			{ error: "Failed to create universe" },
			{ status: 500 }
		);
	}
}
