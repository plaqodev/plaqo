import { SiMedium } from "@icons-pack/react-simple-icons";
import { ArrowRightUpIcon } from "@solar-icons/react/linear";
import type { MediumPayload } from "@/lib/integrations/types";
import { sanitizeHref } from "@/lib/safe-url";

function cx(...classes: Array<string | false | null | undefined>) {
	return classes.filter(Boolean).join(" ");
}

// The payload has no username; recover it from a post URL when Medium hosts
// it (medium.com/@user/… or user.medium.com/…). Custom domains give nothing.
function mediumHandle(url: string): string | null {
	try {
		const u = new URL(url);
		if (u.hostname === "medium.com") {
			const first = u.pathname.split("/")[1] ?? "";
			return first.startsWith("@") ? first.slice(1) || null : null;
		}
		if (u.hostname.endsWith(".medium.com")) {
			return u.hostname.slice(0, -".medium.com".length) || null;
		}
		return null;
	} catch {
		return null;
	}
}

export function MediumBlock({
	payload,
	themed = false,
}: {
	payload: MediumPayload;
	themed?: boolean;
}) {
	if (payload.posts.length === 0) return null;
	// Only when every post agrees: a publication feed mixes authors, and the
	// first post's author isn't the account owner.
	const handles = new Set(payload.posts.map((p) => mediumHandle(p.url)));
	const handle = handles.size === 1 ? [...handles][0] : null;
	return (
		<section>
			<h2
				className={cx(
					"mb-4 flex items-center justify-between text-sm font-medium uppercase tracking-widest",
					themed ? "tt-muted" : "text-muted-foreground",
				)}
			>
				<span className="flex items-center gap-2">
					<SiMedium className="h-3.5 w-3.5" /> Medium
				</span>
				{handle && (
					<a
						href={`https://medium.com/@${handle}`}
						target="_blank"
						rel="noreferrer"
						className={cx(
							"font-mono text-[11px] normal-case tracking-normal transition-opacity",
							themed ? "hover:opacity-80" : "hover:text-foreground",
						)}
					>
						@{handle}
					</a>
				)}
			</h2>
			<div
				className={cx(
					"divide-y overflow-hidden rounded-xl border",
					themed
						? "tt-panel divide-(--tt-border)"
						: "divide-hairline border-hairline bg-surface",
				)}
			>
				{payload.posts.slice(0, 6).map((p) => (
					<a
						key={p.url}
						href={sanitizeHref(p.url)}
						target="_blank"
						rel="noreferrer"
						className={cx(
							"flex items-center justify-between gap-4 p-4 transition-colors",
							themed ? "hover:opacity-90" : "hover:bg-surface-elevated",
						)}
					>
						<div className="min-w-0">
							<p className="truncate text-sm font-medium">{p.title}</p>
							{p.summary && (
								<p
									className={cx(
										"mt-1 line-clamp-2 text-xs",
										themed ? "tt-muted" : "text-muted-foreground",
									)}
								>
									{p.summary}
								</p>
							)}
						</div>
						<ArrowRightUpIcon
							size={16}
							className={cx(
								"h-4 w-4 shrink-0",
								themed ? "tt-muted" : "text-muted-foreground",
							)}
						/>
					</a>
				))}
			</div>
		</section>
	);
}
