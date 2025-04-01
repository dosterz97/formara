"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	ArrowRight,
	Database,
	Globe,
	Layers,
	Sparkles,
	Users,
} from "lucide-react";
import { useEffect } from "react";

export default function FormLandingPage() {
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
						<Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
							Start Creating <ArrowRight className="ml-2 h-4 w-4" />
						</Button>
						<Button size="lg" variant="secondary">
							Watch Demo
						</Button>
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
							Formora connects all elements of your creative universe, making it
							easier than ever to develop consistent, rich worlds.
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
			<section id="how-it-works" className="w-full py-20 px-4 bg-slate-950">
				<div className="max-w-6xl mx-auto">
					<div className="text-center mb-16">
						<h2 className="text-3xl md:text-4xl font-bold mb-4">
							How Formora Works
						</h2>
						<p className="text-lg text-white max-w-2xl mx-auto">
							Our platform makes it easy to connect all the elements of your
							creative universe.
						</p>
					</div>

					<Tabs defaultValue="create" className="max-w-4xl mx-auto">
						<TabsList className="grid grid-cols-3 mb-8">
							<TabsTrigger value="create">Create</TabsTrigger>
							<TabsTrigger value="connect">Connect</TabsTrigger>
							<TabsTrigger value="expand">Expand</TabsTrigger>
						</TabsList>

						<TabsContent
							value="create"
							className="bg-slate-800/30 p-6 rounded-lg border border-slate-700"
						>
							<div className="flex flex-col md:flex-row gap-8 items-center">
								<div className="md:w-1/2">
									<h3 className="text-2xl font-bold mb-4">
										Build Your Foundation
									</h3>
									<p className="text-white mb-4">
										Start by establishing the core elements of your
										universe—geography, history, rules, and key characters.
									</p>
									<ul className="space-y-2 text-white">
										<li className="flex items-center gap-2">
											<div className="h-2 w-2 rounded-full bg-indigo-500"></div>
											Define the foundational rules of your world
										</li>
										<li className="flex items-center gap-2">
											<div className="h-2 w-2 rounded-full bg-indigo-500"></div>
											Establish key locations and time periods
										</li>
										<li className="flex items-center gap-2">
											<div className="h-2 w-2 rounded-full bg-indigo-500"></div>
											Create character archetypes and cultural templates
										</li>
									</ul>
								</div>
								<div className="md:w-1/2 bg-slate-900 rounded-lg p-4 aspect-video flex items-center justify-center">
									<div className="grid grid-cols-2 gap-4 w-full max-w-sm">
										<div className="bg-slate-800 h-32 rounded flex items-center justify-center text-slate-500">
											World Map
										</div>
										<div className="bg-slate-800 h-32 rounded flex items-center justify-center text-slate-500">
											Timeline
										</div>
										<div className="bg-slate-800 h-32 rounded flex items-center justify-center text-slate-500">
											Rules
										</div>
										<div className="bg-slate-800 h-32 rounded flex items-center justify-center text-slate-500">
											Cultures
										</div>
									</div>
								</div>
							</div>
						</TabsContent>

						<TabsContent
							value="connect"
							className="bg-slate-800/30 p-6 rounded-lg border border-slate-700"
						>
							<div className="flex flex-col md:flex-row gap-8 items-center">
								<div className="md:w-1/2">
									<h3 className="text-2xl font-bold mb-4">
										Link Everything Together
									</h3>
									<p className="text-white mb-4">
										Establish relationships between elements to create a rich
										interconnected universe that maintains consistency.
									</p>
									<ul className="space-y-2 text-white">
										<li className="flex items-center gap-2">
											<div className="h-2 w-2 rounded-full bg-purple-500"></div>
											Connect characters to locations, events, and other
											characters
										</li>
										<li className="flex items-center gap-2">
											<div className="h-2 w-2 rounded-full bg-purple-500"></div>
											Link historical events to their consequences
										</li>
										<li className="flex items-center gap-2">
											<div className="h-2 w-2 rounded-full bg-purple-500"></div>
											Create cause-effect relationships across your world
										</li>
									</ul>
								</div>
								<div className="md:w-1/2 bg-slate-900 rounded-lg p-4 aspect-video flex items-center justify-center">
									<div className="w-full max-w-sm h-48 relative">
										<div className="absolute left-4 top-0 w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center text-xs">
											Character
										</div>
										<div className="absolute left-0 bottom-0 w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center text-xs">
											Location
										</div>
										<div className="absolute right-4 top-0 w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center text-xs">
											Event
										</div>
										<div className="absolute right-0 bottom-0 w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center text-xs">
											Item
										</div>
									</div>
								</div>
							</div>
						</TabsContent>

						<TabsContent
							value="expand"
							className="bg-slate-800/30 p-6 rounded-lg border border-slate-700"
						>
							<div className="flex flex-col md:flex-row gap-8 items-center">
								<div className="md:w-1/2">
									<h3 className="text-2xl font-bold mb-4">
										Grow Your Universe
									</h3>
									<p className="text-white mb-4">
										Expand your world by adding new characters, locations, and
										storylines that automatically inherit existing rules.
									</p>
									<ul className="space-y-2 text-white">
										<li className="flex items-center gap-2">
											<div className="h-2 w-2 rounded-full bg-emerald-500"></div>
											Generate new characters that fit your established world
										</li>
										<li className="flex items-center gap-2">
											<div className="h-2 w-2 rounded-full bg-emerald-500"></div>
											Expand regions with consistent cultural attributes
										</li>
										<li className="flex items-center gap-2">
											<div className="h-2 w-2 rounded-full bg-emerald-500"></div>
											Create stories that respect your world's internal logic
										</li>
									</ul>
								</div>
								<div className="md:w-1/2 bg-slate-900 rounded-lg p-4 aspect-video flex items-center justify-center">
									<div className="grid grid-cols-3 gap-2">
										<div className="bg-slate-800 h-12 rounded"></div>
										<div className="bg-slate-800 h-12 rounded"></div>
										<div className="bg-slate-800 h-12 rounded"></div>

										<div className="bg-slate-700 h-12 rounded"></div>
										<div className="bg-slate-700 h-12 rounded"></div>
										<div className="bg-slate-700 h-12 rounded"></div>

										<div className="bg-slate-600 h-12 rounded"></div>
										<div className="bg-slate-600 h-12 rounded"></div>
										<div className="bg-slate-600 h-12 rounded"></div>
									</div>
								</div>
							</div>
						</TabsContent>
					</Tabs>
				</div>
			</section>

			{/* Pricing Section */}
			<section id="pricing" className="w-full py-20 px-4 bg-slate-900">
				<div className="max-w-6xl mx-auto">
					<div className="text-center mb-16">
						<h2 className="text-3xl md:text-4xl font-bold mb-4">
							Simple, Transparent Pricing
						</h2>
						<p className="text-lg text-white max-w-2xl mx-auto">
							Choose the plan that fits your creative needs, from hobbyists to
							professional world-builders.
						</p>
					</div>

					<div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
						<Card className="bg-slate-800/50 border-slate-700 p-6 text-white">
							<div className="mb-4">
								<h3 className="text-xl text-white font-bold">Explorer</h3>
								<p className="text-white">For hobbyist creators</p>
							</div>
							<div className="mb-6">
								<span className="text-4xl font-bold">$9</span>
								<span className="text-white">/month</span>
							</div>
							<ul className="space-y-3 mb-8">
								<li className="flex items-start gap-2">
									<div className="rounded-full bg-emerald-500/20 text-emerald-500 h-5 w-5 flex items-center justify-center text-xs mt-0.5">
										✓
									</div>
									<span>1 universe with up to 100 elements</span>
								</li>
								<li className="flex items-start gap-2">
									<div className="rounded-full bg-emerald-500/20 text-emerald-500 h-5 w-5 flex items-center justify-center text-xs mt-0.5">
										✓
									</div>
									<span>Basic relationship mapping</span>
								</li>
								<li className="flex items-start gap-2">
									<div className="rounded-full bg-emerald-500/20 text-emerald-500 h-5 w-5 flex items-center justify-center text-xs mt-0.5">
										✓
									</div>
									<span>Character generation (10/month)</span>
								</li>
								<li className="flex items-start gap-2">
									<div className="rounded-full bg-emerald-500/20 text-emerald-500 h-5 w-5 flex items-center justify-center text-xs mt-0.5">
										✓
									</div>
									<span>Standard export options</span>
								</li>
							</ul>
							<Button className="w-full bg-slate-700 hover:bg-slate-600">
								Get Started
							</Button>
						</Card>

						<Card className="bg-gradient-to-b from-indigo-900/40 to-purple-900/40 border-indigo-500/20 relative p-6 text-white">
							<div className="absolute top-0 right-0 bg-indigo-500 text-white px-3 py-1 text-sm font-medium rounded-bl-lg rounded-tr-lg">
								Popular
							</div>
							<div className="mb-4">
								<h3 className="text-xl text-white font-bold">Creator</h3>
								<p className="text-white">For serious world-builders</p>
							</div>
							<div className="mb-6">
								<span className="text-4xl font-bold">$19</span>
								<span className="text-white">/month</span>
							</div>
							<ul className="space-y-3 mb-8">
								<li className="flex items-start gap-2">
									<div className="rounded-full bg-indigo-500/30 text-indigo-300 h-5 w-5 flex items-center justify-center text-xs mt-0.5">
										✓
									</div>
									<span>5 universes with unlimited elements</span>
								</li>
								<li className="flex items-start gap-2">
									<div className="rounded-full bg-indigo-500/30 text-indigo-300 h-5 w-5 flex items-center justify-center text-xs mt-0.5">
										✓
									</div>
									<span>Advanced relationship mapping</span>
								</li>
								<li className="flex items-start gap-2">
									<div className="rounded-full bg-indigo-500/30 text-indigo-300 h-5 w-5 flex items-center justify-center text-xs mt-0.5">
										✓
									</div>
									<span>Character generation (50/month)</span>
								</li>
								<li className="flex items-start gap-2">
									<div className="rounded-full bg-indigo-500/30 text-indigo-300 h-5 w-5 flex items-center justify-center text-xs mt-0.5">
										✓
									</div>
									<span>Interactive maps</span>
								</li>
								<li className="flex items-start gap-2">
									<div className="rounded-full bg-indigo-500/30 text-indigo-300 h-5 w-5 flex items-center justify-center text-xs mt-0.5">
										✓
									</div>
									<span>All export options</span>
								</li>
							</ul>
							<Button className="w-full bg-indigo-600 hover:bg-indigo-700">
								Get Started
							</Button>
						</Card>

						<Card className="bg-slate-800/50 border-slate-700 p-6 text-white">
							<div className="mb-4">
								<h3 className="text-xl text-white font-bold">Studio</h3>
								<p className="text-white">For professional teams</p>
							</div>
							<div className="mb-6">
								<span className="text-4xl font-bold">$49</span>
								<span className="text-white">/month</span>
							</div>
							<ul className="space-y-3 mb-8">
								<li className="flex items-start gap-2">
									<div className="rounded-full bg-emerald-500/20 text-emerald-500 h-5 w-5 flex items-center justify-center text-xs mt-0.5">
										✓
									</div>
									<span>Unlimited universes and elements</span>
								</li>
								<li className="flex items-start gap-2">
									<div className="rounded-full bg-emerald-500/20 text-emerald-500 h-5 w-5 flex items-center justify-center text-xs mt-0.5">
										✓
									</div>
									<span>Team collaboration (5 members)</span>
								</li>
								<li className="flex items-start gap-2">
									<div className="rounded-full bg-emerald-500/20 text-emerald-500 h-5 w-5 flex items-center justify-center text-xs mt-0.5">
										✓
									</div>
									<span>Unlimited character generation</span>
								</li>
								<li className="flex items-start gap-2">
									<div className="rounded-full bg-emerald-500/20 text-emerald-500 h-5 w-5 flex items-center justify-center text-xs mt-0.5">
										✓
									</div>
									<span>API access</span>
								</li>
								<li className="flex items-start gap-2">
									<div className="rounded-full bg-emerald-500/20 text-emerald-500 h-5 w-5 flex items-center justify-center text-xs mt-0.5">
										✓
									</div>
									<span>Priority support</span>
								</li>
							</ul>
							<Button className="w-full bg-slate-700 hover:bg-slate-600">
								Get Started
							</Button>
						</Card>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="w-full py-20 px-4 bg-slate-950">
				<div className="max-w-4xl mx-auto bg-gradient-to-r from-indigo-900/40 to-purple-900/40 rounded-2xl p-8 md:p-12 border border-indigo-500/20 text-center">
					<h2 className="text-3xl md:text-4xl font-bold mb-4">
						Ready to Build Your Universe?
					</h2>
					<p className="text-lg text-white mb-8 max-w-2xl mx-auto">
						Join thousands of creators who are using Formora to build rich,
						consistent worlds for their stories, games, and creative projects.
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
							Start Your Free Trial <ArrowRight className="ml-2 h-4 w-4" />
						</Button>
						<Button size="lg" variant="secondary">
							Watch Demo
						</Button>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="w-full bg-slate-950 border-t border-slate-800 py-12">
				<div className="max-w-6xl mx-auto px-4">
					<div className="grid md:grid-cols-4 gap-8">
						<div>
							<div className="flex items-center gap-2 mb-4">
								<Globe className="h-6 w-6 text-indigo-500" />
								<span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
									Formora
								</span>
							</div>
							<p className="text-white mb-4">
								Create connected universes for your stories, games, and creative
								projects.
							</p>
						</div>

						<div>
							<h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
								Product
							</h3>
							<ul className="space-y-2">
								<li>
									<a
										href="#features"
										className="text-white hover:text-indigo-300 transition"
									>
										Features
									</a>
								</li>
								<li>
									<a
										href="#pricing"
										className="text-white hover:text-indigo-300 transition"
									>
										Pricing
									</a>
								</li>
								<li>
									<a
										href="#"
										className="text-white hover:text-indigo-300 transition"
									>
										API
									</a>
								</li>
								<li>
									<a
										href="#"
										className="text-white hover:text-indigo-300 transition"
									>
										Templates
									</a>
								</li>
							</ul>
						</div>

						<div>
							<h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
								Resources
							</h3>
							<ul className="space-y-2">
								<li>
									<a
										href="#"
										className="text-white hover:text-indigo-300 transition"
									>
										Documentation
									</a>
								</li>
								<li>
									<a
										href="#"
										className="text-white hover:text-indigo-300 transition"
									>
										Tutorials
									</a>
								</li>
								<li>
									<a
										href="#"
										className="text-white hover:text-indigo-300 transition"
									>
										Blog
									</a>
								</li>
								<li>
									<a
										href="#"
										className="text-white hover:text-indigo-300 transition"
									>
										Community
									</a>
								</li>
							</ul>
						</div>

						<div>
							<h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
								Company
							</h3>
							<ul className="space-y-2">
								<li>
									<a
										href="#"
										className="text-white hover:text-indigo-300 transition"
									>
										About
									</a>
								</li>
								<li>
									<a
										href="#"
										className="text-white hover:text-indigo-300 transition"
									>
										Careers
									</a>
								</li>
								<li>
									<a
										href="#"
										className="text-white hover:text-indigo-300 transition"
									>
										Contact
									</a>
								</li>
								<li>
									<a
										href="#"
										className="text-white hover:text-indigo-300 transition"
									>
										Privacy
									</a>
								</li>
							</ul>
						</div>
					</div>

					<div className="mt-12 pt-8 border-t border-slate-800 text-center text-white text-sm">
						<p>© 2025 Formora. All rights reserved.</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
