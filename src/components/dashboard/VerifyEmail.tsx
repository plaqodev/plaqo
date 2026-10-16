import { CheckIcon } from "@solar-icons/react/linear";
import { useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { authClient } from "@/lib/auth-client";
import { VERIFY_EMAIL_CALLBACK } from "@/lib/verification";

// Matches the server's /send-verification-email rate limit (3 per minute),
// with room to spare.
const RESEND_COOLDOWN_S = 30;

function useResendVerification(email: string) {
	const [pending, setPending] = useState(false);
	const [cooldown, setCooldown] = useState(0);

	useEffect(() => {
		if (cooldown <= 0) return;
		const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
		return () => clearTimeout(timer);
	}, [cooldown]);

	async function resend() {
		setPending(true);
		try {
			const { error } = await authClient.sendVerificationEmail({
				email,
				callbackURL: VERIFY_EMAIL_CALLBACK,
			});
			if (error) throw new Error(error.message ?? "Couldn't send the email");
			toast.success(`Sent. Check ${email}.`);
			setCooldown(RESEND_COOLDOWN_S);
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Couldn't send the email",
			);
		} finally {
			setPending(false);
		}
	}

	const label = pending
		? "Sending…"
		: cooldown > 0
			? `Sent · ${cooldown}s`
			: "Resend email";

	return { resend, disabled: pending || cooldown > 0, label };
}

// Confirming in another tab (the email link) updates the session cookie;
// refetch it when the user comes back so the notice goes away by itself.
function useRefreshOnFocus() {
	const router = useRouter();
	useEffect(() => {
		const onFocus = () => router.invalidate();
		window.addEventListener("focus", onFocus);
		return () => window.removeEventListener("focus", onFocus);
	}, [router]);
}

export function VerifyEmailBanner({
	email,
	finishingUpgrade,
}: {
	email: string;
	finishingUpgrade: boolean;
}) {
	const { resend, disabled, label } = useResendVerification(email);
	useRefreshOnFocus();

	return (
		<div
			role="status"
			className="flex flex-col gap-3 border-b border-brand/30 bg-brand/5 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10"
		>
			<p className="text-sm leading-relaxed text-foreground">
				<span className="mb-1 block font-mono text-[9px] uppercase tracking-[0.12em] text-brand">
					{finishingUpgrade ? "One step left" : "Confirm your email"}
				</span>
				{finishingUpgrade
					? "Confirm your email to finish upgrading to Pro. "
					: "It's how you get back in if you lose access to your account. "}
				<span className="text-muted-foreground">
					The link goes to <span className="text-foreground">{email}</span>.
				</span>
			</p>

			<button
				type="button"
				onClick={resend}
				disabled={disabled}
				className="shrink-0 self-start border border-border px-3 py-2 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground transition-[color,border-color,transform] active:scale-[0.98] hover:border-foreground hover:text-foreground disabled:opacity-50 disabled:hover:border-border disabled:hover:text-muted-foreground sm:self-auto"
			>
				{label}
			</button>
		</div>
	);
}

export function EmailField({
	email,
	verified,
}: {
	email: string;
	verified: boolean;
}) {
	const { resend, disabled, label } = useResendVerification(email);

	return (
		<div>
			<div className="flex items-center justify-between gap-3">
				<span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
					Email
				</span>

				<span
					className={`inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.12em] ${
						verified ? "text-foreground" : "text-brand"
					}`}
				>
					{verified ? (
						<>
							<CheckIcon size={12} aria-hidden />
							Verified
						</>
					) : (
						"Not verified"
					)}
				</span>
			</div>

			<div className="mt-2 border-b border-border py-2 text-sm">{email}</div>

			{!verified && (
				<div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
					<p className="text-xs leading-relaxed text-muted-foreground">
						Check your inbox for the confirmation link.
					</p>
					<button
						type="button"
						onClick={resend}
						disabled={disabled}
						className="font-mono text-[9px] uppercase tracking-[0.08em] text-brand transition-colors hover:text-foreground disabled:opacity-50 disabled:hover:text-brand"
					>
						{label}
					</button>
				</div>
			)}
		</div>
	);
}
