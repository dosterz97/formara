import { clearBotKnowledge } from "@/lib/db/qdrant-client";
import { NextResponse } from "next/server";

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ botId: string }> }
) {
	try {
		const { botId } = await params;
		console.log("Clearing all knowledge for bot:", botId);

		// Clear all vectors from Qdrant
		await clearBotKnowledge(botId);
		console.log(`Successfully cleared vectors from Qdrant for bot ${botId}`);

		return NextResponse.json({
			success: true,
			message: "Successfully cleared all knowledge entries",
		});
	} catch (e: any) {
		console.error("Error clearing all knowledge:", e);
		return NextResponse.json(
			{ error: e.message || "Failed to clear all knowledge" },
			{ status: 500 }
		);
	}
}
