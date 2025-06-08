import { AIKnowledgeForm } from "@/components/AIKnowledgeForm";
import { ManualKnowledgeEntryForm } from "@/components/ManualKnowledgeEntryForm";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WebPageKnowledgeForm } from "@/components/WebPageKnowledgeForm";
import { Knowledge } from "@/lib/db/schema";
import {
	AlertTriangle,
	Brain,
	Globe,
	Loader2,
	Plus,
	Sparkles,
	Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";

interface KnowledgeTableProps {
	botId: string;
	knowledge: Knowledge[];
	isLoading?: boolean;
	onRefresh?: () => void;
}

export function KnowledgeTable({
	botId,
	knowledge,
	isLoading,
	onRefresh,
}: KnowledgeTableProps) {
	const [isImportModalOpen, setIsImportModalOpen] = useState(false);
	const [selectedKnowledge, setSelectedKnowledge] = useState<Knowledge | null>(
		null
	);
	const [localKnowledge, setLocalKnowledge] = useState<Knowledge[]>(knowledge);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
	const [knowledgeToDelete, setKnowledgeToDelete] = useState<Knowledge | null>(
		null
	);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isDeletingAll, setIsDeletingAll] = useState(false);

	// Update local knowledge when props change
	useEffect(() => {
		setLocalKnowledge(knowledge);
	}, [knowledge]);

	const handleRowClick = (item: Knowledge) => {
		setSelectedKnowledge(item);
		setIsImportModalOpen(true);
	};

	const handleModalClose = () => {
		setIsImportModalOpen(false);
		setSelectedKnowledge(null);
	};

	const handleAddNew = () => {
		setSelectedKnowledge(null);
		setIsImportModalOpen(true);
	};

	const handleSuccess = (updatedData?: Knowledge) => {
		console.log("Knowledge operation successful:", updatedData);

		if (updatedData) {
			if (selectedKnowledge) {
				// Update existing item in local state
				setLocalKnowledge((prev) =>
					prev.map((item) => (item.id === updatedData.id ? updatedData : item))
				);
			} else {
				// Add new item to local state
				setLocalKnowledge((prev) => [updatedData, ...prev]);
			}
		}

		handleModalClose();
		// Trigger refresh if available
		onRefresh?.();
	};

	const handleWebPageSuccess = (results: any[]) => {
		console.log("Webpage knowledge import successful:", results);

		// Add all new items to local state
		if (results && results.length > 0) {
			setLocalKnowledge((prev) => [...results, ...prev]);
		}

		handleModalClose();
		// Trigger refresh if available
		onRefresh?.();
	};

	const handleAISuccess = (results: any[]) => {
		console.log("AI knowledge import successful:", results);

		// Add all new items to local state
		if (results && results.length > 0) {
			setLocalKnowledge((prev) => [...results, ...prev]);
		}

		handleModalClose();
		// Trigger refresh if available
		onRefresh?.();
	};

	const handleDeleteClick = (item: Knowledge, e: React.MouseEvent) => {
		e.stopPropagation();
		setKnowledgeToDelete(item);
		setDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!knowledgeToDelete) return;

		setIsDeleting(true);
		try {
			console.log("Deleting knowledge:", knowledgeToDelete.id);
			const res = await fetch(`/api/knowledge/${knowledgeToDelete.id}`, {
				method: "DELETE",
			});

			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.error || "Failed to delete knowledge entry");
			}

			console.log("Delete successful");

			// Remove from local state
			setLocalKnowledge((prev) =>
				prev.filter((item) => item.id !== knowledgeToDelete.id)
			);

			// Trigger refresh if available
			onRefresh?.();
		} catch (err: any) {
			console.error("Delete error:", err);
			// You might want to show an error toast here
			alert(err.message || "Failed to delete knowledge entry");
		} finally {
			setIsDeleting(false);
			setDeleteDialogOpen(false);
			setKnowledgeToDelete(null);
		}
	};

	const handleDeleteAllClick = () => {
		setDeleteAllDialogOpen(true);
	};

	const handleDeleteAllConfirm = async () => {
		setIsDeletingAll(true);
		try {
			console.log("Deleting all knowledge for bot:", botId);
			const res = await fetch(`/api/bots/${botId}/knowledge/clear`, {
				method: "DELETE",
			});

			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.error || "Failed to clear all knowledge");
			}

			const result = await res.json();
			console.log("Delete all successful:", result);

			// Clear local state
			setLocalKnowledge([]);

			// Trigger refresh if available
			onRefresh?.();
		} catch (err: any) {
			console.error("Delete all error:", err);
			alert(err.message || "Failed to clear all knowledge");
		} finally {
			setIsDeletingAll(false);
			setDeleteAllDialogOpen(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center p-8">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<>
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>Knowledge Base</CardTitle>
							<CardDescription>
								Add and manage knowledge for your bot to use in conversations
							</CardDescription>
						</div>
						<div className="flex items-center gap-2">
							{localKnowledge.length > 0 && (
								<Button
									variant="outline"
									onClick={handleDeleteAllClick}
									disabled={isDeletingAll}
								>
									{isDeletingAll ? (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									) : (
										<Trash2 className="mr-2 h-4 w-4" />
									)}
									Delete All
								</Button>
							)}
							<Dialog
								open={isImportModalOpen}
								onOpenChange={setIsImportModalOpen}
							>
								<DialogTrigger asChild>
									<Button onClick={handleAddNew}>
										<Plus className="mr-2 h-4 w-4" /> Add Knowledge
									</Button>
								</DialogTrigger>
								<DialogContent className="sm:max-w-[800px]">
									<DialogHeader>
										<DialogTitle>
											{selectedKnowledge ? "Edit Knowledge" : "Add Knowledge"}
										</DialogTitle>
										<DialogDescription>
											{selectedKnowledge
												? "Update the knowledge entry details"
												: "Choose how you want to add knowledge to your bot"}
										</DialogDescription>
									</DialogHeader>
									{selectedKnowledge ? (
										<ManualKnowledgeEntryForm
											botId={botId}
											initialData={selectedKnowledge}
											onSuccess={handleSuccess}
										/>
									) : (
										<Tabs defaultValue="manual" className="w-full">
											<TabsList className="grid w-full grid-cols-3">
												<TabsTrigger value="manual">
													<Brain className="mr-2 h-4 w-4" />
													Manual Entry
												</TabsTrigger>
												<TabsTrigger value="webpage">
													<Globe className="mr-2 h-4 w-4" />
													From Webpage
												</TabsTrigger>
												<TabsTrigger value="ai">
													<Sparkles className="mr-2 h-4 w-4" />
													Use AI
												</TabsTrigger>
											</TabsList>
											<TabsContent value="manual">
												<ManualKnowledgeEntryForm
													botId={botId}
													onSuccess={handleSuccess}
												/>
											</TabsContent>
											<TabsContent value="webpage">
												<WebPageKnowledgeForm
													botId={botId}
													onSuccess={handleWebPageSuccess}
												/>
											</TabsContent>
											<TabsContent value="ai">
												<AIKnowledgeForm
													botId={botId}
													onSuccess={handleAISuccess}
												/>
											</TabsContent>
										</Tabs>
									)}
								</DialogContent>
							</Dialog>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{localKnowledge.length > 0 ? (
						<div className="w-full overflow-hidden rounded-md border">
							<div className="w-full overflow-x-auto">
								<Table className="w-full table-fixed">
									<TableHeader>
										<TableRow>
											<TableHead className="w-1/2">Name</TableHead>
											<TableHead className="w-1/6">Added</TableHead>
											<TableHead className="w-1/6">Added By</TableHead>
											<TableHead className="w-1/6 text-right">
												Actions
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{localKnowledge.map((item) => (
											<TableRow
												key={item.id}
												className="cursor-pointer hover:bg-muted/50"
												onClick={() => handleRowClick(item)}
											>
												<TableCell className="w-1/2 max-w-0">
													<div className="space-y-1 w-full">
														<div className="font-medium truncate w-full">
															{item.name}
														</div>
														<div className="text-sm text-muted-foreground truncate w-full">
															{item.content?.split("\n")[0] || "No content"}
														</div>
													</div>
												</TableCell>
												<TableCell className="w-1/6">
													<div className="truncate">
														{new Date(item.createdAt).toLocaleDateString()}
													</div>
												</TableCell>
												<TableCell className="w-1/6">
													<div className="truncate">User</div>
												</TableCell>
												<TableCell className="w-1/6 text-right">
													<div className="flex items-center justify-end gap-2">
														<Button
															variant="ghost"
															size="sm"
															onClick={(e) => {
																e.stopPropagation();
																handleRowClick(item);
															}}
														>
															Edit
														</Button>
														<Button
															variant="ghost"
															size="sm"
															onClick={(e) => handleDeleteClick(item, e)}
															className="text-destructive hover:text-destructive"
															disabled={
																isDeleting && knowledgeToDelete?.id === item.id
															}
														>
															{isDeleting &&
															knowledgeToDelete?.id === item.id ? (
																<Loader2 className="h-4 w-4 animate-spin" />
															) : (
																<Trash2 className="h-4 w-4" />
															)}
														</Button>
													</div>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</div>
					) : (
						<div className="flex flex-col items-center justify-center py-12 px-4 text-center">
							<div className="rounded-full bg-primary/10 p-3 mb-4">
								<Brain className="h-6 w-6 text-primary" />
							</div>
							<h3 className="text-lg font-medium mb-2">
								No knowledge added yet
							</h3>
							<p className="text-muted-foreground mb-4 max-w-sm">
								Start by adding some knowledge to your bot. You can add it
								manually or import it from a webpage.
							</p>
							<Button onClick={handleAddNew}>
								<Plus className="mr-2 h-4 w-4" /> Add Knowledge
							</Button>
						</div>
					)}
				</CardContent>
			</Card>
			<AlertDialog
				open={deleteAllDialogOpen}
				onOpenChange={setDeleteAllDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className="flex items-center gap-2">
							<AlertTriangle className="h-5 w-5 text-destructive" />
							Delete All Knowledge?
						</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently delete all {localKnowledge.length} knowledge
							entries from both the database and vector store. This action
							cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteAllConfirm}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{isDeletingAll ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								"Delete All"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Are you sure you want to delete this knowledge entry?
						</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleDeleteConfirm}>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
