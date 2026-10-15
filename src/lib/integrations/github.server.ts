import { REPO_SLUG_RE } from "./repo-slug";
import type { FetchResult, GithubPayload } from "./types";

export { REPO_SLUG_RE };

const UA = "plaqo-Integrations/1.0";

async function ghFetch(url: string, token?: string) {
	const res = await fetch(url, {
		headers: {
			"User-Agent": UA,
			Accept: "application/vnd.github+json",
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
	});
	if (!res.ok)
		throw new Error(
			`GitHub ${res.status}: ${await res.text().catch(() => res.statusText)}`,
		);
	return res.json();
}

// GitHub's markup doesn't put the exact count on the day cell itself — only
// a relative data-level (0-4). The real number lives in a separate
// <tool-tip for="<cell id>">N contributions on <date>.</tool-tip> element
// elsewhere in the page, keyed by the cell's id. And the yearly total lives
// in its own header, not a sum we can trust to match exactly (GitHub's
// "last year" window is rolling, not aligned to the grid's first/last day).
function parseHeatmap(html: string): {
	days: Array<{ date: string; level: number; count: number }>;
	total: number;
} {
	const countById = new Map<string, number>();
	const tooltipRe =
		/<tool-tip[^>]*\sfor="([^"]+)"[^>]*>\s*(No contributions|[\d,]+ contributions?)/g;
	for (const [, id, text] of html.matchAll(tooltipRe)) {
		countById.set(
			id!,
			text!.startsWith("No") ? 0 : Number(text!.replace(/[^\d]/g, "")),
		);
	}

	const days: Array<{ date: string; level: number; count: number }> = [];
	const cellTagRe = /<td\b[^>]*class="ContributionCalendar-day"[^>]*>/g;
	for (const [tag] of html.matchAll(cellTagRe)) {
		const date = tag.match(/data-date="(\d{4}-\d{2}-\d{2})"/)?.[1];
		const level = tag.match(/data-level="(\d)"/)?.[1];
		const id = tag.match(/\sid="([^"]+)"/)?.[1];
		if (!date || !level) continue;
		days.push({
			date,
			level: Number(level),
			count: countById.get(id ?? "") ?? 0,
		});
	}

	const totalMatch = html.match(
		/id="js-contribution-activity-description"[^>]*>\s*([\d,]+)/,
	);
	const total = totalMatch
		? Number(totalMatch[1]?.replace(/,/g, ""))
		: days.reduce((sum, d) => sum + d.count, 0);

	return { days, total };
}

type RepoSummary = GithubPayload["pinned"][number];

type RestProfile = GithubPayload["profile"];

type RestRepo = {
	name: string;
	full_name: string;
	description: string | null;
	stargazers_count?: number;
	forks_count?: number;
	language: string | null;
	html_url: string;
	pushed_at?: string;
	updated_at?: string;
	fork?: boolean;
	archived?: boolean;
};

function toRepoSummary(r: RestRepo): RepoSummary {
	return {
		name: r.name,
		full_name: r.full_name,
		description: r.description ?? null,
		stars: r.stargazers_count ?? 0,
		forks: r.forks_count ?? 0,
		language: r.language ?? null,
		url: r.html_url,
	};
}

// The fallback "recent work" list: most recently pushed first (the caller
// asks GitHub for sort=pushed), without forks, archived repos, or the
// profile-README repo named after the account — none of those are work.
export function pickRecentRepos<
	T extends { name: string; fork?: boolean; archived?: boolean },
>(repos: T[], login: string, limit = 6): T[] {
	const self = login.toLowerCase();
	return repos
		.filter((r) => !r.fork && !r.archived && r.name.toLowerCase() !== self)
		.slice(0, limit);
}

// What the user pinned on their GitHub profile, in their order. Only the
// GraphQL API exposes pins, and it requires a token.
const PINNED_QUERY = `query($login: String!) {
	user(login: $login) {
		pinnedItems(first: 6, types: REPOSITORY) {
			nodes {
				... on Repository {
					name
					nameWithOwner
					description
					stargazerCount
					forkCount
					url
					primaryLanguage { name }
				}
			}
		}
	}
}`;

export function parsePinnedItems(json: unknown): RepoSummary[] {
	const nodes = (
		json as {
			data?: { user?: { pinnedItems?: { nodes?: unknown[] } } | null };
		}
	)?.data?.user?.pinnedItems?.nodes;
	if (!Array.isArray(nodes)) return [];
	return nodes.flatMap((node) => {
		const n = node as {
			name?: string;
			nameWithOwner?: string;
			description?: string | null;
			stargazerCount?: number;
			forkCount?: number;
			url?: string;
			primaryLanguage?: { name?: string } | null;
		};
		if (!n.name || !n.nameWithOwner || !n.url) return [];
		return [
			{
				name: n.name,
				full_name: n.nameWithOwner,
				description: n.description ?? null,
				stars: n.stargazerCount ?? 0,
				forks: n.forkCount ?? 0,
				language: n.primaryLanguage?.name ?? null,
				url: n.url,
			},
		];
	});
}

// Best effort: no token, a GraphQL error or no pins all mean "no pins", and
// the profile falls back to recent work.
async function fetchGithubPins(
	login: string,
	token: string | undefined,
): Promise<RepoSummary[]> {
	if (!token) return [];
	try {
		const res = await fetch("https://api.github.com/graphql", {
			method: "POST",
			headers: {
				"User-Agent": UA,
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ query: PINNED_QUERY, variables: { login } }),
		});
		if (!res.ok) return [];
		return parsePinnedItems(await res.json());
	} catch {
		return [];
	}
}

// Every repo the account owns, most recently pushed first — the dashboard's
// featured-repositories picker lists these. Forks are left out for the same
// reason as in pickRecentRepos.
export async function listOwnerRepos(handle: string): Promise<RepoSummary[]> {
	const login = handle.trim().replace(/^@/, "");
	const repos = (await ghFetch(
		`https://api.github.com/users/${encodeURIComponent(login)}/repos?sort=pushed&per_page=100&type=owner`,
		process.env.GITHUB_TOKEN,
	)) as RestRepo[];
	return repos.filter((r) => !r.fork).map(toRepoSummary);
}

export async function fetchGithub(input: {
	handle: string;
	config: { pinned?: string[] };
}): Promise<FetchResult[]> {
	const token = process.env.GITHUB_TOKEN;
	const handle = input.handle.trim().replace(/^@/, "");
	if (!handle) throw new Error("Empty GitHub handle");

	const [profile, ownRepos] = (await Promise.all([
		ghFetch(
			`https://api.github.com/users/${encodeURIComponent(handle)}`,
			token,
		),
		// 30 rather than 6: forks and archived repos get filtered out after.
		ghFetch(
			`https://api.github.com/users/${encodeURIComponent(handle)}/repos?sort=pushed&per_page=30&type=owner`,
			token,
		),
	])) as [RestProfile, RestRepo[]];
	const login = profile.login ?? handle;
	const workRepos = ownRepos.filter((r) => !r.fork);
	const repos = pickRecentRepos(ownRepos, login);

	// Featured repos: the user's own picks from the dashboard when set,
	// otherwise what they pinned on GitHub. Empty means the profile shows
	// recent work instead.
	const pinnedSlugs = (input.config.pinned ?? [])
		.filter((slug) => REPO_SLUG_RE.test(slug))
		.slice(0, 6);
	const pinned =
		pinnedSlugs.length > 0
			? (
					await Promise.all(
						pinnedSlugs.map(async (slug) => {
							try {
								return (await ghFetch(
									`https://api.github.com/repos/${encodeURIComponent(slug).replace("%2F", "/")}`,
									token,
								)) as RestRepo;
							} catch {
								return null;
							}
						}),
					)
				)
					.filter((r): r is RestRepo => !!r)
					.map(toRepoSummary)
			: await fetchGithubPins(login, token);

	// Heatmap (best-effort scrape)
	let heatmap: Array<{ date: string; level: number; count: number }> = [];
	let totalContributions = 0;
	try {
		const res = await fetch(
			`https://github.com/users/${encodeURIComponent(handle)}/contributions`,
			{
				headers: { "User-Agent": UA, Accept: "text/html" },
			},
		);
		if (res.ok) {
			const parsed = parseHeatmap(await res.text());
			heatmap = parsed.days.slice(-365);
			totalContributions = parsed.total;
		}
	} catch {
		// ignore
	}

	const langCounts = new Map<string, number>();
	for (const r of workRepos) {
		if (r.language)
			langCounts.set(r.language, (langCounts.get(r.language) ?? 0) + 1);
	}

	const payload: GithubPayload = {
		profile: {
			login: profile.login,
			name: profile.name,
			bio: profile.bio,
			avatar_url: profile.avatar_url,
			followers: profile.followers,
			following: profile.following,
			public_repos: profile.public_repos,
			html_url: profile.html_url,
		},
		repos: repos.map((r) => ({
			...toRepoSummary(r),
			updated_at: r.pushed_at ?? r.updated_at ?? "",
		})),
		pinned,
		heatmap,
		totals: {
			stars: workRepos.reduce((s, r) => s + (r.stargazers_count ?? 0), 0),
			forks: workRepos.reduce((s, r) => s + (r.forks_count ?? 0), 0),
			contributions: totalContributions,
		},
		topLanguages: [...langCounts.entries()]
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5)
			.map(([language, count]) => ({ language, count })),
	};

	return [
		{ kind: "profile", payload: payload as unknown as Record<string, unknown> },
	];
}
