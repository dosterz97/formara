// File: app/universes/[universeId]/entities/[id]/page.tsx
// This can be reused for both new entities (/new) and editing existing ones (/[id]/edit)
"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Form,
	FormControl,
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
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Define types for entity data
interface Universe {
	id: number;
	name: string;
	description: string;
	slug: string;
	status: string;
	vectorNamespace: string;
	teamId: number;
	rules: Record<string, any>;
	createdAt: string;
	updatedAt: string;
	createdBy: number;
}

interface Entity {
	id: number;
	universeId: number;
	name: string;
	slug: string;
	entityType: EntityType;
	description: string;
	status: EntityStatus;
	basicAttributes: Record<string, any>;
	vectorId: string;
	tags: string[];
	createdAt: string;
	updatedAt: string;
	createdBy: number;
}

type EntityType = "character" | "location" | "item" | "event" | "organization";
type EntityStatus = "active" | "inactive" | "historical";

// Define the schema for entity form validation
const entitySchema = z.object({
	name: z.string().min(2, {
		message: "Name must be at least 2 characters.",
	}),
	slug: z
		.string()
		.min(2, {
			message: "Slug must be at least 2 characters.",
		})
		.regex(/^[a-z0-9-]+$/, {
			message: "Slug can only contain lowercase letters, numbers, and hyphens.",
		}),
	entityType: z.enum(
		["character", "location", "item", "event", "organization"] as const,
		{
			message: "Please select a valid entity type.",
		}
	),
	description: z.string().min(10, {
		message: "Description must be at least 10 characters.",
	}),
	status: z.enum(["active", "inactive", "historical"] as const, {
		message: "Please select a valid status.",
	}),
	basicAttributes: z.string().min(2, {
		message: "Basic attributes are required.",
	}),
	tags: z.string().optional(),
});

// Define type for form values
type EntityFormValues = z.infer<typeof entitySchema>;

// Define props for the page component
interface EntityFormPageProps {
	params: {
		universeId: string;
		id: string;
	};
}

export default function EntityFormPage({ params }: EntityFormPageProps) {
	const router = useRouter();
	const { universeId, id } = params;
	const isEditMode = id !== "new";

	const [loading, setLoading] = useState<boolean>(isEditMode);
	const [submitting, setSubmitting] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [universe, setUniverse] = useState<Universe | null>(null);

	// Initialize form
	const form = useForm<EntityFormValues>({
		resolver: zodResolver(entitySchema),
		defaultValues: {
			name: "",
			slug: "",
			entityType: "character",
			description: "",
			status: "active",
			basicAttributes: "{}",
			tags: "",
		},
	});

	// Fetch entity data if in edit mode
	useEffect(() => {
		async function fetchData() {
			try {
				// First fetch universe to ensure it exists
				const universeResponse = await fetch(`/api/universes/${universeId}`);
				if (!universeResponse.ok) {
					throw new Error("Failed to fetch universe");
				}
				const universeData: Universe = await universeResponse.json();
				setUniverse(universeData);

				// If in edit mode, fetch entity data
				if (isEditMode) {
					const entityResponse = await fetch(`/api/entities/${id}`);
					if (!entityResponse.ok) {
						throw new Error("Failed to fetch entity");
					}
					const entityData: Entity = await entityResponse.json();

					// Populate form
					form.reset({
						name: entityData.name,
						slug: entityData.slug,
						entityType: entityData.entityType,
						description: entityData.description,
						status: entityData.status,
						basicAttributes: JSON.stringify(
							entityData.basicAttributes,
							null,
							2
						),
						tags: entityData.tags?.join(", ") || "",
					});
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : "An error occurred");
			} finally {
				setLoading(false);
			}
		}

		fetchData();
	}, [isEditMode, id, universeId, form]);

	async function onSubmit(data: EntityFormValues) {
		setSubmitting(true);
		setError(null);

		try {
			// Parse JSON fields
			let parsedBasicAttributes: Record<string, any>;
			try {
				parsedBasicAttributes = JSON.parse(data.basicAttributes);
			} catch (e) {
				throw new Error("Basic attributes must be valid JSON");
			}

			// Parse tags
			const tags = data.tags
				? data.tags
						.split(",")
						.map((tag) => tag.trim())
						.filter(Boolean)
				: [];

			// Prepare request data
			const entityData = {
				universeId: parseInt(universeId),
				name: data.name,
				slug: data.slug,
				entityType: data.entityType,
				description: data.description,
				status: data.status,
				basicAttributes: parsedBasicAttributes,
				tags,
			};

			// Determine if creating or updating
			const url = isEditMode ? `/api/entities/${id}` : "/api/entities";
			const method = isEditMode ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(entityData),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || "Failed to save entity");
			}

			// Navigate back to universe page
			router.push(`/universes/${universeId}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setSubmitting(false);
		}
	}

	if (loading) return <div className="p-8 text-center">Loading...</div>;
	if (!universe)
		return (
			<div className="p-8 text-center text-red-500">Universe not found</div>
		);

	return (
		<div className="container mx-auto p-6">
			<Card className="w-full max-w-3xl mx-auto">
				<CardHeader>
					<CardTitle>
						{isEditMode ? "Edit Entity" : "Create New Entity"}
					</CardTitle>
					<CardDescription>
						{isEditMode
							? `Update the details for this entity in ${universe.name}`
							: `Add a new entity to ${universe.name}`}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{error && (
						<div className="bg-red-50 text-red-500 p-3 rounded-md mb-4">
							{error}
						</div>
					)}

					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Name</FormLabel>
											<FormControl>
												<Input {...field} placeholder="Iron Man" />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="slug"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Slug</FormLabel>
											<FormControl>
												<Input {...field} placeholder="iron-man" />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="entityType"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Entity Type</FormLabel>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select entity type" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="character">Character</SelectItem>
													<SelectItem value="location">Location</SelectItem>
													<SelectItem value="item">Item</SelectItem>
													<SelectItem value="event">Event</SelectItem>
													<SelectItem value="organization">
														Organization
													</SelectItem>
												</SelectContent>
											</Select>
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
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select status" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="active">Active</SelectItem>
													<SelectItem value="inactive">Inactive</SelectItem>
													<SelectItem value="historical">Historical</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<FormField
								control={form.control}
								name="description"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Description</FormLabel>
										<FormControl>
											<Textarea
												{...field}
												placeholder="Detailed description of the entity..."
												rows={4}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="tags"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Tags (comma-separated)</FormLabel>
										<FormControl>
											<Input {...field} placeholder="hero, avenger, tech" />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="basicAttributes"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Basic Attributes (JSON)</FormLabel>
										<FormControl>
											<Textarea
												{...field}
												placeholder='{"species": "human", "abilities": ["genius intellect"]}'
												rows={8}
												className="font-mono text-sm"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="flex justify-between pt-4">
								<Button
									type="button"
									variant="outline"
									onClick={() => router.push(`/universes/${universeId}`)}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={submitting}>
									{submitting && (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									)}
									{isEditMode ? "Update Entity" : "Create Entity"}
								</Button>
							</div>
						</form>
					</Form>
				</CardContent>
			</Card>
		</div>
	);
}
