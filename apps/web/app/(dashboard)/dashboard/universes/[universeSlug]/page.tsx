"use client";

import { UniverseDetails } from "@/components/universe-details";
import { useParams } from "next/navigation";

export default function UniversePage() {
	const params = useParams();
	const universeSlug = Array.isArray(params.universeSlug)
		? params.universeSlug[0]
		: (params.universeSlug as string);

	return (
		<div className="container mx-auto p-8">
			<UniverseDetails universeSlug={universeSlug} />
		</div>
	);
}
