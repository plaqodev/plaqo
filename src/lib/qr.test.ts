import QRCode from "qrcode";
import { describe, expect, it } from "vitest";
import { buildQrSvg } from "./qr";

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
