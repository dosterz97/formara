"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { Knowledge } from "@/lib/db/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import slugify from "slugify";
import { z } from "zod";

// Define the Zod schema
const knowledgeSchema = z.object({
	name: z.string().min(1, "Name is required"),
	content: z.string().min(1, "Content is required"),
	manualEntry: z.boolean().default(true),
	createdBy: z.string().uuid().optional(),
});

type KnowledgeFormValues = z.infer<typeof knowledgeSchema>;

export function ManualKnowledgeEntryForm({
	botId,
	initialData,
	onSuccess,
}: {
	botId: string;
	initialData?: Knowledge;
	onSuccess?: (updatedData?: Knowledge) => void;
}) {
	const [error, setError] = useState<string | null>(null);
	const isEditing = !!initialData;

	const form = useForm<KnowledgeFormValues>({
		resolver: zodResolver(knowledgeSchema),
		defaultValues: {
			manualEntry: true,
			name: "",
			content: "",
		},
	});

	// Update form when initialData changes
	useEffect(() => {
		if (initialData) {
			form.reset({
				name: initialData.name,
				content: initialData.content || "",
				manualEntry: initialData.manualEntry,
			});
		} else {
			form.reset({
				manualEntry: true,
				name: "",
				content: "",
			});
		}
	}, [initialData, form]);

	const onSubmit = async (data: KnowledgeFormValues) => {
		setError(null);
		try {
			let result;

			if (isEditing) {
				// Update existing knowledge
				console.log("Updating knowledge:", initialData.id, data);
				const res = await fetch(`/api/knowledge/${initialData.id}`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				});
				if (!res.ok) {
					const errorData = await res.json();
					throw new Error(
						errorData.error || "Failed to update knowledge entry"
					);
				}
				result = await res.json();
				console.log("Update successful:", result);
			} else {
				// Create new knowledge
				const slug = slugify(data.name, { lower: true, strict: true });
				const res = await fetch("/api/knowledge", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ ...data, botId, slug }),
				});
				if (!res.ok) {
					const errorData = await res.json();
					throw new Error(errorData.error || "Failed to add knowledge entry");
				}
				result = await res.json();
			}

			if (!isEditing) {
				form.reset();
			}
			onSuccess?.(result);
		} catch (err: any) {
			console.error("Form submission error:", err);
			setError(err.message || "Unknown error");
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				{error && (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Name</FormLabel>
							<FormControl>
								<Input placeholder="Enter knowledge name" {...field} />
							</FormControl>
							<FormDescription>
								A descriptive name for this knowledge entry
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="content"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Content</FormLabel>
							<FormControl>
								<Textarea
									placeholder="Enter the knowledge content..."
									className="min-h-[120px]"
									{...field}
								/>
							</FormControl>
							<FormDescription>
								The actual content/information for this knowledge entry
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<Button
					type="submit"
					disabled={form.formState.isSubmitting}
					className="w-full"
				>
					{form.formState.isSubmitting && (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					)}
					{isEditing ? "Update Knowledge Entry" : "Add Knowledge Entry"}
				</Button>
			</form>
		</Form>
	);
}
