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
import { Textarea } from "@/components/ui/textarea";
import { Bot } from "@/lib/db/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { ReactNode, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
	name: z
		.string()
		.min(1, "Name is required")
		.max(100, "Name must be less than 100 characters"),
	description: z
		.string()
		.max(500, "Description must be less than 500 characters")
		.optional(),
});

type FormValues = z.infer<typeof formSchema>;

type BotFormProps = {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: (bot: Bot) => void;
	trigger?: ReactNode;
	bot?: Bot; // Provided when editing
	mode: "create" | "edit";
};

export function BotForm({
	isOpen,
	onOpenChange,
	onSuccess,
	trigger,
	bot,
	mode = "create",
}: BotFormProps) {
	const [loading, setLoading] = useState<boolean>(false);

	// Initialize form with default values or existing bot data
	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: bot?.name || "",
			description: bot?.description || "",
		},
	});

	// Update form values when bot prop changes
	useEffect(() => {
		if (bot && mode === "edit") {
			form.reset({
				name: bot.name,
				description: bot.description || "",
			});
		}
	}, [bot, form, mode]);

	async function onSubmit(values: FormValues) {
		try {
			setLoading(true);

			const response = await fetch(
				mode === "create" ? "/api/bots" : `/api/bots/${bot?.id}`,
				{
					method: mode === "create" ? "POST" : "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(values),
				}
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || "Something went wrong");
			}

			const data = await response.json();

			if (onSuccess) {
				onSuccess(data);
			}

			onOpenChange(false);
			form.reset();
		} catch (error) {
			console.error("Error submitting form:", error);
			// You might want to show an error message to the user here
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
						{mode === "create" ? "Create New Bot" : "Edit Bot"}
					</DialogTitle>
					<DialogDescription>
						{mode === "create"
							? "Create a new bot with custom behavior and personality."
							: "Update your bot's details and behavior."}
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
										<Input placeholder="My Bot Name" {...field} />
									</FormControl>
									<FormDescription>
										The name of your bot.
										{mode === "create" &&
											" A URL-friendly slug will be automatically generated."}
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
									? "Create Bot"
									: "Save Changes"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
