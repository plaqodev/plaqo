// Shared by the server gate in auth.ts and the dashboard UI.

// APIError code the checkout hook returns for an unconfirmed address.
export const EMAIL_NOT_VERIFIED_CODE = "EMAIL_NOT_VERIFIED";

// Where the link in the confirmation email lands. On an expired or used
// link, better-auth sends the user here with ?error=<CODE> instead.
export const VERIFY_EMAIL_CALLBACK = "/dashboard?verified=1";

// The sign-up email is sent without a callbackURL (use-sign-up.ts leaves it
// out on purpose), and without one the link ends on a bare JSON response.
export function withVerifyCallback(url: string): string {
	const parsed = new URL(url);
	const current = parsed.searchParams.get("callbackURL");
	if (!current || current === "/") {
		parsed.searchParams.set("callbackURL", VERIFY_EMAIL_CALLBACK);
	}
	return parsed.toString();
}
