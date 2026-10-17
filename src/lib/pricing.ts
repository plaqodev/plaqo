// Single source for Pro pricing copy. No server imports: the landing page,
// the dashboard's upgrade buttons and the terms all read from here.
//
// Founding pricing: the products are priced at the regular price and the
// first FOUNDING_SPOTS subscribers get a 37.5% discount code
// (DODO_FOUNDING_DISCOUNT_CODE) on every renewal, for as long as the
// subscription stays active. The checkout adds the code by itself while
// spots remain (see lib/founding.server.ts); nothing to switch afterwards.

export const FOUNDING_SPOTS = 100;

export const PRO_PRICES = {
	founding: { monthly: 5, yearly: 50 },
	regular: { monthly: 8, yearly: 80 },
} as const;

export type ProTier = keyof typeof PRO_PRICES;
export type Billing = "monthly" | "yearly";

export const REFUND_DAYS = 14;
export const SUPPORT_SLA = "1 business day";

export function proPrice(tier: ProTier, billing: Billing): number {
	return PRO_PRICES[tier][billing];
}

// "$5/mo", "$50/yr"
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
