import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	AlertCircle,
	Check,
	CheckCircle,
	Globe,
	Loader2,
	RefreshCw,
	Square,
	Upload,
} from "lucide-react";
import React, { useState } from "react";

interface WebPageExtractorProps {
	universeId: string;
	onComplete?: (data: {
		jinaData: any;
		entitySuggestions?: Array<{
			name: string;
			entity_type: string;
			description: string;
			status: string;
		}>;
		summary?: string;
	}) => void;
	onEntitiesUpload?: (results: any) => void;
}

export function WebPageExtractor({
	universeId,
	onComplete,
	onEntitiesUpload,
}: WebPageExtractorProps) {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [url, setUrl] = useState<string>("");
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState<{
		success?: boolean;
		jinaData?: any;
		entitySuggestions?: Array<{
			name: string;
			entity_type: string;
			description: string;
			status: string;
		}>;
		summary?: string;
		error?: string;
	} | null>(null);

	const [selectedEntities, setSelectedEntities] = useState<
		Array<{
			name: string;
			entity_type: string;
			description: string;
			status: string;
		}>
	>([]);
	const [uploadResult, setUploadResult] = useState<{
		success?: number;
		failed?: number;
		errors?: Array<{ index: number; name: string; error: string }>;
		createdEntities?: any[];
	} | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [showUrlInput, setShowUrlInput] = useState(true);

	const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setUrl(e.target.value);
		setResult(null);
	};

	const handleExtraction = async () => {
		if (!url || !isValidUrl(url)) {
			setResult({
				success: false,
				error: "Please enter a valid URL",
			});
			return;
		}

		setLoading(true);
		setResult(null);

		try {
			const response = await fetch(
				`/api/universe/${universeId}/extract-webpage`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ url }),
				}
			);

			const data = await response.json();

			if (!response.ok) {
				setResult({
					success: false,
					error: data.error || "Extraction failed",
				});
			} else {
				setResult({
					success: true,
					jinaData: data.jinaData,
					entitySuggestions: data.entitySuggestions,
					summary: data.summary,
				});

				// Auto-select all detected entities
				if (data.entitySuggestions && data.entitySuggestions.length > 0) {
					setSelectedEntities(data.entitySuggestions);
					setShowUrlInput(false); // Hide URL input once entities are detected
				}

				if (onComplete) {
					onComplete({
						jinaData: data.jinaData,
						entitySuggestions: data.entitySuggestions,
						summary: data.summary,
					});
				}
			}
		} catch (error) {
			setResult({
				success: false,
				error: "An error occurred during extraction",
			});
		} finally {
			setLoading(false);
		}
	};

	const isValidUrl = (url: string) => {
		try {
			new URL(url);
			return true;
		} catch (e) {
			return false;
		}
	};

	const resetExtractor = () => {
		setUrl("");
		setResult(null);
		setSelectedEntities([]);
		setUploadResult(null);
		setIsDialogOpen(false);
		setShowUrlInput(true);
	};

	const handleRetry = () => {
		setShowUrlInput(true);
		setResult(null);
		setSelectedEntities([]);
		setUploadResult(null);
	};

	const toggleEntity = (entity: {
		name: string;
		entity_type: string;
		description: string;
		status: string;
	}) => {
		const isSelected = selectedEntities.some(
			(e) => e.name === entity.name && e.entity_type === entity.entity_type
		);

		if (isSelected) {
			// Remove entity if already selected
			setSelectedEntities((prev) =>
				prev.filter(
					(e) =>
						!(e.name === entity.name && e.entity_type === entity.entity_type)
				)
			);
		} else {
			// Add entity if not selected
			setSelectedEntities((prev) => [...prev, entity]);
		}
	};

	const handleUploadEntities = async () => {
		if (selectedEntities.length === 0) return;

		setIsUploading(true);
		setUploadResult(null);

		try {
			// Map the selected entities to the expected format
			const entitiesToUpload = selectedEntities.map((entity) => ({
				name: entity.name,
				entity_type: entity.entity_type,
				description: entity.description,
				status: entity.status,
			}));

			const response = await fetch(
				`/api/universe/${universeId}/entities/batch`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ entities: entitiesToUpload }),
				}
			);

			const data = await response.json();

			if (!response.ok) {
				setUploadResult({
					success: 0,
					failed: selectedEntities.length,
					errors: [
						{
							index: 0,
							name: "Batch upload",
							error: data.error || "Upload failed",
						},
					],
				});
			} else {
				setUploadResult(data.results);

				if (onEntitiesUpload) {
					onEntitiesUpload(data.results);
				}

				// Clear selected entities if all uploaded successfully
				if (
					data.results.success === selectedEntities.length &&
					data.results.failed === 0
				) {
					setSelectedEntities([]);
				}
			}
		} catch (error: any) {
			setUploadResult({
				success: 0,
				failed: selectedEntities.length,
				errors: [
					{
						index: 0,
						name: "Batch upload",
						error: error.message || "An error occurred during upload",
					},
				],
			});
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
			<DialogTrigger asChild>
				<Button>
					<Globe className="mr-2 h-4 w-4" /> Extract from Web
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-3xl">
				<DialogHeader>
					<DialogTitle>Extract and Analyze Web Page</DialogTitle>
					<DialogDescription>
						Enter a URL to extract content and analyze for potential entities
						using Jina AI and OpenAI.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 py-4">
					{showUrlInput && (
						<>
							<div className="text-sm text-muted-foreground">
								<p>
									Enter a web page URL to extract content and analyze it for
									potential entities. The system will identify characters,
									locations, items, and other entities from the content.
								</p>
							</div>
							<div className="space-y-2">
								<Label htmlFor="webpage-url">Web Page URL</Label>
								<Input
									id="webpage-url"
									type="url"
									placeholder="https://example.com/page"
									value={url}
									onChange={handleUrlChange}
									disabled={loading || isUploading}
								/>
								<p className="text-xs text-muted-foreground">
									Enter the full URL including https://
								</p>
							</div>
						</>
					)}

					{result && !result.success && (
						<Alert variant="destructive">
							<div className="flex items-center gap-2">
								<AlertCircle className="h-4 w-4" />
								<AlertTitle>Extraction failed</AlertTitle>
							</div>
							<AlertDescription>
								<p className="text-sm mt-1">{result.error}</p>
							</AlertDescription>
						</Alert>
					)}

					{result && result.success && (
						<div className="rounded-lg border bg-card text-card-foreground shadow-sm">
							<div className="flex items-center justify-between p-4 border-b">
								<div className="flex items-center gap-2">
									<CheckCircle className="h-5 w-5 text-green-500" />
									<h3 className="text-lg font-medium">Extraction successful</h3>

									<div className="text-sm bg-secondary/60 text-secondary-foreground px-3 py-1 rounded-full">
										{selectedEntities.length} selected for import
									</div>
								</div>
							</div>
							<div className="p-4">
								{result.entitySuggestions &&
									result.entitySuggestions.length > 0 && (
										<>
											<div className="max-h-80 overflow-y-auto p-1 border rounded-md bg-background">
												{result.entitySuggestions.map((entity, idx) => {
													const isSelected = selectedEntities.some(
														(e) =>
															e.name === entity.name &&
															e.entity_type === entity.entity_type
													);

													return (
														<div
															key={idx}
															className={`mb-2 border-l-2 px-8 py-2 group rounded-r hover:bg-muted/40 ${
																isSelected
																	? "border-primary/70 border-l-3 bg-primary/5"
																	: "border-muted"
															}`}
														>
															<div className="flex items-center gap-4">
																<div className="flex-1 flex flex-col items-start justify-between">
																	<div className="flex items-center text-md font-medium">
																		{entity.name}
																		<span className="ml-2 px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded text-xs">
																			{entity.entity_type}
																		</span>
																	</div>
																	<div className="text-sm">
																		{entity.description}
																	</div>
																</div>

																<Button
																	variant={isSelected ? "secondary" : "outline"}
																	size="sm"
																	className={`h-6 w-6 p-0 rounded-md ${
																		isSelected
																			? "text-primary-foreground bg-primary/70 shadow-sm"
																			: "text-muted-foreground border border-muted-foreground/30"
																	} hover:bg-primary/30 hover:text-primary transition-colors`}
																	onClick={() => toggleEntity(entity)}
																>
																	{isSelected ? (
																		<Check className="h-4 w-4" />
																	) : (
																		<Square className="h-4 w-4" />
																	)}
																</Button>
															</div>
														</div>
													);
												})}
											</div>
										</>
									)}
							</div>
						</div>
					)}

					{uploadResult && (
						<Alert
							variant={
								uploadResult.success && uploadResult.success > 0
									? "default"
									: "destructive"
							}
							className="mt-4"
						>
							<div className="flex items-center gap-2">
								{uploadResult.success && uploadResult.success > 0 ? (
									<CheckCircle className="h-4 w-4" />
								) : (
									<AlertCircle className="h-4 w-4" />
								)}
								<AlertTitle>
									{uploadResult.success
										? `Imported ${uploadResult.success} entities successfully`
										: "Import failed"}
								</AlertTitle>
							</div>
							<AlertDescription>
								{uploadResult.failed
									? `Failed to import ${uploadResult.failed} entities.`
									: ""}

								{uploadResult.errors && uploadResult.errors.length > 0 && (
									<div className="mt-2">
										<p className="font-semibold">Errors:</p>
										<ul className="list-disc pl-5 text-sm">
											{uploadResult.errors.slice(0, 5).map((error, index) => (
												<li key={index}>
													{error.name}: {error.error}
												</li>
											))}
											{uploadResult.errors.length > 5 && (
												<li>
													And {uploadResult.errors.length - 5} more errors...
												</li>
											)}
										</ul>
									</div>
								)}
							</AlertDescription>
						</Alert>
					)}
				</div>
				<DialogFooter className="flex flex-col sm:flex-row gap-2">
					<div className="flex justify-between w-full">
						<Button
							type="button"
							variant="outline"
							onClick={resetExtractor}
							disabled={loading || isUploading}
						>
							Cancel
						</Button>

						{!showUrlInput && result && result.success && (
							<Button
								variant="outline"
								onClick={handleRetry}
								disabled={loading || isUploading}
								className="mr-auto ml-2"
							>
								<RefreshCw className="mr-2 h-4 w-4" /> Try Another URL
							</Button>
						)}

						{result && result.success && selectedEntities.length > 0 && (
							<Button
								onClick={handleUploadEntities}
								disabled={isUploading || selectedEntities.length === 0}
								className="ml-auto"
							>
								{isUploading ? (
									<span className="flex items-center">
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
										Uploading...
									</span>
								) : (
									<span className="flex items-center">
										<Upload className="mr-2 h-4 w-4" /> Import{" "}
										{selectedEntities.length} Entities
									</span>
								)}
							</Button>
						)}

						{showUrlInput && (!result || !result.success) && (
							<Button onClick={handleExtraction} disabled={!url || loading}>
								{loading ? (
									<span className="flex items-center">
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
										Analyzing...
									</span>
								) : (
									<span className="flex items-center">
										<Globe className="h-4 w-4 mr-2" /> Extract & Analyze
									</span>
								)}
							</Button>
						)}
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
