"use client";

import { Button } from "@/components/ui/button";

export default function InvitePage() {
	const discordOAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${process.env.NEXT_PUBLIC_DISCORD_APPLICATION_ID}&permissions=274878024704&scope=bot%20applications.commands`;

	return (
		<div className="flex items-center justify-center min-h-screen">
			<Button
				className="px-8 py-6 text-lg font-medium"
				onClick={() => window.open(discordOAuthUrl, "_blank")}
			>
				Add to Discord
			</Button>
		</div>
	);
}
