import { and, eq } from "drizzle-orm";
import { user as authUser } from "@/db/auth-schema";
import { db } from "@/db/index";
import { integrationAccounts } from "@/db/schema";
import { sendEmail } from "@/lib/email";
import { welcome } from "@/lib/emails/templates";
import { consumeRateLimit } from "@/lib/rate-limit.server";

// Once per account, ever (practically): the window outlives any onboarding,
// and the DB-backed limiter doubles as a "welcome already sent" flag without
// a schema change.
const WELCOME_WINDOW_MS = 365 * 24 * 60 * 60 * 1000;

// Sends the welcome email once the account has a username (its page exists).
// Two callers: email sign-up (username chosen in the form) and the OAuth
// onboarding (username chosen after). Never throws — a welcome email must not
// break sign-up.
export async function sendWelcomeOnce(userId: string): Promise<void> {
	try {
		const [row] = await db
			.select({
				email: authUser.email,
				name: authUser.name,
				username: authUser.username,
			})
			.from(authUser)
			.where(eq(authUser.id, userId))
			.limit(1);
		if (!row?.username) return;

		if (
			!(await consumeRateLimit("welcome-email", userId, WELCOME_WINDOW_MS, 1))
		)
			return;

		const [github] = await db
			.select({ id: integrationAccounts.id })
			.from(integrationAccounts)
			.where(
				and(
					eq(integrationAccounts.userId, userId),
					eq(integrationAccounts.provider, "github"),
				),
			)
			.limit(1);

		await sendEmail({
			to: row.email,
			...welcome({
				name: row.name,
				username: row.username,
				githubConnected: Boolean(github),
			}),
		});
	} catch (e) {
		console.error("[welcome] email failed", e instanceof Error ? e.message : e);
	}
}
