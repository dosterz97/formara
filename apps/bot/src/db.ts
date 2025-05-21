import postgres from "postgres";

// Create a new postgres client
const sql = postgres(process.env.POSTGRES_URL!);

// Helper functions for Discord bot status management
export async function handleGuildCreate(guildId: string, guildName: string) {
	try {
		// Check if this guild already exists in our database
		const existingBots = await sql`
			SELECT * FROM discord_bots 
			WHERE guild_id = ${guildId} 
			LIMIT 1
		`;

		if (existingBots.length > 0) {
			// If it exists but was inactive, reactivate it
			if (existingBots[0].status === "inactive") {
				await sql`
					UPDATE discord_bots 
					SET status = 'active', 
						updated_at = NOW() 
					WHERE guild_id = ${guildId}
				`;
				return true;
			}
		}
		return false;
	} catch (error) {
		console.error("Error handling guild create:", error);
		return false;
	}
}

export async function handleGuildDelete(guildId: string) {
	try {
		await sql`
			UPDATE discord_bots 
			SET status = 'inactive', 
				updated_at = NOW() 
			WHERE guild_id = ${guildId}
		`;
		return true;
	} catch (error) {
		console.error("Error handling guild delete:", error);
		return false;
	}
}
