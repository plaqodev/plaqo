import { ArrowRightUpIcon } from "@solar-icons/react/linear";
import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { buildWeeks } from "@/components/profile/GithubBlock";
import type { PublicProfile } from "@/lib/api/public-profile.functions";
import { COUNTRY_NAME_BY_CODE } from "@/lib/countries";
import { formatCount, formatDate } from "@/lib/format";
import type { GithubPayload, NpmPayload } from "@/lib/integrations/types";
import { SITE_DOMAIN } from "@/lib/site";
import { canonicalTechList } from "@/lib/technologies";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;

// The profile the landing hero previews. Loaded live in routes/index.tsx, so
// the preview follows whatever that profile shows today — no screenshots.
export const PREVIEW_USERNAME = "ingfranciscastillo";

type Profile = NonNullable<PublicProfile>;

// The hero's "Live preview": a real profile taken apart into its pieces and
// set in the site's own editorial grid, each piece tagged with where it came
// from. Built from site tokens, so it follows light/dark like everything else.
export function ProfilePreview({ profile }: { profile: Profile }) {
	const reduceMotion = useReducedMotion();

	const integration = <T,>(provider: string, kind: string) =>
		profile.integrations.find((i) => i.provider === provider && i.kind === kind)
			?.payload as T | undefined;
	const github = integration<GithubPayload>("github", "profile");
	const npm = integration<NpmPayload>("npm", "packages");

	const snippet = profile.data.snippets[0];
	const projects = profile.data.projects.slice(0, 2);
	const article = profile.data.articles[0];
	const pkg = npm?.packages[0];

	return (
		<motion.div
			className="bg-background"
			initial="hidden"
			whileInView="shown"
			viewport={{ once: true, amount: 0.15 }}
			transition={{ staggerChildren: reduceMotion ? 0 : 0.07 }}
		>
			<div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3 sm:px-6">
				<span className="truncate font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
					{SITE_DOMAIN}/
					<span className="text-foreground">{profile.username}</span>
				</span>
				<Link
					to="/$username"
					params={{ username: profile.username }}
					className="group inline-flex shrink-0 items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-brand"
				>
					Open profile
					<ArrowRightUpIcon
						size={12}
						className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
					/>
				</Link>
			</div>

			<div className="grid grid-cols-1 gap-px bg-border lg:grid-cols-12">
				<Piece
					className="lg:col-span-5"
					index="01"
					label="Profile"
					source="you"
				>
					<Identity profile={profile} />
				</Piece>

				{github && github.heatmap.length > 0 && (
					<Piece
						className="lg:col-span-7"
						index="02"
						label="GitHub"
						source="synced from GitHub"
					>
						<GithubPiece github={github} />
					</Piece>
				)}

				{snippet && (
					<Piece
						className="lg:col-span-5"
						index="03"
						label="Snippet"
						source={`${snippet.language} · written here`}
					>
						<div className="mb-3 font-mono text-xs text-foreground">
							{snippet.title}
						</div>
						<div className="relative max-h-56 overflow-hidden">
							<div
								className="font-mono text-[11px] leading-relaxed [&_pre]:m-0 [&_pre]:bg-transparent!"
								// biome-ignore lint/security/noDangerouslySetInnerHtml: Shiki output generated server-side by highlightSnippet, the same HTML the public profile renders
								dangerouslySetInnerHTML={{ __html: snippet.html }}
							/>
							<div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-background to-transparent" />
						</div>
					</Piece>
				)}

				{projects.length > 0 && (
					<Piece
						className="lg:col-span-7"
						index="04"
						label="Projects"
						source="written here"
					>
						<div className="divide-y divide-border">
							{projects.map((project) => (
								<div key={project.id} className="py-4 first:pt-0 last:pb-0">
									<div className="flex items-baseline justify-between gap-4">
										<span className="font-display text-xl tracking-[-0.02em]">
											{project.name}
										</span>
										<span className="font-mono text-[10px] uppercase tracking-[0.08em] text-brand">
											{project.status === "wip" ? "Building" : project.status}
										</span>
									</div>
									<p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
										{project.description}
									</p>
									<p className="mt-2 font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
										{canonicalTechList(project.tech).join("  ·  ")}
									</p>
								</div>
							))}
						</div>
					</Piece>
				)}

				{article && (
					<Piece
						className={pkg ? "lg:col-span-5" : "lg:col-span-12"}
						index="05"
						label="Writing"
						source={article.source ? `from ${article.source}` : "linked"}
					>
						<p className="font-display text-lg leading-snug tracking-[-0.015em]">
							{article.title}
						</p>
						<p className="mt-2 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
							{formatDate(article.date)}
						</p>
					</Piece>
				)}

				{pkg && (
					<Piece
						className={article ? "lg:col-span-7" : "lg:col-span-12"}
						index="06"
						label="Packages"
						source="synced from npm"
					>
						<p className="font-mono text-sm text-foreground">{pkg.name}</p>
						<p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
							{pkg.description}
						</p>
						<p className="mt-2 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
							v{pkg.version}
							{pkg.weekly_downloads != null &&
								`  ·  ${formatCount(pkg.weekly_downloads)} / week`}
						</p>
					</Piece>
				)}
			</div>
		</motion.div>
	);
}

function Piece({
	className,
	index,
	label,
	source,
	children,
}: {
	className?: string;
	index: string;
	label: string;
	source: string;
	children: ReactNode;
}) {
	const reduceMotion = useReducedMotion();
	return (
		<motion.section
			variants={{
				hidden: reduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 },
				shown: { opacity: 1, y: 0 },
			}}
			transition={{ duration: reduceMotion ? 0.01 : 0.55, ease }}
			className={cn("min-w-0 bg-background p-5 sm:p-6", className)}
		>
			<div className="mb-4 flex items-baseline justify-between gap-4">
				<span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
					{index} / {label}
				</span>
				<span className="truncate font-mono text-[10px] tracking-[0.04em] text-brand">
					↳ {source}
				</span>
			</div>
			{children}
		</motion.section>
	);
}

function Identity({ profile }: { profile: Profile }) {
	const location = profile.country
		? (COUNTRY_NAME_BY_CODE[profile.country] ?? profile.country)
		: "";
	const website = profile.website
		.replace(/^https?:\/\//, "")
		.replace(/\/$/, "");

	return (
		<div>
			{profile.image ? (
				<img
					src={profile.image}
					alt=""
					width={56}
					height={56}
					loading="lazy"
					decoding="async"
					className="h-14 w-14 rounded-full border border-border object-cover"
				/>
			) : null}
			<p className="mt-4 font-display text-2xl leading-tight tracking-[-0.03em]">
				{profile.name}
			</p>
			<p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
				@{profile.username}
			</p>
			{profile.bio && (
				<p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
					{profile.bio}
				</p>
			)}
			{(location || website) && (
				<p className="mt-4 font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
					{[location, website].filter(Boolean).join("  ·  ")}
				</p>
			)}
		</div>
	);
}

// Five levels mixed from the brand accent, so the graph reads as part of the
// page rather than GitHub's green.
const LEVEL_BG = [
	"color-mix(in oklab, var(--color-foreground) 7%, transparent)",
	"color-mix(in oklab, var(--color-brand) 30%, transparent)",
	"color-mix(in oklab, var(--color-brand) 55%, transparent)",
	"color-mix(in oklab, var(--color-brand) 80%, transparent)",
	"var(--color-brand)",
];

function GithubPiece({ github }: { github: GithubPayload }) {
	const weeks = buildWeeks(github.heatmap);
	// Skip the profile-README repo (named after the account, usually no
	// language) — it says nothing about the work.
	const repos = (github.pinned.length > 0 ? github.pinned : github.repos)
		.filter(
			(repo) => repo.name.toLowerCase() !== github.profile.login.toLowerCase(),
		)
		.slice(0, 3);

	return (
		<div>
			{/* One fluid column per week, so the year always spans the full
			    width of the piece; cells stay square at any size. */}
			<div
				className="grid gap-0.75"
				style={{
					gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))`,
				}}
				aria-hidden="true"
			>
				{weeks.map((week) => (
					<div key={week[0].date} className="flex flex-col gap-0.75">
						{week.map((day) => (
							<span
								key={day.date}
								className="aspect-square w-full rounded-[2px]"
								style={{ background: LEVEL_BG[day.level] ?? LEVEL_BG[0] }}
							/>
						))}
					</div>
				))}
			</div>
			<p className="mt-3 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
				{formatCount(github.totals.contributions)} contributions / last year
				{"  ·  "}
				{formatCount(github.profile.followers)} followers
			</p>
			{repos.length > 0 && (
				<div className="mt-4 grid gap-px bg-border sm:grid-cols-3">
					{repos.map((repo) => (
						<div
							key={repo.full_name}
							className="min-w-0 bg-background py-2 sm:px-3 sm:first:pl-0"
						>
							<p className="truncate font-mono text-xs text-foreground">
								{repo.name}
							</p>
							<p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
								{repo.language ?? "—"}
							</p>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
