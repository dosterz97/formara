import { Client, Events, GatewayIntentBits, Message } from "discord.js";
import dotenv from "dotenv";
import path from "path";
import { getBotByGuildId } from "../../shared/db";
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
	console.log("Received message:", {
		content: message.content,
		author: message.author.tag,
		isBotMentioned: message.mentions.users.has(client.user!.id),
		botId: client.user!.id,
	});

	// Ignore messages from bots
	if (message.author.bot) {
		console.log("Ignoring bot message");
		return;
	}

	// Check if the message mentions the bot and is in a guild
	if (message.mentions.users.has(client.user!.id)) {
		if (!message.guild) {
			await message.reply(
				"I can only respond in servers, not in direct messages."
			);
			return;
		}

		console.log("Bot was mentioned, fetching bot data");
		try {
			const bot = await getBotByGuildId(message.guild.id);

			if (!bot) {
				console.error("Bot configuration not found for this server");
				await message.reply("I'm not properly configured for this server yet.");
				return;
			}

			const botData = {
				name: bot.name,
				description: bot.description || "",
				attributes: {
					systemPrompt: bot.systemPrompt || "",
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
