"use client";

import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm, ValidationError } from "@formspree/react";
import { CheckCircle, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export default function ContactPage() {
	const router = useRouter();
	const [state, handleSubmit] = useForm("mblgebav");

	// Show success toast when form is successfully submitted
	useEffect(() => {
		if (state.succeeded) {
			toast.success("Message sent!", {
				description:
					"We've received your message and will get back to you soon.",
			});
		}
	}, [state.succeeded]);

	// Show error toast when form submission fails
	useEffect(() => {
		if (state.errors) {
			toast.error("Error", {
				description: "Please check the form and try again.",
			});
		}
	}, [state.errors]);

	return (
		<div className="w-full min-h-screen bg-slate-950 text-slate-50">
			{/* Hero Section */}
			<section className="w-full py-16 px-4 bg-gradient-to-b from-slate-950 to-slate-900">
				<div className="max-w-3xl mx-auto text-center">
					<h1 className="text-3xl md:text-5xl font-bold mb-6">Get in Touch</h1>
					<p className="text-lg text-white max-w-2xl mx-auto mb-8">
						Have questions about Formorra? Our team is here to help.
					</p>
				</div>
			</section>

			{/* Contact Form */}
			<section className="w-full py-16 px-4 bg-slate-900">
				<div className="max-w-md mx-auto">
					<Card className="bg-slate-800/50 border-slate-700 p-6">
						<h2 className="text-xl font-bold mb-6 text-white">
							Send us a message
						</h2>

						{state.succeeded ? (
							<div className="flex flex-col items-center justify-center py-8">
								<div className="bg-green-500/10 w-14 h-14 rounded-full flex items-center justify-center mb-4">
									<CheckCircle className="text-green-500 h-6 w-6" />
								</div>
								<h3 className="text-lg font-bold mb-2 text-white">
									Message Sent!
								</h3>
								<p className="text-center mb-6 text-white">
									Thanks for reaching out. We'll get back to you soon.
								</p>
								<Button
									variant="outline"
									onClick={() => window.location.reload()}
								>
									Send Another Message
								</Button>
							</div>
						) : (
							<form onSubmit={handleSubmit} className="space-y-4">
								<div className="space-y-2">
									<label htmlFor="name" className="text-white font-medium">
										Your Name
									</label>
									<Input
										id="name"
										name="name"
										placeholder="John Doe"
										required
										className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
									/>
									<ValidationError
										prefix="Name"
										field="name"
										errors={state.errors}
										className="text-red-400 text-sm mt-1"
									/>
								</div>

								<div className="space-y-2">
									<label htmlFor="email" className="text-white font-medium">
										Email Address
									</label>
									<Input
										id="email"
										name="email"
										type="email"
										placeholder="you@example.com"
										required
										className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
									/>
									<ValidationError
										prefix="Email"
										field="email"
										errors={state.errors}
										className="text-red-400 text-sm mt-1"
									/>
								</div>

								<div className="space-y-2">
									<label htmlFor="subject" className="text-white font-medium">
										Subject
									</label>
									<Input
										id="subject"
										name="subject"
										placeholder="How can we help?"
										required
										className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
									/>
									<ValidationError
										prefix="Subject"
										field="subject"
										errors={state.errors}
										className="text-red-400 text-sm mt-1"
									/>
								</div>

								<div className="space-y-2">
									<label htmlFor="message" className="text-white font-medium">
										Message
									</label>
									<Textarea
										id="message"
										name="message"
										placeholder="Tell us more about your project..."
										required
										rows={5}
										className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
									/>
									<ValidationError
										prefix="Message"
										field="message"
										errors={state.errors}
										className="text-red-400 text-sm mt-1"
									/>
								</div>

								<Button
									type="submit"
									size="lg"
									disabled={state.submitting}
									className="bg-indigo-600 hover:bg-indigo-700 w-full"
								>
									{state.submitting ? (
										<span className="flex items-center">Sending...</span>
									) : (
										<span className="flex items-center justify-center">
											Send Message <Send className="ml-2 h-4 w-4" />
										</span>
									)}
								</Button>
								<ValidationError
									errors={state.errors}
									className="text-red-400 text-sm mt-1"
								/>
							</form>
						)}
					</Card>
				</div>
			</section>

			{/* Import Footer component from your components directory */}
			<Footer />
		</div>
	);
}
