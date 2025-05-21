"use client";

import { BotForm } from "@/components/bot-form";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot } from "@/lib/db/schema";
import { getDiscordOAuthUrl } from "@/lib/discord/constants";
import { ArrowLeft, Loader2, Pencil, Share2, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { use, useEffect, useState } from "react";
import { toast } from "sonner";

const getOAuthUrl = (botId: string) =>
	getDiscordOAuthUrl(process.env.NEXT_PUBLIC_DISCORD_APPLICATION_ID!, botId);

interface BotDetailsProps {
	params: Promise<{
		botSlug: string;
	}>;
}

export default function BotDetailsPage({ params }: BotDetailsProps) {
	const { botSlug } = use(params);
	const searchParams = useSearchParams();
	const [bot, setBot] = useState<Bot | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [deleteLoading, setDeleteLoading] = useState(false);
	const router = useRouter();
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);

	// Check for Discord integration status
	useEffect(() => {
		const success = searchParams.get("success");
		const error = searchParams.get("error");

		if (success === "true") {
			toast.success("Bot successfully added to Discord server!");
		} else if (error) {
			switch (error) {
				case "already_exists":
					toast.error("Bot is already added to this Discord server.");
					break;
				case "auth_failed":
					toast.error("Failed to authenticate with Discord.");
					break;
				case "guild_fetch_failed":
					toast.error("Failed to fetch Discord server information.");
					break;
				case "db_error":
					toast.error("Failed to save Discord integration.");
					break;
				default:
					toast.error("An unknown error occurred.");
			}
		}
	}, [searchParams]);

	// Fetch bot data
	useEffect(() => {
		const fetchBot = async () => {
			try {
				setLoading(true);
				setError(null);

				const response = await fetch(`/api/bots/${botSlug}`);

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error || "Failed to fetch bot");
				}

				const data = await response.json();
				setBot(data);
			} catch (err) {
				console.error("Error fetching bot:", err);
				setError(
					err instanceof Error ? err.message : "An unknown error occurred"
				);
			} finally {
				setLoading(false);
			}
		};

		if (botSlug) {
			fetchBot();
		}
	}, [botSlug]);

	// Handle bot deletion
	const handleDeleteBot = async () => {
		if (!bot) return toast.error("Bot does not exist!");

		try {
			setDeleteLoading(true);

			const response = await fetch(`/api/bot/${bot.id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to delete bot");
			}

			// Redirect to bots page after successful deletion
			router.push("/dashboard/bots");
			toast.success("Bot deleted successfully");
		} catch (err) {
			console.error("Error deleting bot:", err);
			setError(err instanceof Error ? err.message : "Failed to delete bot");
			toast.error("Failed to delete bot");
			setDeleteLoading(false);
		}
	};

	const handleEditSuccess = (updatedBot: Bot) => {
		// Update the bot in the local state
		setBot(updatedBot);
		toast.success("Bot updated successfully");
	};

	// Loading state
	if (loading) {
		return (
			<>
				<div className="mb-6">
					<Skeleton className="h-8 w-64 mb-2" />
					<Skeleton className="h-4 w-32" />
				</div>
				<Card>
					<CardHeader>
						<Skeleton className="h-8 w-3/4 mb-2" />
						<Skeleton className="h-4 w-1/2" />
					</CardHeader>
					<CardContent>
						<Skeleton className="h-24 w-full mb-4" />
						<Skeleton className="h-8 w-1/3 mb-2" />
						<Skeleton className="h-8 w-1/4" />
					</CardContent>
				</Card>
			</>
		);
	}

	// Error state
	if (error) {
		return (
			<Card className="border-red-200 bg-red-50">
				<CardHeader>
					<CardTitle className="text-red-700">Error</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-red-600">{error}</p>
				</CardContent>
				<CardFooter>
					<Button
						variant="outline"
						onClick={() => router.push("/dashboard/bots")}
					>
						<ArrowLeft className="mr-2 h-4 w-4" /> Back to Bots
					</Button>
				</CardFooter>
			</Card>
		);
	}

	// No bot found
	if (!bot) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Bot Not Found</CardTitle>
				</CardHeader>
				<CardContent>
					<p>
						The bot you are looking for does not exist or you don't have access
						to it.
					</p>
				</CardContent>
				<CardFooter>
					<Button
						variant="outline"
						onClick={() => router.push("/dashboard/bots")}
					>
						<ArrowLeft className="mr-2 h-4 w-4" /> Back to Bots
					</Button>
				</CardFooter>
			</Card>
		);
	}

	// Format dates
	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	return (
		<div className="container mx-auto p-8">
			{/* Header with navigation */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
				<div>
					<h1 className="text-2xl font-bold">{bot.name}</h1>
					<p className="text-muted-foreground">
						Created on {formatDate(bot.createdAt.toString())}
					</p>
				</div>
				<div className="mt-4 sm:mt-0 space-x-2 flex">
					<Button
						variant="outline"
						onClick={() => router.push("/dashboard/bots")}
					>
						<ArrowLeft className="mr-2 h-4 w-4" /> Back
					</Button>
					<Button
						variant="outline"
						onClick={() => window.open(getOAuthUrl(bot.id), "_blank")}
					>
						<Share2 className="mr-2 h-4 w-4" /> Add to Discord
					</Button>
					<BotForm
						isOpen={isEditModalOpen}
						onOpenChange={setIsEditModalOpen}
						onSuccess={handleEditSuccess}
						bot={bot}
						mode="edit"
					/>
					<Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
						<Pencil className="mr-2 h-4 w-4" /> Edit
					</Button>
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button variant="destructive">
								<Trash2 className="mr-2 h-4 w-4" /> Delete
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Are you sure?</AlertDialogTitle>
								<AlertDialogDescription>
									This action cannot be undone. This will permanently delete the
									bot &quot;{bot.name}&quot;.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction
									onClick={handleDeleteBot}
									className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
									disabled={deleteLoading}
								>
									{deleteLoading ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
											Deleting...
										</>
									) : (
										"Delete"
									)}
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			</div>

			{/* Bot details */}
			<Card>
				<CardHeader>
					<div className="flex justify-between items-center">
						<div>
							<CardTitle>{bot.name}</CardTitle>
							<CardDescription>Slug: {bot.slug}</CardDescription>
						</div>
						<Badge
							variant={bot.status === "active" ? "default" : "secondary"}
							className="ml-2"
						>
							{bot.status
								? bot.status.charAt(0).toUpperCase() + bot.status.slice(1)
								: "n/a"}
						</Badge>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					{bot.description && (
						<div>
							<h3 className="text-sm font-medium text-muted-foreground mb-1">
								Description
							</h3>
							<p>{bot.description}</p>
						</div>
					)}

					<div>
						<h3 className="text-sm font-medium text-muted-foreground mb-1">
							System Prompt
						</h3>
						<p className="whitespace-pre-wrap">{bot.systemPrompt}</p>
					</div>
				</CardContent>
				<CardFooter className="flex justify-between border-t p-6">
					<div className="text-sm text-muted-foreground">
						Last updated: {formatDate(bot.updatedAt.toString())}
					</div>
				</CardFooter>
			</Card>
		</div>
	);
}
