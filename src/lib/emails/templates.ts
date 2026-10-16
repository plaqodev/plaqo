import { escapeHtml } from "@/lib/email";
import {
	type Billing,
	FOUNDING_SPOTS,
	type ProTier,
	proPriceLabel,
	REFUND_DAYS,
} from "@/lib/pricing";
import { SITE_DOMAIN, SITE_URL } from "@/lib/site";
import { renderEmail } from "./layout";

export type RenderedEmail = { subject: string; html: string; text: string };

function firstName(name: string | null | undefined) {
	return name?.trim().split(/\s+/)[0] || "there";
}

const link = (url: string, label: string) =>
	`<a href="${escapeHtml(url)}" style="color:#181714;">${escapeHtml(label)}</a>`;

// 01 — sent on sign-up (better-auth emailVerification).
export function verifyEmail(input: {
	name?: string | null;
	url: string;
}): RenderedEmail {
	return {
		subject: "Confirm your email for plaqo",
		...renderEmail({
			preheader: "One click and your account is confirmed.",
			eyebrow: "01 / Account",
			title: "Confirm your email.",
			paragraphs: [
				`Hi ${firstName(input.name)},`,
				"Confirm this address so you can recover your account and receive your billing emails.",
			],
			cta: { label: "Confirm email", url: input.url },
			note: "Didn't sign up for plaqo? You can ignore this email.",
		}),
	};
}

// 02 — sent on request (better-auth sendResetPassword).
export function resetPassword(input: {
	email: string;
	url: string;
	expiresInMinutes: number;
}): RenderedEmail {
	return {
		subject: "Reset your plaqo password",
		...renderEmail({
			preheader: `This link works once, for the next ${input.expiresInMinutes} minutes.`,
			eyebrow: "01 / Account",
			title: "Reset your password.",
			paragraphs: [
				`Someone asked to reset the password for ${input.email}. If it was you, choose a new one below.`,
				"Resetting signs you out on your other devices.",
			],
			cta: { label: "Choose a new password", url: input.url },
			note: `The link expires in ${input.expiresInMinutes} minutes. Didn't ask for this? Your password stays the same.`,
		}),
	};
}

// 03 — sent once the username is claimed and the page exists.
export function welcome(input: {
	name?: string | null;
	username: string;
	githubConnected: boolean;
}): RenderedEmail {
	const pageUrl = `${SITE_URL}/${input.username}`;
	const address = `${SITE_DOMAIN}/${input.username}`;
	return {
		subject: `Your page is live at ${address}`,
		...renderEmail({
			preheader: input.githubConnected
				? "Your repositories are already on it."
				: "Connect GitHub next and it fills itself in.",
			eyebrow: "02 / Welcome",
			title: "Your page is live.",
			paragraphs: [
				`Hi ${firstName(input.name)},`,
				{
					html: `${link(pageUrl, address)} is yours. Put it in your GitHub bio, your resume or your email signature.`,
				},
				input.githubConnected
					? "Your GitHub is connected. Your repositories and contribution graph show up after the first sync and stay current every day. Add a project or a snippet to show what you're proudest of."
					: "Right now it shows your name and bio. Connect GitHub and it adds your repositories, your contribution graph and your pinned work, then keeps them current every day.",
				"Questions or feedback? Reply here. I read every email.",
			],
			signoff: "Francis, founder of plaqo",
			cta: input.githubConnected
				? { label: "Open your page", url: pageUrl }
				: {
						label: "Connect GitHub",
						url: `${SITE_URL}/dashboard/integrations`,
					},
		}),
	};
}

// 04 — first Pro activation (Dodo webhook).
export function proWelcome(input: {
	name?: string | null;
	tier: ProTier;
	billing: Billing;
	foundingNumber: number | null;
}): RenderedEmail {
	const founding = input.tier === "founding" && input.foundingNumber !== null;
	const price = proPriceLabel(input.tier, input.billing);
	return {
		subject: founding
			? `You're founding member #${input.foundingNumber} of plaqo Pro`
			: "Welcome to plaqo Pro",
		...renderEmail({
			preheader: "Analytics, custom CSS and unlimited items are switched on.",
			eyebrow: "03 / Pro",
			title: founding
				? `Founding member #${input.foundingNumber}.`
				: "You're on Pro.",
			paragraphs: [
				`Hi ${firstName(input.name)},`,
				founding
					? `Thank you. You're one of the first ${FOUNDING_SPOTS} Pro members, so you keep ${price} for as long as your subscription stays active.`
					: `Thank you for going Pro (${price}).`,
				{
					html: "Switched on now:<br>&middot; Analytics: who visits your page and which links they open<br>&middot; Custom CSS on top of the theme builder<br>&middot; Unlimited links, projects, snippets and integrations<br>&middot; No plaqo branding on your page<br>&middot; Your QR code in your accent color",
				},
			],
			cta: {
				label: "See who's visiting",
				url: `${SITE_URL}/dashboard/analytics`,
			},
			note: `Cancel anytime from Settings. If Pro isn't for you, reply within ${REFUND_DAYS} days for a full refund.`,
		}),
	};
}

// 05 — a renewal charge failed (Dodo webhook).
export function paymentFailed(input: { name?: string | null }): RenderedEmail {
	return {
		subject: "Your plaqo Pro payment didn't go through",
		...renderEmail({
			preheader: "Update your card to keep Pro active.",
			eyebrow: "03 / Billing",
			title: "Your payment didn't go through.",
			paragraphs: [
				`Hi ${firstName(input.name)},`,
				"We couldn't charge your card for plaqo Pro. This usually means the card expired or the bank declined the charge.",
				"Update your payment method from Settings and the charge will be retried.",
			],
			cta: {
				label: "Update payment method",
				url: `${SITE_URL}/dashboard/settings`,
			},
			note: "Already fixed it? You can ignore this email.",
		}),
	};
}

// 06 — Pro ended (Dodo webhook). Two cases with different jobs:
// "cancelled" (they chose to leave: hear why) and "payment" (the grace period
// ran out on a failed charge: get the card updated, Pro comes back).
export function proEnded(input: {
	name?: string | null;
	wasFounding: boolean;
	reason: "cancelled" | "payment";
}): RenderedEmail {
	const afterPayment = input.reason === "payment";
	const status =
		"Your page stays live on the Free plan and nothing you added was deleted. Analytics and custom CSS are off, and the plaqo branding is back on your page.";

	if (afterPayment) {
		return {
			subject: "Your plaqo Pro plan is paused",
			...renderEmail({
				preheader:
					"We couldn't charge your card. Update it and Pro comes back.",
				eyebrow: "03 / Billing",
				title: "Your Pro plan is paused.",
				paragraphs: [
					`Hi ${firstName(input.name)},`,
					"We couldn't charge your card for plaqo Pro, so your plan is on hold.",
					status,
					...(input.wasFounding
						? [
								"Update your payment method and Pro comes back on the same subscription, founding price included.",
							]
						: [
								"Update your payment method and Pro comes back on the same subscription.",
							]),
				],
				cta: {
					label: "Update payment method",
					url: `${SITE_URL}/dashboard/settings`,
				},
			}),
		};
	}

	return {
		subject: "Your plaqo Pro plan has ended",
		...renderEmail({
			preheader: "Your page stays up on the Free plan. Nothing was deleted.",
			eyebrow: "03 / Billing",
			title: "Your Pro plan has ended.",
			paragraphs: [
				`Hi ${firstName(input.name)},`,
				status,
				...(input.wasFounding
					? [
							"The founding price stays with active subscriptions, so if you come back later, the price at that time applies.",
						]
					: []),
				"One question, if you have a minute: what made you cancel? Reply with a line. It comes straight to me, and it decides what I build next.",
			],
			signoff: "Francis, founder of plaqo",
		}),
	};
}
