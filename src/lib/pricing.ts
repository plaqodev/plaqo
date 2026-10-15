// Single source for Pro pricing copy. No server imports: the landing page,
// the dashboard's upgrade buttons and the terms all read from here.
//
// Founding pricing: the first FOUNDING_SPOTS Pro subscribers pay the
// founding price, locked for life — Dodo keeps each subscription on the
// product it was bought with. When the spots run out, create the regular
// products in Dodo, point DODO_PRO_PRODUCT_ID / DODO_PRO_ANNUAL_PRODUCT_ID at
// them and set PRO_PRICING_TIER=regular; existing subscribers are untouched.

export const FOUNDING_SPOTS = 100;

export const PRO_PRICES = {
	founding: { monthly: 5, yearly: 48 },
	regular: { monthly: 8, yearly: 80 },
} as const;

export type ProTier = keyof typeof PRO_PRICES;
export type Billing = "monthly" | "yearly";

export const REFUND_DAYS = 14;
export const SUPPORT_SLA = "1 business day";

export function proPrice(tier: ProTier, billing: Billing): number {
	return PRO_PRICES[tier][billing];
}

// "$5/mo", "$48/yr"
export function proPriceLabel(tier: ProTier, billing: Billing): string {
	return `$${proPrice(tier, billing)}/${billing === "monthly" ? "mo" : "yr"}`;
}

// Months a yearly plan saves against paying monthly for a year (2 for both
// tiers today) — derived so the copy can't drift from the prices.
export function yearlyMonthsFree(tier: ProTier): number {
	const { monthly, yearly } = PRO_PRICES[tier];
	return Math.round((monthly * 12 - yearly) / monthly);
}

export type ProPricing = {
	tier: ProTier;
	foundingSpots: number;
	foundingSpotsLeft: number;
	// False until the yearly product exists in Dodo (DODO_PRO_ANNUAL_PRODUCT_ID).
	yearlyAvailable: boolean;
};
