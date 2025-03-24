"use client";

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
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Entity, TYPES_OF_ENTITIES, Universe } from "@/lib/db/schema";
import { ChatBubbleIcon } from "@radix-ui/react-icons";
import {
	ArrowDown,
	ArrowLeft,
	ArrowUp,
	ArrowUpDown,
	ChevronLeft,
	ChevronRight,
	Filter,
	Loader2,
	Plus,
	Search,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface PaginationInfo {
	total: number;
	limit: number;
	offset: number;
	hasMore: boolean;
}

const ENTITY_STATUSES = ["active", "inactive", "draft", "archived"];

export default function EntitiesPage() {
	const params = useParams();
	const searchParams = useSearchParams();
	const universeSlug = Array.isArray(params.universeSlug)
		? params.universeSlug[0]
		: (params.universeSlug as string);
	const router = useRouter();

	// State
	const [entities, setEntities] = useState<Entity[]>([]);
	const [universe, setUniverse] = useState<Universe | null>(null);
	const [pagination, setPagination] = useState<PaginationInfo>({
		total: 0,
		limit: parseInt(searchParams.get("limit") || "10"),
		offset: parseInt(searchParams.get("offset") || "0"),
		hasMore: false,
	});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Form states
	const [searchTerm, setSearchTerm] = useState(
		searchParams.get("search") || ""
	);
	const [selectedType, setSelectedType] = useState(
		searchParams.get("type") || ""
	);
	const [selectedStatus, setSelectedStatus] = useState(
		searchParams.get("status") || ""
	);
	const [sortField, setSortField] = useState(
		searchParams.get("sortField") || "createdAt"
	);
	const [sortOrder, setSortOrder] = useState(
		searchParams.get("sortOrder") || "desc"
	);

	// Entity creation
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [newEntity, setNewEntity] = useState({
		name: "",
		description: "",
		entityType: "character",
		status: "active",
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [customType, setCustomType] = useState("");

	// Get query params
	const limit = searchParams.get("limit")
		? (searchParams.get("limit") as string)
		: 10;
	const offset = searchParams.get("offset")
		? (searchParams.get("offset") as string)
		: 0;

	// Calculate current page - make sure pagination values are defined
	const currentPage = pagination
		? Math.floor(pagination.offset / pagination.limit) + 1
		: 1;
	const totalPages = pagination
		? Math.ceil(pagination.total / pagination.limit)
		: 1;

	// Fetch universe data
	useEffect(() => {
		const fetchUniverse = async () => {
			try {
				const response = await fetch(`/api/universes/${universeSlug}`);

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error || "Failed to fetch universe");
				}

				const data = await response.json();

				// @ts-expect-error shhh
				setUniverse({
					id: data.id,
					name: data.name,
					slug: data.slug,
				});
			} catch (err) {
				console.error("Error fetching universe:", err);
				setError(
					err instanceof Error ? err.message : "An unknown error occurred"
				);
			}
		};

		if (universeSlug) {
			fetchUniverse();
		}
	}, [universeSlug]);

	// Fetch entities data
	useEffect(() => {
		const fetchEntities = async () => {
			try {
				setLoading(true);
				setError(null);

				console.log("fetching...");
				// Build query params
				const queryParams = new URLSearchParams({
					limit: String(limit),
					offset: String(offset),
				});

				if (searchParams.get("search")) {
					queryParams.set("search", searchParams.get("search") as string);
				}

				if (searchParams.get("type")) {
					queryParams.set("type", searchParams.get("type") as string);
				}

				if (searchParams.get("status")) {
					queryParams.set("status", searchParams.get("status") as string);
				}

				if (searchParams.get("sortField")) {
					queryParams.set("sortField", searchParams.get("sortField") as string);
				}

				if (searchParams.get("sortOrder")) {
					queryParams.set("sortOrder", searchParams.get("sortOrder") as string);
				}

				const response = await fetch(
					`/api/universes/${universeSlug}/entities?${queryParams}`
				);

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error || "Failed to fetch entities");
				}

				const data = await response.json();
				// console.log(data);
				setEntities(data.entities);
				setPagination(data.pagination);
			} catch (err) {
				console.error("Error fetching entities:", err);
				setError(
					err instanceof Error ? err.message : "An unknown error occurred"
				);
			} finally {
				setLoading(false);
			}
		};

		console.log("universeSlug", universeSlug);
		if (universeSlug) {
			fetchEntities();
		}
	}, [universeSlug, searchParams]);

	// Apply filters and sorting
	const applyFilters = () => {
		const params = new URLSearchParams();

		if (searchTerm) params.set("search", searchTerm);
		if (selectedType) params.set("type", selectedType);
		if (selectedStatus) params.set("status", selectedStatus);
		params.set("sortField", sortField);
		params.set("sortOrder", sortOrder);
		params.set("offset", "0"); // Reset pagination when filtering
		params.set("limit", String(pagination?.limit || 10));

		router.push(
			`/dashboard/universes/${universeSlug}/entities?${params.toString()}`
		);
	};

	// Clear all filters
	const clearFilters = () => {
		setSearchTerm("");
		setSelectedType("");
		setSelectedStatus("");
		setSortField("createdAt");
		setSortOrder("desc");

		router.push(`/dashboard/universes/${universeSlug}/entities`);
	};

	// Handle pagination
	const goToPage = (page: number) => {
		if (!pagination || page < 1 || page > totalPages) return;

		const newOffset = (page - 1) * pagination.limit;
		const params = new URLSearchParams(searchParams.toString());
		params.set("offset", String(newOffset));
		params.set("limit", String(pagination.limit));

		router.push(
			`/dashboard/universes/${universeSlug}/entities?${params.toString()}`
		);
	};

	// Handle sorting
	const handleSort = (field: string) => {
		let newOrder = "desc";

		if (field === sortField) {
			newOrder = sortOrder === "desc" ? "asc" : "desc";
		}

		setSortField(field);
		setSortOrder(newOrder);

		const params = new URLSearchParams(searchParams.toString());
		params.set("sortField", field);
		params.set("sortOrder", newOrder);
		params.set("offset", "0"); // Reset pagination when sorting

		router.push(
			`/dashboard/universes/${universeSlug}/entities?${params.toString()}`
		);
	};

	// Handle entity creation
	const handleCreateEntity = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!newEntity.name.trim()) {
			return;
		}

		// If using custom type, update the entity type
		const entityToCreate = {
			...newEntity,
			entityType:
				newEntity.entityType === "custom" ? customType : newEntity.entityType,
		};

		try {
			setIsSubmitting(true);

			const response = await fetch(`/api/universes/${universeSlug}/entities`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(entityToCreate),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to create entity");
			}

			// Reset form and close dialog
			setNewEntity({
				name: "",
				description: "",
				entityType: "character",
				status: "active",
			});
			setCustomType("");
			setIsCreateDialogOpen(false);

			// Refresh entities (maintain current filters)
			router.refresh();
		} catch (err) {
			console.error("Error creating entity:", err);
			setError(err instanceof Error ? err.message : "Failed to create entity");
		} finally {
			setIsSubmitting(false);
		}
	};

	// Format date
	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	// Handle entity type display
	const getEntityTypeDisplay = (type: string) => {
		return type.charAt(0).toUpperCase() + type.slice(1);
	};

	// Get sort icon
	const getSortIcon = (field: string) => {
		if (field !== sortField) {
			return <ArrowUpDown className="h-4 w-4" />;
		}

		return sortOrder === "asc" ? (
			<ArrowUp className="h-4 w-4" />
		) : (
			<ArrowDown className="h-4 w-4" />
		);
	};

	// Loading state
	if (loading && entities.length === 0) {
		return (
			<div className="container mx-auto py-8">
				<div className="flex items-center mb-6">
					<Skeleton className="h-8 w-64" />
				</div>
				<Card>
					<CardHeader>
						<Skeleton className="h-8 w-1/3 mb-2" />
						<Skeleton className="h-4 w-1/4" />
					</CardHeader>
					<CardContent>
						<div className="flex justify-between mb-6">
							<Skeleton className="h-10 w-64" />
							<Skeleton className="h-10 w-32" />
						</div>
						<Skeleton className="h-64 w-full" />
					</CardContent>
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
								router.push(`/dashboard/universes/${universeSlug}`)
							}
						>
							<ArrowLeft className="mr-2 h-4 w-4" /> Back to Universe
						</Button>
					</CardFooter>
				</Card>
			</div>
		);
	}

	return (
		<div className="container mx-auto py-8">
			{/* Header with universe info */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
				<div>
					<Button
						variant="ghost"
						onClick={() => router.push(`/dashboard/universes/${universeSlug}`)}
						className="pl-0 mb-2"
					>
						<ArrowLeft className="mr-2 h-4 w-4" /> Back to{" "}
						{universe?.name || "Universe"}
					</Button>
					<h1 className="text-2xl font-bold">Entities</h1>
				</div>

				{/* Create entity button */}
				<Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
					<DialogTrigger asChild>
						<Button>
							<Plus className="mr-2 h-4 w-4" /> Create Entity
						</Button>
					</DialogTrigger>
					<DialogContent>
						<form onSubmit={handleCreateEntity}>
							<DialogHeader>
								<DialogTitle>Create New Entity</DialogTitle>
								<DialogDescription>
									Add a new entity to your {universe?.name} universe.
								</DialogDescription>
							</DialogHeader>
							<div className="grid gap-4 py-4">
								<div className="grid gap-2">
									<Label htmlFor="name">Name *</Label>
									<Input
										id="name"
										value={newEntity.name}
										onChange={(e) =>
											setNewEntity({ ...newEntity, name: e.target.value })
										}
										placeholder="Entity name"
										required
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="description">Description</Label>
									<Textarea
										id="description"
										value={newEntity.description}
										onChange={(e) =>
											setNewEntity({
												...newEntity,
												description: e.target.value,
											})
										}
										placeholder="Entity description"
										rows={3}
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="type">Type</Label>
									<Select
										value={newEntity.entityType}
										defaultValue="character"
										onValueChange={(value) =>
											setNewEntity({ ...newEntity, entityType: value })
										}
									>
										<SelectTrigger>
											<SelectValue placeholder="character" />
										</SelectTrigger>
										<SelectContent>
											{TYPES_OF_ENTITIES.map((type) => (
												<SelectItem key={type} value={type}>
													{type}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="status">Status</Label>
									<Select
										value={newEntity.status}
										onValueChange={(value) =>
											setNewEntity({ ...newEntity, status: value })
										}
									>
										<SelectTrigger>
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
							</div>
							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => setIsCreateDialogOpen(false)}
								>
									Cancel
								</Button>
								<Button
									type="submit"
									disabled={isSubmitting || !newEntity.name.trim()}
								>
									{isSubmitting ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
											Creating...
										</>
									) : (
										"Create Entity"
									)}
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			{/* Entities list */}
			<Card>
				<CardHeader>
					<CardTitle>Entities in {universe?.name}</CardTitle>
					<CardDescription>
						{pagination.total} {pagination.total === 1 ? "entity" : "entities"}{" "}
						in this universe
					</CardDescription>
				</CardHeader>
				<CardContent>
					{/* Search and Filter Bar */}
					<div className="flex flex-col sm:flex-row gap-4 mb-6">
						{/* Search Box */}
						<div className="relative flex-1">
							<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								type="search"
								placeholder="Search entities..."
								className="pl-8"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && applyFilters()}
							/>
						</div>

						{/* Mobile: Filter Button */}
						<div className="sm:hidden">
							<Sheet>
								<SheetTrigger asChild>
									<Button variant="outline" className="w-full">
										<Filter className="mr-2 h-4 w-4" /> Filters
									</Button>
								</SheetTrigger>
								<SheetContent>
									<SheetHeader>
										<SheetTitle>Filter Entities</SheetTitle>
										<SheetDescription>
											Apply filters to narrow down your results
										</SheetDescription>
									</SheetHeader>
									<div className="space-y-4 py-4">
										<div className="space-y-2">
											<Label htmlFor="mobile-type">Type</Label>
											<Select
												value={selectedType}
												onValueChange={setSelectedType}
											>
												<SelectTrigger id="mobile-type">
													<SelectValue placeholder="All types" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="">All types</SelectItem>
													{TYPES_OF_ENTITIES.map((type) => (
														<SelectItem key={type} value={type}>
															{type}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div className="space-y-2">
											<Label htmlFor="mobile-status">Status</Label>
											<Select
												value={selectedStatus}
												onValueChange={setSelectedStatus}
											>
												<SelectTrigger id="mobile-status">
													<SelectValue placeholder="All statuses" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="">All statuses</SelectItem>
													{ENTITY_STATUSES.map((status) => (
														<SelectItem key={status} value={status}>
															{status.charAt(0).toUpperCase() + status.slice(1)}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div className="space-y-2">
											<Label htmlFor="mobile-sort">Sort By</Label>
											<Select
												value={`${sortField}-${sortOrder}`}
												onValueChange={(value) => {
													const [field, order] = value.split("-");
													setSortField(field);
													setSortOrder(order);
												}}
											>
												<SelectTrigger id="mobile-sort">
													<SelectValue placeholder="Sort by" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="name-asc">Name (A-Z)</SelectItem>
													<SelectItem value="name-desc">Name (Z-A)</SelectItem>
													<SelectItem value="createdAt-desc">
														Newest first
													</SelectItem>
													<SelectItem value="createdAt-asc">
														Oldest first
													</SelectItem>
													<SelectItem value="updatedAt-desc">
														Recently updated
													</SelectItem>
													<SelectItem value="type-asc">Type (A-Z)</SelectItem>
													<SelectItem value="status-asc">
														Status (A-Z)
													</SelectItem>
												</SelectContent>
											</Select>
										</div>
										<div className="flex gap-2 mt-4">
											<Button
												variant="outline"
												className="flex-1"
												onClick={clearFilters}
											>
												Clear
											</Button>
											<Button
												className="flex-1"
												onClick={() => {
													applyFilters();
													document
														.querySelector<HTMLButtonElement>(
															"[data-sheet-close]"
														)
														?.click();
												}}
											>
												Apply Filters
											</Button>
										</div>
									</div>
								</SheetContent>
							</Sheet>
						</div>

						{/* Desktop: Filter Dropdown */}
						<div className="hidden sm:flex gap-2">
							<Popover>
								<PopoverTrigger asChild>
									<Button variant="outline">
										<Filter className="mr-2 h-4 w-4" /> Filters
										{(selectedType || selectedStatus) && (
											<Badge
												variant="secondary"
												className="ml-2 rounded-sm px-1"
											>
												{(selectedType ? 1 : 0) + (selectedStatus ? 1 : 0)}
											</Badge>
										)}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-80">
									<div className="space-y-4">
										<h4 className="font-medium">Filter Entities</h4>
										<div className="space-y-2">
											<Label htmlFor="type">Type</Label>
											<Select
												value={selectedType}
												onValueChange={setSelectedType}
											>
												<SelectTrigger id="type">
													<SelectValue placeholder="All types" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="">All types</SelectItem>
													{TYPES_OF_ENTITIES.map((type) => (
														<SelectItem key={type} value={type}>
															{type}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div className="space-y-2">
											<Label htmlFor="status">Status</Label>
											<Select
												value={selectedStatus}
												onValueChange={setSelectedStatus}
											>
												<SelectTrigger id="status">
													<SelectValue placeholder="All statuses" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="">All statuses</SelectItem>
													{ENTITY_STATUSES.map((status) => (
														<SelectItem key={status} value={status}>
															{status.charAt(0).toUpperCase() + status.slice(1)}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div className="flex gap-2">
											<Button
												variant="outline"
												className="flex-1"
												onClick={clearFilters}
											>
												Clear
											</Button>
											<Button
												className="flex-1"
												onClick={() => {
													applyFilters();
													document
														.querySelector<HTMLButtonElement>(
															"[data-popover-close]"
														)
														?.click();
												}}
											>
												Apply Filters
											</Button>
										</div>
									</div>
								</PopoverContent>
							</Popover>

							<Select
								value={`${sortField}-${sortOrder}`}
								onValueChange={(value) => {
									const [field, order] = value.split("-");
									setSortField(field);
									setSortOrder(order);

									const params = new URLSearchParams(searchParams.toString());
									params.set("sortField", field);
									params.set("sortOrder", order);
									params.set("offset", "0");

									router.push(
										`/dashboard/universes/${universeSlug}/entities?${params.toString()}`
									);
								}}
							>
								<SelectTrigger className="w-[180px]">
									<SelectValue placeholder="Sort by" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="name-asc">Name (A-Z)</SelectItem>
									<SelectItem value="name-desc">Name (Z-A)</SelectItem>
									<SelectItem value="createdAt-desc">Newest first</SelectItem>
									<SelectItem value="createdAt-asc">Oldest first</SelectItem>
									<SelectItem value="updatedAt-desc">
										Recently updated
									</SelectItem>
									<SelectItem value="type-asc">Type (A-Z)</SelectItem>
									<SelectItem value="status-asc">Status (A-Z)</SelectItem>
								</SelectContent>
							</Select>

							<Button onClick={applyFilters}>Search</Button>
						</div>
					</div>

					{/* Active filters display */}
					{(searchTerm || selectedType || selectedStatus) && (
						<div className="flex flex-wrap gap-2 mb-4">
							{searchTerm && (
								<Badge variant="secondary" className="flex items-center gap-1">
									Search: {searchTerm}
									<Button
										variant="ghost"
										size="icon"
										className="h-4 w-4 ml-1 p-0"
										onClick={() => {
											setSearchTerm("");
											const params = new URLSearchParams(
												searchParams.toString()
											);
											params.delete("search");
											router.push(
												`/dashboard/universes/${universeSlug}/entities?${params.toString()}`
											);
										}}
									>
										<span className="sr-only">Remove</span>×
									</Button>
								</Badge>
							)}

							{selectedType && (
								<Badge variant="secondary" className="flex items-center gap-1">
									Type: {getEntityTypeDisplay(selectedType)}
									<Button
										variant="ghost"
										size="icon"
										className="h-4 w-4 ml-1 p-0"
										onClick={() => {
											setSelectedType("");
											const params = new URLSearchParams(
												searchParams.toString()
											);
											params.delete("type");
											router.push(
												`/dashboard/universes/${universeSlug}/entities?${params.toString()}`
											);
										}}
									>
										<span className="sr-only">Remove</span>×
									</Button>
								</Badge>
							)}

							{selectedStatus && (
								<Badge variant="secondary" className="flex items-center gap-1">
									Status:{" "}
									{selectedStatus.charAt(0).toUpperCase() +
										selectedStatus.slice(1)}
									<Button
										variant="ghost"
										size="icon"
										className="h-4 w-4 ml-1 p-0"
										onClick={() => {
											setSelectedStatus("");
											const params = new URLSearchParams(
												searchParams.toString()
											);
											params.delete("status");
											router.push(
												`/dashboard/universes/${universeSlug}/entities?${params.toString()}`
											);
										}}
									>
										<span className="sr-only">Remove</span>×
									</Button>
								</Badge>
							)}

							<Button
								variant="ghost"
								size="sm"
								className="h-7 px-2 text-xs"
								onClick={clearFilters}
							>
								Clear all filters
							</Button>
						</div>
					)}

					{/* Entities table */}
					{entities.length > 0 ? (
						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-[40%]">
											<Button
												variant="ghost"
												className="p-0 font-bold hover:bg-transparent"
												onClick={() => handleSort("name")}
											>
												Name {getSortIcon("name")}
											</Button>
										</TableHead>
										<TableHead>
											<Button
												variant="ghost"
												className="p-0 font-bold hover:bg-transparent"
												onClick={() => handleSort("type")}
											>
												Type {getSortIcon("type")}
											</Button>
										</TableHead>
										<TableHead className="hidden md:table-cell">
											<Button
												variant="ghost"
												className="p-0 font-bold hover:bg-transparent"
												onClick={() => handleSort("createdAt")}
											>
												Created {getSortIcon("createdAt")}
											</Button>
										</TableHead>
										<TableHead>
											<Button
												variant="ghost"
												className="p-0 font-bold hover:bg-transparent"
												onClick={() => handleSort("status")}
											>
												Status {getSortIcon("status")}
											</Button>
										</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{entities.map((entity) => (
										<TableRow
											key={entity.id}
											className="group hover:bg-muted/50"
										>
											<TableCell className="font-medium">
												<Link
													href={`/dashboard/universes/${universeSlug}/entities/${entity.slug}`}
													className="hover:underline text-blue-600 hover:text-blue-800"
												>
													{entity.name}
												</Link>
												{entity.description && (
													<p className="text-sm text-muted-foreground truncate max-w-xs">
														{entity.description}
													</p>
												)}
											</TableCell>
											<TableCell>{entity.entityType ?? "undefined"}</TableCell>
											<TableCell className="hidden md:table-cell">
												{formatDate(entity.createdAt.toString())}
											</TableCell>
											<TableCell>
												<Badge variant={"default"}>
													{entity.status &&
														entity.status.charAt(0).toUpperCase() +
															entity.status.slice(1)}
												</Badge>
											</TableCell>
											<TableCell className="text-right">
												<div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
													<Button
														variant="ghost"
														size="icon"
														onClick={() => router.push(`/chat/${entity.id}`)}
													>
														<ChatBubbleIcon className="h-4 w-4" />
														<span className="sr-only">Chat</span>
													</Button>

													<Button
														variant="ghost"
														size="icon"
														onClick={() =>
															router.push(
																`/dashboard/universes/${universeSlug}/entities/${entity.slug}`
															)
														}
													>
														<ChevronRight className="h-4 w-4" />
														<span className="sr-only">View</span>
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>

							{/* Pagination */}
							{pagination && totalPages > 1 && (
								<div className="flex items-center justify-between p-4 border-t">
									<div className="text-sm text-muted-foreground">
										Showing {pagination.offset + 1}-
										{Math.min(
											pagination.offset + entities.length,
											pagination.total
										)}{" "}
										of {pagination.total}
									</div>
									<div className="flex items-center space-x-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => goToPage(currentPage - 1)}
											disabled={currentPage === 1}
										>
											<ChevronLeft className="h-4 w-4" />
											<span className="sr-only">Previous</span>
										</Button>
										<div className="text-sm">
											Page {currentPage} of {totalPages}
										</div>
										<Button
											variant="outline"
											size="sm"
											onClick={() => goToPage(currentPage + 1)}
											disabled={currentPage === totalPages}
										>
											<ChevronRight className="h-4 w-4" />
											<span className="sr-only">Next</span>
										</Button>
									</div>
								</div>
							)}
						</div>
					) : (
						<div className="flex flex-col items-center justify-center py-12 px-4 text-center">
							{loading ? (
								<Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
							) : (
								<>
									<div className="rounded-full bg-muted p-3 mb-4">
										<Plus className="h-6 w-6 text-muted-foreground" />
									</div>
									<h3 className="text-lg font-medium mb-2">
										No entities found
									</h3>
									<p className="text-muted-foreground mb-4 max-w-md">
										{searchTerm || selectedType || selectedStatus
											? `No entities match your search criteria.`
											: `This universe doesn't have any entities yet. Create your first entity to get started.`}
									</p>
									{searchTerm || selectedType || selectedStatus ? (
										<Button variant="outline" onClick={clearFilters}>
											Clear filters
										</Button>
									) : (
										<Button onClick={() => setIsCreateDialogOpen(true)}>
											<Plus className="mr-2 h-4 w-4" /> Create Entity
										</Button>
									)}
								</>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
