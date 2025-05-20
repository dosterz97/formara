# Formara Discord Bot

A simple Discord bot that responds to ping commands.

## Setup

1. Create a new Discord application and bot at https://discord.com/developers/applications
2. Copy your bot token
3. Create a `.env` file in the `apps/bot` directory with the following content:
   ```
   DISCORD_TOKEN=your_discord_bot_token_here
   ```
4. Install dependencies:
   ```bash
   pnpm install
   ```
5. Start the bot in development mode:
   ```bash
   pnpm dev
   ```

## Usage

Once the bot is running and invited to your server, you can interact with it by mentioning it and saying "say hello":

```
@YourBot say hello
```

The bot will respond with "Pong! 🏓"
