import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../web/lib/db/schema";

// Create a new postgres client
const client = postgres(process.env.POSTGRES_URL!);

// Create a drizzle database instance
export const db = drizzle(client, { schema });

// Helper function to update Discord bot status
export async function updateDiscordBotStatus(
	guildId: string,
	status: "active" | "inactive"
) {
	try {
		await db
			.update(schema.discordBots)
			.set({
				status,
				updatedAt: new Date(),
			})
			.where(eq(schema.discordBots.guildId, guildId));

		return true;
	} catch (error) {
		console.error("Error updating Discord bot status:", error);
		return false;
	}
}
