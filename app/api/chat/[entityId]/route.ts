import { db } from "@/lib/db/drizzle";
import { searchEntities } from "@/lib/db/qdrant-client";
import { getTeamForUser, getUser } from "@/lib/db/queries";
import { Entity, universes } from "@/lib/db/schema";
import { openai } from "@ai-sdk/openai";
import { CoreMessage, generateText } from "ai";
import dedent from "dedent";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * Helper function to wrap text at specified character width
 */
function wrapText(text: string, maxWidth: number): string {
	const words = text.split(" ");
	let lines = [];
	let currentLine = "";

	for (const word of words) {
		// Check if adding this word exceeds the max width
		if (currentLine.length + word.length + 1 > maxWidth) {
			lines.push(currentLine);
			currentLine = word;
		} else {
			// Add word to current line (with a space if not the first word)
			currentLine = currentLine.length === 0 ? word : `${currentLine} ${word}`;
		}
	}

	// Add the last line if not empty
	if (currentLine.length > 0) {
		lines.push(currentLine);
	}

	return lines.join("\n");
}

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
	const results = await searchEntities("Who is darth vader", universe, 3);

	console.log("results: ", results);

	const contextItems = results.map((r) => {
		const entityName = r.payload.name;
		const description = wrapText(r.payload.description, 80);
		return `${entityName}: ${description}`;
	});

	const system = dedent`
		You are ${entity.name}.

		${entity.description}

		You are chatting with someone from your universe.
		Do not refer to your self as an AI, stay in character.

		======================================================== 
		Context - Here is some information that will be helpful.
		======================================================== 
	
		${contextItems.join("\n\n")}
	`;

	console.log(system);

	const { response } = await generateText({
		model: openai("gpt-4"),
		system,
		messages,
	});

	return Response.json({ messages: response.messages });
}
