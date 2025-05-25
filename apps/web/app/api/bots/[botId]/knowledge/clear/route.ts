import { db } from "@/lib/db/drizzle";
import { clearBotKnowledge } from "@/lib/db/qdrant-client";
import { knowledge } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ botId: string }> }
) {
	try {
		const { botId } = await params;
		console.log("Clearing all knowledge for bot:", botId);

		// Clear all vectors from Qdrant
		try {
			await clearBotKnowledge(botId);
			console.log(`Successfully cleared vectors from Qdrant for bot ${botId}`);
		} catch (vectorError) {
			console.warn("Failed to clear vectors from Qdrant:", vectorError);
			// Continue with database deletion even if vector clearing fails
		}

		// Delete all knowledge entries from database
		const result = await db
			.delete(knowledge)
			.where(eq(knowledge.botId, botId))
			.returning();

		console.log(`Deleted ${result.length} knowledge entries from database`);

		return NextResponse.json({
			success: true,
			deleted: result.length,
			message: `Successfully cleared ${result.length} knowledge entries`,
		});
	} catch (e: any) {
		console.error("Error clearing all knowledge:", e);
		return NextResponse.json(
			{ error: e.message || "Failed to clear all knowledge" },
			{ status: 500 }
		);
	}
}
