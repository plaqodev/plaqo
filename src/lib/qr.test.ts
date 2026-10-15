import QRCode from "qrcode";
import { describe, expect, it } from "vitest";
import { buildQrSvg, qrEyeColor } from "./qr";

const URL = "https://plaqo.dev/ingfranciscastillo";

describe("buildQrSvg", () => {
	it("is a square SVG with the spec's 4-module quiet zone", () => {
		const size = QRCode.create(URL, { errorCorrectionLevel: "H" }).modules.size;
		const svg = buildQrSvg(URL);
		expect(svg.startsWith("<svg")).toBe(true);
		expect(svg).toContain(`viewBox="0 0 ${size + 8} ${size + 8}"`);
	});

	it("uses error correction level H so the center logo is recoverable", () => {
		// Same data at level H yields a larger matrix than at the default M.
		const h = QRCode.create(URL, { errorCorrectionLevel: "H" }).modules.size;
		const m = QRCode.create(URL).modules.size;
		expect(h).toBeGreaterThan(m);
		expect(buildQrSvg(URL)).toContain(`viewBox="0 0 ${h + 8} ${h + 8}"`);
	});

	it("draws three finder eyes and the plaqo mark", () => {
		const svg = buildQrSvg(URL);
		expect(svg.match(/fill-rule="evenodd" d="M/g)?.length).toBe(4); // 3 eyes + mark body
		expect(svg).toContain("M70 62H82V84H70Z"); // the mark's accent post
	});

	it("is deterministic for the same URL", () => {
		expect(buildQrSvg(URL)).toBe(buildQrSvg(URL));
	});
});

describe("qrEyeColor (Pro accent)", () => {
	it("keeps an accent that's dark enough to scan against the paper", () => {
		expect(qrEyeColor("#0f766e")).toBe("#0f766e"); // dark teal
		expect(qrEyeColor("#1d4ed8")).toBe("#1d4ed8"); // deep blue
	});

	it("falls back to vermilion for light or invalid accents", () => {
		expect(qrEyeColor("#7aa2f7")).toBe("#9D3326"); // light blue
		expect(qrEyeColor("#facc15")).toBe("#9D3326"); // yellow
		expect(qrEyeColor("not-a-color")).toBe("#9D3326");
		expect(qrEyeColor(null)).toBe("#9D3326");
	});

	it("recolors the eyes and the mark's post", () => {
		const svg = buildQrSvg(URL, { accent: "#0f766e" });
		expect(svg).toContain('fill="#0f766e"');
		expect(svg).not.toContain('fill="#9D3326"');
	});
});
