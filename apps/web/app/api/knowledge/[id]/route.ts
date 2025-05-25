import { db } from "@/lib/db/drizzle";
import {
	deleteKnowledgeVector,
	updateKnowledgeVector,
} from "@/lib/db/qdrant-client";
import { knowledge } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		const data = await request.json();
		const { name, content } = data;

		console.log("Updating knowledge entry:", id, { name, content });

		// Update the knowledge entry
		const result = await db
			.update(knowledge)
			.set({
				name,
				content,
				updatedAt: sql`now()`,
			})
			.where(eq(knowledge.id, id))
			.returning();

		console.log("Update result:", result);

		if (result.length === 0) {
			return NextResponse.json(
				{ error: "Knowledge entry not found" },
				{ status: 404 }
			);
		}

		const updatedKnowledge = result[0];

		// Update the vector in Qdrant if vectorId exists
		if (updatedKnowledge.vectorId && updatedKnowledge.botId) {
			try {
				await updateKnowledgeVector({
					id: updatedKnowledge.id,
					name: updatedKnowledge.name,
					content: updatedKnowledge.content,
					vectorId: updatedKnowledge.vectorId,
					botId: updatedKnowledge.botId,
				});
				console.log(
					`Successfully updated vector ${updatedKnowledge.vectorId} in Qdrant`
				);
			} catch (vectorError) {
				console.warn("Failed to update vector in Qdrant:", vectorError);
				// Continue returning the updated knowledge even if vector update fails
			}
		}

		return NextResponse.json(updatedKnowledge);
	} catch (e: any) {
		console.error("Error updating knowledge entry:", e);
		return NextResponse.json(
			{ error: e.message || "Failed to update knowledge entry" },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		console.log("Deleting knowledge entry:", id);

		// First, get the knowledge entry to obtain vectorId and botId
		const knowledgeEntry = await db
			.select()
			.from(knowledge)
			.where(eq(knowledge.id, id))
			.limit(1);

		if (knowledgeEntry.length === 0) {
			return NextResponse.json(
				{ error: "Knowledge entry not found" },
				{ status: 404 }
			);
		}

		const entry = knowledgeEntry[0];

		// Delete the vector from Qdrant if vectorId exists
		if (entry.vectorId && entry.botId) {
			try {
				await deleteKnowledgeVector(entry.vectorId, entry.botId);
				console.log(
					`Successfully deleted vector ${entry.vectorId} from Qdrant`
				);
			} catch (vectorError) {
				console.warn("Failed to delete vector from Qdrant:", vectorError);
				// Continue with database deletion even if vector deletion fails
			}
		}

		// Delete the knowledge entry from database
		const result = await db
			.delete(knowledge)
			.where(eq(knowledge.id, id))
			.returning();

		console.log("Delete result:", result);

		return NextResponse.json({ success: true, deleted: result[0] });
	} catch (e: any) {
		console.error("Error deleting knowledge entry:", e);
		return NextResponse.json(
			{ error: e.message || "Failed to delete knowledge entry" },
			{ status: 500 }
		);
	}
}
