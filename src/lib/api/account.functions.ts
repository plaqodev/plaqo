import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { DELETION_REASONS, deleteAccountInput } from "@/lib/account-deletion";
import { authMiddleware } from "@/lib/auth-middleware";

// Deletes the signed-in account after checking the typed username, then
// tells the support inbox why. better-auth does the deletion itself:
// password check (or a recent sign-in for GitHub/Google-only accounts),
// the Pro guard and the avatar cleanup live in auth.ts (user.deleteUser).
// Every table that belongs to the user cascades from the user row.
// Server modules are imported inside the handler so none of them are
// pulled into the client bundle.
export const deleteMyAccount = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator(deleteAccountInput)
	.handler(async ({ data, context }) => {
		const { auth } = await import("@/lib/auth");
		const { escapeHtml, sendEmail } = await import("@/lib/email");
		const { securityLog } = await import("@/lib/security-log");

		const headers = getRequestHeaders();
		const session = await auth.api.getSession({
			headers,
			query: { disableCookieCache: true },
		});
		if (!session || session.user.id !== context.userId) {
			throw new Error("Unauthorized");
		}

		const username = session.user.username ?? "";
		if (data.username.toLowerCase() !== username.toLowerCase()) {
			throw new Error("That username doesn't match your account.");
		}

		try {
			await auth.api.deleteUser({
				body: data.password ? { password: data.password } : {},
				headers,
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : "";
			if (/fresh|re-?authenticate/i.test(message)) {
				throw new Error(
					"For your security, sign out and sign in again, then delete your account.",
				);
			}
			throw new Error(message || "Couldn't delete your account.");
		}

		securityLog("account.deleted", "success", { userId: context.userId });

		// Best effort: the account is already gone, so a send error only
		// costs us the answer.
		const label =
			DELETION_REASONS.find((r) => r.value === data.reason)?.label ??
			data.reason;
		const details = data.details ?? "";
		try {
			await sendEmail({
				to: process.env.CONTACT_EMAIL || "support@plaqo.dev",
				subject: `Account deleted: ${username}`,
				html: `<p><strong>Reason:</strong> ${escapeHtml(label)}</p>${
					details ? `<p>${escapeHtml(details).replace(/\n/g, "<br>")}</p>` : ""
				}`,
				text: `Reason: ${label}${details ? `\n\n${details}` : ""}`,
			});
		} catch (err) {
			console.error(
				"[account] deletion reason email failed",
				err instanceof Error ? err.message : err,
			);
		}

		return { ok: true as const };
	});
