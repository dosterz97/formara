import { createKnowledge } from "@/lib/db/actions/knowledge";
import { createKnowledgeVector } from "@/lib/db/qdrant-client";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		const data = await request.json();
		const { botId, name, content, manualEntry = true, createdBy } = data;

		// Generate a unique ID for the knowledge entry
		const knowledgeId = `knowledge_${nanoid()}`;

		// Create vector in Qdrant first
		const vectorId = await createKnowledgeVector({
			id: knowledgeId,
			name,
			content,
			botId,
		});

		// Then store in database with the vector ID
		const entry = await createKnowledge({
			botId,
			name,
			content,
			vectorId,
			manualEntry,
			createdBy,
		});

		return NextResponse.json(entry);
	} catch (e: any) {
		console.error("Error creating knowledge entry:", e);
		return NextResponse.json(
			{ error: e.message || "Failed to create knowledge entry" },
			{ status: 500 }
		);
	}
}
