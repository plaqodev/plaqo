import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useId, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { DELETION_REASONS, type DeletionReason } from "@/lib/account-deletion";
import { deleteMyAccount } from "@/lib/api/account.functions";
import { authClient } from "@/lib/auth-client";

const labelClass = "font-mono text-[10px] uppercase tracking-[0.08em]";
const lineInput =
	"mt-2 h-11 rounded-none border-x-0 border-t-0 border-b-border bg-transparent px-0 shadow-none focus-visible:border-destructive focus-visible:ring-0";

export function DeleteAccount({ username }: { username: string }) {
	const navigate = useNavigate();
	const deleteAccount = useServerFn(deleteMyAccount);
	const id = useId();

	const [reason, setReason] = useState<DeletionReason | "">("");
	const [details, setDetails] = useState("");
	const [typed, setTyped] = useState("");
	const [password, setPassword] = useState("");
	const [pending, setPending] = useState(false);
	// GitHub/Google-only accounts have no password to confirm with; they
	// need a recent sign-in instead. Assume a password until we know.
	const [hasPassword, setHasPassword] = useState(true);

	useEffect(() => {
		authClient
			.listAccounts()
			.then(({ data }) => {
				if (data) {
					setHasPassword(data.some((a) => a.providerId === "credential"));
				}
			})
			.catch(() => {});
	}, []);

	const ready =
		reason !== "" &&
		typed.trim().toLowerCase() === username.toLowerCase() &&
		(!hasPassword || password.length > 0);

	async function handleDelete(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!ready) return;
		setPending(true);
		try {
			await deleteAccount({
				data: {
					reason,
					details: details.trim() || undefined,
					username: typed.trim(),
					password: hasPassword ? password : undefined,
				},
			});
			toast.success("Your account was deleted.");
			await navigate({ to: "/", reloadDocument: true });
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Couldn't delete your account",
			);
			setPending(false);
		}
	}

	return (
		<form onSubmit={handleDelete} className="mt-6 max-w-xl space-y-6">
			<fieldset>
				<legend className={labelClass}>Why are you leaving?</legend>
				<div className="mt-3 grid gap-2 sm:grid-cols-2">
					{DELETION_REASONS.map((r) => (
						<label
							key={r.value}
							className="flex cursor-pointer items-center gap-2.5 text-sm text-muted-foreground has-checked:text-foreground"
						>
							<input
								type="radio"
								name={`${id}-reason`}
								value={r.value}
								checked={reason === r.value}
								onChange={() => setReason(r.value)}
								className="accent-destructive"
							/>
							{r.label}
						</label>
					))}
				</div>
			</fieldset>

			<div>
				<Label htmlFor={`${id}-details`} className={labelClass}>
					Anything else? <span className="normal-case">(optional)</span>
				</Label>
				<textarea
					id={`${id}-details`}
					value={details}
					onChange={(e) => setDetails(e.target.value)}
					maxLength={1000}
					rows={2}
					className="mt-2 w-full resize-y border-0 border-b border-border bg-transparent py-2 text-base outline-none focus:border-destructive sm:text-sm"
				/>
			</div>

			<div className="grid gap-6 sm:grid-cols-2">
				<div>
					<Label htmlFor={`${id}-username`} className={labelClass}>
						Type <span className="text-foreground">{username}</span>
					</Label>
					<Input
						id={`${id}-username`}
						value={typed}
						onChange={(e) => setTyped(e.target.value)}
						name="confirm-delete"
						autoComplete="off"
						data-1p-ignore
						data-lpignore="true"
						autoCapitalize="none"
						spellCheck={false}
						className={lineInput}
					/>
				</div>

				{hasPassword && (
					<div>
						<Label htmlFor={`${id}-password`} className={labelClass}>
							Password
						</Label>
						<PasswordInput
							id={`${id}-password`}
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							// Not "current-password": the browser would fill in the
							// saved password, and this form must be typed on purpose.
							autoComplete="new-password"
							data-1p-ignore
							data-lpignore="true"
						/>
					</div>
				)}
			</div>

			{!hasPassword && (
				<p className="text-xs leading-relaxed text-muted-foreground">
					You sign in with GitHub or Google, so we confirm it's you by a recent
					sign-in. If you signed in more than an hour ago, sign out and back in
					first.
				</p>
			)}

			<Button
				type="submit"
				variant="destructive"
				disabled={!ready || pending}
				className="h-10 rounded-none px-4 font-mono text-[10px] uppercase tracking-[0.08em] shadow-none transition-transform active:scale-[0.98]"
			>
				{pending ? "Deleting…" : "Delete my account"}
			</Button>
		</form>
	);
}
