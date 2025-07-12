import { Client, Events, GatewayIntentBits, Message } from "discord.js";
import dotenv from "dotenv";
import path from "path";
import { processChat } from "~/shared/chat";
import { getBotByGuildId } from "~/shared/db";
import { Bot } from "../../web/lib/db/schema";
import { handleGuildCreate, handleGuildDelete } from "./db";

// Load .env from root directory
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.GuildMembers,
	],
});

// Handle bot being added to a new server
client.on(Events.GuildCreate, async (guild) => {
	console.log(`Bot was added to guild: ${guild.name} (${guild.id})`);

	const success = await handleGuildCreate(guild.id, guild.name);
	if (success) {
		console.log(`Reactivated bot for guild ${guild.id}`);
		// Send a welcome message to the default channel if possible
		try {
			const defaultChannel = guild.channels.cache.find(
				(channel) =>
					channel.type === 0 && // GUILD_TEXT
					channel.permissionsFor(guild.members.me!)?.has("SendMessages")
			);

			if (defaultChannel?.isTextBased()) {
				await defaultChannel.send(
					"Hello! I'm your new AI assistant. Feel free to mention me in any message to start a conversation!"
				);
			}
		} catch (error) {
			console.error("Error sending welcome message:", error);
		}
	}
});

// Handle bot being removed from a server
client.on(Events.GuildDelete, async (guild) => {
	console.log(`Bot was removed from guild: ${guild.name} (${guild.id})`);

	const success = await handleGuildDelete(guild.id);
	if (success) {
		console.log(`Updated status for guild ${guild.id} to inactive`);
	} else {
		console.error(`Failed to update status for guild ${guild.id}`);
	}
});

client.once(Events.ClientReady, (c) => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on(Events.MessageCreate, async (message: Message) => {
	// Ignore messages from bots
	if (message.author.bot) {
		console.log("Ignoring bot message");
		return;
	}

	console.log("=== Received Message ===");
	console.log("Content:", message.content);
	console.log("Author:", message.author.tag);
	console.log("Guild:", message.guild?.name || "DM");
	console.log("Bot Mentioned:", message.mentions.users.has(client.user!.id));
	console.log("========================");

	// Get bot data for guild
	let bot: Bot | null = null;
	if (message.guild) {
		try {
			bot = await getBotByGuildId(message.guild.id);
		} catch (error) {
			console.error("Error fetching bot data:", error);
		}
	}

	// Check if the message mentions the bot and is in a guild
	if (message.mentions.users.has(client.user!.id)) {
		if (!message.guild) {
			await message.reply(
				"I can only respond in servers, not in direct messages."
			);
			return;
		}

		console.log(
			"Bot was mentioned, fetching bot data for guild",
			message.guild.id
		);
		try {
			if (!bot) {
				bot = await getBotByGuildId(message.guild.id);
			}

			if (!bot) {
				console.error("Bot configuration not found for this server");
				// await message.reply("I'm not properly configured for this server yet.");
				return;
			}

			// Use shared chat processing function
			const result = await processChat({
				botId: bot.id,
				message: message.content,
				chatHistory: [], // No chat history for now
			});

			// Handle the response
			if ("error" in result) {
				console.error("Chat processing error:", result.error);
				// Handle moderation violations by deleting the message
				if (result.error.includes("flagged for")) {
					try {
						await message.delete();
						console.log(
							`Deleted message containing inappropriate content from ${message.author.tag}`
						);
						// Send a warning message
						if (message.channel.type === 0) {
							await message.channel.send(`${message.author}, ${result.error}`);
						}
					} catch (error) {
						console.error("Error deleting message:", error);
					}
					return;
				}
				// For other errors, send a generic error message
				await message.reply(
					"I apologize, but I am experiencing difficulties processing your message right now."
				);
			} else {
				// Log successful response details
				console.log("=== Chat Response Details ===");
				console.log("Bot ID:", bot.id);
				console.log("User:", message.author.tag);
				console.log("Guild:", message.guild.name);
				console.log("User Message:", message.content);
				console.log("Bot Response:", result.response);

				// Log knowledge sources used
				if (result.knowledgeSources && result.knowledgeSources.length > 0) {
					console.log("Knowledge Sources Used:");
					result.knowledgeSources.forEach((source, index) => {
						console.log(
							`  ${index + 1}. ${source.name} (Score: ${source.score.toFixed(
								3
							)})`
						);
						console.log(
							`     Content: ${source.content.substring(0, 200)}${
								source.content.length > 200 ? "..." : ""
							}`
						);
					});
				} else {
					console.log("No knowledge sources used");
				}

				// Log performance timings
				if (result.timings) {
					console.log("Performance Timings:");
					Object.entries(result.timings).forEach(([key, value]) => {
						console.log(`  ${key}: ${value}ms`);
					});
				}

				// Log moderation result if present
				if (result.moderationResult) {
					console.log("Moderation Result:");
					console.log(`  Violation: ${result.moderationResult.violation}`);
					if (result.moderationResult.violation) {
						console.log(
							`  Toxicity: ${
								result.moderationResult.toxicityScore?.toFixed(3) || "N/A"
							}`
						);
						console.log(
							`  Harassment: ${
								result.moderationResult.harassmentScore?.toFixed(3) || "N/A"
							}`
						);
						console.log(
							`  Sexual Content: ${
								result.moderationResult.sexualContentScore?.toFixed(3) || "N/A"
							}`
						);
						console.log(
							`  Spam: ${
								result.moderationResult.spamScore?.toFixed(3) || "N/A"
							}`
						);
					}
				}

				console.log("==============================");

				await message.reply(result.response);
				console.log("Response sent successfully");
			}
		} catch (error) {
			console.error("Error processing message:", error);
			// Fall back to generic response if AI fails
			await message.reply(
				"I apologize, but I am experiencing difficulties processing your message right now."
			);
		}
	}
});

// Login to Discord with your client's token
const token = process.env.DISCORD_TOKEN;
if (!token) {
	throw new Error("DISCORD_TOKEN is not set in environment variables");
}

client
	.login(token)
	.then(() => {
		console.log("Bot successfully logged in");
	})
	.catch((error) => {
		console.error("Failed to log in:", error);
	});
