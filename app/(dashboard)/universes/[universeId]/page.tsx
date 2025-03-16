"use client";

import { useParams } from "next/navigation";
import { UniverseDetails } from "./universe-details";

export default function UniversePage() {
	const params = useParams();
	const id = Array.isArray(params.universeId)
		? params.universeId[0]
		: (params.universeId as string);

	return (
		<div className="container mx-auto py-8">
			<UniverseDetails id={id} />
		</div>
	);
}
