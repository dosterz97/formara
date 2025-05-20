"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ActionState } from "@/lib/auth/middleware";
import { Globe2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { signIn, signUp } from "./actions";

export function Login({ mode = "signin" }: { mode?: "signin" | "signup" }) {
	const searchParams = useSearchParams();
	const redirect = searchParams.get("redirect");
	const priceId = searchParams.get("priceId");
	const inviteId = searchParams.get("inviteId");
	const [state, formAction, pending] = useActionState<ActionState, FormData>(
		mode === "signin" ? signIn : signUp,
		{ error: "" }
	);

	return (
		<div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-700">
			{/* Animated background elements */}
			<div className="absolute inset-0 overflow-hidden">
				<div className="absolute -inset-[10px] opacity-30">
					{Array.from({ length: 8 }).map((_, i) => (
						<div
							key={i}
							className="absolute rounded-full bg-white/20"
							style={{
								width: `${Math.random() * 300 + 100}px`,
								height: `${Math.random() * 300 + 100}px`,
								top: `${Math.random() * 100}%`,
								left: `${Math.random() * 100}%`,
								animation: `float ${Math.random() * 20 + 15}s linear infinite`,
								animationDelay: `${Math.random() * 5}s`,
							}}
						/>
					))}
				</div>
				<div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-indigo-900/40 to-transparent" />
				<div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-indigo-900/40 to-transparent" />
			</div>

			<div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
				<div className="flex justify-center">
					<div className="bg-white p-3 rounded-full shadow-lg">
						<Globe2 className="h-12 w-12 text-indigo-600" />
					</div>
				</div>
				<h2 className="mt-6 text-center text-3xl font-extrabold text-white">
					{mode === "signin"
						? "Sign in to your account"
						: "Create your account"}
				</h2>
			</div>

			<div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
				<div className="bg-white py-8 px-4 shadow-2xl sm:rounded-lg sm:px-10 backdrop-blur-sm">
					<form className="space-y-6" action={formAction}>
						<input type="hidden" name="redirect" value={redirect || ""} />
						<input type="hidden" name="priceId" value={priceId || ""} />
						<input type="hidden" name="inviteId" value={inviteId || ""} />
						<div>
							<Label
								htmlFor="email"
								className="block text-sm font-medium text-gray-700"
							>
								Email
							</Label>
							<div className="mt-1">
								<Input
									id="email"
									name="email"
									type="email"
									autoComplete="email"
									defaultValue={state.email}
									required
									maxLength={50}
									className="appearance-none rounded-full relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
									placeholder="Enter your email"
								/>
							</div>
						</div>

						<div>
							<Label
								htmlFor="password"
								className="block text-sm font-medium text-gray-700"
							>
								Password
							</Label>
							<div className="mt-1">
								<Input
									id="password"
									name="password"
									type="password"
									autoComplete={
										mode === "signin" ? "current-password" : "new-password"
									}
									defaultValue={state.password}
									required
									minLength={8}
									maxLength={100}
									className="appearance-none rounded-full relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
									placeholder="Enter your password"
								/>
							</div>
						</div>

						{state?.error && (
							<div className="text-red-500 text-sm">{state.error}</div>
						)}

						<div>
							<Button
								type="submit"
								className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
								disabled={pending}
							>
								{pending ? (
									<>
										<Loader2 className="animate-spin mr-2 h-4 w-4" />
										Loading...
									</>
								) : mode === "signin" ? (
									"Sign in"
								) : (
									"Sign up"
								)}
							</Button>
						</div>
					</form>

					<div className="mt-6">
						<div className="relative">
							<div className="absolute inset-0 flex items-center">
								<div className="w-full border-t border-gray-300" />
							</div>
							<div className="relative flex justify-center text-sm">
								<span className="px-2 bg-white text-gray-500">
									{mode === "signin"
										? "New to our platform?"
										: "Already have an account?"}
								</span>
							</div>
						</div>

						<div className="mt-6">
							<Link
								href={`${mode === "signin" ? "/sign-up" : "/sign-in"}${
									redirect ? `?redirect=${redirect}` : ""
								}${priceId ? `&priceId=${priceId}` : ""}`}
								className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-full shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
							>
								{mode === "signin"
									? "Create an account"
									: "Sign in to existing account"}
							</Link>
						</div>
					</div>
				</div>
			</div>

			{/* Add some keyframe animations */}
			<style jsx global>{`
				@keyframes float {
					0% {
						transform: translateY(0) translateX(0);
					}
					25% {
						transform: translateY(-20px) translateX(10px);
					}
					50% {
						transform: translateY(0) translateX(20px);
					}
					75% {
						transform: translateY(20px) translateX(10px);
					}
					100% {
						transform: translateY(0) translateX(0);
					}
				}
			`}</style>
		</div>
	);
}
