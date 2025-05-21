import { db } from "@/lib/db/drizzle";
import { getTeamForUser, getUser } from "@/lib/db/queries";
import { bots } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
	request: NextRequest,
	{ params }: { params: { botSlug: string } }
) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const teamData = await getTeamForUser(user.id);
		if (!teamData) {
			return NextResponse.json({ error: "No team for user" }, { status: 500 });
		}

		const { botSlug } = await params;

		// Get the specific bot by slug
		const bot = await db
			.select()
			.from(bots)
			.where(eq(bots.slug, botSlug))
			.limit(1);

		if (!bot || bot.length === 0) {
			return NextResponse.json({ error: "Bot not found" }, { status: 404 });
		}

		// Verify the bot belongs to the user's team
		if (bot[0].teamId !== teamData.id) {
			return NextResponse.json(
				{ error: "Unauthorized access to bot" },
				{ status: 403 }
			);
		}

		return NextResponse.json(bot[0]);
	} catch (error) {
		console.error("Error fetching bot:", error);
		return NextResponse.json({ error: "Failed to fetch bot" }, { status: 500 });
	}
}
