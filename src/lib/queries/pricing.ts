import { useQuery } from "@tanstack/react-query";
import { getProPricing } from "@/lib/api/pricing.functions";
import { proPriceLabel } from "@/lib/pricing";

export const proPricingKey = ["pro-pricing"] as const;

export function useProPricing() {
	return useQuery({
		queryKey: proPricingKey,
		queryFn: () => getProPricing(),
		staleTime: 5 * 60 * 1000,
	});
}

// "$5/mo" today, "$8/mo" once PRO_PRICING_TIER=regular — what the dashboard's
// upgrade buttons charge (they check out monthly).
export function useProMonthlyLabel(): string {
	const { data } = useProPricing();
	return proPriceLabel(data?.tier ?? "founding", "monthly");
}
