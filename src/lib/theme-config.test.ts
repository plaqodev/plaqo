import { describe, expect, it } from "vitest";
import {
	defaultThemeV2,
	parseThemeConfig,
	themeToStyleTag,
	themeV2Schema,
} from "./theme-config";

const BREAKOUT = "#000;}</style><img src=x onerror=alert(1)><style>";

describe("theme XSS hardening", () => {
	it.each(["bg", "fg", "muted", "surface", "border", "accent", "accent2"])(
		"rejects a style-tag breakout in %s",
		(key) => {
			expect(
				themeV2Schema.safeParse({ ...defaultThemeV2, [key]: BREAKOUT }).success,
			).toBe(false);
		},
	);

	it.each(["headingFont", "bodyFont", "monoFont"])(
		"rejects unknown fonts in %s",
		(key) => {
			expect(
				themeV2Schema.safeParse({ ...defaultThemeV2, [key]: "x;}</style>" })
					.success,
			).toBe(false);
		},
	);

	it.each([
		"#fff",
		"#7c5cff",
		"#7c5cff80",
		"rgb(10, 20, 30)",
		"rgba(10, 20, 30, 0.5)",
		"hsl(250, 100%, 68%)",
	])("accepts color %s", (color) => {
		expect(
			themeV2Schema.safeParse({ ...defaultThemeV2, accent: color }).success,
		).toBe(true);
	});

	it("never emits a closing tag even for an unvalidated stored theme", () => {
		// Bypasses the schema, like a row written before validation existed.
		const css = themeToStyleTag({
			...defaultThemeV2,
			bg: BREAKOUT,
			customCss: "a{}</style><script>x</script>",
		});
		expect(css).not.toContain("<");
	});

	it("falls back to the default theme for invalid stored config", () => {
		expect(parseThemeConfig({ bg: BREAKOUT })).toEqual(defaultThemeV2);
	});
});

describe("built-in templates", () => {
	it("all pass the hardened schema", async () => {
		const { templates } = await import("./theme-templates");
		const failing = templates
			.filter((t) => !themeV2Schema.safeParse(t.config).success)
			.map((t) => t.id);
		expect(failing).toEqual([]);
	});
});

describe("theme effects reach every profile card", () => {
	const css = (patch: Partial<typeof defaultThemeV2>) =>
		themeToStyleTag({ ...defaultThemeV2, ...patch }, ".tt-scope");

	it("gives blocks (.tt-panel) the theme radius and shadow", () => {
		expect(css({})).toMatch(
			/\.tt-scope \.tt-panel \{[^}]*border-radius: var\(--tt-radius\)[^}]*box-shadow: var\(--tt-shadow\)/,
		);
	});

	it("applies glass to blocks as well as links", () => {
		const out = css({ glass: true });
		expect(out).toContain(".tt-scope .tt-card, .tt-scope .tt-panel {");
		expect(out).toMatch(/backdrop-filter: blur\(14px\)/);
		expect(css({ glass: false })).not.toMatch(/backdrop-filter: blur\(14px\)/);
	});

	it("moves only clickable cards on hover", () => {
		const out = css({ hover: "lift" });
		expect(out).toContain(
			".tt-scope .tt-card:hover, .tt-scope a.tt-panel:hover {",
		);
		expect(out).not.toContain(".tt-scope .tt-panel:hover");
		expect(css({ hover: "none" })).not.toContain(":hover { transform");
	});
});
