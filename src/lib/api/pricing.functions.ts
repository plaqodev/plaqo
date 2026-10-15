import { createServerFn } from "@tanstack/react-start";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db/index";
import { profiles } from "@/db/schema";
import { FOUNDING_SPOTS, type ProPricing, type ProTier } from "@/lib/pricing";

// How many founding spots warn ahead of running out, so the products can be
// switched to regular pricing before the cap is crossed.
const WARN_AT_LEFT = 10;

// Public: the pricing table shows the live count. The count is every Pro
// account (paid or comped), which is what "spots taken" means.
export const getProPricing = createServerFn({ method: "GET" }).handler(
	async (): Promise<ProPricing> => {
		const tier: ProTier =
			process.env.PRO_PRICING_TIER === "regular" ? "regular" : "founding";

		const [row] = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(profiles)
			.where(eq(profiles.plan, "pro"));
		const taken = row?.count ?? 0;
		const left = Math.max(0, FOUNDING_SPOTS - taken);

		if (tier === "founding" && left <= WARN_AT_LEFT) {
			console.warn(
				`[pricing] ${left} founding spots left — create the regular Pro products in Dodo, update DODO_PRO_PRODUCT_ID / DODO_PRO_ANNUAL_PRODUCT_ID and set PRO_PRICING_TIER=regular.`,
			);
		}

		return {
			tier,
			foundingSpots: FOUNDING_SPOTS,
			foundingSpotsLeft: left,
			yearlyAvailable: Boolean(process.env.DODO_PRO_ANNUAL_PRODUCT_ID),
		};
	},
);
