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
import { Button } from "@/components/ui/button";
import { Bot } from "@/lib/db/schema";
import { Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast, Toaster } from "sonner";

export default function BotsPage() {
	const [bots, setBots] = useState<Bot[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [deleteLoadingBotId, setDeleteLoadingBotId] = useState<string | null>(
		null
	);

	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [selectedBot, setSelectedBot] = useState<Bot | undefined>(undefined);

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

	const handleCreateSuccess = (newBot: Bot) => {
		// Add the new bot to the local state
		setBots([...bots, newBot]);
	};

	const handleEditSuccess = (updatedBot: Bot) => {
		// Update the bot in the local state
		setBots(bots.map((b) => (b.id === updatedBot.id ? updatedBot : b)));
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

	const handleEditClick = (bot: Bot) => {
		setSelectedBot(bot);
		setIsEditModalOpen(true);
	};

	return (
		<section className="flex-1 p-4 lg:p-8">
			{/* Add Sonner component to the layout */}
			<Toaster position="top-right" />

			<h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
				Bots
			</h1>
			<div className="flex justify-between items-center mb-6">
				{/* Create Bot Form */}
				<BotForm
					isOpen={isCreateModalOpen}
					onOpenChange={setIsCreateModalOpen}
					onSuccess={handleCreateSuccess}
					mode="create"
					trigger={<Button>Create New Bot</Button>}
				/>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
				{loading ? (
					<div className="col-span-full text-center p-12">
						<p>Loading bots...</p>
					</div>
				) : error ? (
					<div className="col-span-full text-center p-12 bg-red-50 rounded-lg border border-red-200">
						<h3 className="text-lg font-medium text-red-600 mb-2">Error</h3>
						<p className="text-red-500 mb-4">{error}</p>
					</div>
				) : bots.length > 0 ? (
					bots.map((bot) => (
						<div
							key={bot.id}
							className="border rounded-lg p-6 shadow-sm relative"
						>
							<h2 className="text-xl font-semibold mb-2">{bot.name}</h2>
							<p className="text-gray-600 mb-4">{bot.description}</p>
							<div className="flex justify-between items-center">
								<span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
									{bot.status}
								</span>
								<div className="flex items-center gap-2">
									<div className="absolute right-4 top-4">
										<AlertDialog>
											<AlertDialogTrigger asChild>
												<Button size={"icon"} variant={"outline"}>
													{deleteLoadingBotId === bot.id ? (
														<>
															<Loader2 className="h-4 w-4 animate-spin" />{" "}
														</>
													) : (
														<Trash2 className="h-4 w-4" />
													)}
												</Button>
											</AlertDialogTrigger>
											<AlertDialogContent>
												<AlertDialogHeader>
													<AlertDialogTitle>Are you sure?</AlertDialogTitle>
													<AlertDialogDescription>
														This action cannot be undone. This will permanently
														delete the bot &quot;{bot.name}&quot;.
													</AlertDialogDescription>
												</AlertDialogHeader>
												<AlertDialogFooter>
													<AlertDialogCancel>Cancel</AlertDialogCancel>
													<AlertDialogAction
														onClick={() => handleDeleteBot(bot)}
														className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
														disabled={!!deleteLoadingBotId}
													>
														{deleteLoadingBotId === bot.id ? (
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
									<Button
										variant="outline"
										size="sm"
										onClick={() => handleEditClick(bot)}
									>
										Edit
									</Button>
									<Link href={`/dashboard/bots/${bot.slug}`}>
										<Button variant="outline" size="sm">
											View
										</Button>
									</Link>
								</div>
							</div>
						</div>
					))
				) : (
					<div className="col-span-full text-center p-12 bg-gray-100 rounded-lg border border-dashed border-gray-300">
						<h3 className="text-lg font-medium text-gray-700 mb-2">
							No bots yet
						</h3>
						<p className="text-gray-600 mb-4">
							Create your first bot to get started
						</p>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 w-full">
							<div className="col-span-1 bg-white rounded-md p-4 h-64 shadow-sm border border-gray-200">
								<div className="h-8 w-32 bg-indigo-100 rounded mb-4"></div>
								<div className="space-y-2">
									<div className="h-4 w-full bg-gray-200 rounded"></div>
									<div className="h-4 w-full bg-gray-200 rounded"></div>
									<div className="h-4 w-3/4 bg-gray-200 rounded"></div>
								</div>
							</div>
							<div className="col-span-2 bg-white rounded-md p-4 hidden md:block shadow-sm border border-gray-200">
								<div className="h-full flex flex-col">
									<div className="flex justify-between mb-4">
										<div className="h-8 w-40 bg-purple-100 rounded"></div>
										<div className="h-8 w-20 bg-indigo-100 rounded"></div>
									</div>
									<div className="flex-1 grid grid-cols-2 gap-4">
										<div className="bg-gray-100 rounded-md p-3">
											<div className="h-24 bg-gray-200 rounded mb-3"></div>
											<div className="h-4 w-3/4 bg-gray-300 rounded mb-2"></div>
											<div className="h-4 w-1/2 bg-gray-300 rounded"></div>
										</div>
										<div className="bg-gray-100 rounded-md p-3">
											<div className="h-24 bg-gray-200 rounded mb-3"></div>
											<div className="h-4 w-3/4 bg-gray-300 rounded mb-2"></div>
											<div className="h-4 w-1/2 bg-gray-300 rounded"></div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Edit Bot Form */}
			<BotForm
				isOpen={isEditModalOpen}
				onOpenChange={setIsEditModalOpen}
				onSuccess={handleEditSuccess}
				bot={selectedBot}
				mode="edit"
			/>
		</section>
	);
}
