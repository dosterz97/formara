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
	CheckCircle,
	Download,
	FileUp,
	Loader2,
	Upload,
} from "lucide-react";
import React, { useState } from "react";

interface EntityCSVUploaderProps {
	universeId: string;
	onComplete?: () => void;
}

export function EntityCSVUploader({
	universeId,
	onComplete,
}: EntityCSVUploaderProps) {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [file, setFile] = useState<File | null>(null);
	const [uploading, setUploading] = useState(false);
	const [result, setResult] = useState<{
		success?: number;
		failed?: number;
		errors?: { row: number; error: string }[];
		message?: string;
	} | null>(null);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0];
		if (selectedFile && selectedFile.name.endsWith(".csv")) {
			setFile(selectedFile);
			setResult(null);
		} else if (selectedFile) {
			setResult({
				message: "Please select a CSV file",
				errors: [],
			});
		}
	};

	const handleUpload = async () => {
		if (!file) return;

		setUploading(true);
		setResult(null);

		try {
			const formData = new FormData();
			formData.append("file", file);

			const response = await fetch(
				`/api/universe/${universeId}/entities/upload`,
				{
					method: "POST",
					body: formData,
				}
			);

			const data = await response.json();

			if (!response.ok) {
				setResult({
					message: data.error || "Upload failed",
					errors: data.details || [],
				});
			} else {
				setResult(data.results);
				if (onComplete && data.results.success > 0) {
					onComplete();
				}
			}
		} catch (error) {
			setResult({
				message: "An error occurred during upload",
				errors: [],
			});
		} finally {
			setUploading(false);
		}
	};

	const downloadTemplate = () => {
		const headers = "name,entity_type,description,status,voice_id,slug";
		// Create examples without JSON fields
		const examples = [
			'John Doe,character,"A friendly character",active,voice-123,john-doe',
			'Mystic Forest,location,"A magical location",active,,mystic-forest',
			'Magic Sword,item,"A legendary weapon",active,,magic-sword',
		];

		const instructions = `# Entity CSV Import Template
# 
# Required columns:
# - name: Entity name (required)
# - entity_type: Type of entity (required, one of: character, location, item, concept, faction)
#
# Optional columns:
# - description: Text description of the entity
# - status: Entity status (active, inactive, draft, archived)
# - voice_id: Voice ID for character entities
# - slug: Custom URL slug (will be auto-generated from name if not provided)
#
`;

		const csvContent = `${instructions}${headers}\n${examples.join("\n")}`;

		const blob = new Blob([csvContent], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "entity_template.csv";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const resetUploader = () => {
		setFile(null);
		setResult(null);
		setIsDialogOpen(false);
	};

	return (
		<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
			<DialogTrigger asChild>
				<Button>
					<FileUp className="mr-2 h-4 w-4" /> Import from CSV
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Import Entities from CSV</DialogTitle>
					<DialogDescription>
						Upload a CSV file to bulk import entities into your universe.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 py-4">
					<div className="text-sm text-muted-foreground">
						<p>Upload a CSV file with entity data. Required fields:</p>
						<ul className="list-disc pl-5 mt-1">
							<li>
								<strong>name</strong>: Entity name
							</li>
							<li>
								<strong>entity_type</strong>: Type of entity (character,
								location, item, concept, faction)
							</li>
						</ul>
						<p className="mt-1">
							Additional attributes can be added later through the entity
							editor.
						</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="csv-file">CSV File</Label>
						<div className="flex items-center gap-4">
							<Input
								id="csv-file"
								type="file"
								accept=".csv"
								onChange={handleFileChange}
								disabled={uploading}
							/>
							<Button
								variant="outline"
								size="sm"
								onClick={downloadTemplate}
								title="Download template CSV"
							>
								<Download className="h-4 w-4" />
							</Button>
						</div>
						<p className="text-xs text-muted-foreground">
							Download the template for properly formatted data
						</p>
					</div>

					{result && (
						<Alert
							variant={
								result.success && result.success > 0 ? "default" : "destructive"
							}
						>
							<div className="flex items-center gap-2">
								{result.success && result.success > 0 ? (
									<CheckCircle className="h-4 w-4" />
								) : (
									<AlertCircle className="h-4 w-4" />
								)}
								<AlertTitle>
									{result.message ||
										(result.success
											? `Imported ${result.success} entities successfully`
											: "Import failed")}
								</AlertTitle>
							</div>
							<AlertDescription>
								{result.failed
									? `Failed to import ${result.failed} entities.`
									: ""}

								{result.errors && result.errors.length > 0 && (
									<div className="mt-2">
										<p className="font-semibold">Errors:</p>
										<ul className="list-disc pl-5 text-sm">
											{result.errors.slice(0, 5).map((error, index) => (
												<li key={index}>
													Row {error.row}: {error.error}
												</li>
											))}
											{result.errors.length > 5 && (
												<li>And {result.errors.length - 5} more errors...</li>
											)}
										</ul>
									</div>
								)}
							</AlertDescription>
						</Alert>
					)}
				</div>
				<DialogFooter className="flex justify-between sm:justify-between">
					<Button
						type="button"
						variant="outline"
						onClick={resetUploader}
						disabled={uploading}
					>
						Cancel
					</Button>
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={downloadTemplate}
							disabled={uploading}
						>
							<Download className="h-4 w-4 mr-2" /> Template
						</Button>
						<Button onClick={handleUpload} disabled={!file || uploading}>
							{uploading ? (
								<span className="flex items-center">
									<Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
								</span>
							) : (
								<span className="flex items-center">
									<Upload className="h-4 w-4 mr-2" /> Upload
								</span>
							)}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
