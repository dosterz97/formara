"use client";

import {
	deleteAccount,
	updateAccount,
	updatePassword,
} from "@/app/(login)/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser } from "@/lib/auth";
import { Loader2, Lock, Trash2 } from "lucide-react";
import { startTransition, use, useActionState } from "react";

type ActionState = {
	error?: string;
	success?: string;
};

export default function GeneralPage() {
	const { userPromise } = useUser();
	const user = use(userPromise);

	// Account update state
	const [accountState, accountAction, isAccountPending] = useActionState<
		ActionState,
		FormData
	>(updateAccount, { error: "", success: "" });

	// Password update state
	const [passwordState, passwordAction, isPasswordPending] = useActionState<
		ActionState,
		FormData
	>(updatePassword, { error: "", success: "" });

	// Delete account state
	const [deleteState, deleteAction, isDeletePending] = useActionState<
		ActionState,
		FormData
	>(deleteAccount, { error: "", success: "" });

	const handleAccountSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		startTransition(() => {
			accountAction(new FormData(event.currentTarget));
		});
	};

	const handlePasswordSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		startTransition(() => {
			passwordAction(new FormData(event.currentTarget));
		});
	};

	const handleDeleteSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		startTransition(() => {
			deleteAction(new FormData(event.currentTarget));
		});
	};

	return (
		<section className="flex-1 p-4 lg:p-8">
			<h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
				Account Settings
			</h1>

			{/* Account Information Section */}
			<Card className="mb-8">
				<CardHeader>
					<CardTitle>Account Information</CardTitle>
				</CardHeader>
				<CardContent>
					<form className="space-y-4" onSubmit={handleAccountSubmit}>
						<div>
							<Label htmlFor="name">Name</Label>
							<Input
								id="name"
								name="name"
								placeholder="Enter your name"
								defaultValue={user?.name || ""}
								required
							/>
						</div>
						<div>
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								name="email"
								type="email"
								placeholder="Enter your email"
								defaultValue={user?.email || ""}
								required
							/>
						</div>
						{accountState.error && (
							<p className="text-red-500 text-sm">{accountState.error}</p>
						)}
						{accountState.success && (
							<p className="text-green-500 text-sm">{accountState.success}</p>
						)}
						<Button
							type="submit"
							className="bg-indigo-500 hover:bg-indigo-600 text-white"
							disabled={isAccountPending}
						>
							{isAccountPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Saving...
								</>
							) : (
								"Save Changes"
							)}
						</Button>
					</form>
				</CardContent>
			</Card>

			{/* Password Section */}
			<Card className="mb-8">
				<CardHeader>
					<CardTitle>Password</CardTitle>
				</CardHeader>
				<CardContent>
					<form className="space-y-4" onSubmit={handlePasswordSubmit}>
						<div>
							<Label htmlFor="current-password">Current Password</Label>
							<Input
								id="current-password"
								name="currentPassword"
								type="password"
								autoComplete="current-password"
								required
								minLength={8}
								maxLength={100}
							/>
						</div>
						<div>
							<Label htmlFor="new-password">New Password</Label>
							<Input
								id="new-password"
								name="newPassword"
								type="password"
								autoComplete="new-password"
								required
								minLength={8}
								maxLength={100}
							/>
						</div>
						<div>
							<Label htmlFor="confirm-password">Confirm New Password</Label>
							<Input
								id="confirm-password"
								name="confirmPassword"
								type="password"
								required
								minLength={8}
								maxLength={100}
							/>
						</div>
						{passwordState.error && (
							<p className="text-red-500 text-sm">{passwordState.error}</p>
						)}
						{passwordState.success && (
							<p className="text-green-500 text-sm">{passwordState.success}</p>
						)}
						<Button
							type="submit"
							className="bg-red-600 hover:bg-red-700 text-white"
							disabled={isPasswordPending}
						>
							{isPasswordPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Updating...
								</>
							) : (
								<>
									<Lock className="mr-2 h-4 w-4" />
									Update Password
								</>
							)}
						</Button>
					</form>
				</CardContent>
			</Card>

			{/* Delete Account Section */}
			<Card>
				<CardHeader>
					<CardTitle>Delete Account</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-gray-500 mb-4">
						Account deletion is non-reversable. Please proceed with caution.
					</p>
					<form onSubmit={handleDeleteSubmit} className="space-y-4">
						<div>
							<Label htmlFor="delete-password">Confirm Password</Label>
							<Input
								id="delete-password"
								name="password"
								type="password"
								required
								minLength={8}
								maxLength={100}
							/>
						</div>
						{deleteState.error && (
							<p className="text-red-500 text-sm">{deleteState.error}</p>
						)}
						<Button
							type="submit"
							variant="destructive"
							className="bg-red-600 hover:bg-red-700"
							disabled={isDeletePending}
						>
							{isDeletePending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Deleting...
								</>
							) : (
								<>
									<Trash2 className="mr-2 h-4 w-4" />
									Delete Account
								</>
							)}
						</Button>
					</form>
				</CardContent>
			</Card>
		</section>
	);
}
