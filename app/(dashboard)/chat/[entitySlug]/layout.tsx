"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useUser } from "@/lib/auth";
import { use } from "react";

export const experimental_ppr = true;

function Sidebar({ children }: { children: React.ReactNode }) {
	const { userPromise } = useUser();
	const user = use(userPromise);
	return (
		<>
			<SidebarProvider defaultOpen={true}>
				<AppSidebar
					user={{
						id: user?.id,
						name: user?.name,
						email: user?.email,
					}}
				/>
				<SidebarInset>{children}</SidebarInset>
			</SidebarProvider>
		</>
	);
}
export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<section className="flex flex-col min-h-screen">
			<Sidebar>{children}</Sidebar>
		</section>
	);
}
