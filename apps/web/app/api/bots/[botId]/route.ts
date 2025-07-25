import { db } from "@/lib/db/drizzle";
import { getTeamForUser, getUser } from "@/lib/db/queries";
import { bots, discordBots } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import slugify from "slugify";
import { deleteBotKnowledgeCollection } from "~/shared/qdrant-client";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ botId: string }> }
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

		const { botId } = await params;

		// First try to find by slug since it's not a UUID
		let bot = await db.query.bots.findFirst({
			where: eq(bots.slug, botId),
		});

		// If not found by slug, try by ID (this will fail gracefully if botId is not a valid UUID)
		if (!bot) {
			try {
				bot = await db.query.bots.findFirst({
					where: eq(bots.id, botId),
				});
			} catch (err) {
				// Ignore UUID parse errors
				if (!(err instanceof Error) || !err.message.includes("uuid")) {
					throw err;
				}
			}
		}

		if (!bot) {
			return NextResponse.json({ error: "Bot not found" }, { status: 404 });
		}

		// Verify the bot belongs to the user's team
		if (bot.teamId !== teamData.id) {
			return NextResponse.json(
				{ error: "Unauthorized access to bot" },
				{ status: 403 }
			);
		}

		return NextResponse.json(bot);
	} catch (error) {
		console.error("Error fetching bot:", error);
		return NextResponse.json({ error: "Failed to fetch bot" }, { status: 500 });
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ botId: string }> }
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

		const data = await request.json();
		const { botId } = await params;

		// Get the existing bot
		const existingBot = await db
			.select()
			.from(bots)
			.where(eq(bots.id, botId))
			.limit(1);

		if (!existingBot || existingBot.length === 0) {
			return NextResponse.json({ error: "Bot not found" }, { status: 404 });
		}

		// Verify the bot belongs to the user's team
		if (existingBot[0].teamId !== teamData.id) {
			return NextResponse.json(
				{ error: "Unauthorized access to bot" },
				{ status: 403 }
			);
		}

		// Generate a new slug if the name has changed
		let slug = existingBot[0].slug;
		if (data.name && data.name !== existingBot[0].name) {
			slug = slugify(data.name, {
				lower: true,
				strict: true,
			});

			// Check if another bot with this slug exists
			const slugExists = await db
				.select()
				.from(bots)
				.where(
					eq(bots.teamId, teamData.id) &&
						eq(bots.slug, slug) &&
						eq(bots.id, botId)
				)
				.limit(1);

			if (slugExists.length > 0) {
				return NextResponse.json(
					{ error: "A bot with this name already exists" },
					{ status: 400 }
				);
			}
		}

		// Update the bot
		const [updatedBot] = await db
			.update(bots)
			.set({
				name: data.name || existingBot[0].name,
				slug,
				description: data.description,
				updatedAt: new Date(),
			})
			.where(eq(bots.id, botId))
			.returning();

		return NextResponse.json(updatedBot);
	} catch (error) {
		console.error("Error updating bot:", error);
		return NextResponse.json(
			{ error: "Failed to update bot" },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ botId: string }> }
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

		const { botId } = await params;

		// First try to find by slug since it's not a UUID
		let bot = await db.query.bots.findFirst({
			where: eq(bots.slug, botId),
		});

		// If not found by slug, try by ID (this will fail gracefully if botId is not a valid UUID)
		if (!bot) {
			try {
				bot = await db.query.bots.findFirst({
					where: eq(bots.id, botId),
				});
			} catch (err) {
				// Ignore UUID parse errors
				if (!(err instanceof Error) || !err.message.includes("uuid")) {
					throw err;
				}
			}
		}

		if (!bot) {
			return NextResponse.json({ error: "Bot not found" }, { status: 404 });
		}

		// Verify the bot belongs to the user's team
		if (bot.teamId !== teamData.id) {
			return NextResponse.json(
				{ error: "Unauthorized access to bot" },
				{ status: 403 }
			);
		}

		// Delete the knowledge collection from Qdrant first
		try {
			await deleteBotKnowledgeCollection(bot.id);
			console.log(
				`Successfully deleted knowledge collection for bot ${bot.id}`
			);
		} catch (vectorError) {
			console.warn(
				"Failed to delete knowledge collection from Qdrant:",
				vectorError
			);
			// Continue with database deletion even if vector collection deletion fails
		}

		// Delete associated Discord bot records first
		try {
			await db.delete(discordBots).where(eq(discordBots.botId, bot.id));
			console.log(`Successfully deleted Discord bot records for bot ${bot.id}`);
		} catch (discordError) {
			console.warn("Failed to delete Discord bot records:", discordError);
			// Continue with bot deletion even if Discord records deletion fails
		}

		// Delete the bot (this will cascade delete knowledge entries due to foreign key constraint)
		await db.delete(bots).where(eq(bots.id, bot.id));

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error deleting bot:", error);
		return NextResponse.json(
			{ error: "Failed to delete bot" },
			{ status: 500 }
		);
	}
}
