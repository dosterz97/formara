"use client";

import { Footer } from "@/components/footer";
import AnimatedTabs from "@/components/home/animated-tabs";
import PricingSection from "@/components/home/pricing-cards";
import { IframePlayer } from "@/components/iframe-lightbox";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	ArrowRight,
	Database,
	Globe,
	Layers,
	Sparkles,
	Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function FormLandingPage() {
	const router = useRouter();
	// Smooth scroll function for anchor links
	useEffect(() => {
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
	}, []);

	return (
		<div className="w-full min-h-screen bg-slate-950 text-slate-50">
			{/* Hero Section */}
			<section className="w-full py-20 px-4 bg-gradient-to-b from-slate-950 to-slate-900">
				<div className="max-w-6xl mx-auto text-center">
					<h1 className="text-4xl md:text-6xl font-bold mb-6">
						Create Connected Universes for Your Stories
					</h1>
					<p className="text-xl text-white max-w-3xl mx-auto mb-10">
						Build rich metaverses where all your characters, lore, and
						world-building connect seamlessly in one centralized hub.
					</p>
					<div className="flex flex-col sm:flex-row justify-center gap-4">
						<Button
							size="lg"
							className="bg-indigo-600 hover:bg-indigo-700"
							onClick={() => {
								router.push("/sign-up");
							}}
						>
							Start Creating <ArrowRight className="ml-2 h-4 w-4" />
						</Button>
						<IframePlayer src="https://app.supademo.com/embed/cm9thg38f0ksv11m7d1qxfpsj?embed_v=2">
							<Button size="lg" variant="secondary">
								Watch Demo
							</Button>
						</IframePlayer>
					</div>

					{/* Hero Image */}
					<div className="mt-16 w-full max-w-5xl mx-auto bg-slate-800/50 rounded-lg border border-slate-700 p-4">
						<div className="aspect-video rounded-md overflow-hidden relative bg-slate-900">
							<div className="absolute inset-0 flex items-center justify-center">
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 w-full">
									<div className="col-span-1 bg-slate-800 rounded-md p-4 h-64">
										<div className="h-8 w-32 bg-indigo-500/20 rounded mb-4"></div>
										<div className="space-y-2">
											<div className="h-4 w-full bg-slate-700 rounded"></div>
											<div className="h-4 w-full bg-slate-700 rounded"></div>
											<div className="h-4 w-3/4 bg-slate-700 rounded"></div>
										</div>
									</div>
									<div className="col-span-2 bg-slate-800 rounded-md p-4 hidden md:block">
										<div className="h-full flex flex-col">
											<div className="flex justify-between mb-4">
												<div className="h-8 w-40 bg-purple-500/20 rounded"></div>
												<div className="h-8 w-20 bg-indigo-500/20 rounded"></div>
											</div>
											<div className="flex-1 grid grid-cols-2 gap-4">
												<div className="bg-slate-700/50 rounded-md p-3">
													<div className="h-24 bg-slate-600/50 rounded mb-3"></div>
													<div className="h-4 w-3/4 bg-slate-600 rounded mb-2"></div>
													<div className="h-4 w-1/2 bg-slate-600 rounded"></div>
												</div>
												<div className="bg-slate-700/50 rounded-md p-3">
													<div className="h-24 bg-slate-600/50 rounded mb-3"></div>
													<div className="h-4 w-3/4 bg-slate-600 rounded mb-2"></div>
													<div className="h-4 w-1/2 bg-slate-600 rounded"></div>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section id="features" className="w-full py-20 px-4 bg-slate-900">
				<div className="max-w-6xl mx-auto">
					<div className="text-center mb-16">
						<h2 className="text-3xl md:text-4xl font-bold mb-4">
							Everything You Need For World Building
						</h2>
						<p className="text-lg text-white max-w-2xl mx-auto">
							Formorra connects all elements of your creative universe, making
							it easier than ever to develop consistent, rich worlds.
						</p>
					</div>

					<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
						<Card className="bg-slate-800/50 border-slate-700 p-6">
							<div className="bg-indigo-500/10 w-12 h-12 rounded-md flex items-center justify-center mb-4">
								<Database className="text-indigo-500 h-6 w-6" />
							</div>
							<h3 className="text-xl text-white font-bold mb-2">
								Centralized Knowledge Base
							</h3>
							<p className="text-white">
								Store all your world's information in one place, with powerful
								linking and relationship tools.
							</p>
						</Card>

						<Card className="bg-slate-800/50 border-slate-700 p-6">
							<div className="bg-purple-500/10 w-12 h-12 rounded-md flex items-center justify-center mb-4">
								<Users className="text-purple-500 h-6 w-6" />
							</div>
							<h3 className="text-xl text-white font-bold mb-2">
								Character Generation
							</h3>
							<p className="text-white">
								Quickly create new characters that automatically inherit
								consistent traits from your universe.
							</p>
						</Card>

						<Card className="bg-slate-800/50 border-slate-700 p-6">
							<div className="bg-pink-500/10 w-12 h-12 rounded-md flex items-center justify-center mb-4">
								<Layers className="text-pink-500 h-6 w-6" />
							</div>
							<h3 className="text-xl text-white font-bold mb-2">
								Layered Worldbuilding
							</h3>
							<p className="text-white">
								Build your universe in layers, from geography and cultures to
								magic systems and technology.
							</p>
						</Card>

						<Card className="bg-slate-800/50 border-slate-700 p-6">
							<div className="bg-blue-500/10 w-12 h-12 rounded-md flex items-center justify-center mb-4">
								<Globe className="text-blue-500 h-6 w-6" />
							</div>
							<h3 className="text-xl text-white font-bold mb-2">
								Interactive Maps
							</h3>
							<p className="text-white">
								Create detailed maps of your world with location-specific lore,
								characters, and events.
							</p>
						</Card>

						<Card className="bg-slate-800/50 border-slate-700 p-6">
							<div className="bg-emerald-500/10 w-12 h-12 rounded-md flex items-center justify-center mb-4">
								<Sparkles className="text-emerald-500 h-6 w-6" />
							</div>
							<h3 className="text-xl text-white font-bold mb-2">
								AI-Assisted Creation
							</h3>
							<p className="text-white">
								Generate ideas, expand lore, and develop characters with AI that
								understands your universe.
							</p>
						</Card>

						<Card className="bg-slate-800/50 border-slate-700 p-6">
							<div className="bg-amber-500/10 w-12 h-12 rounded-md flex items-center justify-center mb-4">
								<ArrowRight className="text-amber-500 h-6 w-6" />
							</div>
							<h3 className="text-xl text-white font-bold mb-2">
								Cross-Platform Export
							</h3>
							<p className="text-white">
								Export your world data to various formats for use in games,
								books, or other creative projects.
							</p>
						</Card>
					</div>
				</div>
			</section>

			{/* How It Works */}
			<section id="how-it-works">
				<AnimatedTabs />
			</section>

			{/* Pricing Section */}
			<section id="pricing">
				<PricingSection />
			</section>

			{/* CTA Section */}
			<section className="w-full py-20 px-4 bg-slate-950">
				<div className="max-w-4xl mx-auto bg-gradient-to-r from-indigo-900/40 to-purple-900/40 rounded-2xl p-8 md:p-12 border border-indigo-500/20 text-center">
					<h2 className="text-3xl md:text-4xl font-bold mb-4">
						Ready to Build Your Universe?
					</h2>
					<p className="text-lg text-white mb-8 max-w-2xl mx-auto">
						Join thousands of creators who are using Formorra to build rich,
						consistent worlds for their stories, games, and creative projects.
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
							Start Your Free Trial <ArrowRight className="ml-2 h-4 w-4" />
						</Button>
						<IframePlayer src="https://app.supademo.com/embed/cm9thg38f0ksv11m7d1qxfpsj?embed_v=2">
							<Button size="lg" variant="secondary">
								Watch Demo
							</Button>
						</IframePlayer>
					</div>
				</div>
			</section>
			<Footer />
		</div>
	);
}
