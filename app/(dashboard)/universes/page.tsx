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
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import slugify from "slugify";
import { toast, Toaster } from "sonner";
import { z } from "zod";

// Import enums from your schema
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
	rules: z
		.string()
		.optional()
		.transform((val) => (val ? JSON.parse(val) : {})),
});

type FormValues = z.infer<typeof formSchema>;

export default function HomePage() {
	const [universes, setUniverses] = useState<Universe[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);

	// Load universes from API when component mounts
	useEffect(() => {
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
				toast.error("Error loading universes");
			} finally {
				setLoading(false);
			}
		};

		fetchUniverses();
	}, []);

	// Initialize React Hook Form
	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			description: "",
			status: "active",
			rules: "",
		},
	});

	async function onSubmit(values: FormValues) {
		try {
			// Generate slug from name
			const slug = slugify(values.name, { lower: true, strict: true });

			// Create the universe object with required fields
			const universeData = {
				name: values.name,
				slug,
				description: values.description || "",
				status: values.status,
				rules: values.rules,
			};

			// Set loading state
			setLoading(true);

			// Call the POST API endpoint
			const response = await fetch("/api/universes", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(universeData),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to create universe");
			}

			// Get the created universe from the response
			const newUniverse = await response.json();

			// Add the new universe to the local state
			setUniverses([...universes, newUniverse]);

			// Reset form and close modal
			form.reset();
			setIsModalOpen(false);

			// Show success message with Sonner
			toast.success("Universe created", {
				description: `${values.name} has been successfully created.`,
			});
		} catch (err) {
			console.error("Failed to create universe:", err);
			setError("Failed to create universe. Please try again.");

			toast.error("Error", {
				description:
					err instanceof Error
						? err.message
						: "Failed to create universe. Please try again.",
			});
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="container mx-auto p-6">
			{/* Add Sonner component to the layout */}
			<Toaster position="top-right" />

			<div className="flex justify-between items-center mb-6">
				<h1 className="text-3xl font-bold">Home</h1>

				<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
					<DialogTrigger asChild>
						<Button>Create New Universe</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-[500px]">
						<DialogHeader>
							<DialogTitle>Create New Universe</DialogTitle>
							<DialogDescription>
								Create a new universe to organize your entities, characters, and
								lore.
							</DialogDescription>
						</DialogHeader>

						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(onSubmit)}
								className="space-y-4"
							>
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
												The name of your universe. A URL-friendly slug will be
												automatically generated.
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

								<FormField
									control={form.control}
									name="rules"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Rules (JSON)</FormLabel>
											<FormControl>
												<Textarea
													placeholder='{"allowTimeTravel": true, "magicSystem": "elemental"}'
													className="resize-none font-mono text-sm"
													{...field}
												/>
											</FormControl>
											<FormDescription>
												Optional universe-specific rules in JSON format.
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<DialogFooter className="pt-4">
									<Button
										type="button"
										variant="outline"
										onClick={() => setIsModalOpen(false)}
									>
										Cancel
									</Button>
									<Button type="submit">Create Universe</Button>
								</DialogFooter>
							</form>
						</Form>
					</DialogContent>
				</Dialog>
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
						<div key={universe.id} className="border rounded-lg p-6 shadow-sm">
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
									<Link href={`/universes/${universe.id}`}>
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
		</div>
	);
}
