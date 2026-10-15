import { describe, expect, it } from "vitest";
import { canonicalTech, canonicalTechList } from "./technologies";

describe("canonicalTech", () => {
	it("fixes casing and spacing of known technologies", () => {
		expect(canonicalTech("typescript")).toBe("TypeScript");
		expect(canonicalTech("Typescript")).toBe("TypeScript");
		expect(canonicalTech("tanstack router")).toBe("TanStack Router");
		expect(canonicalTech("Tanstack Start")).toBe("TanStack Start");
		expect(canonicalTech("better-auth")).toBe("Better Auth");
		expect(canonicalTech("nextjs")).toBe("Next.js");
	});

	it("keeps C, C++ and C# apart", () => {
		expect(canonicalTech("c")).toBe("C");
		expect(canonicalTech("c++")).toBe("C++");
		expect(canonicalTech("c#")).toBe("C#");
	});

	it("resolves common short forms", () => {
		expect(canonicalTech("ts")).toBe("TypeScript");
		expect(canonicalTech("postgres")).toBe("PostgreSQL");
		expect(canonicalTech("tailwind")).toBe("Tailwind CSS");
	});

	it("returns unknown tags trimmed but otherwise as typed", () => {
		expect(canonicalTech("  MyInternalLib ")).toBe("MyInternalLib");
	});
});

describe("canonicalTechList", () => {
	it("dedupes tags that canonicalize to the same name and drops blanks", () => {
		expect(
			canonicalTechList(["typescript", "TypeScript", " ", "tanstack router"]),
		).toEqual(["TypeScript", "TanStack Router"]);
	});
});
