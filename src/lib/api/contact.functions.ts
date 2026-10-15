import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { z } from "zod";
import { escapeHtml, sendEmail } from "@/lib/email";
import { SUPPORT_SLA } from "@/lib/pricing";
import { consumeRateLimit } from "@/lib/rate-limit.server";
import { emailSchema } from "@/lib/schemas/auth";
import { clientIp, securityLog } from "@/lib/security-log";

const CONTACT_WINDOW_MS = 60 * 60 * 1000;
const CONTACT_MAX = 3;

export const contactSchema = z.object({
	name: z.string().min(1).max(120),
	email: emailSchema,
	message: z.string().min(1).max(4000),
	// Honeypot: campo oculto en el form real, invisible para humanos. Los bots
	// que autocompletan todo lo llenan — si viene con algo, fingimos éxito sin
	// mandar el email.
	website: z.string().optional(),
});

// Best effort: no session, or any lookup failure, just means "not Pro" —
// the message still goes out. Server modules are imported inside the
// handler so none of them are pulled into the client bundle.
async function senderIsPro(): Promise<boolean> {
	try {
		const { auth } = await import("@/lib/auth");
		const session = await auth.api.getSession({
			headers: getRequestHeaders(),
		});
		if (!session?.user) return false;
		const { db } = await import("@/db/index");
		const { profiles } = await import("@/db/schema");
		const { eq } = await import("drizzle-orm");
		const [row] = await db
			.select({ plan: profiles.plan })
			.from(profiles)
			.where(eq(profiles.id, session.user.id))
			.limit(1);
		return row?.plan === "pro";
	} catch {
		return false;
	}
}

export const sendContactMessage = createServerFn({ method: "POST" })
	.validator((input) => contactSchema.parse(input))
	.handler(async ({ data }) => {
		if (data.website) {
			return { ok: true as const };
		}

		// Public and sends an email per call: without a limit anyone could
		// flood the inbox and burn the email provider's quota.
		const ip = clientIp(getRequestHeaders()) ?? "unknown";
		if (
			!(await consumeRateLimit("contact", ip, CONTACT_WINDOW_MS, CONTACT_MAX))
		) {
			securityLog("contact.rate_limited", "blocked", { ip });
			throw new Error("Too many messages. Please try again later.");
		}

		const to = process.env.CONTACT_EMAIL || "support@plaqo.dev";
		const name = escapeHtml(data.name);
		const email = escapeHtml(data.email);
		const message = escapeHtml(data.message);

		// Priority support: Pro members get a reply within SUPPORT_SLA, so their
		// messages are tagged [PRO]. Decided from the signed-in session, never
		// from the typed email — anyone can type a Pro member's address.
		const pro = await senderIsPro();
		const tag = pro ? "[PRO] " : "";
		const planLine = pro ? `Pro member — reply within ${SUPPORT_SLA}.` : "";

		await sendEmail({
			to,
			subject: `${tag}New contact message from ${data.name}`,
			html: `${planLine ? `<p><strong>${planLine}</strong></p>` : ""}<p><strong>From:</strong> ${name} (${email})</p><p>${message.replace(/\n/g, "<br>")}</p>`,
			text: `${planLine ? `${planLine}\n` : ""}From: ${data.name} (${data.email})\n\n${data.message}`,
		});

		return { ok: true as const };
	});
