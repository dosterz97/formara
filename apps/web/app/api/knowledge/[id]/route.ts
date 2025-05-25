import { db } from "@/lib/db/drizzle";
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

		return NextResponse.json(result[0]);
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

		// Delete the knowledge entry
		const result = await db
			.delete(knowledge)
			.where(eq(knowledge.id, id))
			.returning();

		console.log("Delete result:", result);

		if (result.length === 0) {
			return NextResponse.json(
				{ error: "Knowledge entry not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json({ success: true, deleted: result[0] });
	} catch (e: any) {
		console.error("Error deleting knowledge entry:", e);
		return NextResponse.json(
			{ error: e.message || "Failed to delete knowledge entry" },
			{ status: 500 }
		);
	}
}
