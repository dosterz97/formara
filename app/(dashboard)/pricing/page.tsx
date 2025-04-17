import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { checkoutAction } from "@/lib/payments/actions";
import { getStripePrices, getStripeProducts } from "@/lib/payments/stripe";
import { Check } from "lucide-react";
import Link from "next/link";
import { SubmitButton } from "./submit-button";

// Prices are fresh for one hour max
export const revalidate = 3600;

export default async function PricingPage() {
	const [prices, products] = await Promise.all([
		getStripePrices(),
		getStripeProducts(),
	]);

	const basePlan = products.find((product) => product.name === "Base");
	const plusPlan = products.find((product) => product.name === "Plus");

	const basePrice = prices.find((price) => price.productId === basePlan?.id);
	const plusPrice = prices.find((price) => price.productId === plusPlan?.id);

	return (
		<div className="w-full min-h-screen bg-slate-950 text-slate-50">
			{/* Hero Section */}
			<section className="w-full py-16 px-4 bg-gradient-to-b from-slate-950 to-slate-900">
				<div className="max-w-3xl mx-auto text-center">
					<h1 className="text-3xl md:text-5xl font-bold mb-6">
						Simple, Transparent Pricing
					</h1>
					<p className="text-lg text-white max-w-2xl mx-auto mb-8">
						Choose the plan that's right for your world-building needs. No
						hidden fees or surprise charges.
					</p>
				</div>
			</section>

			{/* Pricing Cards Section */}
			<section className="w-full py-16 px-4 bg-slate-900">
				<div className="max-w-6xl mx-auto">
					<div className="grid md:grid-cols-3 gap-8 mx-auto">
						{/* Free Plan */}
						<PricingCard
							name="Free"
							price={0}
							interval="forever"
							trialDays={0}
							features={[
								"3 Worlds Maximum",
								"Basic World Templates",
								"Community Support",
								"Standard Export Options",
							]}
							href="/sign-up"
							buttonText="Get Started Free"
							highlighted={false}
						/>

						{/* Base Plan */}
						<PricingCard
							name={basePlan?.name || "Base"}
							price={basePrice?.unitAmount || 800}
							interval={basePrice?.interval || "month"}
							trialDays={basePrice?.trialPeriodDays || 7}
							features={[
								"Unlimited Worlds",
								"Unlimited Workspace Members",
								"Email Support",
								"Advanced Templates",
								"Premium Export Options",
							]}
							priceId={basePrice?.id}
							highlighted={false}
						/>

						{/* Plus Plan */}
						<PricingCard
							name={plusPlan?.name || "Plus"}
							price={plusPrice?.unitAmount || 1200}
							interval={plusPrice?.interval || "month"}
							trialDays={plusPrice?.trialPeriodDays || 7}
							features={[
								"Everything in Base, plus:",
								"Early Access to New Features",
								"24/7 Support + Slack Access",
								"AI-Assisted Creation",
								"Custom Branded Exports",
							]}
							priceId={plusPrice?.id}
							highlighted={true}
						/>
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

function PricingCard({
	name,
	price,
	interval,
	trialDays,
	features,
	priceId,
	href,
	buttonText,
	highlighted = false,
}: {
	name: string;
	price: number;
	interval: string;
	trialDays: number;
	features: string[];
	priceId?: string;
	href?: string;
	buttonText?: string;
	highlighted?: boolean;
}) {
	return (
		<Card
			className={`bg-slate-800/50 border-slate-700 ${
				highlighted ? "border-indigo-500 ring-1 ring-indigo-500" : ""
			} overflow-hidden relative`}
		>
			{highlighted && (
				<div className="absolute top-0 inset-x-0 h-1.5 bg-indigo-500"></div>
			)}

			<div className="p-6">
				<h2 className="text-2xl font-bold text-white mb-2">{name}</h2>

				{trialDays > 0 && (
					<p className="text-sm text-slate-300 mb-4">
						with {trialDays} day free trial
					</p>
				)}

				<div className="mb-6">
					<p className="text-4xl font-bold text-white">
						{price === 0 ? (
							"Free"
						) : (
							<>
								${price / 100}
								<span className="text-lg font-normal text-slate-300 ml-1">
									per user / {interval}
								</span>
							</>
						)}
					</p>
				</div>

				<ul className="space-y-4 mb-8 min-h-48">
					{features.map((feature, index) => (
						<li key={index} className="flex items-start">
							<Check className="h-5 w-5 text-indigo-500 mr-2 mt-0.5 flex-shrink-0" />
							<span className="text-slate-200">{feature}</span>
						</li>
					))}
				</ul>

				{price === 0 && href ? (
					<Link href={href}>
						<Button className="w-full bg-indigo-600 hover:bg-indigo-700">
							{buttonText || "Get Started Free"}
						</Button>
					</Link>
				) : (
					<form action={checkoutAction} className="w-full">
						<input type="hidden" name="priceId" value={priceId} />
						<SubmitButton />
					</form>
				)}
			</div>
		</Card>
	);
}
