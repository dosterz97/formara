import React, { useState } from "react";

type TabId = "create" | "connect" | "expand";

interface TabContent {
	title: string;
	description: string;
	color: string;
	items: string[];
	visual: React.ReactNode;
}

interface TabsContent {
	[key: string]: TabContent;
}

const AnimatedTabs: React.FC = () => {
	const [activeTab, setActiveTab] = useState<TabId>("create");

	const tabContent: TabsContent = {
		create: {
			title: "Build Your Foundation",
			description:
				"Start by establishing the core elements of your universe—geography, history, rules, and key characters.",
			color: "bg-indigo-500",
			items: [
				"Define the foundational rules of your world",
				"Establish key locations and time periods",
				"Create character archetypes and cultural templates",
			],
			visual: (
				<div className="grid grid-cols-2 gap-4 w-full max-w-sm">
					<div className="bg-slate-800 h-32 rounded flex items-center justify-center text-slate-500 transform transition-all duration-500 hover:scale-105 hover:bg-slate-700">
						World Map
					</div>
					<div className="bg-slate-800 h-32 rounded flex items-center justify-center text-slate-500 transform transition-all duration-500 hover:scale-105 hover:bg-slate-700">
						Timeline
					</div>
					<div className="bg-slate-800 h-32 rounded flex items-center justify-center text-slate-500 transform transition-all duration-500 hover:scale-105 hover:bg-slate-700">
						Rules
					</div>
					<div className="bg-slate-800 h-32 rounded flex items-center justify-center text-slate-500 transform transition-all duration-500 hover:scale-105 hover:bg-slate-700">
						Cultures
					</div>
				</div>
			),
		},
		connect: {
			title: "Link Everything Together",
			description:
				"Establish relationships between elements to create a rich interconnected universe that maintains consistency.",
			color: "bg-purple-500",
			items: [
				"Connect characters to locations, events, and other characters",
				"Link historical events to their consequences",
				"Create cause-effect relationships across your world",
			],
			visual: (
				<div className="w-full max-w-sm h-48 relative">
					<div className="absolute left-4 top-0 w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center text-xs transform transition-all duration-500 hover:scale-110 hover:bg-slate-700 hover:z-10">
						Character
					</div>
					<div className="absolute left-0 bottom-0 w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center text-xs transform transition-all duration-500 hover:scale-110 hover:bg-slate-700 hover:z-10">
						Location
					</div>
					<div className="absolute right-4 top-0 w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center text-xs transform transition-all duration-500 hover:scale-110 hover:bg-slate-700 hover:z-10">
						Event
					</div>
					<div className="absolute right-0 bottom-0 w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center text-xs transform transition-all duration-500 hover:scale-110 hover:bg-slate-700 hover:z-10">
						Item
					</div>
					{/* Animated connection lines */}
					<svg
						className="absolute inset-0 w-full h-full"
						xmlns="http://www.w3.org/2000/svg"
					>
						<line
							x1="20%"
							y1="10%"
							x2="80%"
							y2="10%"
							className="stroke-purple-500 stroke-2 opacity-70"
						>
							<animate
								attributeName="opacity"
								values="0.3;0.7;0.3"
								dur="3s"
								repeatCount="indefinite"
							/>
						</line>
						<line
							x1="20%"
							y1="10%"
							x2="10%"
							y2="90%"
							className="stroke-purple-500 stroke-2 opacity-70"
						>
							<animate
								attributeName="opacity"
								values="0.5;0.8;0.5"
								dur="2.5s"
								repeatCount="indefinite"
							/>
						</line>
						<line
							x1="80%"
							y1="10%"
							x2="90%"
							y2="90%"
							className="stroke-purple-500 stroke-2 opacity-70"
						>
							<animate
								attributeName="opacity"
								values="0.4;0.6;0.4"
								dur="2.8s"
								repeatCount="indefinite"
							/>
						</line>
						<line
							x1="10%"
							y1="90%"
							x2="90%"
							y2="90%"
							className="stroke-purple-500 stroke-2 opacity-70"
						>
							<animate
								attributeName="opacity"
								values="0.3;0.7;0.3"
								dur="3.2s"
								repeatCount="indefinite"
							/>
						</line>
					</svg>
				</div>
			),
		},
		expand: {
			title: "Grow Your Universe",
			description:
				"Expand your world by adding new characters, locations, and storylines that automatically inherit existing rules.",
			color: "bg-emerald-500",
			items: [
				"Generate new characters that fit your established world",
				"Expand regions with consistent cultural attributes",
				"Create stories that respect your world's internal logic",
			],
			visual: (
				<div className="grid grid-cols-3 gap-2 w-full">
					<div className="bg-slate-800 h-12 rounded transform transition-all duration-300 hover:scale-105"></div>
					<div className="bg-slate-800 h-12 rounded transform transition-all duration-300 hover:scale-105 delay-75"></div>
					<div className="bg-slate-800 h-12 rounded transform transition-all duration-300 hover:scale-105 delay-150"></div>

					<div className="bg-slate-700 h-12 rounded transform transition-all duration-300 hover:scale-105 delay-75"></div>
					<div className="bg-slate-700 h-12 rounded transform transition-all duration-300 hover:scale-105 delay-150"></div>
					<div className="bg-slate-700 h-12 rounded transform transition-all duration-300 hover:scale-105 delay-225"></div>

					<div className="bg-slate-600 h-12 rounded transform transition-all duration-300 hover:scale-105 delay-150"></div>
					<div className="bg-slate-600 h-12 rounded transform transition-all duration-300 hover:scale-105 delay-225"></div>
					<div className="bg-slate-600 h-12 rounded transform transition-all duration-300 hover:scale-105 delay-300"></div>
				</div>
			),
		},
	};

	const handleTabChange = (tab: TabId): void => {
		setActiveTab(tab);
	};

	return (
		<div className="w-full py-20 px-4 bg-slate-950">
			<div className="max-w-6xl mx-auto">
				<div className="text-center mb-16">
					<h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
						How Formora Works
					</h2>
					<p className="text-lg text-white max-w-2xl mx-auto">
						Our platform makes it easy to connect all the elements of your
						creative universe.
					</p>
				</div>

				<div className="max-w-4xl mx-auto">
					{/* Tab Navigation */}
					<div className="grid grid-cols-3 mb-8 bg-slate-800/50 rounded-lg overflow-hidden">
						{Object.keys(tabContent).map((tab) => (
							<button
								key={tab}
								onClick={() => handleTabChange(tab as TabId)}
								className={`py-3 px-2 transition-all duration-300 relative ${
									activeTab === tab
										? "text-white font-medium"
										: "text-slate-400 hover:text-white"
								}`}
							>
								<span className="relative z-10 capitalize">{tab}</span>
								{activeTab === tab && (
									<div
										className={`absolute inset-0 ${tabContent[tab].color} opacity-90`}
										style={{
											animation: "fadeIn 0.3s ease-out",
										}}
									/>
								)}
							</button>
						))}
					</div>

					{/* Tab Content */}
					<div className="bg-slate-800/30 p-6 rounded-lg border border-slate-700 min-h-96">
						{Object.keys(tabContent).map((tab) => (
							<div
								key={tab}
								className={`transition-all duration-500 ${
									activeTab === tab
										? "opacity-100 translate-x-0"
										: "opacity-0 absolute -translate-x-4"
								}`}
								style={{ display: activeTab === tab ? "block" : "none" }}
							>
								<div className="flex flex-col md:flex-row gap-8 items-center">
									<div className="md:w-1/2">
										<h3 className="text-2xl font-bold mb-4 text-white">
											{tabContent[tab].title}
										</h3>
										<p className="text-white mb-4">
											{tabContent[tab].description}
										</p>
										<ul className="space-y-2 text-white">
											{tabContent[tab].items.map((item, i) => (
												<li
													key={i}
													className="flex items-center gap-2"
													style={{
														animation: `slideInRight 0.5s ease-out ${
															i * 0.1
														}s both`,
													}}
												>
													<div
														className={`h-2 w-2 rounded-full ${tabContent[tab].color}`}
													></div>
													{item}
												</li>
											))}
										</ul>
									</div>
									<div className="md:w-1/2 bg-slate-900 rounded-lg p-4 aspect-video flex items-center justify-center transition-all duration-500 hover:shadow-lg hover:shadow-slate-900/50">
										{tabContent[tab].visual}
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Adding keyframe animations */}
			<style jsx>{`
				@keyframes fadeIn {
					from {
						opacity: 0;
					}
					to {
						opacity: 0.9;
					}
				}
				@keyframes slideInRight {
					from {
						opacity: 0;
						transform: translateX(-20px);
					}
					to {
						opacity: 1;
						transform: translateX(0);
					}
				}
			`}</style>
		</div>
	);
};

export default AnimatedTabs;
