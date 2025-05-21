import { db } from "@/lib/db/drizzle";
import { getTeamForUser, getUser } from "@/lib/db/queries";
import { bots } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import slugify from "slugify";

export async function GET(request: NextRequest) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const teamData = await getTeamForUser(user.id);
		if (!teamData) {
			return NextResponse.json({ error: "No team for user" }, { status: 500 });
		}

		// Get all bots for the team
		const teamBots = await db
			.select()
			.from(bots)
			.where(eq(bots.teamId, teamData.id))
			.orderBy(desc(bots.createdAt));

		return NextResponse.json(teamBots);
	} catch (error) {
		console.error("Error fetching bots:", error);
		return NextResponse.json(
			{ error: "Failed to fetch bots" },
			{ status: 500 }
		);
	}
}

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

		const data = await request.json();

		// Generate a slug from the name
		const slug = slugify(data.name, {
			lower: true,
			strict: true,
		});

		// Check if a bot with this slug already exists for this team
		const existingBot = await db
			.select()
			.from(bots)
			.where(eq(bots.teamId, teamData.id) && eq(bots.slug, slug))
			.limit(1);

		if (existingBot.length > 0) {
			return NextResponse.json(
				{ error: "A bot with this name already exists" },
				{ status: 400 }
			);
		}

		// Create the bot
		const [newBot] = await db
			.insert(bots)
			.values({
				teamId: teamData.id,
				name: data.name,
				slug,
				description: data.description,
				systemPrompt: data.systemPrompt,
				status: data.status,
				createdBy: user.id,
			})
			.returning();

		return NextResponse.json(newBot);
	} catch (error) {
		console.error("Error creating bot:", error);
		return NextResponse.json(
			{ error: "Failed to create bot" },
			{ status: 500 }
		);
	}
}
