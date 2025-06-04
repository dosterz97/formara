import { db } from "@/lib/db/drizzle";
import { bots, discordBots } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const code = searchParams.get("code");
		const state = searchParams.get("state"); // This will be our bot ID
		const guildId = searchParams.get("guild_id");

		console.log("Discord callback received:", { code, state, guildId });

		if (!code || !state || !guildId) {
			console.error("Missing required parameters:", { code, state, guildId });
			return NextResponse.redirect(
				`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bots?error=missing_params`
			);
		}

		// Get the bot to find its slug
		const bot = await db.select().from(bots).where(eq(bots.id, state)).limit(1);

		if (!bot || bot.length === 0) {
			console.error("Bot not found:", state);
			return NextResponse.redirect(
				`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bots?error=bot_not_found`
			);
		}

		const botSlug = bot[0].slug;

		// Exchange the code for an access token
		const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
			method: "POST",
			body: new URLSearchParams({
				client_id: process.env.NEXT_PUBLIC_DISCORD_APPLICATION_ID!,
				client_secret: process.env.DISCORD_CLIENT_SECRET!,
				code,
				grant_type: "authorization_code",
				redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/discord/callback`,
			}),
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
		});

		if (!tokenResponse.ok) {
			const errorText = await tokenResponse.text();
			console.error("Failed to exchange code for token:", errorText);
			return NextResponse.redirect(
				`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bots/${botSlug}?error=auth_failed`
			);
		}

		const tokenData = await tokenResponse.json();
		console.log("Received token data:", {
			type: tokenData.token_type,
			scope: tokenData.scope,
		});

		// Check if this Discord bot relationship already exists
		const existingBot = await db
			.select()
			.from(discordBots)
			.where(
				and(eq(discordBots.botId, state), eq(discordBots.guildId, guildId))
			)
			.limit(1);

		if (existingBot.length > 0) {
			console.log(
				"Bot already exists for this guild, updating token information"
			);
			try {
				await db
					.update(discordBots)
					.set({
						settings: {
							accessToken: tokenData.access_token,
							refreshToken: tokenData.refresh_token,
							tokenType: tokenData.token_type,
							scope: tokenData.scope,
						},
					})
					.where(
						and(eq(discordBots.botId, state), eq(discordBots.guildId, guildId))
					);

				return NextResponse.redirect(
					`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bots/${botSlug}?success=updated`
				);
			} catch (error) {
				console.error("Failed to update existing Discord bot:", error);
				return NextResponse.redirect(
					`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bots/${botSlug}?error=update_failed`
				);
			}
		}

		// Get guild information
		const guildResponse = await fetch(
			`https://discord.com/api/v10/guilds/${guildId}`,
			{
				headers: {
					Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
				},
			}
		);

		if (!guildResponse.ok) {
			const errorText = await guildResponse.text();
			console.error("Failed to fetch guild:", errorText);
			return NextResponse.redirect(
				`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bots/${botSlug}?error=guild_fetch_failed`
			);
		}

		const guildData = await guildResponse.json();
		console.log("Received guild data:", {
			name: guildData.name,
			id: guildData.id,
		});

		try {
			// Create the Discord bot relationship
			const [discordBot] = await db
				.insert(discordBots)
				.values({
					botId: state,
					guildId: guildId,
					guildName: guildData.name,
					settings: {
						accessToken: tokenData.access_token,
						refreshToken: tokenData.refresh_token,
						tokenType: tokenData.token_type,
						scope: tokenData.scope,
					},
				})
				.returning();

			console.log("Created Discord bot relationship:", {
				id: discordBot.id,
				botId: discordBot.botId,
				guildId: discordBot.guildId,
			});

			// Redirect back to the bot details page with success message
			return NextResponse.redirect(
				`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bots/${botSlug}?success=true`
			);
		} catch (error) {
			console.error("Failed to create Discord bot relationship:", error);
			return NextResponse.redirect(
				`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bots/${botSlug}?error=db_error`
			);
		}
	} catch (error) {
		console.error("Error handling Discord callback:", error);
		return NextResponse.redirect(
			`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bots?error=unknown`
		);
	}
}
