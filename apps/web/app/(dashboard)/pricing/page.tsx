import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { checkoutAction } from "@/lib/payments/actions";
import { getStripePrices, getStripeProducts } from "@/lib/payments/stripe";
import Link from "next/link";
import { SubmitButton } from "./submit-button";

// Prices are fresh for one hour max
export const revalidate = 3600;

export default async function PricingPage() {
	const [prices, products] = await Promise.all([
		getStripePrices(),
		getStripeProducts(),
	]);

	const creatorPlan = products.find((product) => product.name === "Creator");
	const studioPlan = products.find((product) => product.name === "Studio");

	const creatorPrice = prices.find(
		(price) => price.productId === creatorPlan?.id
	);
	const studioPrice = prices.find(
		(price) => price.productId === studioPlan?.id
	);

	return (
		<div className="w-full min-h-screen bg-slate-950 text-slate-50">
			{/* Hero Section */}
			<section className="w-full py-16 px-4 bg-gradient-to-b from-slate-950 to-slate-900">
				<div className="max-w-3xl mx-auto text-center">
					<h1 className="text-3xl md:text-5xl font-bold mb-6">
						Simple, Transparent Pricing
					</h1>
					<p className="text-lg text-white max-w-2xl mx-auto mb-8">
						Choose the plan that fits your Discord community, from small servers
						to large networks.
					</p>
				</div>
			</section>

			{/* Pricing Cards Section */}
			<section className="w-full py-16 px-4 bg-slate-900">
				<div className="max-w-6xl mx-auto">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
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
									{[
										"1 Discord Server",
										"1,000 messages per month",
										"Public Forum Support",
										"Standard Moderation",
									].map((feature, index) => (
										<li key={index} className="flex items-start gap-2">
											<div className="rounded-full bg-emerald-500/20 text-emerald-500 h-5 w-5 flex items-center justify-center text-xs mt-0.5">
												✓
											</div>
											<span className="text-white">{feature}</span>
										</li>
									))}
								</ul>
							</div>
							<div className="p-6 pt-0 mt-auto">
								<Link href="/sign-up">
									<Button className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-md transition-colors duration-200">
										Get Started Free
									</Button>
								</Link>
							</div>
						</div>

						{/* Creator Plan */}
						<div className="bg-gradient-to-b from-indigo-900/40 to-purple-900/40 border border-indigo-500/20 rounded-lg overflow-hidden relative flex flex-col">
							<div className="absolute top-0 right-0 bg-indigo-500 text-white px-3 py-1 text-sm font-medium rounded-bl-lg rounded-tr-lg">
								Popular
							</div>
							<div className="p-6 flex-grow">
								<div className="mb-4">
									<h3 className="text-xl text-white font-bold">
										{creatorPlan?.name || "Creator"}
									</h3>
									<p className="text-white">For growing communities</p>
								</div>
								<div className="mb-6">
									<span className="text-4xl font-bold text-white">
										${(creatorPrice?.unitAmount || 2000) / 100}
									</span>
									<span className="text-white">
										/{creatorPrice?.interval || "month"}
									</span>
								</div>
								{creatorPrice?.trialPeriodDays &&
									creatorPrice.trialPeriodDays > 0 && (
										<p className="text-sm text-indigo-300 mb-4">
											with {creatorPrice.trialPeriodDays} day free trial
										</p>
									)}
								<ul className="space-y-3 mb-8">
									{[
										"Everything in Free, plus:",
										"3 Discord Servers",
										"10,000 messages per month",
										"Personal Support",
										"Customized Moderation",
									].map((feature, index) => (
										<li key={index} className="flex items-start gap-2">
											<div className="rounded-full bg-indigo-500/30 text-indigo-300 h-5 w-5 flex items-center justify-center text-xs mt-0.5">
												✓
											</div>
											<span className="text-white">{feature}</span>
										</li>
									))}
								</ul>
							</div>
							<div className="p-6 pt-0 mt-auto">
								<form action={checkoutAction} className="w-full">
									<input
										type="hidden"
										name="priceId"
										value={creatorPrice?.id}
									/>
									<SubmitButton className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md transition-colors duration-200" />
								</form>
							</div>
						</div>

						{/* Studio Plan */}
						<div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden flex flex-col">
							<div className="p-6 flex-grow">
								<div className="mb-4">
									<h3 className="text-xl text-white font-bold">
										{studioPlan?.name || "Studio"}
									</h3>
									<p className="text-white">For large networks</p>
								</div>
								<div className="mb-6">
									<span className="text-4xl font-bold text-white">
										${(studioPrice?.unitAmount || 10000) / 100}
									</span>
									<span className="text-white">
										/{studioPrice?.interval || "month"}
									</span>
								</div>
								{studioPrice?.trialPeriodDays &&
									studioPrice.trialPeriodDays > 0 && (
										<p className="text-sm text-slate-300 mb-4">
											with {studioPrice.trialPeriodDays} day free trial
										</p>
									)}
								<ul className="space-y-3 mb-8">
									{[
										"Everything in Creator, plus:",
										"10 Discord Servers",
										"1,000,000 messages per month",
										"Private Discord Channel Support",
										"Full Customization",
										"Early Access to New Features",
										"24/7 Support + Slack Access",
										"AI-Assisted Creation",
										"Custom Branded Exports",
									].map((feature, index) => (
										<li key={index} className="flex items-start gap-2">
											<div className="rounded-full bg-emerald-500/20 text-emerald-500 h-5 w-5 flex items-center justify-center text-xs mt-0.5">
												✓
											</div>
											<span className="text-white">{feature}</span>
										</li>
									))}
								</ul>
							</div>
							<div className="p-6 pt-0 mt-auto">
								<form action={checkoutAction} className="w-full">
									<input type="hidden" name="priceId" value={studioPrice?.id} />
									<SubmitButton className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-md transition-colors duration-200" />
								</form>
							</div>
						</div>
					</div>

					{/* Additional FAQ about pricing */}
					<div className="mt-16 max-w-3xl mx-auto text-center">
						<h2 className="text-2xl font-bold mb-6 text-white">
							Frequently Asked Questions
						</h2>

						<div className="grid gap-6 mt-8">
							<Card className="bg-slate-800/50 border-slate-700 p-6 text-left">
								<h3 className="text-lg font-semibold mb-2 text-white">
									Can I upgrade or downgrade my plan?
								</h3>
								<p className="text-white text-sm">
									Yes, you can change your plan at any time. When upgrading,
									you'll be charged the prorated difference. When downgrading,
									the new price will apply at the start of your next billing
									cycle.
								</p>
							</Card>

							<Card className="bg-slate-800/50 border-slate-700 p-6 text-left">
								<h3 className="text-lg font-semibold mb-2 text-white">
									Do you offer custom plans for larger teams?
								</h3>
								<p className="text-white text-sm">
									Absolutely! If you have specific needs or a larger team,
									contact us for a custom plan tailored to your requirements.
								</p>
							</Card>

							<Card className="bg-slate-800/50 border-slate-700 p-6 text-left">
								<h3 className="text-lg font-semibold mb-2 text-white">
									How does the free trial work?
								</h3>
								<p className="text-white text-sm">
									You can try any paid plan risk-free for the specified trial
									period. You won't be charged until the trial ends, and you can
									cancel anytime before then.
								</p>
							</Card>
						</div>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="w-full py-16 px-4 bg-slate-950">
				<div className="max-w-3xl mx-auto text-center">
					<h2 className="text-2xl font-bold mb-4 text-white">
						Still have questions?
					</h2>
					<p className="text-white mb-8">
						Our team is here to help with any questions you might have about our
						plans.
					</p>
					<Link href="/contact">
						<Button className="bg-indigo-600 hover:bg-indigo-700">
							Contact Us
						</Button>
					</Link>
				</div>
			</section>

			{/* Import Footer component from your components directory */}
			<Footer />
		</div>
	);
}
