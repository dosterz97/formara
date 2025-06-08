import { db } from "@/lib/db/drizzle";
import { deleteBotKnowledgeCollection } from "@/lib/db/qdrant-client";
import { bots, discordBots } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ botId: string }> }
) {
	try {
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

		return NextResponse.json(bot);
	} catch (error) {
		console.error("Error fetching bot:", error);
		return NextResponse.json({ error: "Failed to fetch bot" }, { status: 500 });
	}
}

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ botId: string }> }
) {
	try {
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
