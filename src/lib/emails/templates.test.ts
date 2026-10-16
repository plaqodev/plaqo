import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as t from "./templates";

const samples = {
	"1-verify": t.verifyEmail({
		name: "Ada Lovelace",
		url: "https://plaqo.dev/api/auth/verify-email?token=abc",
	}),
	"2-reset": t.resetPassword({
		email: "ada@example.com",
		url: "https://plaqo.dev/reset-password/abc",
		expiresInMinutes: 30,
	}),
	"3-welcome": t.welcome({
		name: "Ada Lovelace",
		username: "ada",
		githubConnected: false,
	}),
	"4-pro": t.proWelcome({
		name: "Ada Lovelace",
		tier: "founding",
		billing: "monthly",
		foundingNumber: 7,
	}),
	"5-failed": t.paymentFailed({ name: "Ada Lovelace" }),
	"6-ended": t.proEnded({
		name: "Ada Lovelace",
		wasFounding: true,
		reason: "cancelled",
	}),
	"7-paused": t.proEnded({
		name: "Ada Lovelace",
		wasFounding: true,
		reason: "payment",
	}),
};

// EMAIL_PREVIEW_DIR=<dir> pnpm vitest run src/lib/emails writes every
// sample as .html/.txt to eyeball in a browser.
const previewDir = process.env.EMAIL_PREVIEW_DIR;
if (previewDir) {
	mkdirSync(previewDir, { recursive: true });
	for (const [name, email] of Object.entries(samples)) {
		writeFileSync(join(previewDir, `${name}.html`), email.html);
		writeFileSync(
			join(previewDir, `${name}.txt`),
			`Subject: ${email.subject}\n\n${email.text}`,
		);
	}
}

describe("email templates", () => {
	it.each(Object.entries(samples))("%s has subject, html and text", (_, e) => {
		expect(e.subject.length).toBeGreaterThan(10);
		expect(e.html.startsWith("<!doctype html>")).toBe(true);
		expect(e.text.length).toBeGreaterThan(40);
	});

	it.each(Object.entries(samples))(
		"%s keeps em dashes out of the subject (no AI tells)",
		(_, e) => {
			expect(e.subject).not.toContain("—");
		},
	);

	it("escapes user-controlled values", () => {
		const e = t.verifyEmail({
			name: '<img src=x onerror="alert(1)">',
			url: 'https://plaqo.dev/?a="><script>',
		});
		expect(e.html).not.toContain("<img src=x");
		expect(e.html).not.toContain("<script>");
	});

	it("states the real reset expiry", () => {
		const e = t.resetPassword({
			email: "a@b.c",
			url: "https://x",
			expiresInMinutes: 30,
		});
		expect(e.html).toContain("30 minutes");
		expect(e.html).not.toContain("1 hour");
	});

	it("names the founding number only for founding members", () => {
		expect(samples["4-pro"].subject).toContain("#7");
		const regular = t.proWelcome({
			name: "A",
			tier: "regular",
			billing: "yearly",
			foundingNumber: null,
		});
		expect(regular.subject).toBe("Welcome to plaqo Pro");
		expect(regular.html).toContain("$80/yr");
	});

	it("points the welcome CTA at the next step", () => {
		expect(samples["3-welcome"].html).toContain("/dashboard/integrations");
		const connected = t.welcome({
			name: "A",
			username: "ada",
			githubConnected: true,
		});
		expect(connected.html).toContain("Open your page");
	});
});
