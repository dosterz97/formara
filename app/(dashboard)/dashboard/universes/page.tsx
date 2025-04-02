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
import { UniverseForm } from "@/components/universe-form";
import { Universe } from "@/lib/db/schema";
import { Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast, Toaster } from "sonner";
export default function HomePage() {
	const [universes, setUniverses] = useState<
		(Universe & { entityCount: number })[]
	>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [deleteLoadingUniverseId, setDeleteLoadingUniverseId] = useState<
		string | null
	>(null);

	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [selectedUniverse, setSelectedUniverse] = useState<
		Universe | undefined
	>(undefined);

	// Load universes from API when component mounts
	useEffect(() => {
		fetchUniverses();
	}, []);

	const fetchUniverses = async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/universes");

			if (!response.ok) {
				throw new Error("Failed to fetch universes");
			}

			const data = await response.json();
			setUniverses(data);
		} catch (err) {
			console.error("Error fetching universes:", err);
			setError("Failed to load universes");
		} finally {
			setLoading(false);
		}
	};

	const handleCreateSuccess = (newUniverse: Universe) => {
		// Add the new universe to the local state
		setUniverses([...universes, newUniverse as any]);
	};

	const handleEditSuccess = (updatedUniverse: Universe) => {
		// Update the universe in the local state
		setUniverses(
			universes.map((u) =>
				u.id === updatedUniverse.id ? { ...u, ...updatedUniverse } : u
			)
		);
	};

	// Handle universe deletion
	const handleDeleteUniverse = async (universe: Universe) => {
		if (!universe) return toast.error("Universe does not exist!");

		setDeleteLoadingUniverseId(universe.id);

		try {
			const response = await fetch(`/api/universe/${universe.id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to delete universe");
			}

			setUniverses((prevUniverses) =>
				prevUniverses.filter((u) => u.id !== universe.id)
			);
		} catch (err) {
			console.error("Error deleting universe:", err);

			setError(
				err instanceof Error ? err.message : "Failed to delete universe"
			);
		} finally {
			setDeleteLoadingUniverseId(null);
		}
	};

	const handleEditClick = (universe: Universe) => {
		setSelectedUniverse(universe);
		setIsEditModalOpen(true);
	};

	return (
		<div className="container mx-auto p-6">
			{/* Add Sonner component to the layout */}
			<Toaster position="top-right" />

			<div className="flex justify-between items-center mb-6">
				<h1 className="text-3xl font-bold">Home</h1>

				{/* Create Universe Form */}
				<UniverseForm
					isOpen={isCreateModalOpen}
					onOpenChange={setIsCreateModalOpen}
					onSuccess={handleCreateSuccess}
					mode="create"
					trigger={<Button>Create New Universe</Button>}
				/>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
				{loading ? (
					<div className="col-span-full text-center p-12">
						<p>Loading universes...</p>
					</div>
				) : error ? (
					<div className="col-span-full text-center p-12 bg-red-50 rounded-lg border border-red-200">
						<h3 className="text-lg font-medium text-red-600 mb-2">Error</h3>
						<p className="text-red-500 mb-4">{error}</p>
					</div>
				) : universes.length > 0 ? (
					universes.map((universe) => (
						<div
							key={universe.id}
							className="border rounded-lg p-6 shadow-sm relative"
						>
							<h2 className="text-xl font-semibold mb-2">{universe.name}</h2>
							<p className="text-gray-600 mb-4">{universe.description}</p>
							<div className="flex justify-between items-center">
								<span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
									{universe.status}
								</span>
								<div className="flex items-center gap-2">
									<span className="text-sm text-gray-500">
										{universe.entityCount || 0} entities
									</span>

									<div className="absolute right-4 top-4">
										<AlertDialog>
											<AlertDialogTrigger asChild>
												<Button size={"icon"} variant={"outline"}>
													{deleteLoadingUniverseId === universe.id ? (
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
														delete the universe &quot;{universe.name}&quot; and
														all its entities.
													</AlertDialogDescription>
												</AlertDialogHeader>
												<AlertDialogFooter>
													<AlertDialogCancel>Cancel</AlertDialogCancel>
													<AlertDialogAction
														onClick={() => handleDeleteUniverse(universe)}
														className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
														disabled={!!deleteLoadingUniverseId}
													>
														{deleteLoadingUniverseId === universe.id ? (
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
										onClick={() => handleEditClick(universe)}
									>
										Edit
									</Button>
									<Link href={`/dashboard/universes/${universe.slug}`}>
										<Button variant="outline" size="sm">
											View
										</Button>
									</Link>
								</div>
							</div>
						</div>
					))
				) : (
					<div className="col-span-full text-center p-12 bg-gray-50 rounded-lg border border-dashed">
						<h3 className="text-lg font-medium text-gray-600 mb-2">
							No universes yet
						</h3>
						<p className="text-gray-500 mb-4">
							Create your first universe to get started
						</p>
					</div>
				)}
			</div>

			{/* Edit Universe Form */}
			<UniverseForm
				isOpen={isEditModalOpen}
				onOpenChange={setIsEditModalOpen}
				onSuccess={handleEditSuccess}
				universe={selectedUniverse}
				mode="edit"
			/>
		</div>
	);
}
