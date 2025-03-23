import { db } from "@/lib/db/drizzle";
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
