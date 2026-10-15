import { SiWakatime } from "@icons-pack/react-simple-icons";
import type { WakatimePayload } from "@/lib/integrations/types";
import { sanitizeHref } from "@/lib/safe-url";

// WakaTime answers with whichever range the user made public ("last_7_days",
// "last_30_days", "all_time"…), not always 7 days — show what came back.
function humanRange(range: string) {
	return range.replaceAll("_", " ");
}

function cx(...classes: Array<string | false | null | undefined>) {
	return classes.filter(Boolean).join(" ");
}

export function WakatimeBlock({
	payload,
	themed = false,
}: {
	payload: WakatimePayload;
	themed?: boolean;
}) {
	if (payload.languages.length === 0) return null;
	const range = humanRange(payload.range);
	return (
		<section>
			<h2
				className={cx(
					"mb-4 flex items-center justify-between text-sm font-medium uppercase tracking-widest",
					themed ? "tt-muted" : "text-muted-foreground",
				)}
			>
				<span className="flex items-center gap-2">
					<SiWakatime className="h-3.5 w-3.5" /> WakaTime
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
					{range}
				</a>
			</h2>
			<div
				className={cx(
					"rounded-xl border p-4",
					themed ? "tt-panel" : "border-hairline bg-surface",
				)}
			>
				<div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
					<p className="text-2xl font-semibold tracking-tight">
						{payload.total_human}
					</p>
					<p
						className={cx(
							"text-xs",
							themed ? "tt-muted" : "text-muted-foreground",
						)}
					>
						{payload.daily_average_human}/day avg
					</p>
				</div>
				<ul className="mt-4 space-y-2">
					{payload.languages.map((l) => (
						<li key={l.name} className="text-xs">
							<div className="flex items-center justify-between">
								<span className="font-medium">{l.name}</span>
								<span className={themed ? "tt-muted" : "text-muted-foreground"}>
									{l.text}
								</span>
							</div>
							<div
								className={cx(
									"mt-1 h-1.5 overflow-hidden rounded-full",
									!themed && "bg-background",
								)}
								style={themed ? { background: "var(--tt-border)" } : undefined}
							>
								<div
									className={cx("h-full rounded-full", !themed && "bg-brand")}
									style={{
										width: `${Math.min(100, l.percent)}%`,
										background: themed ? "var(--tt-accent)" : undefined,
									}}
								/>
							</div>
						</li>
					))}
				</ul>
				{payload.editors.length > 0 && (
					<p
						className={cx(
							"mt-4 text-[11px]",
							themed ? "tt-muted" : "text-muted-foreground",
						)}
					>
						Editors:{" "}
						{payload.editors.map((e) => `${e.name} ${e.percent}%`).join(" · ")}
					</p>
				)}
			</div>
		</section>
	);
}
