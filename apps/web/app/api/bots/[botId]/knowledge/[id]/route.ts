import {
	deleteKnowledgeVector,
	updateKnowledgeVector,
} from "@/lib/db/qdrant-client";
import { NextResponse } from "next/server";
import { Knowledge } from "../../../../../../../shared/knowledge";

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ botId: string; id: string }> }
) {
	try {
		const { id, botId } = await params;
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

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ botId: string; id: string }> }
) {
	try {
		const { botId, id } = await params;
		const data = await request.json();
		const { name, content } = data;

		// Update vector in Qdrant
		await updateKnowledgeVector({
			id,
			botId,
			name,
			content,
			vectorId: id,
		});

		const knowledge: Knowledge = {
			id,
			botId,
			name,
			content,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		return NextResponse.json(knowledge);
	} catch (e: any) {
		console.error("Error updating knowledge:", e);
		return NextResponse.json(
			{ error: e.message || "Failed to update knowledge" },
			{ status: 500 }
		);
	}
}
