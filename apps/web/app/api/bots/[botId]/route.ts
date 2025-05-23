import { db } from "@/lib/db/drizzle";
import { bots } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	context: { params: { botId: string } }
) {
	try {
		const { botId } = await context.params;

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
	context: { params: { botId: string } }
) {
	try {
		const { botId } = await context.params;

		// Delete the bot
		await db.delete(bots).where(eq(bots.id, botId));

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error deleting bot:", error);
		return NextResponse.json(
			{ error: "Failed to delete bot" },
			{ status: 500 }
		);
	}
}
