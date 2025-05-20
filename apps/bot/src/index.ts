import { Client, Events, GatewayIntentBits, Message } from "discord.js";
import dotenv from "dotenv";
import path from "path";

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

	// Check if the message mentions the bot
	if (message.mentions.users.has(client.user!.id)) {
		console.log("Bot was mentioned, sending response");
		try {
			await message.reply("Pong! 🏓");
			console.log("Response sent successfully");
		} catch (error) {
			console.error("Error sending response:", error);
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
