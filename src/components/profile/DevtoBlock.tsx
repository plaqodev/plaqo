import { SiDevdotto } from "@icons-pack/react-simple-icons";
import {
	ArrowRightUpIcon,
	ClockCircleIcon,
	EyeIcon,
	HeartIcon,
} from "@solar-icons/react/linear";
import { formatCount } from "@/lib/format";
import type { DevtoPayload } from "@/lib/integrations/types";
import { sanitizeHref } from "@/lib/safe-url";

function cx(...classes: Array<string | false | null | undefined>) {
	return classes.filter(Boolean).join(" ");
}

// The payload has no username, but every article URL is dev.to/<user>/<slug>.
function devtoHandle(url: string): string | null {
	try {
		const u = new URL(url);
		if (u.hostname !== "dev.to") return null;
		return u.pathname.split("/")[1] || null;
	} catch {
		return null;
	}
}

export function DevtoBlock({
	payload,
	themed = false,
}: {
	payload: DevtoPayload;
	themed?: boolean;
}) {
	if (payload.articles.length === 0) return null;
	const handle = devtoHandle(payload.articles[0].url);
	return (
		<section>
			<h2
				className={cx(
					"mb-4 flex items-center justify-between text-sm font-medium uppercase tracking-widest",
					themed ? "tt-muted" : "text-muted-foreground",
				)}
			>
				<span className="flex items-center gap-2">
					<SiDevdotto className="h-3.5 w-3.5" /> Dev.to
				</span>
				{handle && (
					<a
						href={`https://dev.to/${handle}`}
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
				{payload.articles.slice(0, 6).map((a) => (
					<a
						key={a.id}
						href={sanitizeHref(a.url)}
						target="_blank"
						rel="noreferrer"
						className={cx(
							"group flex items-center justify-between gap-4 p-4 transition-colors",
							themed ? "hover:opacity-90" : "hover:bg-surface-elevated",
						)}
					>
						<div className="min-w-0">
							<p className="truncate text-sm font-medium">{a.title}</p>
							<div
								className={cx(
									"mt-1 flex flex-wrap items-center gap-3 text-[11px]",
									themed ? "tt-muted" : "text-muted-foreground",
								)}
							>
								<span className="inline-flex items-center gap-1">
									<HeartIcon size={12} className="h-3 w-3" />
									{formatCount(a.reactions)}
								</span>
								{a.page_views != null && (
									<span className="inline-flex items-center gap-1">
										<EyeIcon size={12} className="h-3 w-3" />
										{formatCount(a.page_views)}
									</span>
								)}
								<span className="inline-flex items-center gap-1">
									<ClockCircleIcon size={12} className="h-3 w-3" />
									{a.reading_time_minutes} min
								</span>
							</div>
						</div>
						<ArrowRightUpIcon
							size={16}
							className={cx(
								"h-4 w-4 shrink-0 transition-[translate,color] duration-300 motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5",
								themed
									? "tt-muted group-hover:text-(--tt-accent)!"
									: "text-muted-foreground group-hover:text-brand",
							)}
						/>
					</a>
				))}
			</div>
		</section>
	);
}
