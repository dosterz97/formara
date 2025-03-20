"use client";

import { useParams } from "next/navigation";
import { UniverseDetails } from "./universe-details";

export default function UniversePage() {
	const params = useParams();
	const universeSlug = Array.isArray(params.universeSlug)
		? params.universeSlug[0]
		: (params.universeSlug as string);

	return (
		<div className="container mx-auto py-8">
			<UniverseDetails universeSlug={universeSlug} />
		</div>
	);
}
