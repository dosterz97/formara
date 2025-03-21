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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Entity, ENTITY_STATUSES, TYPES_OF_ENTITIES } from "@/lib/db/schema";
import { ArrowLeft, Loader2, Save, Trash } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EntityEditPage() {
	const params = useParams();
	const universeSlug = Array.isArray(params.universeSlug)
		? params.universeSlug[0]
		: (params.universeSlug as string);
	const entitySlug = Array.isArray(params.entitySlug)
		? params.entitySlug[0]
		: (params.entitySlug as string);
	const router = useRouter();

	// State
	const [entity, setEntity] = useState<Entity | null>(null);
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		entityType: "",
		status: "active",
		basicAttributes: "{}",
	});
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [formError, setFormError] = useState<string | null>(null);
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
	const [navigationTarget, setNavigationTarget] = useState("");
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);

	// Fetch entity data
	useEffect(() => {
		const fetchEntity = async () => {
			try {
				setLoading(true);
				setError(null);

				const response = await fetch(
					`/api/universes/${universeSlug}/entities/${entitySlug}`
				);

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error || "Failed to fetch entity");
				}

				const data = (await response.json()) as Entity;
				setEntity(data);

				// Initialize form data
				setFormData({
					name: data.name,
					description: data.description || "",
					entityType: data.entityType,
					status: data.status || "active",
					basicAttributes: JSON.stringify(data.basicAttributes || {}, null, 2),
				});
			} catch (err) {
				console.error("Error fetching entity:", err);
				setError(
					err instanceof Error ? err.message : "An unknown error occurred"
				);
			} finally {
				setLoading(false);
			}
		};

		if (universeSlug && entitySlug) {
			fetchEntity();
		}
	}, [universeSlug, entitySlug]);

	// Track form changes
	useEffect(() => {
		if (!entity) return;

		const originalData = {
			name: entity.name,
			description: entity.description || "",
			entityType: entity.entityType,
			status: entity.status,
			basicAttributes: {}, // JSON.stringify(entity.basicAttributes || {}, null, 2),
		};

		// Check if form data has changed
		const hasChanges =
			originalData.name !== formData.name ||
			originalData.description !== formData.description ||
			originalData.entityType !== formData.entityType ||
			originalData.status !== formData.status ||
			originalData.basicAttributes !== formData.basicAttributes;

		setHasUnsavedChanges(hasChanges);
	}, [entity, formData]);

	// Handle form submission
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setFormError(null);

		try {
			setSaving(true);

			// Validate JSON attributes
			let parsedAttributes = {};
			try {
				parsedAttributes = JSON.parse(formData.basicAttributes);
			} catch (err) {
				setFormError("Invalid JSON in attributes field");
				setSaving(false);
				return;
			}

			const updatedEntity = {
				name: formData.name.trim(),
				description: formData.description.trim(),
				entityType: formData.entityType,
				status: formData.status,
				attributes: parsedAttributes,
			};

			const response = await fetch(
				`/api/universes/${universeSlug}/entities/${entitySlug}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(updatedEntity),
				}
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to update entity");
			}

			setHasUnsavedChanges(false);

			// Navigate back to entity detail page
			router.push(`/universes/${universeSlug}/entities/${entitySlug}`);
		} catch (err) {
			console.error("Error updating entity:", err);
			setFormError(
				err instanceof Error ? err.message : "Failed to update entity"
			);
		} finally {
			setSaving(false);
		}
	};

	// Handle entity deletion
	const handleDelete = async () => {
		try {
			setDeleting(true);
			setFormError(null);

			const response = await fetch(
				`/api/universes/${universeSlug}/entities/${entitySlug}`,
				{
					method: "DELETE",
				}
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to delete entity");
			}

			// Navigate back to entities list
			router.push(`/universes/${universeSlug}/entities`);
		} catch (err) {
			console.error("Error deleting entity:", err);
			setFormError(
				err instanceof Error ? err.message : "Failed to delete entity"
			);
			setShowDeleteDialog(false);
			setDeleting(false);
		}
	};

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleTypeChange = (value: string) => {
		setFormData((prev) => ({ ...prev, entityType: value }));
	};

	// Handle navigation with unsaved changes check
	const handleNavigation = (path: string) => {
		if (hasUnsavedChanges) {
			setNavigationTarget(path);
			setShowUnsavedDialog(true);
		} else {
			router.push(path);
		}
	};

	// Loading state
	if (loading) {
		return (
			<div className="container mx-auto py-8">
				<div className="mb-6">
					<Skeleton className="h-8 w-64 mb-2" />
				</div>
				<Card>
					<CardHeader>
						<Skeleton className="h-8 w-3/4 mb-2" />
						<Skeleton className="h-4 w-1/2" />
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-24 w-full" />
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-40 w-full" />
						</div>
					</CardContent>
					<CardFooter>
						<Skeleton className="h-10 w-24" />
					</CardFooter>
				</Card>
			</div>
		);
	}

	// Error state
	if (error) {
		return (
			<div className="container mx-auto py-8">
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
							onClick={() => router.push(`/universes/${universeSlug}/entities`)}
						>
							<ArrowLeft className="mr-2 h-4 w-4" /> Back to Entities
						</Button>
					</CardFooter>
				</Card>
			</div>
		);
	}

	// No entity found
	if (!entity) {
		return (
			<div className="container mx-auto py-8">
				<Card>
					<CardHeader>
						<CardTitle>Entity Not Found</CardTitle>
					</CardHeader>
					<CardContent>
						<p>
							The entity you are looking for does not exist or you don't have
							access to it.
						</p>
					</CardContent>
					<CardFooter>
						<Button
							variant="outline"
							onClick={() => router.push(`/universes/${universeSlug}/entities`)}
						>
							<ArrowLeft className="mr-2 h-4 w-4" /> Back to Entities
						</Button>
					</CardFooter>
				</Card>
			</div>
		);
	}

	return (
		<div className="container mx-auto py-8">
			{/* Unsaved changes dialog */}
			<AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
						<AlertDialogDescription>
							You have unsaved changes. Are you sure you want to leave this
							page?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setShowUnsavedDialog(false)}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								setShowUnsavedDialog(false);
								router.push(navigationTarget);
							}}
						>
							Leave Page
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Delete confirmation dialog */}
			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Entity</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete "{entity.name}"? This action
							cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className="bg-red-600 hover:bg-red-700 text-white"
						>
							{deleting ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
								</>
							) : (
								<>
									<Trash className="mr-2 h-4 w-4" /> Delete Entity
								</>
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Header */}
			<div className="mb-6">
				<Button
					variant="ghost"
					onClick={() =>
						handleNavigation(`/universes/${universeSlug}/entities`)
					}
					className="pl-0 mb-2"
				>
					<ArrowLeft className="mr-2 h-4 w-4" /> Back to Entity Details
				</Button>
				<h1 className="text-2xl font-bold">Edit Entity</h1>
			</div>

			{/* Edit form */}
			<Card>
				<form onSubmit={handleSubmit}>
					<CardHeader>
						<CardTitle>Edit {entity.name}</CardTitle>
						<CardDescription>Update the details of this entity</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* Form error message */}
						{formError && (
							<div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
								<p className="text-red-700">{formError}</p>
							</div>
						)}

						{/* Name field */}
						<div className="space-y-2">
							<Label htmlFor="name">Name *</Label>
							<Input
								id="name"
								name="name"
								value={formData.name}
								onChange={handleInputChange}
								required
							/>
						</div>

						{/* Description field */}
						<div className="space-y-2">
							<Label htmlFor="description">Description</Label>
							<Textarea
								id="description"
								name="description"
								value={formData.description}
								onChange={handleInputChange}
								rows={3}
							/>
						</div>

						{/* Type field */}
						<div className="space-y-2">
							<Label htmlFor="type">Type</Label>
							<Select
								value={formData.entityType}
								onValueChange={handleTypeChange}
							>
								<SelectTrigger id="type">
									<SelectValue placeholder="Select type" />
								</SelectTrigger>
								<SelectContent>
									{TYPES_OF_ENTITIES.map((type) => (
										<SelectItem key={type} value={type}>
											{type.charAt(0).toUpperCase() + type.slice(1)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Status field */}
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="status">Status</Label>
								<div className="flex items-center space-x-2">
									<Switch
										id="status-switch"
										checked={formData.status === "active"}
										onCheckedChange={(checked) =>
											setFormData((prev) => ({
												...prev,
												status: checked ? "active" : "inactive",
											}))
										}
									/>
									<Label htmlFor="status-switch" className="cursor-pointer">
										{formData.status === "active" ? "Active" : "Inactive"}
									</Label>
								</div>
							</div>
							<Select
								value={formData.status}
								onValueChange={(value) =>
									setFormData((prev) => ({ ...prev, status: value }))
								}
							>
								<SelectTrigger id="status">
									<SelectValue placeholder="Select status" />
								</SelectTrigger>
								<SelectContent>
									{ENTITY_STATUSES.map((status) => (
										<SelectItem key={status} value={status}>
											{status.charAt(0).toUpperCase() + status.slice(1)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Attributes field */}
						<div className="space-y-2">
							<Label htmlFor="attributes">Attributes (JSON)</Label>
							<Textarea
								id="attributes"
								name="attributes"
								value={formData.basicAttributes}
								onChange={handleInputChange}
								rows={8}
								className="font-mono text-sm"
							/>
							<p className="text-xs text-muted-foreground">
								Enter attributes as valid JSON. Example: {"{"}"key": "value",
								"nested": {"{"}"property": 123{"}"}
								{"}"}.
							</p>
						</div>
					</CardContent>
					<CardFooter className="flex justify-between border-t p-6">
						<div className="flex gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() =>
									handleNavigation(
										`/universes/${universeSlug}/entities/${entitySlug}`
									)
								}
							>
								Cancel
							</Button>
							<Button
								type="button"
								variant="destructive"
								onClick={() => setShowDeleteDialog(true)}
								disabled={deleting}
							>
								<Trash className="mr-2 h-4 w-4" /> Delete
							</Button>
						</div>
						<Button
							type="submit"
							disabled={saving || deleting}
							className={!hasUnsavedChanges ? "opacity-50" : ""}
						>
							{saving ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
								</>
							) : (
								<>
									<Save className="mr-2 h-4 w-4" /> Save Changes
								</>
							)}
						</Button>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}
