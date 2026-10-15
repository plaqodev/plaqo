import { authClient } from "@/lib/auth-client";
import type { Billing } from "@/lib/pricing";

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

	if (error || !data) {
		throw new Error(error?.message ?? "Couldn't start checkout");
	}

	window.location.href = data.url;
}

// "Go Pro" from the landing page while signed out: the choice survives the
// signup + onboarding detour in sessionStorage, and the dashboard resumes it
// (resumeCheckoutIntent) once there's an account to check out with.
const INTENT_KEY = "plaqo:checkout-intent";

export function saveCheckoutIntent(billing: Billing) {
	try {
		sessionStorage.setItem(INTENT_KEY, billing);
	} catch {
		// Storage blocked: the user can still upgrade from the dashboard.
	}
}

export function takeCheckoutIntent(): Billing | null {
	try {
		const value = sessionStorage.getItem(INTENT_KEY);
		sessionStorage.removeItem(INTENT_KEY);
		return value === "monthly" || value === "yearly" ? value : null;
	} catch {
		return null;
	}
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
