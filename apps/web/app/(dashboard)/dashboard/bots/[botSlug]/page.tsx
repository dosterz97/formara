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
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Knowledge } from "@/lib/db/schema";
import { getDiscordOAuthUrl } from "@/lib/discord/constants";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Pencil, Save, Trash2, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { use, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const getOAuthUrl = (botId: string) =>
	getDiscordOAuthUrl(process.env.NEXT_PUBLIC_DISCORD_APPLICATION_ID!, botId);

// Form schema for bot editing
const formSchema = z.object({
	name: z
		.string()
		.min(1, "Name is required")
		.max(100, "Name must be less than 100 characters"),
	description: z
		.string()
		.max(500, "Description must be less than 500 characters")
		.optional(),
	status: z.enum(["active", "inactive"]),
});

type FormValues = z.infer<typeof formSchema>;

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

	// Editing state
	const [isEditing, setIsEditing] = useState(false);
	const [editLoading, setEditLoading] = useState(false);

	// Form for inline editing
	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			description: "",
			status: "active",
		},
	});

	// Update form when bot data changes
	useEffect(() => {
		if (bot) {
			form.reset({
				name: bot.name,
				description: bot.description || "",
				status: (bot.status as any) || "active",
			});
		}
	}, [bot, form]);

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

	// Handle inline form submission
	const handleInlineEdit = async (values: FormValues) => {
		if (!bot) return;

		try {
			setEditLoading(true);

			const response = await fetch(`/api/bot/${bot.id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(values),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to update bot");
			}

			const updatedBot = await response.json();
			setBot(updatedBot);
			setIsEditing(false);
			toast.success("Bot updated successfully");
		} catch (error) {
			console.error("Error updating bot:", error);
			toast.error("Failed to update bot");
		} finally {
			setEditLoading(false);
		}
	};

	// Cancel editing
	const handleCancelEdit = () => {
		if (bot) {
			form.reset({
				name: bot.name,
				description: bot.description || "",
				status: (bot.status as any) || "active",
			});
		}
		setIsEditing(false);
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
				<Tabs defaultValue="details" className="w-full">
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="details">Details</TabsTrigger>
						<TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
						<TabsTrigger value="chat">Chat Interface</TabsTrigger>
					</TabsList>
					<TabsContent value="details">
						<Card>
							<CardHeader>
								<div className="flex items-center justify-between">
									<div>
										<CardTitle>Bot Details</CardTitle>
										<CardDescription>
											Configure your bot's settings and behavior
										</CardDescription>
									</div>
									<div className="flex items-center gap-2">
										{!isEditing ? (
											<Button
												variant="outline"
												size="sm"
												onClick={() => setIsEditing(true)}
												disabled={editLoading}
											>
												<Pencil className="mr-2 h-4 w-4" />
												Edit
											</Button>
										) : (
											<div className="flex gap-2">
												<Button
													variant="outline"
													size="sm"
													onClick={handleCancelEdit}
													disabled={editLoading}
												>
													<X className="mr-2 h-4 w-4" />
													Cancel
												</Button>
												<Button
													size="sm"
													onClick={form.handleSubmit(handleInlineEdit)}
													disabled={editLoading}
												>
													{editLoading ? (
														<Loader2 className="mr-2 h-4 w-4 animate-spin" />
													) : (
														<Save className="mr-2 h-4 w-4" />
													)}
													Save
												</Button>
											</div>
										)}
									</div>
								</div>
							</CardHeader>
							<CardContent>
								{!isEditing ? (
									<div className="space-y-4">
										<div>
											<h3 className="font-medium mb-2">Name</h3>
											<p className="text-sm text-muted-foreground">
												{bot?.name}
											</p>
										</div>
										<div>
											<h3 className="font-medium mb-2">Description</h3>
											<p className="text-sm text-muted-foreground">
												{bot?.description || "No description set"}
											</p>
										</div>
										<div>
											<h3 className="font-medium mb-2">Status</h3>
											<Badge variant="outline">{bot?.status}</Badge>
										</div>
									</div>
								) : (
									<Form {...form}>
										<form
											onSubmit={form.handleSubmit(handleInlineEdit)}
											className="space-y-4"
										>
											<FormField
												control={form.control}
												name="name"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Name</FormLabel>
														<FormControl>
															<Input placeholder="Bot name" {...field} />
														</FormControl>
														<FormDescription>
															The name of your bot.
														</FormDescription>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name="description"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Description</FormLabel>
														<FormControl>
															<Textarea
																placeholder="Describe your bot..."
																className="resize-none"
																{...field}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name="status"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Status</FormLabel>
														<Select
															onValueChange={field.onChange}
															defaultValue={field.value}
															value={field.value}
														>
															<FormControl>
																<SelectTrigger>
																	<SelectValue placeholder="Select a status" />
																</SelectTrigger>
															</FormControl>
															<SelectContent>
																{["active", "inactive"].map((status) => (
																	<SelectItem key={status} value={status}>
																		{status.charAt(0).toUpperCase() +
																			status.slice(1)}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
														<FormDescription>
															The current status of this bot.
														</FormDescription>
														<FormMessage />
													</FormItem>
												)}
											/>
										</form>
									</Form>
								)}
							</CardContent>
						</Card>
					</TabsContent>
					<TabsContent value="knowledge">
						<KnowledgeTable
							botId={bot?.id || ""}
							knowledge={knowledge}
							isLoading={knowledgeLoading}
						/>
					</TabsContent>
					<TabsContent value="chat">
						<ChatInterface botId={bot?.id || ""} botName={bot?.name || ""} />
					</TabsContent>
				</Tabs>
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
