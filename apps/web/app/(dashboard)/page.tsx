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
import Link from "next/link";
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
						AI-Powered Discord Moderation & Support
					</h1>
					<p className="text-xl text-white max-w-3xl mx-auto mb-10">
						Formorra is your ultimate AI solution for Discord server management.
						It's designed to automate moderation and enhance member engagement,
						giving you back valuable time.
					</p>
					<div className="flex flex-col sm:flex-row justify-center gap-4">
						<Button
							size="lg"
							className="bg-indigo-600 hover:bg-indigo-700"
							onClick={() => {
								router.push("/sign-up");
							}}
						>
							Add to Discord <ArrowRight className="ml-2 h-4 w-4" />
						</Button>
						<IframePlayer src="https://www.youtube.com/embed/OYzrMr6o5OI">
							<Button size="lg" variant="secondary">
								See How It Works
							</Button>
						</IframePlayer>
					</div>

					{/* Hero Image */}
					<div className="mt-16 w-full max-w-5xl mx-auto bg-slate-800/50 rounded-lg border border-slate-700 p-4">
						<div className="aspect-video rounded-md overflow-hidden relative bg-slate-900">
							<video
								src="/videos/demo.mp4"
								autoPlay
								muted
								loop
								playsInline
								controls
								className="w-full h-full object-cover"
								title="Formorra Demo"
							>
								Your browser does not support the video tag.
							</video>
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section id="features" className="w-full py-20 px-4 bg-slate-900">
				<div className="max-w-6xl mx-auto">
					<div className="text-center mb-16">
						<h2 className="text-3xl md:text-4xl font-bold mb-4">
							What Formorra Does for You
						</h2>
						<p className="text-lg text-white max-w-2xl mx-auto">
							Automate moderation and enhance member engagement with powerful AI
							features designed for Discord communities.
						</p>
					</div>

					<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
						<Card className="bg-slate-800/50 border-slate-700 p-6">
							<div className="bg-indigo-500/10 w-12 h-12 rounded-md flex items-center justify-center mb-4">
								<Database className="text-indigo-500 h-6 w-6" />
							</div>
							<h3 className="text-xl text-white font-bold mb-2">
								Smart Moderation
							</h3>
							<p className="text-white">
								Keep your community safe 24/7 with AI-powered content filtering
								and rule enforcement.
							</p>
						</Card>

						<Card className="bg-slate-800/50 border-slate-700 p-6">
							<div className="bg-purple-500/10 w-12 h-12 rounded-md flex items-center justify-center mb-4">
								<Users className="text-purple-500 h-6 w-6" />
							</div>
							<h3 className="text-xl text-white font-bold mb-2">
								Instant Answers
							</h3>
							<p className="text-white">
								Provide immediate, accurate responses to member questions using
								your existing knowledge base.
							</p>
						</Card>

						<Card className="bg-slate-800/50 border-slate-700 p-6">
							<div className="bg-pink-500/10 w-12 h-12 rounded-md flex items-center justify-center mb-4">
								<Layers className="text-pink-500 h-6 w-6" />
							</div>
							<h3 className="text-xl text-white font-bold mb-2">
								Easy Training
							</h3>
							<p className="text-white">
								Simply upload your documents; our AI learns and adapts to your
								community's needs.
							</p>
						</Card>

						<Card className="bg-slate-800/50 border-slate-700 p-6">
							<div className="bg-blue-500/10 w-12 h-12 rounded-md flex items-center justify-center mb-4">
								<Globe className="text-blue-500 h-6 w-6" />
							</div>
							<h3 className="text-xl text-white font-bold mb-2">
								Real-time Insights
							</h3>
							<p className="text-white">
								Stay informed with instant alerts and detailed logs of all bot
								activity.
							</p>
						</Card>

						<Card className="bg-slate-800/50 border-slate-700 p-6">
							<div className="bg-emerald-500/10 w-12 h-12 rounded-md flex items-center justify-center mb-4">
								<Sparkles className="text-emerald-500 h-6 w-6" />
							</div>
							<h3 className="text-xl text-white font-bold mb-2">
								Custom Responses
							</h3>
							<p className="text-white">
								Train your bot to speak in your community's unique voice and
								style.
							</p>
						</Card>

						<Card className="bg-slate-800/50 border-slate-700 p-6">
							<div className="bg-amber-500/10 w-12 h-12 rounded-md flex items-center justify-center mb-4">
								<ArrowRight className="text-amber-500 h-6 w-6" />
							</div>
							<h3 className="text-xl text-white font-bold mb-2">
								Seamless Setup
							</h3>
							<p className="text-white">
								Get started in minutes with one-click Discord integration – no
								coding required.
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
						Ready to Transform Your Discord Server?
					</h2>
					<p className="text-lg text-white mb-12 max-w-2xl mx-auto">
						Automate moderation and answer questions with your own AI-powered
						Discord bot.
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<Link href="/sign-up">
							<Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
								Get Started <ArrowRight className="ml-2 h-4 w-4" />
							</Button>
						</Link>
						<IframePlayer src="https://www.youtube.com/embed/OYzrMr6o5OI">
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
