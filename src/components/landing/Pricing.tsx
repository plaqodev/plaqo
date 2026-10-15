import { ArrowRightIcon } from "@solar-icons/react/linear/arrow-right";
import { useNavigate } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import toast from "react-hot-toast";

import { authClient } from "@/lib/auth-client";
import { saveCheckoutIntent, startProCheckout } from "@/lib/billing";
import {
	type Billing,
	type ProPricing,
	proPriceLabel,
	REFUND_DAYS,
	SUPPORT_SLA,
	yearlyMonthsFree,
} from "@/lib/pricing";

import { focusClaimField } from "./claim";
import { SectionHeader } from "./Features";

const rows = [
	["All integrations", "All", "All"],
	["Integration limit", "Up to 5", "Unlimited"],
	["Sync", "Daily + on demand", "Daily + on demand"],
	["Links", "Up to 5", "Unlimited"],
	["Projects", "Up to 5", "Unlimited"],
	["Snippets", "Up to 5", "Unlimited"],
	["Basic themes", "Included", "Included"],
	["Analytics", "—", "Included"],
	["Custom CSS", "—", "Included"],
	["Remove plaqo branding", "—", "Included"],
	["QR code for your page", "plaqo colors", "Your accent"],
	["Email support", "Included", `Priority · ${SUPPORT_SLA}`],
];

const FALLBACK: ProPricing = {
	tier: "founding",
	foundingSpots: 100,
	foundingSpotsLeft: 100,
	yearlyAvailable: false,
};

const ease = [0.16, 1, 0.3, 1] as const;

export function Pricing({ pricing }: { pricing: ProPricing | null }) {
	const reduceMotion = useReducedMotion();
	const navigate = useNavigate();
	const { data: session } = authClient.useSession();
	const p = pricing ?? FALLBACK;
	const [billing, setBilling] = useState<Billing>("monthly");
	const [pending, setPending] = useState(false);
	const effectiveBilling: Billing = p.yearlyAvailable ? billing : "monthly";

	const founding = p.tier === "founding";
	const taken = p.foundingSpots - p.foundingSpotsLeft;

	async function goPro() {
		if (!session?.user) {
			saveCheckoutIntent(effectiveBilling);
			navigate({ to: "/signup", search: { username: undefined } });
			return;
		}
		setPending(true);
		try {
			await startProCheckout(effectiveBilling);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Checkout failed");
			setPending(false);
		}
	}

	const rowVariants = {
		hidden: reduceMotion ? {} : { opacity: 0, y: 12 },
		visible: {
			opacity: 1,
			y: 0,
			transition: { duration: reduceMotion ? 0.01 : 0.45, ease },
		},
	};

	return (
		<section id="pricing" className="border-t border-border">
			<div className="mx-auto max-w-editorial px-5 py-24 sm:px-8 sm:py-32">
				<motion.div
					initial={reduceMotion ? false : { opacity: 0, y: 18 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, amount: 0.35 }}
					transition={{
						duration: reduceMotion ? 0.01 : 0.7,
						ease,
					}}
				>
					<SectionHeader
						eyebrow="04 / Pricing"
						title="Free forever. Pro when you need more."
						sub="Start with everything you need to build your developer presence. Upgrade when you want more control."
					/>
				</motion.div>

				<div className="mt-14 flex flex-col gap-5 sm:mt-16 sm:flex-row sm:items-end sm:justify-between">
					{founding ? (
						<div className="max-w-md">
							<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand">
								{p.foundingSpotsLeft > 0
									? `Founding price · ${p.foundingSpotsLeft} of ${p.foundingSpots} spots left`
									: "Founding spots are full"}
							</p>
							<p className="mt-2 text-sm text-muted-foreground">
								{p.foundingSpotsLeft > 0
									? `The first ${p.foundingSpots} Pro members keep ${proPriceLabel("founding", "monthly")} for life — after that, Pro is ${proPriceLabel("regular", "monthly")}.`
									: `All ${p.foundingSpots} founding spots are taken. Thank you.`}
							</p>
							<div
								className="mt-3 h-1 w-full bg-border"
								role="progressbar"
								aria-label="Founding spots taken"
								aria-valuemin={0}
								aria-valuemax={p.foundingSpots}
								aria-valuenow={taken}
							>
								<div
									className="h-full bg-brand transition-[width] duration-700"
									style={{ width: `${(taken / p.foundingSpots) * 100}%` }}
								/>
							</div>
						</div>
					) : (
						<div />
					)}

					{p.yearlyAvailable && (
						<fieldset className="flex shrink-0 gap-px border border-border bg-border">
							<legend className="sr-only">Billing period</legend>
							{(
								[
									["monthly", "Monthly"],
									[
										"yearly",
										`Yearly · ${yearlyMonthsFree(p.tier)} months free`,
									],
								] as const
							).map(([value, label]) => (
								<label
									key={value}
									className={`cursor-pointer px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring ${
										billing === value
											? "bg-foreground text-background"
											: "bg-background text-muted-foreground hover:text-foreground"
									}`}
								>
									<input
										type="radio"
										name="billing"
										value={value}
										checked={billing === value}
										onChange={() => setBilling(value)}
										className="sr-only"
									/>
									{label}
								</label>
							))}
						</fieldset>
					)}
				</div>

				<motion.div
					className="mt-8 border-t border-border"
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, amount: 0.08 }}
					variants={{
						hidden: {},
						visible: {
							transition: {
								staggerChildren: reduceMotion ? 0 : 0.055,
							},
						},
					}}
				>
					<motion.div
						variants={rowVariants}
						className="grid grid-cols-[minmax(0,1fr)_7rem_7rem] border-b border-border py-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:grid-cols-[minmax(0,1fr)_10rem_10rem]"
					>
						<span>Feature</span>

						<div className="text-right">
							<div className="text-foreground">Free</div>
							<div className="mt-1 normal-case tracking-normal">
								$0 · forever
							</div>
						</div>

						<div className="text-right">
							<div className="text-foreground">Pro</div>
							<div className="mt-1 normal-case tracking-normal">
								{proPriceLabel(p.tier, effectiveBilling)}
							</div>
						</div>
					</motion.div>

					{rows.map(([label, free, pro], index) => (
						<motion.div
							key={label}
							variants={rowVariants}
							className="grid grid-cols-[minmax(0,1fr)_7rem_7rem] items-center border-b border-border py-5 sm:grid-cols-[minmax(0,1fr)_10rem_10rem]"
						>
							<div className="flex min-w-0 items-baseline gap-3">
								<span className="shrink-0 font-mono text-[9px] text-muted-foreground">
									{String(index + 1).padStart(2, "0")}
								</span>

								<span className="truncate text-sm">{label}</span>
							</div>

							<span className="text-right text-sm text-muted-foreground">
								{free}
							</span>

							<span className="text-right text-sm text-foreground">{pro}</span>
						</motion.div>
					))}

					<motion.div
						variants={rowVariants}
						className="flex flex-col items-stretch gap-4 py-6 sm:flex-row sm:items-center sm:justify-between"
					>
						<p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
							Cancel anytime · Full refund within {REFUND_DAYS} days
						</p>

						<div className="flex flex-wrap items-center gap-3">
							<button
								type="button"
								onClick={() => focusClaimField(reduceMotion)}
								className="inline-flex items-center gap-2 border border-border px-4 py-3 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground md:py-2.5"
							>
								Start free
							</button>

							<button
								type="button"
								onClick={goPro}
								disabled={pending}
								className="group inline-flex items-center gap-2 border border-foreground bg-foreground px-4 py-3 font-mono text-[10px] uppercase tracking-[0.08em] text-background transition-colors hover:border-brand hover:bg-brand disabled:opacity-60 md:py-2.5"
							>
								{pending
									? "Redirecting…"
									: `Go Pro — ${proPriceLabel(p.tier, effectiveBilling)}`}
								<ArrowRightIcon
									size={13}
									className="transition-transform duration-300 group-hover:translate-x-1"
								/>
							</button>
						</div>
					</motion.div>
				</motion.div>
			</div>
		</section>
	);
}
