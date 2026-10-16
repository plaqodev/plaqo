import { describe, expect, it } from "vitest";
import { VERIFY_EMAIL_CALLBACK, withVerifyCallback } from "./verification";

const base = "https://plaqo.dev/api/auth/verify-email?token=abc";

describe("withVerifyCallback", () => {
	it("adds the dashboard callback when there is none", () => {
		const url = new URL(withVerifyCallback(base));
		expect(url.searchParams.get("callbackURL")).toBe(VERIFY_EMAIL_CALLBACK);
		expect(url.searchParams.get("token")).toBe("abc");
	});

	it("replaces the bare root callback", () => {
		const url = new URL(withVerifyCallback(`${base}&callbackURL=%2F`));
		expect(url.searchParams.get("callbackURL")).toBe(VERIFY_EMAIL_CALLBACK);
	});

	it("keeps an explicit callback", () => {
		const url = new URL(
			withVerifyCallback(`${base}&callbackURL=%2Fdashboard%2Fsettings`),
		);
		expect(url.searchParams.get("callbackURL")).toBe("/dashboard/settings");
	});
});
