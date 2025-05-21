export const DISCORD_OAUTH_SCOPES = [
	"bot",
	"applications.commands",
	"identify",
	"guilds",
].join("%20");

export const DISCORD_BOT_PERMISSIONS = "277025466368"; // Send Messages, Read Messages, Manage Messages, etc.

export const getDiscordOAuthUrl = (clientId: string, state?: string) => {
	const baseUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${DISCORD_BOT_PERMISSIONS}&scope=${DISCORD_OAUTH_SCOPES}&response_type=code`;

	return state ? `${baseUrl}&state=${state}` : baseUrl;
};
