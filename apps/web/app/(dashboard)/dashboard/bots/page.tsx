"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Bot } from "@/lib/db/schema";
import { getDiscordOAuthUrl } from "@/lib/discord/constants";
import { Loader2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast, Toaster } from "sonner";

export default function BotsPage() {
	const [bots, setBots] = useState<Bot[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [deleteLoadingBotId, setDeleteLoadingBotId] = useState<string | null>(
		null
	);

	// Load bots from API when component mounts
	useEffect(() => {
		fetchBots();
	}, []);

	const fetchBots = async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/bots");

			if (!response.ok) {
				throw new Error("Failed to fetch bots");
			}

			const data = await response.json();
			setBots(data);
		} catch (err) {
			console.error("Error fetching bots:", err);
			setError("Failed to load bots");
		} finally {
			setLoading(false);
		}
	};

	// Handle bot deletion
	const handleDeleteBot = async (bot: Bot) => {
		if (!bot) return toast.error("Bot does not exist!");

		setDeleteLoadingBotId(bot.id);

		try {
			const response = await fetch(`/api/bot/${bot.id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to delete bot");
			}

			setBots((prevBots) => prevBots.filter((b) => b.id !== bot.id));
			toast.success("Bot deleted successfully");
		} catch (err) {
			console.error("Error deleting bot:", err);
			setError(err instanceof Error ? err.message : "Failed to delete bot");
			toast.error("Failed to delete bot");
		} finally {
			setDeleteLoadingBotId(null);
		}
	};

	const handleAddToDiscord = (bot: Bot) => {
		const discordUrl = getDiscordOAuthUrl(
			process.env.NEXT_PUBLIC_DISCORD_APPLICATION_ID!,
			bot.id
		);
		window.open(discordUrl, "_blank");
	};

	return (
		<section className="flex-1 p-4 lg:p-8">
			<Toaster position="top-right" />

			<div className="max-w-7xl mx-auto">
				<div className="flex justify-between items-center mb-8">
					<div>
						<h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
							Your Bots
						</h1>
						<p className="text-gray-500 mt-1">
							Manage and configure your Discord bots
						</p>
					</div>
					<Link href="/dashboard/bots/new">
						<Button className="bg-indigo-600 hover:bg-indigo-700 shadow-sm">
							<Plus className="mr-2 h-4 w-4" />
							Create New Bot
						</Button>
					</Link>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{loading ? (
						<div className="col-span-full">
							<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
								<div className="flex items-center justify-center space-x-2">
									<Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
									<p className="text-gray-600">Loading your bots...</p>
								</div>
							</div>
						</div>
					) : error ? (
						<div className="col-span-full">
							<div className="bg-red-50 rounded-lg border border-red-200 p-8">
								<h3 className="text-lg font-medium text-red-600 mb-2">Error</h3>
								<p className="text-red-500">{error}</p>
							</div>
						</div>
					) : bots.length > 0 ? (
						bots.map((bot) => (
							<div
								key={bot.id}
								className="group bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200"
							>
								<Link href={`/dashboard/bots/${bot.slug}`} className="block">
									<div className="p-6">
										<div className="flex justify-between items-start mb-4">
											<div>
												<h2 className="text-xl font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
													{bot.name}
												</h2>
												<p className="text-gray-600 mt-1 line-clamp-2">
													{bot.description}
												</p>
											</div>
											<div onClick={(e) => e.preventDefault()}>
												<AlertDialog>
													<AlertDialogTrigger asChild>
														<Button
															size="icon"
															variant="ghost"
															className="text-gray-400 hover:text-red-600 hover:bg-red-50"
														>
															{deleteLoadingBotId === bot.id ? (
																<Loader2 className="h-4 w-4 animate-spin" />
															) : (
																<Trash2 className="h-4 w-4" />
															)}
														</Button>
													</AlertDialogTrigger>
													<AlertDialogContent>
														<AlertDialogHeader>
															<AlertDialogTitle>Delete Bot</AlertDialogTitle>
															<AlertDialogDescription>
																This action cannot be undone. This will
																permanently delete the bot &quot;{bot.name}
																&quot;.
															</AlertDialogDescription>
														</AlertDialogHeader>
														<AlertDialogFooter>
															<AlertDialogCancel>Cancel</AlertDialogCancel>
															<AlertDialogAction
																onClick={() => handleDeleteBot(bot)}
																className="bg-red-600 text-white hover:bg-red-700"
																disabled={!!deleteLoadingBotId}
															>
																{deleteLoadingBotId === bot.id ? (
																	<>
																		<Loader2 className="mr-2 h-4 w-4 animate-spin" />
																		Deleting...
																	</>
																) : (
																	"Delete Bot"
																)}
															</AlertDialogAction>
														</AlertDialogFooter>
													</AlertDialogContent>
												</AlertDialog>
											</div>
										</div>
										<div className="flex items-center gap-2 mb-6">
											<span
												className={`px-2.5 py-1 rounded-full text-xs font-medium ${
													bot.status === "active"
														? "bg-green-100 text-green-800"
														: "bg-yellow-100 text-yellow-800"
												}`}
											>
												{bot.status}
											</span>
										</div>
									</div>
								</Link>
								<div className="px-6 pb-6 grid grid-cols-2 gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => handleAddToDiscord(bot)}
										className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white border-none"
									>
										<svg
											className="mr-2 h-4 w-4"
											viewBox="0 0 24 24"
											fill="currentColor"
										>
											<path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
										</svg>
										Add to Discord
									</Button>
									<Link href={`/dashboard/bots/${bot.slug}`}>
										<Button variant="outline" size="sm" className="w-full">
											Edit
										</Button>
									</Link>
								</div>
							</div>
						))
					) : (
						<div className="col-span-full">
							<div className="bg-white rounded-lg border border-dashed border-gray-300 p-12 text-center">
								<div className="max-w-md mx-auto">
									<h3 className="text-xl font-semibold text-gray-900 mb-2">
										No bots yet
									</h3>
									<p className="text-gray-600 mb-6">
										Create your first bot to start managing your Discord servers
									</p>
									<Link href="/dashboard/bots/new">
										<Button className="bg-indigo-600 hover:bg-indigo-700 shadow-sm">
											<Plus className="mr-2 h-4 w-4" />
											Create Your First Bot
										</Button>
									</Link>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</section>
	);
}
