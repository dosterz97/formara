import Link from "next/link";
import React from "react";
import { Button } from "../ui/button";

const PricingSection: React.FC = () => {
	return (
		<section id="pricing" className="w-full py-20 px-4 bg-slate-900">
			<div className="max-w-6xl mx-auto">
				<div className="text-center mb-16">
					<h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
						Simple, Transparent Pricing
					</h2>
					<p className="text-lg text-white max-w-2xl mx-auto">
						Choose the plan that fits your Discord community, from small servers
						to large networks.
					</p>
				</div>

				{/* Main grid container with explicit 3 columns on md+ screens */}
				<div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
					{/* Free Plan */}
					<div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden flex flex-col">
						<div className="p-6 flex-grow">
							<div className="mb-4">
								<h3 className="text-xl text-white font-bold">Free</h3>
								<p className="text-white">For small communities</p>
							</div>
							<div className="mb-6">
								<span className="text-4xl font-bold text-white">$0</span>
								<span className="text-white">/month</span>
							</div>
							<ul className="space-y-3 mb-8">
								<li className="flex items-start gap-2">
									<div className="rounded-full bg-emerald-500/20 text-emerald-500 h-5 w-5 flex items-center justify-center text-xs mt-0.5">
										✓
									</div>
									<span className="text-white">1 Discord Server</span>
								</li>
								<li className="flex items-start gap-2">
									<div className="rounded-full bg-emerald-500/20 text-emerald-500 h-5 w-5 flex items-center justify-center text-xs mt-0.5">
										✓
									</div>
									<span className="text-white">Basic Moderation</span>
								</li>
								<li className="flex items-start gap-2">
									<div className="rounded-full bg-emerald-500/20 text-emerald-500 h-5 w-5 flex items-center justify-center text-xs mt-0.5">
										✓
									</div>
									<span className="text-white">Community Support</span>
								</li>
								<li className="flex items-start gap-2">
									<div className="rounded-full bg-emerald-500/20 text-emerald-500 h-5 w-5 flex items-center justify-center text-xs mt-0.5">
										✓
									</div>
									<span className="text-white">Basic FAQ Support</span>
								</li>
							</ul>
						</div>
						{/* Button container with consistent padding */}
						<div className="p-6 pt-0 mt-auto">
							<Link href="/sign-up">
								<Button className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-md transition-colors duration-200">
									Get Started Free
								</Button>
							</Link>
						</div>
					</div>

					{/* Creator Card */}
					<div className="bg-gradient-to-b from-indigo-900/40 to-purple-900/40 border border-indigo-500/20 rounded-lg overflow-hidden relative flex flex-col">
						<div className="absolute top-0 right-0 bg-indigo-500 text-white px-3 py-1 text-sm font-medium rounded-bl-lg rounded-tr-lg">
							Popular
						</div>
						<div className="p-6 flex-grow">
							<div className="mb-4">
								<h3 className="text-xl text-white font-bold">Creator</h3>
								<p className="text-white">For growing communities</p>
							</div>
							<div className="mb-6">
								<span className="text-4xl font-bold text-white">$20</span>
								<span className="text-white">/month</span>
							</div>
							<p className="text-sm text-indigo-300 mb-4">
								with 7 day free trial
							</p>
							<ul className="space-y-3 mb-8">
								<li className="flex items-start gap-2">
									<div className="rounded-full bg-indigo-500/30 text-indigo-300 h-5 w-5 flex items-center justify-center text-xs mt-0.5">
										✓
									</div>
									<span className="text-white">Up to 5 Discord Servers</span>
								</li>
								<li className="flex items-start gap-2">
									<div className="rounded-full bg-indigo-500/30 text-indigo-300 h-5 w-5 flex items-center justify-center text-xs mt-0.5">
										✓
									</div>
									<span className="text-white">Advanced Moderation</span>
								</li>
								<li className="flex items-start gap-2">
									<div className="rounded-full bg-indigo-500/30 text-indigo-300 h-5 w-5 flex items-center justify-center text-xs mt-0.5">
										✓
									</div>
									<span className="text-white">Email Support</span>
								</li>
								<li className="flex items-start gap-2">
									<div className="rounded-full bg-indigo-500/30 text-indigo-300 h-5 w-5 flex items-center justify-center text-xs mt-0.5">
										✓
									</div>
									<span className="text-white">Custom FAQ Training</span>
								</li>
								<li className="flex items-start gap-2">
									<div className="rounded-full bg-indigo-500/30 text-indigo-300 h-5 w-5 flex items-center justify-center text-xs mt-0.5">
										✓
									</div>
									<span className="text-white">Moderation Analytics</span>
								</li>
							</ul>
						</div>
						{/* Button container with consistent padding */}
						<div className="p-6 pt-0 mt-auto">
							<Link href="/pricing">
								<Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md transition-colors duration-200">
									Subscribe Now
								</Button>
							</Link>
						</div>
					</div>

					{/* Studio Card */}
					<div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden flex flex-col">
						<div className="p-6 flex-grow">
							<div className="mb-4">
								<h3 className="text-xl text-white font-bold">Studio</h3>
								<p className="text-white">For large networks</p>
							</div>
							<div className="mb-6">
								<span className="text-4xl font-bold text-white">$100</span>
								<span className="text-white">/month</span>
							</div>
							<p className="text-sm text-slate-300 mb-4">
								with 7 day free trial
							</p>
							<ul className="space-y-3 mb-8">
								<li className="flex items-start gap-2">
									<div className="rounded-full bg-emerald-500/20 text-emerald-500 h-5 w-5 flex items-center justify-center text-xs mt-0.5">
										✓
									</div>
									<span className="text-white">
										Everything in Creator, plus:
									</span>
								</li>
								<li className="flex items-start gap-2">
									<div className="rounded-full bg-emerald-500/20 text-emerald-500 h-5 w-5 flex items-center justify-center text-xs mt-0.5">
										✓
									</div>
									<span className="text-white">Unlimited Discord Servers</span>
								</li>
								<li className="flex items-start gap-2">
									<div className="rounded-full bg-emerald-500/20 text-emerald-500 h-5 w-5 flex items-center justify-center text-xs mt-0.5">
										✓
									</div>
									<span className="text-white">
										24/7 Support + Discord Access
									</span>
								</li>
								<li className="flex items-start gap-2">
									<div className="rounded-full bg-emerald-500/20 text-emerald-500 h-5 w-5 flex items-center justify-center text-xs mt-0.5">
										✓
									</div>
									<span className="text-white">Advanced AI Training</span>
								</li>
								<li className="flex items-start gap-2">
									<div className="rounded-full bg-emerald-500/20 text-emerald-500 h-5 w-5 flex items-center justify-center text-xs mt-0.5">
										✓
									</div>
									<span className="text-white">Custom Bot Branding</span>
								</li>
							</ul>
						</div>
						{/* Button container with consistent padding */}
						<div className="p-6 pt-0 mt-auto">
							<Link href="/pricing">
								<Button className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-md transition-colors duration-200">
									Subscribe Now
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};

export default PricingSection;
