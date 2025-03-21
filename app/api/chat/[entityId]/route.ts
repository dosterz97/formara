import { db } from "@/lib/db/drizzle";
import { searchEntities } from "@/lib/db/qdrant-client";
import { getTeamForUser, getUser } from "@/lib/db/queries";
import { Entity, universes } from "@/lib/db/schema";
import { openai } from "@ai-sdk/openai";
import { CoreMessage, generateText } from "ai";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
	const { messages, entity }: { messages: CoreMessage[]; entity: Entity } =
		await req.json();

	const universeId = entity.universeId;
	console.log(universeId);
	if (!universeId) {
		return NextResponse.json(
			{ error: "Universe id is required" },
			{ status: 400 }
		);
	}

	const user = await getUser();
	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const teamData = await getTeamForUser(user.id);
	if (!teamData) {
		return NextResponse.json({ error: "No team for user" }, { status: 500 });
	}

	// Get the specific universe by ID
	const universeResult = await db
		.select()
		.from(universes)
		.where(eq(universes.id, universeId))
		.limit(1);

	if (!universeResult || universeResult.length === 0) {
		return NextResponse.json({ error: "Universe not found" }, { status: 404 });
	}

	const universe = universeResult[0];

	console.log("universe", universe);
	const results = await searchEntities("Who is darth vader", universe);

	console.log("results: ", results);

	const system = `
		You are ${entity.name}.

		${entity.description}

		You are chatting with someone from you universe.

		Here is some information that will be helpful.
	
		${results.map((r) => `${r.payload.name}: ${r.payload.description}\n\n`)}
	`;

	console.log(system);

	const { response } = await generateText({
		model: openai("gpt-4"),
		system,
		messages,
	});

	return Response.json({ messages: response.messages });
}
