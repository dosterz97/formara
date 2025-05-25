"use client";

import { BotForm } from "@/components/bot-form";
import { ChatInterface } from "@/components/chat-interface";
import { KnowledgeTable } from "@/components/knowledge-table";
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
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, Knowledge } from "@/lib/db/schema";
import { getDiscordOAuthUrl } from "@/lib/discord/constants";
import { ArrowLeft, Loader2, Pencil, Trash2 } from "lucide-react";
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
	const [knowledge, setKnowledge] = useState<Knowledge[]>([]);
	const [loading, setLoading] = useState(true);
	const [knowledgeLoading, setKnowledgeLoading] = useState(true);
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

	// Fetch knowledge data
	useEffect(() => {
		const fetchKnowledge = async () => {
			if (!bot) return;

			try {
				setKnowledgeLoading(true);
				const response = await fetch(`/api/bots/${bot.id}/knowledge`);

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error || "Failed to fetch knowledge");
				}

				const data = await response.json();
				setKnowledge(data);
			} catch (err) {
				console.error("Error fetching knowledge:", err);
				toast.error("Failed to load knowledge data");
			} finally {
				setKnowledgeLoading(false);
			}
		};

		if (bot) {
			fetchKnowledge();
		}
	}, [bot]);

	// Handle bot deletion
	const handleDeleteBot = async () => {
		if (!bot) return toast.error("Bot does not exist!");

		try {
			setDeleteLoading(true);

			const response = await fetch(`/api/bots/${bot.id}`, {
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
		<>
			<div className="mb-6">
				<Button
					variant="outline"
					onClick={() => router.push("/dashboard/bots")}
					className="mb-4"
				>
					<ArrowLeft className="mr-2 h-4 w-4" /> Back to Bots
				</Button>
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold tracking-tight">{bot?.name}</h1>
						<p className="text-muted-foreground">{bot?.description}</p>
					</div>
					<div className="flex items-center gap-2">
						<Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
							<Pencil className="mr-2 h-4 w-4" /> Edit
						</Button>
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button variant="destructive">
									{deleteLoading ? (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									) : (
										<Trash2 className="mr-2 h-4 w-4" />
									)}
									Delete
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>
										Are you sure you want to delete this bot?
									</AlertDialogTitle>
									<AlertDialogDescription>
										This action cannot be undone. This will permanently delete
										the bot and all its data.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>Cancel</AlertDialogCancel>
									<AlertDialogAction
										onClick={handleDeleteBot}
										className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
									>
										Delete
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</div>
				</div>
			</div>

			<div className="grid gap-6">
				<Card>
					<CardHeader>
						<CardTitle>Bot Details</CardTitle>
						<CardDescription>
							Configure your bot's settings and behavior
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div>
								<h3 className="font-medium mb-2">System Prompt</h3>
								<p className="text-sm text-muted-foreground">
									{bot?.systemPrompt || "No system prompt set"}
								</p>
							</div>
							<div>
								<h3 className="font-medium mb-2">Voice</h3>
								<p className="text-sm text-muted-foreground">
									{bot?.voiceId || "No voice selected"}
								</p>
							</div>
							<div>
								<h3 className="font-medium mb-2">Status</h3>
								<Badge variant="outline">{bot?.status}</Badge>
							</div>
						</div>
					</CardContent>
				</Card>

				<KnowledgeTable
					botId={bot?.id || ""}
					knowledge={knowledge}
					isLoading={knowledgeLoading}
				/>

				<ChatInterface botId={bot?.id || ""} botName={bot?.name || ""} />
			</div>

			{/* Edit modal */}
			<Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Bot</DialogTitle>
					</DialogHeader>
					<BotForm
						bot={bot}
						isOpen={isEditModalOpen}
						onOpenChange={setIsEditModalOpen}
						mode="edit"
						onSuccess={(updatedBot) => {
							handleEditSuccess(updatedBot);
							setIsEditModalOpen(false);
						}}
					/>
				</DialogContent>
			</Dialog>
		</>
	);
}
