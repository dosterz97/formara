import { Client, Events, GatewayIntentBits, Message } from "discord.js";
import dotenv from "dotenv";
import path from "path";
import { getEntityById } from "../../shared/db";
import { handleGuildCreate, handleGuildDelete } from "./db";
import { generateVaderResponse } from "./services/gemini";

// Load .env from root directory
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const DARTH_VADER_ID = "a7fbe48e-d24d-454c-a5f7-c8398b074770";

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.GuildMembers,
	],
});

let characterData: {
	name: string;
	description: string;
	attributes: Record<string, any>;
} | null = null;

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
					"*mechanical breathing* I have arrived. The Force is strong with this server."
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

client.once(Events.ClientReady, async (c) => {
	console.log(`Ready! Logged in as ${c.user.tag}`);

	// Fetch character data on startup
	try {
		const entity = await getEntityById(DARTH_VADER_ID);
		if (entity) {
			characterData = {
				name: entity.name,
				description: entity.description || "",
				attributes: entity.basicAttributes || {},
			};
			console.log("Character data loaded:", characterData);
		} else {
			console.error("Character not found in database");
		}
	} catch (error) {
		console.error("Error fetching character data:", error);
	}
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

	// Check if the message mentions the bot
	if (message.mentions.users.has(client.user!.id)) {
		console.log("Bot was mentioned, generating AI response");
		try {
			if (!characterData) {
				await message.reply("Error: Character data not loaded");
				return;
			}

			// Get AI-generated response from Gemini
			const response = await generateVaderResponse(message.content);
			await message.reply(response);
			console.log("Response sent successfully");
		} catch (error) {
			console.error("Error sending response:", error);
			// Fall back to random response if AI fails
			const responses = [
				"I find your lack of faith disturbing.",
				"You underestimate the power of the Dark Side.",
				"Join me, and together we can rule the galaxy.",
				"The Force is strong with this one.",
				"Be careful not to choke on your aspirations.",
			];
			await message.reply(
				responses[Math.floor(Math.random() * responses.length)]
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
