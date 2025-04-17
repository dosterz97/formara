import { Globe2 } from "lucide-react";

export function Footer() {
	return (
		<footer className="w-full bg-slate-950 border-t border-slate-800 py-12">
			<div className="max-w-6xl mx-auto px-4">
				<div className="grid md:grid-cols-4 gap-8">
					<div>
						<div className="flex items-center gap-2 mb-4">
							<Globe2 className="h-6 w-6 text-indigo-500" />
							<span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
								Formorra
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
									href="/pricing"
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
									href="/contact"
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
					<p>© 2025 Formorra. All rights reserved.</p>
				</div>
			</div>
		</footer>
	);
}
