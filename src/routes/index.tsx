import { createFileRoute } from "@tanstack/react-router";
import { Cta } from "@/components/landing/cta";
import { Faq, faqs } from "@/components/landing/Faq";
import { Features } from "@/components/landing/Features";
import { Hero } from "@/components/landing/Hero";
import { Pricing } from "@/components/landing/Pricing";
import { PREVIEW_USERNAME } from "@/components/landing/ProfilePreview";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { getProPricing } from "@/lib/api/pricing.functions";
import { getPublicProfile } from "@/lib/api/public-profile.functions";
import { PRO_PRICES } from "@/lib/pricing";
import { absoluteUrl } from "@/lib/site";

export const Route = createFileRoute("/")({
	head: ({ loaderData }) => {
		const orgId = absoluteUrl("/#organization");
		const tier = loaderData?.pricing?.tier ?? "founding";
		const proOffer = (billing: "monthly" | "yearly") => {
			const price = String(PRO_PRICES[tier][billing]);
			return {
				"@type": "Offer",
				name: billing === "monthly" ? "Pro" : "Pro (yearly)",
				price,
				priceCurrency: "USD",
				availability: "https://schema.org/InStock",
				priceSpecification: {
					"@type": "UnitPriceSpecification",
					price,
					priceCurrency: "USD",
					unitText: billing === "monthly" ? "MONTH" : "ANN",
				},
			};
		};

		// @graph con lo que ya existe de verdad en la página: la copy de
		// Pricing.tsx (sin inventar aggregateRating, no hay reviews reales) y
		// las preguntas de Faq.tsx tal cual (mismo array, no una copia que
		// pueda desincronizarse).
		const jsonLd = {
			"@context": "https://schema.org",
			"@graph": [
				{
					"@type": "Organization",
					"@id": orgId,
					name: "plaqo",
					url: absoluteUrl("/"),
					logo: absoluteUrl("/android-chrome-512.png"),
					sameAs: ["https://github.com/ingfranciscastillo"],
				},
				{
					"@type": "WebSite",
					"@id": absoluteUrl("/#website"),
					name: "plaqo",
					url: absoluteUrl("/"),
					publisher: { "@id": orgId },
					potentialAction: {
						"@type": "SearchAction",
						target: {
							"@type": "EntryPoint",
							urlTemplate: absoluteUrl("/discover?q={search_term_string}"),
						},
						"query-input": "required name=search_term_string",
					},
				},
				{
					"@type": "SoftwareApplication",
					"@id": absoluteUrl("/#software"),
					name: "plaqo",
					url: absoluteUrl("/"),
					applicationCategory: "DeveloperApplication",
					operatingSystem: "Web",
					offers: [
						{
							"@type": "Offer",
							name: "Free",
							price: "0",
							priceCurrency: "USD",
							availability: "https://schema.org/InStock",
						},
						proOffer("monthly"),
						...(loaderData?.pricing?.yearlyAvailable
							? [proOffer("yearly")]
							: []),
					],
				},
				{
					"@type": "FAQPage",
					"@id": absoluteUrl("/#faq"),
					mainEntity: faqs.map((faq) => ({
						"@type": "Question",
						name: faq.q,
						acceptedAnswer: {
							"@type": "Answer",
							text: faq.a,
						},
					})),
				},
			],
		};

		return {
			meta: [
				{ title: "plaqo — The link-in-bio built for developers" },
				{
					name: "description",
					content:
						"Your repos, snippets, articles and projects on one page — auto-synced with GitHub, Dev.to, Medium and Stack Overflow.",
				},
				{
					property: "og:title",
					content: "plaqo — The link-in-bio for developers",
				},
				{
					property: "og:description",
					content:
						"One page for everything you ship. Built for developers, with the polish of Linear and the speed of Vercel.",
				},
				{ property: "og:url", content: absoluteUrl("/") },
				// Built-in JSON-LD support: renders a correctly-typed
				// <script type="application/ld+json"> with safe escaping — see
				// the same pattern/comment in routes/$username.tsx. A flat
				// `scripts: [{ attrs, children }]` entry gets misassembled into
				// a nested `attrs.attrs`, losing the `type` attr.
				{ "script:ld+json": jsonLd },
			],
			links: [{ rel: "canonical", href: absoluteUrl("/") }],
		};
	},
	// The hero's live preview renders a real profile. A failed or missing
	// profile just hides that block — it must never take the landing down.
	// The pricing table's founding-spots count is live too; on failure it
	// falls back to plain founding pricing (Pricing's FALLBACK).
	loader: async () => {
		const [preview, pricing] = await Promise.all([
			getPublicProfile({ data: { username: PREVIEW_USERNAME } }).catch(
				() => null,
			),
			getProPricing().catch(() => null),
		]);
		return { preview, pricing };
	},
	component: Landing,
});

function Landing() {
	const { preview, pricing } = Route.useLoaderData();
	return (
		<div className="min-h-dvh bg-background text-foreground">
			<Header />
			<main>
				<Hero preview={preview} />
				<Features />
				<Pricing pricing={pricing} />
				<Faq />
				<Cta />
			</main>
			<Footer />
		</div>
	);
}
