import { SiDocker } from "@icons-pack/react-simple-icons";
import {
	ArrowRightUpIcon,
	DownloadMinimalisticIcon,
	StarIcon,
} from "@solar-icons/react/linear";
import { formatCount } from "@/lib/format";
import type { DockerhubPayload } from "@/lib/integrations/types";
import { sanitizeHref } from "@/lib/safe-url";

function cx(...classes: Array<string | false | null | undefined>) {
	return classes.filter(Boolean).join(" ");
}

export function DockerhubBlock({
	payload,
	themed = false,
}: {
	payload: DockerhubPayload;
	themed?: boolean;
}) {
	if (payload.repos.length === 0) return null;
	return (
		<section>
			<h2
				className={cx(
					"mb-4 flex items-center justify-between text-sm font-medium uppercase tracking-widest",
					themed ? "tt-muted" : "text-muted-foreground",
				)}
			>
				<span className="flex items-center gap-2">
					<SiDocker className="h-3.5 w-3.5" /> Docker Hub
				</span>
				<a
					href={sanitizeHref(payload.url)}
					target="_blank"
					rel="noreferrer"
					className={cx(
						"font-mono text-[11px] normal-case tracking-normal transition-opacity",
						themed ? "hover:opacity-80" : "hover:text-foreground",
					)}
				>
					@{payload.username} · {formatCount(payload.total_pulls)} pulls
				</a>
			</h2>
			<div className="grid gap-3 sm:grid-cols-2">
				{payload.repos.slice(0, 6).map((r) => (
					<a
						key={r.url}
						href={sanitizeHref(r.url)}
						target="_blank"
						rel="noreferrer"
						className={cx(
							"group flex flex-col rounded-xl border p-4 transition-colors",
							themed
								? "tt-panel hover:opacity-90"
								: "border-hairline bg-surface hover:bg-surface-elevated",
						)}
					>
						<div className="flex items-start justify-between gap-2">
							<p className="truncate font-mono text-sm font-medium">
								{r.namespace}/{r.name}
							</p>
							<ArrowRightUpIcon
								className={cx(
									"h-4 w-4 shrink-0 transition-[translate,color] duration-300 motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5",
									themed
										? "tt-muted group-hover:text-(--tt-accent)!"
										: "text-muted-foreground group-hover:text-brand",
								)}
							/>
						</div>
						{r.description && (
							<p
								className={cx(
									"mt-1 line-clamp-2 text-xs",
									themed ? "tt-muted" : "text-muted-foreground",
								)}
							>
								{r.description}
							</p>
						)}
						<div
							className={cx(
								"mt-auto flex items-center gap-3 pt-3 text-[11px]",
								themed ? "tt-muted" : "text-muted-foreground",
							)}
						>
							<span className="inline-flex items-center gap-1">
								<DownloadMinimalisticIcon className="h-3 w-3" />
								{formatCount(r.pulls)}
							</span>
							<span className="inline-flex items-center gap-1">
								<StarIcon className="h-3 w-3" />
								{formatCount(r.stars)}
							</span>
						</div>
					</a>
				))}
			</div>
		</section>
	);
}
