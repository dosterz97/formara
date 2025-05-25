import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { BookOpen, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

interface KnowledgeSource {
	name: string;
	content: string;
	score: number;
}

interface KnowledgeSourcesWidgetProps {
	sources: KnowledgeSource[];
}

export function KnowledgeSourcesWidget({
	sources,
}: KnowledgeSourcesWidgetProps) {
	const [isOpen, setIsOpen] = useState(false);

	if (!sources || sources.length === 0) {
		return null;
	}

	return (
		<Card className="mt-2 bg-blue-50/50 border-blue-200">
			<Collapsible open={isOpen} onOpenChange={setIsOpen}>
				<CollapsibleTrigger asChild>
					<CardHeader className="pb-2 pt-3 px-3 cursor-pointer hover:bg-blue-100/50 transition-colors">
						<CardTitle className="text-xs font-medium text-blue-700 flex items-center gap-2">
							<BookOpen className="h-3 w-3" />
							Knowledge Sources ({sources.length})
							{isOpen ? (
								<ChevronDown className="h-3 w-3" />
							) : (
								<ChevronRight className="h-3 w-3" />
							)}
						</CardTitle>
					</CardHeader>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<CardContent className="pt-0 px-3 pb-3">
						<div className="space-y-2">
							{sources.map((source, index) => (
								<div
									key={index}
									className="bg-white border border-blue-200 rounded-md p-2"
								>
									<div className="flex items-center justify-between mb-1">
										<h4 className="text-xs font-medium text-gray-900 truncate">
											{source.name}
										</h4>
										<Badge
											variant="secondary"
											className="text-xs px-1.5 py-0.5"
										>
											{Math.round(source.score * 100)}%
										</Badge>
									</div>
									<p className="text-xs text-gray-600 line-clamp-2">
										{source.content}
									</p>
								</div>
							))}
						</div>
					</CardContent>
				</CollapsibleContent>
			</Collapsible>
		</Card>
	);
}
