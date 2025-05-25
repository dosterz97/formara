import { ManualKnowledgeEntryForm } from "@/components/ManualKnowledgeEntryForm";

export default function ManualEntryPage() {
	return (
		<div className="container mx-auto p-4">
			<h1 className="text-2xl font-bold mb-4">Manual Knowledge Entry</h1>
			<ManualKnowledgeEntryForm
				onSuccess={() => alert("Knowledge entry added successfully!")}
			/>
		</div>
	);
}
