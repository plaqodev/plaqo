import { createServerFn } from "@tanstack/react-start";
import { FOUNDING_SPOTS, type ProPricing, type ProTier } from "@/lib/pricing";

// Public: the pricing table shows the live count. With the founding
// discount configured, Dodo's usage count is the source of truth and the
// tier flips to regular by itself when the spots run out. Without it (or if
// Dodo can't be reached) it falls back to counting Pro profiles and
// PRO_PRICING_TIER.
export const getProPricing = createServerFn({ method: "GET" }).handler(
	async (): Promise<ProPricing> => {
		const { foundingStatus } = await import("@/lib/founding.server");
		const yearlyAvailable = Boolean(process.env.DODO_PRO_ANNUAL_PRODUCT_ID);

		const status = await foundingStatus();
		if (status) {
			return {
				tier: status.active ? "founding" : "regular",
				foundingSpots: status.spots,
				foundingSpotsLeft: status.left,
				yearlyAvailable,
			};
		}

		const { eq, sql } = await import("drizzle-orm");
		const { db } = await import("@/db/index");
		const { profiles } = await import("@/db/schema");
		const tier: ProTier =
			process.env.PRO_PRICING_TIER === "regular" ? "regular" : "founding";
		const [row] = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(profiles)
			.where(eq(profiles.plan, "pro"));
		const taken = row?.count ?? 0;

		return {
			tier,
			foundingSpots: FOUNDING_SPOTS,
			foundingSpotsLeft: Math.max(0, FOUNDING_SPOTS - taken),
			yearlyAvailable,
		};
	},
);
