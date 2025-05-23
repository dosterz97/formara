import { db } from "@/lib/db/drizzle";
import { knowledge } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	context: { params: { botId: string } }
) {
	try {
		const { botId } = await context.params;

		const knowledgeItems = await db
			.select()
			.from(knowledge)
			.where(eq(knowledge.botId, botId));

		return NextResponse.json(knowledgeItems);
	} catch (error) {
		console.error("Error fetching knowledge:", error);
		return NextResponse.json(
			{ error: "Failed to fetch knowledge" },
			{ status: 500 }
		);
	}
}

export async function POST(
	request: Request,
	context: { params: { botId: string } }
) {
	try {
		const { botId } = await context.params;
		const data = await request.json();

		// TODO: Add validation for required fields
		const newKnowledge = await db.insert(knowledge).values({
			botId,
			...data,
		});

		return NextResponse.json(newKnowledge);
	} catch (error) {
		console.error("Error creating knowledge:", error);
		return NextResponse.json(
			{ error: "Failed to create knowledge" },
			{ status: 500 }
		);
	}
}
