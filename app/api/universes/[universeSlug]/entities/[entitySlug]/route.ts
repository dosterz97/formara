import { db } from "@/lib/db/drizzle";
import { getTeamForUser, getUser } from "@/lib/db/queries";
import { entities, universes } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET a specific entity
export async function GET(
	request: NextRequest,
	{ params }: { params: { universeSlug: string; entitySlug: string } }
) {
	try {
		const { universeSlug, entitySlug } = await params;
		console.log("GET", universeSlug, entitySlug);
		if (!universeSlug || !entitySlug) {
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

		// Get the entity
		const entity = await db
			.select()
			.from(entities)
			.where(
				and(eq(entities.slug, entitySlug), eq(entities.universeId, universe.id))
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
