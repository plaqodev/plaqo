import { authClient } from "@/lib/auth-client";
import type { Billing } from "@/lib/pricing";
import { EMAIL_NOT_VERIFIED_CODE } from "@/lib/verification";

export class EmailNotVerifiedError extends Error {
	constructor() {
		super(
			"Confirm your email before upgrading. You can resend the link from the banner or Settings.",
		);
		this.name = "EmailNotVerifiedError";
	}
}

const CHECKOUT_SLUG: Record<Billing, string> = {
	monthly: "pro",
	yearly: "pro-annual",
};

export async function startProCheckout(
	billing: Billing = "monthly",
): Promise<void> {
	const { data, error } = await authClient.dodopayments.checkoutSession({
		slug: CHECKOUT_SLUG[billing],
	});

	if (error?.code === EMAIL_NOT_VERIFIED_CODE)
		throw new EmailNotVerifiedError();
	if (error || !data) {
		throw new Error(error?.message ?? "Couldn't start checkout");
	}

	window.location.href = data.url;
}

// "Go Pro" from the landing page while signed out: the choice survives the
// signup + onboarding detour, and the dashboard resumes it once there's a
// confirmed account to check out with. localStorage, not sessionStorage: the
// confirmation link usually opens in a new tab.
const INTENT_KEY = "plaqo:checkout-intent";
const INTENT_TTL_MS = 24 * 60 * 60 * 1000;

export function saveCheckoutIntent(billing: Billing) {
	try {
		localStorage.setItem(
			INTENT_KEY,
			JSON.stringify({ billing, at: Date.now() }),
		);
	} catch {
		// Storage blocked: the user can still upgrade from the dashboard.
	}
}

export function peekCheckoutIntent(): Billing | null {
	try {
		const raw = localStorage.getItem(INTENT_KEY);
		if (!raw) return null;
		const { billing, at } = JSON.parse(raw) as {
			billing?: unknown;
			at?: unknown;
		};
		const fresh = typeof at === "number" && Date.now() - at < INTENT_TTL_MS;
		if (fresh && (billing === "monthly" || billing === "yearly"))
			return billing;
		localStorage.removeItem(INTENT_KEY);
		return null;
	} catch {
		return null;
	}
}

export function takeCheckoutIntent(): Billing | null {
	const billing = peekCheckoutIntent();
	try {
		localStorage.removeItem(INTENT_KEY);
	} catch {
		// Nothing stored to clear.
	}
	return billing;
}

export async function openBillingPortal(): Promise<void> {
	const { data, error } = await authClient.dodopayments.customer.portal();

	if (error || !data) {
		throw new Error(error?.message ?? "Couldn't open billing portal");
	}

	if (data.redirect) {
		window.location.href = data.url;
	}
}
