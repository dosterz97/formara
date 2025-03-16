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
import { ArrowLeft, Loader2, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// TypeScript interface for Universe
interface Universe {
	id: string;
	name: string;
	slug: string;
	description: string;
	status: string;
	rules: Record<string, any>;
	teamId: string;
	createdBy: string;
	createdAt: string;
	updatedAt: string;
	vectorNamespace: string;
	entityCount: number;
}

interface UniverseDetailsProps {
	id: string;
}

export function UniverseDetails({ id }: UniverseDetailsProps) {
	const [universe, setUniverse] = useState<Universe | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [deleteLoading, setDeleteLoading] = useState(false);
	const router = useRouter();

	// Fetch universe data
	useEffect(() => {
		const fetchUniverse = async () => {
			try {
				setLoading(true);
				setError(null);

				console.log(id);
				const response = await fetch(`/api/universes/${id}`);

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error || "Failed to fetch universe");
				}

				const data = await response.json();
				setUniverse(data);
			} catch (err) {
				console.error("Error fetching universe:", err);
				setError(
					err instanceof Error ? err.message : "An unknown error occurred"
				);
			} finally {
				setLoading(false);
			}
		};

		if (id) {
			fetchUniverse();
		}
	}, [id]);

	// Handle universe deletion
	const handleDeleteUniverse = async () => {
		if (!universe) return;

		try {
			setDeleteLoading(true);

			const response = await fetch(`/api/universes/${universe.id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to delete universe");
			}

			// Redirect to universes page after successful deletion
			router.push("/universes");
		} catch (err) {
			console.error("Error deleting universe:", err);
			setError(
				err instanceof Error ? err.message : "Failed to delete universe"
			);
			setDeleteLoading(false);
		}
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
					<Button variant="outline" onClick={() => router.push("/universes")}>
						<ArrowLeft className="mr-2 h-4 w-4" /> Back to Universes
					</Button>
				</CardFooter>
			</Card>
		);
	}

	// No universe found
	if (!universe) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Universe Not Found</CardTitle>
				</CardHeader>
				<CardContent>
					<p>
						The universe you are looking for does not exist or you don't have
						access to it.
					</p>
				</CardContent>
				<CardFooter>
					<Button variant="outline" onClick={() => router.push("/universes")}>
						<ArrowLeft className="mr-2 h-4 w-4" /> Back to Universes
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
			{/* Header with navigation */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
				<div>
					<h1 className="text-2xl font-bold">{universe.name}</h1>
					<p className="text-muted-foreground">
						Created on {formatDate(universe.createdAt)}
					</p>
				</div>
				<div className="mt-4 sm:mt-0 space-x-2 flex">
					<Button variant="outline" onClick={() => router.push("/universes")}>
						<ArrowLeft className="mr-2 h-4 w-4" /> Back
					</Button>
					<Button
						variant="outline"
						onClick={() => router.push(`/universes/${universe.id}/edit`)}
					>
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
									universe &quot;{universe.name}&quot; and all its entities.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction
									onClick={handleDeleteUniverse}
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

			{/* Universe details */}
			<Card>
				<CardHeader>
					<div className="flex justify-between items-center">
						<div>
							<CardTitle>{universe.name}</CardTitle>
							<CardDescription>Slug: {universe.slug}</CardDescription>
						</div>
						<Badge
							variant={universe.status === "active" ? "default" : "secondary"}
							className="ml-2"
						>
							{universe.status.charAt(0).toUpperCase() +
								universe.status.slice(1)}
						</Badge>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					{universe.description && (
						<div>
							<h3 className="text-sm font-medium text-muted-foreground mb-1">
								Description
							</h3>
							<p>{universe.description}</p>
						</div>
					)}

					<div>
						<h3 className="text-sm font-medium text-muted-foreground mb-1">
							Entity Count
						</h3>
						<p className="text-2xl font-bold">{universe.entityCount}</p>
					</div>

					{universe.rules && Object.keys(universe.rules).length > 0 && (
						<div>
							<h3 className="text-sm font-medium text-muted-foreground mb-1">
								Rules
							</h3>
							<pre className="bg-muted p-4 rounded-md text-sm overflow-auto">
								{JSON.stringify(universe.rules, null, 2)}
							</pre>
						</div>
					)}
				</CardContent>
				<CardFooter className="flex justify-between border-t p-6">
					<div className="text-sm text-muted-foreground">
						Last updated: {formatDate(universe.updatedAt)}
					</div>
					<Link href={`/universes/${universe.id}/entities`}>
						<Button>View Entities</Button>
					</Link>
				</CardFooter>
			</Card>
		</>
	);
}
