// File: app/api/universes/[id]/facts/route.ts
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/drizzle";
import { universes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
	params: {
		id: string;
	};
}

// GET all knowledge facts for a universe
export async function GET(request: NextRequest, { params }: RouteParams) {
	try {
		const session = await auth();
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id: universeId } = params;

		// Get universe to check permissions
		const [universe] = await db
			.select()
			.from(universes)
			.where(eq(universes.id, parseInt(universeId)));

		if (!universe) {
			return NextResponse.json(
				{ error: "Universe not found" },
				{ status: 404 }
			);
		}

		// Check team ownership
		if (universe.teamId !== session.user.teamId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
		}

		// Get all knowledge facts from Qdrant
		const { getKnowledgeFacts } = await import("@/lib/db/qdrant-client");
		const facts = await getKnowledgeFacts(universe);

		return NextResponse.json(facts);
	} catch (error) {
		console.error("Error fetching knowledge facts:", error);
		return NextResponse.json(
			{ error: "Failed to fetch knowledge facts" },
			{ status: 500 }
		);
	}
}

// POST create a new knowledge fact
export async function POST(request: NextRequest, { params }: RouteParams) {
	try {
		const session = await auth();
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id: universeId } = params;
		const body = await request.json();

		// Validate required fields
		if (!body.title || !body.content || !body.category) {
			return NextResponse.json(
				{ error: "Title, content, and category are required" },
				{ status: 400 }
			);
		}

		// Get universe to check permissions
		const [universe] = await db
			.select()
			.from(universes)
			.where(eq(universes.id, parseInt(universeId)));

		if (!universe) {
			return NextResponse.json(
				{ error: "Universe not found" },
				{ status: 404 }
			);
		}

		// Check team ownership
		if (universe.teamId !== session.user.teamId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
		}

		// Create unique ID for the fact
		const factId = body.id || `knowledge-${Date.now()}`;

		// Create knowledge fact in Qdrant
		const { addKnowledgeFact } = await import("@/lib/db/qdrant-client");

		const knowledgeFact = {
			id: factId,
			title: body.title,
			content: body.content,
			category: body.category,
			tags: body.tags || [],
		};

		const result = await addKnowledgeFact(universe, knowledgeFact);

		return NextResponse.json(
			{
				...knowledgeFact,
				vectorId: result,
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error("Error creating knowledge fact:", error);
		return NextResponse.json(
			{ error: "Failed to create knowledge fact" },
			{ status: 500 }
		);
	}
}

// File: app/api/facts/[id]/route.ts

interface RouteParams {
	params: {
		id: string;
	};
}

// GET knowledge fact by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
	try {
		const session = await auth();
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = params;

		// Since facts are only stored in Qdrant, we need to search across all universes
		// Get all universes for user's team
		const allUniverses = await db
			.select()
			.from(universes)
			.where(eq(universes.teamId, session.user.teamId));

		// Search for fact in each universe
		const { getKnowledgeFactById } = await import("@/lib/db/qdrant-client");

		for (const universe of allUniverses) {
			try {
				const fact = await getKnowledgeFactById(universe, id);
				if (fact) {
					return NextResponse.json(fact);
				}
			} catch (error) {
				// Continue to next universe if fact not found
				continue;
			}
		}

		return NextResponse.json(
			{ error: "Knowledge fact not found" },
			{ status: 404 }
		);
	} catch (error) {
		console.error("Error fetching knowledge fact:", error);
		return NextResponse.json(
			{ error: "Failed to fetch knowledge fact" },
			{ status: 500 }
		);
	}
}

// PUT update knowledge fact
export async function PUT(request: NextRequest, { params }: RouteParams) {
	try {
		const session = await auth();
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = params;
		const body = await request.json();

		// Validate required fields
		if (!body.title || !body.content || !body.category || !body.universeId) {
			return NextResponse.json(
				{ error: "Title, content, category, and universeId are required" },
				{ status: 400 }
			);
		}

		// Get universe to check permissions
		const [universe] = await db
			.select()
			.from(universes)
			.where(eq(universes.id, body.universeId));

		if (!universe) {
			return NextResponse.json(
				{ error: "Universe not found" },
				{ status: 404 }
			);
		}

		// Check team ownership
		if (universe.teamId !== session.user.teamId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
		}

		// Update knowledge fact in Qdrant
		const { updateKnowledgeFact } = await import("@/lib/db/qdrant-client");

		const knowledgeFact = {
			id,
			title: body.title,
			content: body.content,
			category: body.category,
			tags: body.tags || [],
		};

		await updateKnowledgeFact(universe, knowledgeFact);

		return NextResponse.json(knowledgeFact);
	} catch (error) {
		console.error("Error updating knowledge fact:", error);
		return NextResponse.json(
			{ error: "Failed to update knowledge fact" },
			{ status: 500 }
		);
	}
}

// DELETE knowledge fact
export async function DELETE(request: NextRequest, { params }: RouteParams) {
	try {
		const session = await auth();
		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = params;
		const { searchParams } = new URL(request.url);
		const universeId = searchParams.get("universeId");

		if (!universeId) {
			return NextResponse.json(
				{ error: "universeId is required" },
				{ status: 400 }
			);
		}

		// Get universe to check permissions
		const [universe] = await db
			.select()
			.from(universes)
			.where(eq(universes.id, parseInt(universeId)));

		if (!universe) {
			return NextResponse.json(
				{ error: "Universe not found" },
				{ status: 404 }
			);
		}

		// Check team ownership
		if (universe.teamId !== session.user.teamId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
		}

		// Delete knowledge fact from Qdrant
		const { deleteKnowledgeFact } = await import("@/lib/db/qdrant-client");
		await deleteKnowledgeFact(universe, id);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error deleting knowledge fact:", error);
		return NextResponse.json(
			{ error: "Failed to delete knowledge fact" },
			{ status: 500 }
		);
	}
}
