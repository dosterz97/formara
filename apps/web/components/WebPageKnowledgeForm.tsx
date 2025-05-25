"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	AlertCircle,
	CheckCircle,
	ChevronLeft,
	ChevronRight,
	Globe,
	Loader2,
	Plus,
} from "lucide-react";
import { useEffect, useState } from "react";
import slugify from "slugify";
import { toast } from "sonner";

interface ExtractedContent {
	title: string;
	content: string;
	description?: string;
	url: string;
}

interface KnowledgeChunk {
	id: string;
	name: string;
	content: string;
	selected: boolean;
}

interface WebPageKnowledgeFormProps {
	botId: string;
	onSuccess?: (results: any[]) => void;
}

export function WebPageKnowledgeForm({
	botId,
	onSuccess,
}: WebPageKnowledgeFormProps) {
	const [url, setUrl] = useState("");
	const [isExtracting, setIsExtracting] = useState(false);
	const [extractedContent, setExtractedContent] =
		useState<ExtractedContent | null>(null);
	const [knowledgeChunks, setKnowledgeChunks] = useState<KnowledgeChunk[]>([]);
	const [isCreating, setIsCreating] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [chunkSize, setChunkSize] = useState(2000);
	const [overlap, setOverlap] = useState(200);

	// Pagination state
	const [currentPage, setCurrentPage] = useState(1);
	const [chunksPerPage] = useState(10); // Show 10 chunks per page

	// Calculate pagination
	const totalPages = Math.ceil(knowledgeChunks.length / chunksPerPage);
	const startIndex = (currentPage - 1) * chunksPerPage;
	const endIndex = startIndex + chunksPerPage;
	const currentChunks = knowledgeChunks.slice(startIndex, endIndex);

	// Reset pagination when chunks change
	useEffect(() => {
		setCurrentPage(1);
	}, [knowledgeChunks]);

	// Calculate selected count
	const selectedCount = knowledgeChunks.filter(
		(chunk) => chunk.selected
	).length;

	const isValidUrl = (url: string) => {
		try {
			new URL(url);
			return url.startsWith("http://") || url.startsWith("https://");
		} catch {
			return false;
		}
	};

	const chunkContent = (content: string, title: string): KnowledgeChunk[] => {
		if (!content || content.length <= chunkSize) {
			return [
				{
					id: "1",
					name: title || "Web Page Content",
					content: content,
					selected: true,
				},
			];
		}

		const chunks: KnowledgeChunk[] = [];
		let startIndex = 0;
		let chunkIndex = 1;

		while (startIndex < content.length) {
			const endIndex = Math.min(startIndex + chunkSize, content.length);

			// Try to break at sentence boundaries
			let actualEndIndex = endIndex;
			if (endIndex < content.length) {
				const lastSentenceEnd = content.lastIndexOf(".", endIndex);
				const lastParagraphEnd = content.lastIndexOf("\n\n", endIndex);
				const breakPoint = Math.max(lastSentenceEnd, lastParagraphEnd);

				if (breakPoint > startIndex + chunkSize / 2) {
					actualEndIndex = breakPoint + 1;
				}
			}

			const chunkContent = content.slice(startIndex, actualEndIndex).trim();

			if (chunkContent) {
				chunks.push({
					id: chunkIndex.toString(),
					name: `${title} - Part ${chunkIndex}`,
					content: chunkContent,
					selected: true,
				});
				chunkIndex++;
			}

			startIndex = Math.max(actualEndIndex - overlap, startIndex + 1);
		}

		return chunks;
	};

	const handleExtractContent = async () => {
		if (!url || !isValidUrl(url)) {
			setError("Please enter a valid URL starting with http:// or https://");
			return;
		}

		setIsExtracting(true);
		setError(null);
		setExtractedContent(null);
		setKnowledgeChunks([]);

		try {
			const response = await fetch(
				`/api/bots/${botId}/knowledge/extract-webpage`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ url, chunkSize, overlap }),
				}
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					errorData.error || "Failed to extract content from webpage"
				);
			}

			const data = await response.json();
			setExtractedContent(data.extractedContent);

			// Create knowledge chunks from the extracted content
			const chunks = chunkContent(
				data.extractedContent.content,
				data.extractedContent.title
			);
			setKnowledgeChunks(chunks);
		} catch (err: any) {
			console.error("Extraction error:", err);
			setError(err.message || "Failed to extract content from webpage");
		} finally {
			setIsExtracting(false);
		}
	};

	const handleChunkToggle = (chunkId: string) => {
		setKnowledgeChunks((prev) =>
			prev.map((chunk) =>
				chunk.id === chunkId ? { ...chunk, selected: !chunk.selected } : chunk
			)
		);
	};

	const handleSelectAll = () => {
		const allSelected = knowledgeChunks.every((chunk) => chunk.selected);
		setKnowledgeChunks((prev) =>
			prev.map((chunk) => ({ ...chunk, selected: !allSelected }))
		);
	};

	const handleChunkNameChange = (chunkId: string, newName: string) => {
		setKnowledgeChunks((prev) =>
			prev.map((chunk) =>
				chunk.id === chunkId ? { ...chunk, name: newName } : chunk
			)
		);
	};

	const handleCreateKnowledge = async () => {
		const selectedChunks = knowledgeChunks.filter((chunk) => chunk.selected);

		if (selectedChunks.length === 0) {
			toast.error("Please select at least one knowledge chunk to create");
			return;
		}

		setIsCreating(true);
		const results = [];

		try {
			for (const chunk of selectedChunks) {
				const response = await fetch("/api/knowledge", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						botId,
						slug: slugify(chunk.name, { lower: true, strict: true }),
						name: chunk.name,
						content: chunk.content,
						manualEntry: false, // This is from web import
					}),
				});

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(
						`Failed to create "${chunk.name}": ${errorData.error}`
					);
				}

				const result = await response.json();
				results.push(result);
			}

			toast.success(`Successfully created ${results.length} knowledge entries`);
			onSuccess?.(results);

			// Reset form
			setUrl("");
			setExtractedContent(null);
			setKnowledgeChunks([]);
			setError(null);
		} catch (err: any) {
			console.error("Creation error:", err);
			setError(err.message || "Failed to create knowledge entries");
		} finally {
			setIsCreating(false);
		}
	};

	return (
		<div className="max-h-[60vh] max-w-full overflow-y-auto overflow-x-hidden space-y-3 p-2">
			{/* URL Input Section - Hide after successful extraction */}
			{knowledgeChunks.length === 0 && (
				<div className="space-y-2">
					<div className="space-y-2">
						<Label htmlFor="webpage-url" className="text-sm font-medium">
							Web Page URL
						</Label>
						<div className="flex gap-2">
							<Input
								id="webpage-url"
								type="url"
								placeholder="https://example.com/article"
								value={url}
								onChange={(e) => setUrl(e.target.value)}
								disabled={isExtracting || isCreating}
								className="flex-1 h-9 min-w-0"
							/>
							<Button
								onClick={handleExtractContent}
								disabled={isExtracting || !url || isCreating}
								size="sm"
								className="h-9 px-3 flex-shrink-0"
							>
								{isExtracting ? (
									<>
										<Loader2 className="mr-1 h-4 w-4 animate-spin" />
										Extracting...
									</>
								) : (
									<>
										<Globe className="mr-1 h-4 w-4" />
										Extract
									</>
								)}
							</Button>
						</div>
						<p className="text-xs text-muted-foreground">
							Enter the full URL including https:// - content will be extracted
							using Jina AI
						</p>
					</div>
				</div>
			)}

			{/* Error Display */}
			{error && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertTitle>Error</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{/* Knowledge Chunks Section */}
			{knowledgeChunks.length > 0 && (
				<Card className="w-full">
					<CardHeader className="pb-2">
						<div className="flex items-center justify-between">
							<div className="flex-1 min-w-0">
								<CardTitle className="text-sm flex items-center gap-2">
									<CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
									<span className="truncate">Knowledge Chunks Ready</span>
									<span className="text-xs font-normal text-muted-foreground flex-shrink-0">
										({selectedCount} of {knowledgeChunks.length} selected)
									</span>
								</CardTitle>
								<CardDescription className="text-xs">
									Review and select the knowledge chunks you want to import.
									{extractedContent && (
										<span className="block mt-1 text-xs text-muted-foreground truncate">
											From: {extractedContent.url}
										</span>
									)}
									{knowledgeChunks.length > chunksPerPage && (
										<span className="block mt-1">
											Showing {startIndex + 1}-
											{Math.min(endIndex, knowledgeChunks.length)} of{" "}
											{knowledgeChunks.length} chunks
										</span>
									)}
								</CardDescription>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									setUrl("");
									setExtractedContent(null);
									setKnowledgeChunks([]);
									setError(null);
								}}
								className="h-7 px-2 text-xs flex-shrink-0"
							>
								New URL
							</Button>
						</div>
					</CardHeader>

					<CardContent className="w-full">
						<div className="h-48 sm:h-64 lg:h-80 overflow-y-auto space-y-2 border rounded-lg p-2 bg-gray-50/50 w-full">
							{currentChunks.map((chunk) => (
								<div
									key={chunk.id}
									className={`border rounded-md p-2 transition-colors bg-white w-full cursor-pointer ${
										chunk.selected
											? "border-blue-200 bg-blue-50/50 hover:bg-blue-100/50"
											: "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
									}`}
									onClick={() => {
										setKnowledgeChunks((prev) =>
											prev.map((c) =>
												c.id === chunk.id ? { ...c, selected: !c.selected } : c
											)
										);
									}}
								>
									<div className="flex items-start gap-2 w-full">
										<Checkbox
											checked={chunk.selected}
											onCheckedChange={(checked) => {
												setKnowledgeChunks((prev) =>
													prev.map((c) =>
														c.id === chunk.id
															? { ...c, selected: !!checked }
															: c
													)
												);
											}}
											className="mt-0.5 flex-shrink-0"
											onClick={(e) => e.stopPropagation()} // Prevent double-toggle
										/>
										<div className="flex-1 min-w-0 space-y-1 overflow-hidden w-0">
											<h4 className="font-medium text-xs truncate break-all">
												{chunk.name}
											</h4>
											<p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed break-all overflow-wrap-anywhere">
												{chunk.content}
											</p>
											<div className="text-xs text-muted-foreground">
												{chunk.content.length.toLocaleString()} chars
											</div>
										</div>
									</div>
								</div>
							))}

							{currentChunks.length === 0 && (
								<div className="text-center text-muted-foreground py-4 text-xs">
									No chunks on this page
								</div>
							)}
						</div>

						{/* Pagination controls */}
						{totalPages > 1 && (
							<div className="mt-2 flex items-center justify-between bg-gray-50 p-1.5 rounded-md">
								<div className="text-xs text-muted-foreground font-medium">
									Page {currentPage} of {totalPages}
									<span className="text-xs ml-1">
										({startIndex + 1}-
										{Math.min(endIndex, knowledgeChunks.length)} of{" "}
										{knowledgeChunks.length})
									</span>
								</div>
								<div className="flex items-center gap-1">
									<Button
										variant="outline"
										size="sm"
										onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
										disabled={currentPage === 1}
										className="h-6 px-2 text-xs"
									>
										<ChevronLeft className="h-3 w-3" />
										Prev
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() =>
											setCurrentPage(Math.min(totalPages, currentPage + 1))
										}
										disabled={currentPage === totalPages}
										className="h-6 px-2 text-xs"
									>
										Next
										<ChevronRight className="h-3 w-3" />
									</Button>
								</div>
							</div>
						)}

						{/* Bulk actions */}
						{knowledgeChunks.length > 0 && (
							<div className="mt-2 flex flex-wrap gap-1 pt-2 border-t">
								<div className="flex gap-1">
									<Button
										variant="outline"
										size="sm"
										onClick={() => {
											setKnowledgeChunks((prev) =>
												prev.map((c) => ({ ...c, selected: true }))
											);
										}}
										className="h-6 px-2 text-xs"
									>
										All ({knowledgeChunks.length})
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => {
											setKnowledgeChunks((prev) =>
												prev.map((c) => ({ ...c, selected: false }))
											);
										}}
										className="h-6 px-2 text-xs"
									>
										None
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => {
											setKnowledgeChunks((prev) =>
												prev.map((c) => ({ ...c, selected: !c.selected }))
											);
										}}
										className="h-6 px-2 text-xs"
									>
										Toggle
									</Button>
								</div>
								<div className="flex-1" />
								<Button
									onClick={handleCreateKnowledge}
									disabled={isCreating || selectedCount === 0}
									className="h-6 px-2 text-xs"
									size="sm"
								>
									{isCreating ? (
										<>
											<Loader2 className="mr-1 h-3 w-3 animate-spin" />
											Creating...
										</>
									) : (
										<>
											<Plus className="mr-1 h-3 w-3" />
											Create {selectedCount}
										</>
									)}
								</Button>
							</div>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	);
}
