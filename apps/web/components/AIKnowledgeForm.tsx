import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Knowledge } from "@/lib/db/schema";
import { CheckCircle, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";

interface PreviewKnowledge extends Knowledge {
	selected: boolean;
}

interface AIKnowledgeFormProps {
	botId: string;
	onSuccess: (results: Knowledge[]) => void;
}

export function AIKnowledgeForm({ botId, onSuccess }: AIKnowledgeFormProps) {
	const [inputText, setInputText] = useState("");
	const [isProcessing, setIsProcessing] = useState(false);
	const [previewData, setPreviewData] = useState<PreviewKnowledge[] | null>(
		null
	);
	const [expandedChunkId, setExpandedChunkId] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!inputText.trim()) return;

		setIsProcessing(true);
		try {
			const processResponse = await fetch("/api/knowledge/process-ai", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					text: inputText,
					botId,
				}),
			});

			if (!processResponse.ok) {
				throw new Error("Failed to process text with AI");
			}

			const processedData = await processResponse.json();
			console.log("AI Processed Data:", processedData); // Debug log

			// Ensure each item has name and content
			const formattedData = processedData.map((item: any) => ({
				id: item.id || Math.random().toString(36).substring(7),
				name: item.name || "AI Generated Knowledge",
				content: item.content || "",
				selected: true,
			}));

			console.log("Formatted Data:", formattedData); // Debug log
			setPreviewData(formattedData);
		} catch (error) {
			console.error("Error processing text:", error);
			alert("Failed to process text. Please try again.");
		} finally {
			setIsProcessing(false);
		}
	};

	const handleConfirm = async () => {
		if (!previewData) return;

		setIsProcessing(true);
		try {
			const selectedItems = previewData.filter((item) => item.selected);

			// Process each item individually to match API expectations
			const results = [];
			for (const item of selectedItems) {
				const response = await fetch("/api/knowledge", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						botId,
						name: item.name,
						content: item.content,
						manualEntry: false,
					}),
				});

				if (!response.ok) {
					throw new Error("Failed to save knowledge");
				}

				const result = await response.json();
				results.push(result);
			}

			onSuccess(results);
		} catch (error) {
			console.error("Error saving knowledge:", error);
			alert("Failed to save knowledge. Please try again.");
		} finally {
			setIsProcessing(false);
		}
	};

	const handleChunkToggle = (index: number) => {
		if (!previewData) return;
		const newData = [...previewData];
		newData[index] = { ...newData[index], selected: !newData[index].selected };
		setPreviewData(newData);
	};

	const selectedCount =
		previewData?.filter((item) => item.selected).length || 0;

	return (
		<div className="max-h-[60vh] max-w-full overflow-y-auto overflow-x-hidden space-y-3 p-2">
			{!previewData ? (
				<div className="space-y-2">
					<div className="space-y-2">
						<label className="text-sm font-medium block">
							Paste your text here for AI processing
						</label>
						<div className="flex gap-2">
							<Textarea
								value={inputText}
								onChange={(e) => setInputText(e.target.value)}
								placeholder="Paste your text here..."
								className="flex-1 min-h-[200px] resize-none"
								disabled={isProcessing}
							/>
						</div>
						<p className="text-xs text-muted-foreground">
							The text will be processed using Gemini AI to create structured
							knowledge chunks
						</p>
					</div>
					<Button
						onClick={handleSubmit}
						disabled={isProcessing || !inputText.trim()}
						className="w-full"
					>
						{isProcessing ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Processing...
							</>
						) : (
							<>
								<Sparkles className="mr-2 h-4 w-4" />
								Process with AI
							</>
						)}
					</Button>
				</div>
			) : (
				<Card className="w-full">
					<CardHeader className="pb-2">
						<div className="flex items-center justify-between">
							<div className="flex-1 min-w-0">
								<CardTitle className="text-sm flex items-center gap-2">
									<CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
									<span className="truncate">Knowledge Chunks Ready</span>
									<span className="text-xs font-normal text-muted-foreground flex-shrink-0">
										({selectedCount} of {previewData.length} selected)
									</span>
								</CardTitle>
								<CardDescription className="text-xs">
									Review and select the knowledge chunks you want to import.
								</CardDescription>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									setPreviewData(null);
									setInputText("");
								}}
								className="h-7 px-2 text-xs flex-shrink-0"
							>
								New Text
							</Button>
						</div>
					</CardHeader>
					<CardContent className="w-full">
						<div className="h-48 sm:h-64 lg:h-80 overflow-y-auto space-y-2 border rounded-lg p-2 bg-gray-50/50 w-full">
							{previewData.map((item, index) => {
								const isExpanded = expandedChunkId === index.toString();
								return (
									<div
										key={index}
										className={`border rounded-md p-2 transition-colors bg-white w-full cursor-pointer ${
											item.selected
												? "border-blue-200 bg-blue-50/50 hover:bg-blue-100/50"
												: "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
										} ${isExpanded ? "ring-2 ring-blue-200" : ""}`}
										onClick={() => {
											setExpandedChunkId(isExpanded ? null : index.toString());
										}}
									>
										<div className="flex items-start gap-2 w-full">
											<Checkbox
												checked={item.selected}
												onCheckedChange={() => handleChunkToggle(index)}
												className="mt-0.5 flex-shrink-0"
												onClick={(e) => e.stopPropagation()}
											/>
											<div className="flex-1 min-w-0 space-y-1 overflow-hidden w-0">
												<h4 className="font-medium text-xs truncate break-all">
													{item.name}
												</h4>
												{isExpanded ? (
													<div className="space-y-2">
														<p className="text-xs text-muted-foreground leading-relaxed break-all overflow-wrap-anywhere whitespace-pre-wrap">
															{item.content}
														</p>
														<div className="text-xs text-blue-600 font-medium">
															Click to collapse
														</div>
													</div>
												) : (
													<div className="space-y-1">
														<p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed break-all overflow-wrap-anywhere">
															{item.content}
														</p>
														<div className="text-xs text-blue-600">
															Click to expand •{" "}
															{item.content.length.toLocaleString()} chars
														</div>
													</div>
												)}
											</div>
										</div>
									</div>
								);
							})}
						</div>

						{/* Bulk actions */}
						<div className="mt-2 flex flex-wrap gap-1 pt-2 border-t">
							<div className="flex gap-1">
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										setPreviewData(
											(prev) =>
												prev?.map((item) => ({
													...item,
													selected: true,
												})) || null
										);
									}}
									className="h-6 px-2 text-xs"
								>
									All ({previewData.length})
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										setPreviewData(
											(prev) =>
												prev?.map((item) => ({
													...item,
													selected: false,
												})) || null
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
										setPreviewData(
											(prev) =>
												prev?.map((item) => ({
													...item,
													selected: !item.selected,
												})) || null
										);
									}}
									className="h-6 px-2 text-xs"
								>
									Toggle
								</Button>
							</div>
							<div className="flex-1" />
							<Button
								onClick={handleConfirm}
								disabled={isProcessing || selectedCount === 0}
								className="h-6 px-2 text-xs"
								size="sm"
							>
								{isProcessing ? (
									<>
										<Loader2 className="mr-1 h-3 w-3 animate-spin" />
										Creating...
									</>
								) : (
									<>
										<Sparkles className="mr-1 h-3 w-3" />
										Create {selectedCount}
									</>
								)}
							</Button>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
