import { dodoClient } from "@/lib/dodo.server";
import { FOUNDING_SPOTS } from "@/lib/pricing";

// The founding price is a Dodo discount code (37.5% off, usage limit 100,
// no cycle limit, so it applies to every renewal), not separate products:
// checkout shows the regular price struck through. Dodo's dashboard can't
// make a limited code the products' default discount, so the auth hook
// (auth.ts) adds it to every checkout session while spots remain. Dodo's
// own usage count is the source of truth for "spots left".
export const FOUNDING_DISCOUNT_CODE =
	process.env.DODO_FOUNDING_DISCOUNT_CODE || null;

export type FoundingStatus = {
	active: boolean;
	spots: number;
	left: number;
};

// Every checkout and pricing render would otherwise call Dodo. A minute of
// staleness only means the counter lags; Dodo still enforces the limit.
const CACHE_MS = 60_000;
let cached: { at: number; value: FoundingStatus } | null = null;

// Null when no code is configured or Dodo can't be reached: callers then
// fall back (no discount added, counter from local data).
export async function foundingStatus(): Promise<FoundingStatus | null> {
	if (!FOUNDING_DISCOUNT_CODE) return null;
	if (cached && Date.now() - cached.at < CACHE_MS) return cached.value;

	try {
		const discount = await dodoClient.discounts.retrieveByCode(
			FOUNDING_DISCOUNT_CODE,
		);
		const spots = discount.usage_limit ?? FOUNDING_SPOTS;
		const left = Math.max(0, spots - discount.times_used);
		const expired =
			discount.expires_at !== null &&
			discount.expires_at !== undefined &&
			new Date(discount.expires_at).getTime() < Date.now();
		const value = { active: left > 0 && !expired, spots, left };
		cached = { at: Date.now(), value };
		return value;
	} catch (e) {
		console.error(
			"[founding] discount lookup failed",
			e instanceof Error ? e.message : e,
		);
		return null;
	}
}

// Whether a subscription webhook payload carries the founding discount.
export function hasFoundingDiscount(data: unknown): boolean {
	if (!FOUNDING_DISCOUNT_CODE || !data || typeof data !== "object") {
		return false;
	}
	const { discounts, discount_id } = data as {
		discounts?: unknown;
		discount_id?: unknown;
	};
	if (Array.isArray(discounts)) {
		return discounts.some(
			(d) =>
				d &&
				typeof d === "object" &&
				(d as { code?: unknown }).code === FOUNDING_DISCOUNT_CODE,
		);
	}
	return typeof discount_id === "string" && discount_id.length > 0;
}
