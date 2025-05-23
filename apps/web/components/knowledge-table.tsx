import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Knowledge } from "@/lib/db/schema";
import { Brain, Globe, Loader2, Plus } from "lucide-react";
import { useState } from "react";

interface KnowledgeTableProps {
	botId: string;
	knowledge: Knowledge[];
	isLoading?: boolean;
}

export function KnowledgeTable({
	botId,
	knowledge,
	isLoading,
}: KnowledgeTableProps) {
	const [isImportModalOpen, setIsImportModalOpen] = useState(false);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center p-8">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<>
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>Knowledge Base</CardTitle>
							<CardDescription>
								Add and manage knowledge for your bot to use in conversations
							</CardDescription>
						</div>
						<Dialog
							open={isImportModalOpen}
							onOpenChange={setIsImportModalOpen}
						>
							<DialogTrigger asChild>
								<Button>
									<Plus className="mr-2 h-4 w-4" /> Add Knowledge
								</Button>
							</DialogTrigger>
							<DialogContent className="sm:max-w-[600px]">
								<DialogHeader>
									<DialogTitle>Add Knowledge</DialogTitle>
									<DialogDescription>
										Choose how you want to add knowledge to your bot
									</DialogDescription>
								</DialogHeader>
								<Tabs defaultValue="manual" className="w-full">
									<TabsList className="grid w-full grid-cols-2">
										<TabsTrigger value="manual">
											<Brain className="mr-2 h-4 w-4" />
											Manual Entry
										</TabsTrigger>
										<TabsTrigger value="webpage">
											<Globe className="mr-2 h-4 w-4" />
											From Webpage
										</TabsTrigger>
									</TabsList>
									<TabsContent value="manual">
										{/* Manual entry form will go here */}
										<p>Manual entry form coming soon...</p>
									</TabsContent>
									<TabsContent value="webpage">
										{/* Webpage import form will go here */}
										<p>Webpage import form coming soon...</p>
									</TabsContent>
								</Tabs>
							</DialogContent>
						</Dialog>
					</div>
				</CardHeader>
				<CardContent>
					{knowledge.length > 0 ? (
						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-[40%]">Name</TableHead>
										<TableHead>Added</TableHead>
										<TableHead>Added By</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{knowledge.map((item) => (
										<TableRow key={item.id}>
											<TableCell className="font-medium">{item.name}</TableCell>
											<TableCell>
												{new Date(item.createdAt).toLocaleDateString()}
											</TableCell>
											<TableCell>User</TableCell>
											<TableCell className="text-right">
												{/* Actions will go here */}
												<Button variant="ghost" size="sm">
													View
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					) : (
						<div className="flex flex-col items-center justify-center py-12 px-4 text-center">
							<div className="rounded-full bg-primary/10 p-3 mb-4">
								<Brain className="h-6 w-6 text-primary" />
							</div>
							<h3 className="text-lg font-medium mb-2">
								No knowledge added yet
							</h3>
							<p className="text-muted-foreground mb-4 max-w-sm">
								Start by adding some knowledge to your bot. You can add it
								manually or import it from a webpage.
							</p>
							<Button onClick={() => setIsImportModalOpen(true)}>
								<Plus className="mr-2 h-4 w-4" /> Add Knowledge
							</Button>
						</div>
					)}
				</CardContent>
			</Card>
		</>
	);
}
