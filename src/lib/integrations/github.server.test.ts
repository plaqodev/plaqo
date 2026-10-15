import { describe, expect, it } from "vitest";
import {
	parsePinnedItems,
	pickRecentRepos,
	REPO_SLUG_RE,
} from "./github.server";

describe("REPO_SLUG_RE", () => {
	it.each(["vercel/next.js", "a-b/c_d.e", "owner/.github"])(
		"accepts %s",
		(slug) => {
			expect(REPO_SLUG_RE.test(slug)).toBe(true);
		},
	);

	// Anything that could steer the api.github.com request path elsewhere.
	it.each([
		"../rate_limit",
		"owner/..",
		"owner/.",
		"./repo",
		"owner/repo/../x",
		"owner/repo?per_page=1",
		"owner",
	])("rejects %s", (slug) => {
		expect(REPO_SLUG_RE.test(slug)).toBe(false);
	});
});

describe("pickRecentRepos", () => {
	const repo = (
		name: string,
		extra: { fork?: boolean; archived?: boolean } = {},
	) => ({
		name,
		...extra,
	});

	it("drops forks, archived repos and the profile-README repo, keeping order", () => {
		const picked = pickRecentRepos(
			[
				repo("Octocat"),
				repo("app"),
				repo("forked", { fork: true }),
				repo("old", { archived: true }),
				repo("lib"),
			],
			"octocat",
		);
		expect(picked.map((r) => r.name)).toEqual(["app", "lib"]);
	});

	it("caps the list", () => {
		const many = Array.from({ length: 10 }, (_, i) => repo(`r${i}`));
		expect(pickRecentRepos(many, "me")).toHaveLength(6);
		expect(pickRecentRepos(many, "me", 2)).toHaveLength(2);
	});
});

describe("parsePinnedItems", () => {
	it("maps GraphQL pinned repositories in order", () => {
		const json = {
			data: {
				user: {
					pinnedItems: {
						nodes: [
							{
								name: "app",
								nameWithOwner: "me/app",
								description: "An app",
								stargazerCount: 12,
								forkCount: 3,
								url: "https://github.com/me/app",
								primaryLanguage: { name: "TypeScript" },
							},
							{
								name: "lib",
								nameWithOwner: "org/lib",
								description: null,
								stargazerCount: 0,
								forkCount: 0,
								url: "https://github.com/org/lib",
								primaryLanguage: null,
							},
						],
					},
				},
			},
		};
		expect(parsePinnedItems(json)).toEqual([
			{
				name: "app",
				full_name: "me/app",
				description: "An app",
				stars: 12,
				forks: 3,
				language: "TypeScript",
				url: "https://github.com/me/app",
			},
			{
				name: "lib",
				full_name: "org/lib",
				description: null,
				stars: 0,
				forks: 0,
				language: null,
				url: "https://github.com/org/lib",
			},
		]);
	});

	it("returns nothing for errors, unknown users and non-repository pins", () => {
		expect(
			parsePinnedItems({ errors: [{ message: "Bad credentials" }] }),
		).toEqual([]);
		expect(parsePinnedItems({ data: { user: null } })).toEqual([]);
		expect(
			parsePinnedItems({ data: { user: { pinnedItems: { nodes: [{}] } } } }),
		).toEqual([]);
	});
});
