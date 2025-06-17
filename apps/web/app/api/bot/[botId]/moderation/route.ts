import { db } from "@/lib/db/drizzle";
import { botModeration } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const moderationSchema = z.object({
	enabled: z.boolean(),
	toxicityThreshold: z.number().min(0).max(1),
	harassmentThreshold: z.number().min(0).max(1),
	sexualContentThreshold: z.number().min(0).max(1),
	spamThreshold: z.number().min(0).max(1),
	actionOnViolation: z.enum(["warn", "delete", "timeout"]),
	timeoutDuration: z.number().min(1).max(1440).optional(),
});

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ botId: string }> }
) {
	try {
		const { botId } = await params;
		console.log("Fetching moderation settings for bot:", botId);
		const settings = await db.query.botModeration.findFirst({
			where: eq(botModeration.botId, botId),
		});

		if (!settings) {
			console.log("No moderation settings found, creating default settings");
			// Create default settings if none exist
			const [newSettings] = await db
				.insert(botModeration)
				.values({
					botId,
					enabled: true, // Enable moderation by default
					toxicityThreshold: 0.7,
					harassmentThreshold: 0.7,
					sexualContentThreshold: 0.7,
					spamThreshold: 0.7,
					actionOnViolation: "warn",
				})
				.returning();

			return NextResponse.json(newSettings);
		}

		console.log("Found moderation settings:", settings);
		return NextResponse.json(settings);
	} catch (error) {
		console.error("Error fetching moderation settings:", error);
		return NextResponse.json(
			{ error: "Failed to fetch moderation settings" },
			{ status: 500 }
		);
	}
}

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ botId: string }> }
) {
	try {
		const { botId } = await params;
		const body = await request.json();
		console.log("Updating moderation settings for bot:", botId, body);
		const validatedData = moderationSchema.parse(body);

		const settings = await db.query.botModeration.findFirst({
			where: eq(botModeration.botId, botId),
		});

		if (!settings) {
			console.log("No existing settings found, creating new settings");
			// Create new settings
			const [newSettings] = await db
				.insert(botModeration)
				.values({
					botId,
					...validatedData,
				})
				.returning();

			return NextResponse.json(newSettings);
		}

		console.log("Updating existing settings");
		// Update existing settings
		const [updatedSettings] = await db
			.update(botModeration)
			.set({
				...validatedData,
				updatedAt: new Date(),
			})
			.where(eq(botModeration.botId, botId))
			.returning();

		return NextResponse.json(updatedSettings);
	} catch (error) {
		console.error("Error updating moderation settings:", error);
		return NextResponse.json(
			{ error: "Failed to update moderation settings" },
			{ status: 500 }
		);
	}
}
