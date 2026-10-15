import { describe, expect, it } from "vitest";
import { formatCount, formatDate } from "./format";

describe("formatDate", () => {
	it("formats in en-US, pinned to UTC", () => {
		expect(formatDate("2026-04-25")).toBe("Apr 25, 2026");
		expect(formatDate("2026-04-25T23:30:00Z")).toBe("Apr 25, 2026");
		expect(formatDate(new Date("2026-01-01T00:00:00Z"))).toBe("Jan 1, 2026");
	});
});

describe("formatCount", () => {
	it("groups thousands below 10,000", () => {
		expect(formatCount(0)).toBe("0");
		expect(formatCount(999)).toBe("999");
		expect(formatCount(2326)).toBe("2,326");
		expect(formatCount(9999)).toBe("9,999");
	});

	it("goes compact from 10,000", () => {
		expect(formatCount(10_000)).toBe("10K");
		expect(formatCount(12_400)).toBe("12.4K");
		expect(formatCount(272_000)).toBe("272K");
		expect(formatCount(1_340_000)).toBe("1.3M");
	});
});
