// Continuing from previous file: app/api/universes/[id]/entities/route.ts

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

		// Get all entities for this universe
		const allEntities = await db
			.select()
			.from(entities)
			.where(eq(entities.universeId, parseInt(universeId)));

		// Get tags for each entity from Qdrant
		const { getEntitiesWithTags } = await import("@/lib/db/qdrant-client");
		const entitiesWithTags = await getEntitiesWithTags(universe, allEntities);

		return NextResponse.json(entitiesWithTags);
	} catch (error) {
		console.error("Error fetching entities:", error);
		return NextResponse.json(
			{ error: "Failed to fetch entities" },
			{ status: 500 }
		);
	}
}
