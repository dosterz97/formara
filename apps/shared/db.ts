import dotenv from "dotenv";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import path from "path";
import postgres from "postgres";
import { bots, discordBots } from "../web/lib/db/schema";

// Load .env from root directory - go up two levels from shared/db.ts to reach root
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

if (!process.env.POSTGRES_URL) {
	throw new Error("POSTGRES_URL environment variable is not set");
}

// Database client
export const client = postgres(process.env.POSTGRES_URL);
export const db = drizzle(client);

export async function getBotByGuildId(guildId: string) {
	try {
		const result = await db
			.select({
				name: bots.name,
				description: bots.description,
				systemPrompt: bots.systemPrompt,
				status: bots.status,
				settings: bots.settings,
			})
			.from(discordBots)
			.innerJoin(bots, eq(discordBots.botId, bots.id))
			.where(
				and(
					eq(discordBots.guildId, guildId),
					eq(discordBots.status, "active"),
					eq(bots.status, "active")
				)
			)
			.limit(1);

		return result[0] || null;
	} catch (error) {
		console.error("Error getting bot by guild ID:", error);
		return null;
	}
}
