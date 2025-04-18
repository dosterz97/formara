import { stripe } from "../payments/stripe";

async function createStripeProducts() {
	console.log("Creating Stripe products and prices...");

	const creatorProduct = await stripe.products.create({
		name: "Creator",
		description: "Creator subscription plan",
	});

	await stripe.prices.create({
		product: creatorProduct.id,
		unit_amount: 2000, // $20 in cents
		currency: "usd",
		recurring: {
			interval: "month",
			trial_period_days: 7,
		},
	});

	const studioProduct = await stripe.products.create({
		name: "Studio",
		description: "Studio subscription plan",
	});

	await stripe.prices.create({
		product: studioProduct.id,
		unit_amount: 10000, // $100 in cents
		currency: "usd",
		recurring: {
			interval: "month",
			trial_period_days: 7,
		},
	});

	console.log("Stripe products and prices created successfully.");
}

async function seed() {
	await createStripeProducts();
}

seed()
	.catch((error) => {
		console.error("Seed process failed:", error);
		process.exit(1);
	})
	.finally(() => {
		console.log("Seed process finished. Exiting...");
		process.exit(0);
	});
