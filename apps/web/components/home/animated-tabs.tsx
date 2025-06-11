"use client";

import { Check } from "lucide-react";
import React, { useState } from "react";
import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
} from "recharts";

type TabId = "setup" | "train" | "launch";

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

const performanceData = [
	{ date: "Day 1", value: 20 },
	{ date: "Day 2", value: 35 },
	{ date: "Day 3", value: 45 },
	{ date: "Day 4", value: 60 },
	{ date: "Day 5", value: 75 },
	{ date: "Day 6", value: 85 },
];

const AnimatedTabs: React.FC = () => {
	const [activeTab, setActiveTab] = useState<TabId>("setup");

	const tabContent: TabsContent = {
		setup: {
			title: "Quick Setup",
			description:
				"Get started in minutes with our simple Discord integration process.",
			color: "bg-indigo-500",
			items: [
				"Add our bot to your Discord server",
				"Configure basic settings and permissions",
				"Choose your moderation preferences",
			],
			visual: (
				<div className="grid grid-cols-2 gap-4 w-full max-w-sm">
					<div className="bg-slate-800 h-32 rounded flex items-center justify-center text-slate-500 transform transition-all duration-500 hover:scale-105 hover:bg-slate-700">
						Discord Bot
					</div>
					<div className="bg-slate-800 h-32 rounded flex items-center justify-center text-slate-500 transform transition-all duration-500 hover:scale-105 hover:bg-slate-700">
						Settings
					</div>
					<div className="bg-slate-800 h-32 rounded flex items-center justify-center text-slate-500 transform transition-all duration-500 hover:scale-105 hover:bg-slate-700">
						Permissions
					</div>
					<div className="bg-slate-800 h-32 rounded flex items-center justify-center text-slate-500 transform transition-all duration-500 hover:scale-105 hover:bg-slate-700">
						Preferences
					</div>
				</div>
			),
		},
		train: {
			title: "Train Your Bot",
			description:
				"Upload your community guidelines and FAQs to create a custom knowledge base.",
			color: "bg-purple-500",
			items: [
				"Upload your community guidelines and rules",
				"Add FAQs and common questions",
				"Customize response styles and tones",
			],
			visual: (
				<div className="w-full max-w-sm h-48 relative">
					<div className="absolute left-4 top-0 w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center text-xs transform transition-all duration-500 hover:scale-110 hover:bg-slate-700 hover:z-10">
						Guidelines
					</div>
					<div className="absolute left-0 bottom-0 w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center text-xs transform transition-all duration-500 hover:scale-110 hover:bg-slate-700 hover:z-10">
						FAQs
					</div>
					<div className="absolute right-4 top-0 w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center text-xs transform transition-all duration-500 hover:scale-110 hover:bg-slate-700 hover:z-10">
						Rules
					</div>
					<div className="absolute right-0 bottom-0 w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center text-xs transform transition-all duration-500 hover:scale-110 hover:bg-slate-700 hover:z-10">
						Style
					</div>
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
		launch: {
			title: "Watch It Work",
			description:
				"Your bot is ready to moderate content and answer questions automatically.",
			color: "bg-emerald-500",
			items: [
				"Monitor moderation actions in real-time",
				"Track question answering performance",
				"Adjust settings and training as needed",
			],
			visual: (
				<div className="w-full max-w-sm h-48 relative">
					<div className="absolute inset-0 bg-slate-800/50 rounded-lg p-4">
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart
								data={performanceData}
								margin={{ top: 5, right: 5, left: 20, bottom: 5 }}
							>
								<defs>
									<linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
										<stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
									</linearGradient>
								</defs>
								<CartesianGrid
									strokeDasharray="3 3"
									stroke="#475569"
									vertical={false}
								/>
								<XAxis
									dataKey="date"
									stroke="#94A3B8"
									tickLine={false}
									axisLine={false}
								/>
								<Tooltip
									contentStyle={{
										backgroundColor: "#1E293B",
										border: "none",
										borderRadius: "0.5rem",
										color: "#E2E8F0",
									}}
								/>
								<Area
									type="monotone"
									dataKey="value"
									stroke="#10B981"
									fillOpacity={1}
									fill="url(#colorValue)"
								/>
							</AreaChart>
						</ResponsiveContainer>
					</div>
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
						How It Works
					</h2>
					<p className="text-lg text-white max-w-2xl mx-auto">
						Set up your AI-powered Discord bot in three simple steps.
					</p>
				</div>

				<div className="max-w-5xl mx-auto">
					{/* Tab Navigation */}
					<div className="grid grid-cols-3 mb-8 bg-slate-800/50 rounded-lg overflow-hidden">
						<button
							onClick={() => setActiveTab("setup")}
							className={`py-3 px-4 text-sm font-medium transition-colors ${
								activeTab === "setup"
									? "bg-slate-700 text-white"
									: "text-slate-400 hover:text-white"
							}`}
						>
							Setup
						</button>
						<button
							onClick={() => setActiveTab("train")}
							className={`py-3 px-4 text-sm font-medium transition-colors ${
								activeTab === "train"
									? "bg-slate-700 text-white"
									: "text-slate-400 hover:text-white"
							}`}
						>
							Train
						</button>
						<button
							onClick={() => setActiveTab("launch")}
							className={`py-3 px-4 text-sm font-medium transition-colors ${
								activeTab === "launch"
									? "bg-slate-700 text-white"
									: "text-slate-400 hover:text-white"
							}`}
						>
							Launch
						</button>
					</div>

					{/* Tab Content */}
					<div className="bg-slate-800/50 rounded-lg p-8">
						<div className="grid md:grid-cols-2 gap-8 items-center">
							<div>
								<h3 className="text-2xl font-bold mb-4 text-white">
									{tabContent[activeTab].title}
								</h3>
								<p className="text-lg text-white mb-6">
									{tabContent[activeTab].description}
								</p>
								<ul className="space-y-4">
									{tabContent[activeTab].items.map((item, index) => (
										<div key={index} className="flex items-center gap-2">
											<div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
												<Check className="w-3 h-3 text-emerald-500" />
											</div>
											<span className="text-slate-300">{item}</span>
										</div>
									))}
								</ul>
							</div>
							<div className="flex justify-center">
								{tabContent[activeTab].visual}
							</div>
						</div>
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
