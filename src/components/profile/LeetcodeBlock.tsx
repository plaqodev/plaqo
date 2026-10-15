import { SiLeetcode } from "@icons-pack/react-simple-icons";
import { formatCount } from "@/lib/format";
import type { LeetcodePayload } from "@/lib/integrations/types";
import { sanitizeHref } from "@/lib/safe-url";

function cx(...classes: Array<string | false | null | undefined>) {
	return classes.filter(Boolean).join(" ");
}

export function LeetcodeBlock({
	payload,
	themed = false,
}: {
	payload: LeetcodePayload;
	themed?: boolean;
}) {
	// Colores fijos a propósito: verde/ámbar/rojo para easy/medium/hard es la
	// convención universal de LeetCode; cambiarlos con el tema confundiría.
	const rows = [
		{
			label: "Easy",
			solved: payload.solved.easy,
			total: payload.totals.easy,
			className: "bg-emerald-500",
		},
		{
			label: "Medium",
			solved: payload.solved.medium,
			total: payload.totals.medium,
			className: "bg-amber-500",
		},
		{
			label: "Hard",
			solved: payload.solved.hard,
			total: payload.totals.hard,
			className: "bg-rose-500",
		},
	];
	return (
		<section>
			<h2
				className={cx(
					"mb-4 flex items-center justify-between text-sm font-medium uppercase tracking-widest",
					themed ? "tt-muted" : "text-muted-foreground",
				)}
			>
				<span className="flex items-center gap-2">
					<SiLeetcode className="h-3.5 w-3.5" /> LeetCode
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
					@{payload.username}
				</a>
			</h2>
			<div
				className={cx(
					"rounded-xl border p-4",
					themed ? "tt-panel" : "border-hairline bg-surface",
				)}
			>
				<div className="flex items-baseline justify-between">
					<p className="text-2xl font-semibold tracking-tight">
						{formatCount(payload.solved.all)}
						<span
							className={cx(
								"ml-1 text-sm font-normal",
								themed ? "tt-muted" : "text-muted-foreground",
							)}
						>
							solved
						</span>
					</p>
					{payload.ranking != null && (
						<p
							className={cx(
								"text-xs",
								themed ? "tt-muted" : "text-muted-foreground",
							)}
						>
							Rank #{formatCount(payload.ranking)}
						</p>
					)}
				</div>
				<ul className="mt-4 space-y-2">
					{rows.map((r) => (
						<li key={r.label} className="text-xs">
							<div className="flex items-center justify-between">
								<span className="font-medium">{r.label}</span>
								<span className={themed ? "tt-muted" : "text-muted-foreground"}>
									{r.solved}/{r.total || "?"}
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
									className={`h-full rounded-full ${r.className}`}
									style={{
										width: `${r.total ? Math.min(100, (r.solved / r.total) * 100) : 0}%`,
									}}
								/>
							</div>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}
