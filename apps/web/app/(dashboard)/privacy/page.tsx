"use client";

import { Footer } from "@/components/footer";

export default function PrivacyPage() {
	return (
		<div className="w-full min-h-screen bg-slate-950 text-slate-50">
			{/* Hero Section */}
			<section className="w-full py-12 px-4 bg-gradient-to-b from-slate-950 to-slate-900">
				<div className="max-w-3xl mx-auto text-center">
					<h1 className="text-3xl md:text-5xl font-bold mb-6">
						Privacy Policy
					</h1>
					<p className="text-lg text-slate-300 max-w-2xl mx-auto">
						Learn how we collect, use, and protect your information when using
						Formora Bot.
					</p>
				</div>
			</section>

			{/* Privacy Policy Content */}
			<section className="w-full pb-12 px-4 bg-slate-900">
				<div className="max-w-4xl mx-auto prose prose-invert">
					<div className="text-center mb-8">
						<h1 className="text-3xl font-bold text-white mb-2">
							Privacy Policy for Formora Bot
						</h1>
						<p className="text-slate-300">
							<strong>Last Updated:</strong> June 20, 2025
						</p>
					</div>

					<div className="space-y-8 text-slate-100">
						<p className="text-lg leading-relaxed">
							This Privacy Policy explains how Formorra ("we," "us," or "our")
							collects, uses, and discloses information when you use our Discord
							bot, <strong>Formora Bot</strong> (the "Bot"). By adding and using
							the Bot, you agree to the practices described in this Privacy
							Policy.
						</p>

						<section>
							<h2 className="text-2xl font-semibold mb-4 text-white">
								1. Information We Collect
							</h2>
							<p className="mb-4">
								We collect different types of information depending on how you
								interact with the Bot:
							</p>

							<h3 className="text-xl font-medium mb-3 text-white">
								Discord-Provided Information (Automatically Collected):
							</h3>
							<ul className="list-disc pl-6 space-y-2 mb-4">
								<li>
									<strong>Server ID and Name:</strong> To allow the Bot to
									function within your server, store server-specific settings,
									and manage its presence.
								</li>
								<li>
									<strong>Channel IDs and Names:</strong> If you configure the
									Bot to interact with specific channels.
								</li>
								<li>
									<strong>User IDs (when necessary):</strong> We{" "}
									<strong>do not</strong> collect or store individual user IDs
									unless explicitly required for a core feature of the Bot. In
									such cases, the user ID is only stored for the specific
									purpose of that feature and is not linked to other personally
									identifiable information.
								</li>
								<li>
									<strong>Command Usage Data:</strong> We may log which commands
									are used, the server where they are used, and the timestamp.
									This is for troubleshooting, performance monitoring, and
									improving the Bot's functionality. We <strong>do not</strong>{" "}
									log the content of your messages unless it's directly part of
									a command's input that the bot needs to process.
								</li>
							</ul>

							<h3 className="text-xl font-medium mb-3 text-white">
								User-Provided Information (Voluntarily):
							</h3>
							<ul className="list-disc pl-6 space-y-2 mb-4">
								<li>
									<strong>Configuration Settings:</strong> Any settings you
									configure for the Bot within your Discord server. This data is
									typically tied to your server ID.
								</li>
								<li>
									<strong>Direct Interactions:</strong> If you communicate with
									us for support, feedback, or inquiries, we will collect the
									information you provide (e.g., your Discord username, email
									address if provided, and the content of your communication).
								</li>
							</ul>

							<h3 className="text-xl font-medium mb-3 text-white">
								We DO NOT collect:
							</h3>
							<ul className="list-disc pl-6 space-y-2">
								<li>
									Your Discord username or any personally identifiable
									information beyond what is strictly necessary for the Bot's
									functionality.
								</li>
								<li>
									Your private messages (DMs) unless you directly message the
									Bot for a specific command.
								</li>
								<li>
									Any chat content that is not part of a direct command
									interaction.
								</li>
								<li>
									Any tracking or analytics of your behavior beyond basic
									command usage for functional purposes.
								</li>
							</ul>
						</section>

						<section>
							<h2 className="text-2xl font-semibold mb-4 text-white">
								2. How We Use Your Information
							</h2>
							<p className="mb-4">
								We use the collected information for the following purposes:
							</p>
							<ul className="list-disc pl-6 space-y-2">
								<li>
									<strong>To Provide and Maintain the Bot:</strong> To enable
									the Bot to operate effectively within your Discord servers,
									respond to commands, and deliver its intended features.
								</li>
								<li>
									<strong>To Improve the Bot:</strong> To understand how the Bot
									is being used, identify bugs, and develop new features or
									improve existing ones.
								</li>
								<li>
									<strong>To Provide Support:</strong> To respond to your
									inquiries, troubleshoot issues, and provide assistance.
								</li>
								<li>
									<strong>For Legal Compliance:</strong> To comply with
									applicable laws, regulations, and Discord's Terms of Service
									and Developer Terms.
								</li>
							</ul>
						</section>

						<section>
							<h2 className="text-2xl font-semibold mb-4 text-white">
								3. Data Storage and Retention
							</h2>
							<ul className="list-disc pl-6 space-y-2">
								<li>
									<strong>Storage Location:</strong> All data is stored securely
									on servers located in the United States.
								</li>
								<li>
									<strong>Data Retention:</strong> We retain data only for as
									long as necessary to provide the Bot's services and fulfill
									the purposes outlined in this Privacy Policy, or as required
									by law.
								</li>
								<li>
									Server configurations are stored as long as the Bot is in your
									server. If the Bot is removed from a server, its associated
									server data will be deleted within a reasonable timeframe
									(e.g., 30 days).
								</li>
								<li>
									Command usage logs are typically retained for a limited period
									(e.g., 30-90 days) for operational purposes and then
									anonymized or deleted.
								</li>
								<li>
									Information related to support inquiries may be retained for
									longer to maintain a record of our communication.
								</li>
							</ul>
						</section>

						<section>
							<h2 className="text-2xl font-semibold mb-4 text-white">
								4. Sharing Your Information
							</h2>
							<p className="mb-4">
								We do not sell, trade, or otherwise transfer your personal
								information to third parties. We may share information in the
								following limited circumstances:
							</p>
							<ul className="list-disc pl-6 space-y-2">
								<li>
									<strong>With Your Consent:</strong> We may share your
									information if you give us explicit permission to do so.
								</li>
								<li>
									<strong>For Legal Reasons:</strong> We may disclose your
									information if required to do so by law or in response to
									valid requests by public authorities.
								</li>
								<li>
									<strong>To Protect Our Rights:</strong> We may disclose
									information when we believe it is necessary to protect our
									rights, property, or safety, or the rights, property, or
									safety of others.
								</li>
							</ul>
						</section>

						<section>
							<h2 className="text-2xl font-semibold mb-4 text-white">
								5. Data Security
							</h2>
							<p>
								We implement reasonable security measures to protect the
								information we collect from unauthorized access, disclosure,
								alteration, and destruction. However, no method of transmission
								over the internet or electronic storage is 100% secure, and we
								cannot guarantee absolute security.
							</p>
						</section>

						<section>
							<h2 className="text-2xl font-semibold mb-4 text-white">
								6. Your Rights
							</h2>
							<p className="mb-4">
								Depending on your jurisdiction, you may have the following
								rights regarding your data:
							</p>
							<ul className="list-disc pl-6 space-y-2 mb-4">
								<li>
									<strong>Right to Access:</strong> You have the right to
									request a copy of the personal information we hold about you.
								</li>
								<li>
									<strong>Right to Rectification:</strong> You have the right to
									request that we correct any inaccurate or incomplete
									information we hold about you.
								</li>
								<li>
									<strong>Right to Erasure (Right to be Forgotten):</strong> You
									have the right to request the deletion of your personal
									information, subject to certain legal exceptions. For
									server-specific data, removing the Bot from your server will
									initiate the deletion process for that server's settings.
								</li>
								<li>
									<strong>Right to Restrict Processing:</strong> You have the
									right to request that we limit the way we use your
									information.
								</li>
								<li>
									<strong>Right to Object to Processing:</strong> You have the
									right to object to our processing of your information under
									certain circumstances.
								</li>
								<li>
									<strong>Right to Data Portability:</strong> You have the right
									to request that we provide your information in a structured,
									commonly used, and machine-readable format.
								</li>
							</ul>
							<p>
								To exercise any of these rights, please contact us using the
								contact information provided below.
							</p>
						</section>

						<section>
							<h2 className="text-2xl font-semibold mb-4 text-white">
								7. Children's Privacy
							</h2>
							<p>
								The Bot is not intended for use by children under the age of 13.
								We do not knowingly collect personal information from children
								under 13. If we become aware that we have inadvertently
								collected personal information from a child under 13, we will
								take steps to delete that information as soon as possible.
							</p>
						</section>

						<section>
							<h2 className="text-2xl font-semibold mb-4 text-white">
								8. Changes to This Privacy Policy
							</h2>
							<p>
								We may update this Privacy Policy from time to time to reflect
								changes in our practices or for other operational, legal, or
								regulatory reasons. We will notify you of any significant
								changes by posting the new Privacy Policy on our Discord support
								server. Your continued use of the Bot after the effective date
								of the revised Privacy Policy constitutes your acceptance of the
								changes.
							</p>
						</section>

						<section>
							<h2 className="text-2xl font-semibold mb-4 text-white">
								9. Contact Us
							</h2>
							<p className="mb-4">
								If you have any questions or concerns about this Privacy Policy
								or our data practices, please contact us at:
							</p>
							<ul className="list-disc pl-6 space-y-2">
								<li>
									<strong>Email:</strong> hello@formorra.com
								</li>
								<li>
									<strong>Discord Support Server:</strong>{" "}
									<a
										href="https://discord.gg/abBZv2HRs8"
										className="text-blue-400 hover:text-blue-300 underline"
									>
										https://discord.gg/abBZv2HRs8
									</a>
								</li>
							</ul>
						</section>
					</div>
				</div>
			</section>

			{/* Import Footer component from your components directory */}
			<Footer />
		</div>
	);
}
