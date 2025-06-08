import { deleteKnowledgeVector } from "@/lib/db/qdrant-client";
import { NextResponse } from "next/server";

export async function DELETE(
	request: Request,
	{ params }: { params: { botId: string; id: string } }
) {
	try {
		const { id, botId } = params;
		console.log("Deleting knowledge entry:", id, "for bot:", botId);

		// Delete the vector from Qdrant
		await deleteKnowledgeVector(id, botId);
		console.log(`Successfully deleted vector ${id} from Qdrant`);

		return NextResponse.json({ success: true, deleted: id });
	} catch (e: any) {
		console.error("Error deleting knowledge entry:", e);
		return NextResponse.json(
			{ error: e.message || "Failed to delete knowledge entry" },
			{ status: 500 }
		);
	}
}
