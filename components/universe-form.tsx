"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
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
import { Textarea } from "@/components/ui/textarea";
import { ENTITY_STATUSES, Universe } from "@/lib/db/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { ReactNode, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import slugify from "slugify";
import { toast } from "sonner";
import { z } from "zod";

// Form schema definition
const formSchema = z.object({
	name: z
		.string()
		.min(2, {
			message: "Universe name must be at least 2 characters.",
		})
		.max(100, {
			message: "Universe name must not exceed 100 characters.",
		}),
	description: z.string().optional(),
	status: z.enum(ENTITY_STATUSES).default("active"),
});

type FormValues = z.infer<typeof formSchema>;

type UniverseFormProps = {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: (universe: Universe) => void;
	trigger?: ReactNode;
	universe?: Universe; // Provided when editing
	mode: "create" | "edit";
};

export function UniverseForm({
	isOpen,
	onOpenChange,
	onSuccess,
	trigger,
	universe,
	mode = "create",
}: UniverseFormProps) {
	const [loading, setLoading] = useState<boolean>(false);

	// Initialize form with default values or existing universe data
	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: universe?.name || "",
			description: universe?.description || "",
			status: (universe?.status as any) || "active",
		},
	});

	// Update form values when universe prop changes
	useEffect(() => {
		if (universe && mode === "edit") {
			form.reset({
				name: universe.name,
				description: universe.description || "",
				status: (universe.status as any) || "active",
			});
		}
	}, [universe, form, mode]);

	async function onSubmit(values: FormValues) {
		try {
			setLoading(true);

			// Common data for both create and edit
			const universeData = {
				name: values.name,
				description: values.description || "",
				status: values.status,
			};

			let response;

			if (mode === "create") {
				// For creation mode, add slug
				const slug = slugify(values.name, { lower: true, strict: true });

				// Call the POST API endpoint
				response = await fetch("/api/universes", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						...universeData,
						slug,
					}),
				});
			} else {
				// For edit mode, use PUT/PATCH with the universe ID
				if (!universe) throw new Error("No universe provided for editing");

				response = await fetch(`/api/universe/${universe.id}`, {
					method: "PUT", // or PUT depending on your API
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(universeData),
				});
			}

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || `Failed to ${mode} universe`);
			}

			// Get the created/updated universe from the response
			const resultUniverse = await response.json();

			// Reset form and close modal
			form.reset();
			onOpenChange(false);

			// Call the onSuccess callback with the universe data
			if (onSuccess) {
				onSuccess(resultUniverse);
			}

			// Show success message
			toast.success(
				mode === "create" ? "Universe created" : "Universe updated",
				{
					description: `${values.name} has been successfully ${
						mode === "create" ? "created" : "updated"
					}.`,
				}
			);
		} catch (err) {
			console.error(`Failed to ${mode} universe:`, err);

			toast.error("Error", {
				description:
					err instanceof Error
						? err.message
						: `Failed to ${mode} universe. Please try again.`,
			});
		} finally {
			setLoading(false);
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			{trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>
						{mode === "create" ? "Create New Universe" : "Edit Universe"}
					</DialogTitle>
					<DialogDescription>
						{mode === "create"
							? "Create a new universe to organize your entities, characters, and lore."
							: "Update your universe details."}
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Name</FormLabel>
									<FormControl>
										<Input placeholder="My Universe Name" {...field} />
									</FormControl>
									<FormDescription>
										The name of your universe.
										{mode === "create" &&
											"A URL-friendly slug will be automatically generated."}
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
											placeholder="Describe your universe..."
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
											{ENTITY_STATUSES.map((status) => (
												<SelectItem key={status} value={status}>
													{status.charAt(0).toUpperCase() + status.slice(1)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormDescription>
										The current status of this universe.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter className="pt-4">
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
								disabled={loading}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={loading}>
								{loading
									? "Processing..."
									: mode === "create"
									? "Create Universe"
									: "Save Changes"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
