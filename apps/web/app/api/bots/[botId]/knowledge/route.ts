import { createKnowledgeVector, scrollKnowledge } from "@/lib/db/qdrant-client";
import { NextResponse } from "next/server";
import { Knowledge } from "../../../../../../shared/knowledge";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ botId: string }> }
) {
	try {
		const { botId } = await params;
		const { searchParams } = new URL(request.url);
		const limit = parseInt(searchParams.get("limit") || "20");
		const offset = parseInt(searchParams.get("offset") || "0");
		const knowledgeIds = searchParams.get("ids")?.split(",") || [];

		console.log("Fetching knowledge for bot:", botId, {
			limit,
			offset,
			knowledgeIds,
		});

		// Get vectors from Qdrant
		const vectorResults = await scrollKnowledge(botId, limit, offset);

		// Filter by IDs if provided
		const filteredResults =
			knowledgeIds.length > 0
				? vectorResults.filter((result) => knowledgeIds.includes(result.id))
				: vectorResults;

		// Convert to Knowledge type
		const knowledgeItems = filteredResults.map(
			(result) =>
				({
					id: result.id,
					botId,
					name: result.payload.name,
					content: result.payload.content,
					createdAt: new Date(result.payload.createdAt),
					updatedAt: new Date(result.payload.updatedAt),
				} as Knowledge)
		);

		return NextResponse.json(knowledgeItems);
	} catch (e: any) {
		console.error("Error fetching knowledge:", e);
		return NextResponse.json(
			{ error: e.message || "Failed to fetch knowledge" },
			{ status: 500 }
		);
	}
}

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ botId: string }> }
) {
	try {
		const { botId } = await params;
		const data = await request.json();
		const { name, content } = data;

		// Generate a new ID for the knowledge entry
		const id = crypto.randomUUID();
		const now = new Date();

		// Create vector in Qdrant
		await createKnowledgeVector({
			id,
			botId,
			name,
			content,
		});

		const knowledge: Knowledge = {
			id,
			botId,
			name,
			content,
			createdAt: now,
			updatedAt: now,
		};

		return NextResponse.json(knowledge);
	} catch (e: any) {
		console.error("Error creating knowledge:", e);
		return NextResponse.json(
			{ error: e.message || "Failed to create knowledge" },
			{ status: 500 }
		);
	}
}
