import type { Metadata, Viewport } from "next";

import { Toaster } from "@/components/ui/sonner";
import { UserProvider } from "@/lib/auth";
import { getUser } from "@/lib/db/queries";

import { Manrope } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
	title: "Formora",
	description: "Create universes that matter.",
};

export const viewport: Viewport = {
	maximumScale: 1,
};

const manrope = Manrope({ subsets: ["latin"] });

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	let userPromise = getUser();

	return (
		<html
			lang="en"
			className={`bg-white dark:bg-gray-950 text-black dark:text-white ${manrope.className}`}
		>
			<body className="min-h-[100dvh] bg-gray-50">
				<UserProvider userPromise={userPromise}>{children}</UserProvider>
				<Toaster richColors />
			</body>
		</html>
	);
}
