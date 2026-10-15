// One number style for every count on a profile (followers, stars, pulls,
// downloads, reputation…). Locale is pinned so the server render and the
// browser's hydration produce the same string — toLocaleString() with no
// argument follows each runtime's default locale and can differ.
const full = new Intl.NumberFormat("en-US");
const compact = new Intl.NumberFormat("en-US", {
	notation: "compact",
	maximumFractionDigits: 1,
});

// Pinned to UTC as well: a date-only value like "2026-04-25" parses as UTC
// midnight, and formatting it in a viewer's local zone west of UTC would
// show the 24th — and disagree with the server render.
const date = new Intl.DateTimeFormat("en-US", {
	month: "short",
	day: "numeric",
	year: "numeric",
	timeZone: "UTC",
});

// "Apr 25, 2026" — every date on a profile (posts, videos, talks, articles).
export function formatDate(value: string | Date): string {
	return date.format(typeof value === "string" ? new Date(value) : value);
}

// Full number with grouping below 10,000 ("2,326"); compact above ("12K",
// "1.3M"), where the exact digits stop being readable at a glance.
export function formatCount(n: number): string {
	return Math.abs(n) < 10_000 ? full.format(n) : compact.format(n);
}
