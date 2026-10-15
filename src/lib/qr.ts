import QRCode from "qrcode";

// Brand palette: ink modules on paper, vermilion finder "eyes". Always a
// light background — inverted (light-on-dark) codes fail on many scanners,
// so the code stays paper-and-ink even in dark mode.
const INK = "#181714";
const PAPER = "#F4F1EB";
const ACCENT = "#9D3326";

// The plaqo mark (a plaque on two posts), in its 14 17 72 72 box.
const MARK_BODY = "M18 22H82V62H30V84H18Z M30 34H70V50H30Z";
const MARK_POST = "M70 62H82V84H70Z";

// Spec quiet zone: four modules of empty margin on every side.
const QUIET = 4;
// Finder patterns are 7×7 at three corners.
const FINDER = 7;
// Share of the code's width the center logo plate covers. Level H recovers
// up to ~30% damage; a 22%-wide plate clears ~5% of the area.
const LOGO_RATIO = 0.22;

function isFinder(row: number, col: number, size: number) {
	const top = row < FINDER;
	const left = col < FINDER;
	const right = col >= size - FINDER;
	const bottom = row >= size - FINDER;
	return (top && left) || (top && right) || (bottom && left);
}

// A rounded 7×7 finder: outer ring and 3×3 core, drawn as shapes instead of
// modules so the corners read as part of the brand.
function finderEye(x: number, y: number, color: string) {
	return [
		`<path fill="${color}" fill-rule="evenodd" d="M${x + 1.1} ${y}h4.8a1.1 1.1 0 0 1 1.1 1.1v4.8a1.1 1.1 0 0 1-1.1 1.1h-4.8a1.1 1.1 0 0 1-1.1-1.1v-4.8a1.1 1.1 0 0 1 1.1-1.1Z M${x + 1.5} ${y + 1}h4a0.5 0.5 0 0 1 0.5 0.5v4a0.5 0.5 0 0 1-0.5 0.5h-4a0.5 0.5 0 0 1-0.5-0.5v-4a0.5 0.5 0 0 1 0.5-0.5Z"/>`,
		`<rect x="${x + 2}" y="${y + 2}" width="3" height="3" rx="0.5" fill="${color}"/>`,
	].join("");
}

// WCAG relative luminance of a #rrggbb color.
function luminance(hex: string): number {
	const channel = (i: number) => {
		const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
		return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

// Finder eyes have to read as dark against the paper or scanners can't
// locate the code. Below this contrast a custom accent falls back to the
// brand vermilion (#9D3326 sits at ~6.9:1).
const MIN_EYE_CONTRAST = 3.5;

export function qrEyeColor(accent?: string | null): string {
	if (!accent || !/^#[0-9a-f]{6}$/i.test(accent)) return ACCENT;
	const contrast = (luminance(PAPER) + 0.05) / (luminance(accent) + 0.05);
	return contrast >= MIN_EYE_CONTRAST ? accent : ACCENT;
}

// SVG for a branded QR code pointing at `url`. Pure (no DOM), so the same
// markup is rendered in the dashboard, downloaded, and decoded in tests.
// `accent` (Pro) recolors the finder eyes when it's dark enough to scan.
export function buildQrSvg(
	url: string,
	options: { accent?: string | null } = {},
): string {
	const eye = qrEyeColor(options.accent);
	const { modules } = QRCode.create(url, { errorCorrectionLevel: "H" });
	const size = modules.size;
	const total = size + QUIET * 2;

	// Logo plate: an odd number of modules, centered on the matrix.
	let plate = Math.round(size * LOGO_RATIO);
	if (plate % 2 === 0) plate += 1;
	const plateStart = (size - plate) / 2;
	const inPlate = (row: number, col: number) =>
		row >= plateStart &&
		row < plateStart + plate &&
		col >= plateStart &&
		col < plateStart + plate;

	const cells: string[] = [];
	for (let row = 0; row < size; row++) {
		for (let col = 0; col < size; col++) {
			if (!modules.get(row, col)) continue;
			if (isFinder(row, col, size) || inPlate(row, col)) continue;
			cells.push(
				`<rect x="${col + QUIET + 0.04}" y="${row + QUIET + 0.04}" width="0.92" height="0.92" rx="0.2"/>`,
			);
		}
	}

	const far = size - FINDER + QUIET;
	const eyes = [
		finderEye(QUIET, QUIET, eye),
		finderEye(far, QUIET, eye),
		finderEye(QUIET, far, eye),
	].join("");

	// Plate with a hairline of breathing room, then the mark inside it.
	const px = plateStart + QUIET;
	const markInset = plate * 0.16;
	const markSize = plate - markInset * 2;
	const scale = markSize / 72;
	const mark = `<g transform="translate(${px + markInset - 14 * scale} ${px + markInset - 17 * scale}) scale(${scale})"><path fill="${INK}" fill-rule="evenodd" d="${MARK_BODY}"/><path fill="${eye}" d="${MARK_POST}"/></g>`;

	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="geometricPrecision"><rect width="${total}" height="${total}" fill="${PAPER}"/><g fill="${INK}">${cells.join("")}</g>${eyes}<rect x="${px - 0.2}" y="${px - 0.2}" width="${plate + 0.4}" height="${plate + 0.4}" rx="1.2" fill="${PAPER}"/>${mark}</svg>`;
}
