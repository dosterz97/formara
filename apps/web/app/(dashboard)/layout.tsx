"use client";

import { signOut } from "@/app/(login)/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/lib/auth";
import { Globe2, Home, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, Suspense, use, useEffect, useState } from "react";

interface UserMenuProps {
	isLandingPage: boolean;
	darkMode?: boolean;
}

function UserMenu({ isLandingPage, darkMode }: UserMenuProps) {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const { userPromise } = useUser();
	const user = use(userPromise);
	const router = useRouter();

	async function handleSignOut() {
		await signOut();
		router.refresh();
		router.push("/");
	}

	if (!user) {
		return (
			<>
				<Button
					asChild
					variant={"link"}
					className={`${
						darkMode
							? "text-indigo-600 hover:text-indigo-700"
							: "text-black hover:text-gray-800"
					}`}
				>
					<Link href="/sign-in">Sign in</Link>
				</Button>
				{/* <Link
					href="/pricing"
					className={`${
						isLandingPage
							? "text-white hover:text-indigo-300"
							: "text-gray-700 hover:text-gray-900"
					} text-sm font-medium transition ${isLandingPage ? "" : "md:block"}`}
				>
					Pricing
				</Link> */}
				<Button
					asChild
					className={`${
						darkMode
							? "bg-indigo-600 hover:bg-indigo-700"
							: "bg-black hover:bg-gray-800"
					} text-white text-sm px-4 py-2 rounded-full`}
				>
					<Link href="/sign-up">Sign Up</Link>
				</Button>
			</>
		);
	}

	return (
		<div className={`text-black`}>
			<DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
				<DropdownMenuTrigger>
					<Avatar className="cursor-pointer size-9">
						<AvatarImage alt={user.name || ""} />
						<AvatarFallback>
							{user.email
								.split(" ")
								.map((n) => n[0])
								.join("")}
						</AvatarFallback>
					</Avatar>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="flex flex-col gap-1">
					<DropdownMenuItem className="cursor-pointer">
						<Link href="/dashboard" className="flex w-full items-center">
							<Home className="mr-2 h-4 w-4" />
							<span>Dashboard</span>
						</Link>
					</DropdownMenuItem>
					<form action={handleSignOut} className="w-full">
						<button type="submit" className="flex w-full">
							<DropdownMenuItem className="w-full flex-1 cursor-pointer">
								<LogOut className="mr-2 h-4 w-4" />
								<span>Sign out</span>
							</DropdownMenuItem>
						</button>
					</form>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}

interface NavigationProps {
	isLandingPage: boolean;
}

function Navigation({ isLandingPage }: NavigationProps) {
	// Smooth scroll function for anchor links
	useEffect(() => {
		if (!isLandingPage) return;

		const handleAnchorClick = (e: MouseEvent) => {
			const target = e.currentTarget as HTMLAnchorElement;
			const href = target.getAttribute("href");
			// Check if the href is an anchor link
			if (href && href.startsWith("#")) {
				e.preventDefault();

				const targetId = href.substring(1);
				const targetElement = document.getElementById(targetId);

				if (targetElement) {
					window.scrollTo({
						top: targetElement.offsetTop,
						behavior: "smooth",
					});
				}
			}
		};

		// Add click event listeners to all anchor links
		const anchorLinks = document.querySelectorAll('a[href^="#"]');
		anchorLinks.forEach((link) => {
			link.addEventListener("click", handleAnchorClick as EventListener);
		});

		// Cleanup event listeners
		return () => {
			anchorLinks.forEach((link) => {
				link.removeEventListener("click", handleAnchorClick as EventListener);
			});
		};
	}, [isLandingPage]);

	if (!isLandingPage) return null;

	return (
		<div className="hidden md:flex items-center justify-center gap-8">
			<a
				href="#features"
				className="text-white hover:text-indigo-300 transition"
			>
				Features
			</a>
			<a
				href="#how-it-works"
				className="text-white hover:text-indigo-300 transition"
			>
				How It Works
			</a>
			<a
				href="#pricing"
				className="text-white hover:text-indigo-300 transition"
			>
				Pricing
			</a>
		</div>
	);
}

function Header({ darkMode }: { darkMode?: boolean }) {
	const pathname = usePathname();
	const isLandingPage = pathname === "/";

	return (
		<header
			className={
				darkMode
					? "w-full border-b border-slate-800"
					: "border-b border-gray-200"
			}
		>
			<div
				className={`max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center relative`}
			>
				{/* Logo positioned on the left */}
				<div className="flex-none w-[250px]">
					<Link href="/" className="flex items-center gap-2">
						<Globe2
							className={`h-8 w-8 ${
								darkMode ? "text-indigo-500" : "text-indigo-500"
							}`}
						/>
						<span
							className={
								darkMode
									? "text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600"
									: "text-xl font-semibold text-gray-900"
							}
						>
							Formorra
						</span>
					</Link>
				</div>

				{/* Navigation centered in the middle */}
				<div className="flex-1 flex justify-center">
					<Navigation isLandingPage={isLandingPage} />
				</div>

				{/* User menu on the right */}
				<div className="flex-none flex items-center space-x-4 w-[250px] justify-end">
					<Suspense fallback={<div className="h-9" />}>
						<UserMenu isLandingPage={isLandingPage} darkMode={darkMode} />
					</Suspense>
				</div>
			</div>
		</header>
	);
}

interface LayoutProps {
	children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
	const pathname = usePathname();
	const darkMode =
		pathname === "/" || pathname === "/contact" || pathname === "/privacy";

	return (
		<section
			className={`flex flex-col min-h-screen ${
				darkMode ? "bg-slate-950 text-slate-50" : ""
			}`}
		>
			<Header darkMode={darkMode} />
			<main className="flex-1 relative">{children}</main>
		</section>
	);
}
