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
import { ArrowLeft, Loader2, Save, Trash, Volume2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Define voice interface
interface Voice {
	voice_id: string;
	name: string;
	preview_url?: string;
	category?: string;
}

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
		voiceId: "",
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
	const [voices, setVoices] = useState<Voice[]>([]);
	const [loadingVoices, setLoadingVoices] = useState(false);
	const [audioPreview, setAudioPreview] = useState<string | null>(null);
	const [playingPreview, setPlayingPreview] = useState(false);

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
					voiceId: data.voiceId || "", // Add voice ID field
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

	// Fetch available voices
	useEffect(() => {
		const fetchVoices = async () => {
			if (formData.entityType !== "character") return;

			try {
				setLoadingVoices(true);
				const response = await fetch("/api/voices");

				if (!response.ok) {
					throw new Error("Failed to fetch voices");
				}

				const data = await response.json();
				setVoices(data);
			} catch (err) {
				console.error("Error fetching voices:", err);
			} finally {
				setLoadingVoices(false);
			}
		};

		fetchVoices();
	}, [formData.entityType]);

	// Track form changes
	useEffect(() => {
		if (!entity) return;

		const originalData = {
			name: entity.name,
			description: entity.description || "",
			entityType: entity.entityType,
			status: entity.status,
			basicAttributes: {}, // JSON.stringify(entity.basicAttributes || {}, null, 2),
			voiceId: entity.voiceId || "", // Add voice ID to track changes
		};

		// Check if form data has changed
		const hasChanges =
			originalData.name !== formData.name ||
			originalData.description !== formData.description ||
			originalData.entityType !== formData.entityType ||
			originalData.status !== formData.status ||
			originalData.basicAttributes !== formData.basicAttributes ||
			originalData.voiceId !== formData.voiceId; // Check voice ID changes

		setHasUnsavedChanges(hasChanges);
	}, [entity, formData]);

	// Handle playing voice preview
	const playVoicePreview = async (voiceId: string) => {
		const voice = voices.find((v) => v.voice_id === voiceId);
		if (!voice || !voice.preview_url) return;

		setPlayingPreview(true);
		setAudioPreview(voice.preview_url);

		const audio = new Audio(voice.preview_url);
		audio.onended = () => setPlayingPreview(false);
		audio.play().catch((err) => {
			console.error("Error playing preview:", err);
			setPlayingPreview(false);
		});
	};

	// Handle form submission
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setFormError(null);

		if (!entity) return toast.error("Missing entity! Unable to update.");

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
				voiceId: formData.entityType === "character" ? formData.voiceId : null, // Only set voice for characters
			};

			console.log(updatedEntity);

			const response = await fetch(`/api/entities/${entity.id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(updatedEntity),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to update entity");
			}

			setHasUnsavedChanges(false);

			// Navigate back to entity detail page
			router.push(
				`/dashboard/universes/${universeSlug}/entities/${entitySlug}`
			);
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
		if (!entity) return toast.error("Entity is missing! Unable to delete.");

		try {
			setDeleting(true);
			setFormError(null);

			const response = await fetch(`/api/entities/${entity.id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to delete entity");
			}

			// Navigate back to entities list
			router.push(`/dashboard/universes/${universeSlug}/entities`);
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
		setFormData((prev) => ({
			...prev,
			entityType: value,
			// Clear voice ID if changing away from character type
			voiceId: value === "character" ? prev.voiceId : "",
		}));
	};

	const handleVoiceChange = (voiceId: string) => {
		setFormData((prev) => ({ ...prev, voiceId }));
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
							onClick={() =>
								router.push(`/dashboard/universes/${universeSlug}/entities`)
							}
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
							onClick={() =>
								router.push(`/dashboard/universes/${universeSlug}/entities`)
							}
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
			{/* Audio element for previews */}
			{audioPreview && <audio src={audioPreview} className="hidden" />}

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
						handleNavigation(`/dashboard/universes/${universeSlug}/entities`)
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

						{/* Voice selection (only for character type) */}
						{formData.entityType === "character" && (
							<div className="space-y-2">
								<Label htmlFor="voice">Voice</Label>
								<div className="flex space-x-2">
									<Select
										value={formData.voiceId || "none"}
										onValueChange={(value) => {
											// Convert "none" to null/undefined when storing in state
											handleVoiceChange(value === "none" ? "" : value);
										}}
										disabled={loadingVoices}
									>
										<SelectTrigger id="voice" className="flex-1">
											<SelectValue
												placeholder={
													loadingVoices ? "Loading voices..." : "Select a voice"
												}
											/>
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="none">No voice</SelectItem>
											{voices.map((voice) => (
												<SelectItem key={voice.voice_id} value={voice.voice_id}>
													{voice.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>

									{formData.voiceId && (
										<Button
											type="button"
											variant="outline"
											size="icon"
											disabled={playingPreview || !formData.voiceId}
											onClick={() => playVoicePreview(formData.voiceId)}
											title="Preview voice"
										>
											{playingPreview ? (
												<Loader2 className="h-4 w-4 animate-spin" />
											) : (
												<Volume2 className="h-4 w-4" />
											)}
										</Button>
									)}
								</div>
								<p className="text-xs text-muted-foreground">
									Select a voice for this character to enable audio responses.
								</p>
							</div>
						)}

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
							<Label htmlFor="basicAttributes">Attributes (JSON)</Label>
							<Textarea
								id="basicAttributes"
								name="basicAttributes"
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
										`/dashboard/universes/${universeSlug}/entities/${entitySlug}`
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
