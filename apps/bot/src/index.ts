import { Client, Events, GatewayIntentBits, Message } from "discord.js";
import dotenv from "dotenv";
import path from "path";
import { getBotByGuildId, getBotModerationSettings } from "../../shared/db";
import {
	DEFAULT_MODERATION_THRESHOLDS,
	moderateContent,
} from "../../shared/moderation";
import { Bot } from "../../web/lib/db/schema";
import { handleGuildCreate, handleGuildDelete } from "./db";
import { generateBotResponse } from "./services/gemini";

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

	console.log("Received message:", {
		content: message.content,
		author: message.author.tag,
		isBotMentioned: message.mentions.users.has(client.user!.id),
		botId: client.user!.id,
	});

	// Get bot data first to check moderation settings
	let bot: Bot | null = null;
	let moderationSettings = null;
	if (message.guild) {
		try {
			bot = await getBotByGuildId(message.guild.id);
			if (bot) {
				moderationSettings = await getBotModerationSettings(bot.id);
				console.log("Moderation settings:", moderationSettings);
			}
		} catch (error) {
			console.error("Error fetching bot data:", error);
		}
	}

	// Check content with Gemini moderation if enabled
	try {
		const moderationResult = await moderateContent(message.content, {
			enabled: moderationSettings?.enabled ?? false,
			toxicityThreshold:
				moderationSettings?.toxicityThreshold ??
				DEFAULT_MODERATION_THRESHOLDS.toxicityThreshold,
			harassmentThreshold:
				moderationSettings?.harassmentThreshold ??
				DEFAULT_MODERATION_THRESHOLDS.harassmentThreshold,
			sexualContentThreshold:
				moderationSettings?.sexualContentThreshold ??
				DEFAULT_MODERATION_THRESHOLDS.sexualContentThreshold,
			spamThreshold:
				moderationSettings?.spamThreshold ??
				DEFAULT_MODERATION_THRESHOLDS.spamThreshold,
		});

		if (moderationResult.violation) {
			// Find the highest scoring category
			const scores = [
				{ type: "Toxicity", score: moderationResult.toxicityScore },
				{ type: "Harassment", score: moderationResult.harassmentScore },
				{ type: "Sexual Content", score: moderationResult.sexualContentScore },
				{ type: "Spam", score: moderationResult.spamScore },
			];
			const highestScore = scores.reduce((prev, current) =>
				prev.score > current.score ? prev : current
			);

			try {
				await message.delete();
				console.log(
					`Deleted message containing ${highestScore.type.toLowerCase()} content from ${
						message.author.tag
					}`
				);
				// Send a warning message
				if (message.channel.type === 0) {
					// GUILD_TEXT
					await message.channel.send(
						`${
							message.author
						}, your message was flagged for ${highestScore.type.toLowerCase()} content. Please keep the chat family-friendly.`
					);
				}
			} catch (error) {
				console.error("Error deleting message:", error);
			}
			return;
		}
	} catch (error) {
		console.error("Error in content moderation:", error);
		// Continue with message processing if moderation fails
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
				await message.reply("I'm not properly configured for this server yet.");
				return;
			}

			const botData = {
				name: bot.name,
				description: bot.description || "",
				attributes: {
					status: bot.status,
					settings: bot.settings || {},
				},
			};

			console.log("Bot data:", botData);

			// Get AI-generated response using bot data
			const response = await generateBotResponse(message.content, botData);
			await message.reply(response);
			console.log("Response sent successfully");
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
