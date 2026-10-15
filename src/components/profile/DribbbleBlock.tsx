import { SiDribbble } from "@icons-pack/react-simple-icons";
import { EyeIcon, HeartIcon } from "@solar-icons/react/linear";
import { formatCount } from "@/lib/format";
import type { DribbblePayload } from "@/lib/integrations/types";
import { sanitizeHref } from "@/lib/safe-url";

function cx(...classes: Array<string | false | null | undefined>) {
	return classes.filter(Boolean).join(" ");
}

export function DribbbleBlock({
	payload,
	themed = false,
}: {
	payload: DribbblePayload;
	themed?: boolean;
}) {
	if (payload.shots.length === 0) return null;
	return (
		<section>
			<h2
				className={cx(
					"mb-4 flex items-center justify-between text-sm font-medium uppercase tracking-widest",
					themed ? "tt-muted" : "text-muted-foreground",
				)}
			>
				<span className="flex items-center gap-2">
					<SiDribbble className="h-3.5 w-3.5" /> Dribbble
				</span>
				<a
					href={sanitizeHref(payload.profile.url)}
					target="_blank"
					rel="noreferrer"
					className={cx(
						"font-mono text-[11px] normal-case tracking-normal transition-opacity",
						themed ? "hover:opacity-80" : "hover:text-foreground",
					)}
				>
					@{payload.profile.username} · {formatCount(payload.profile.followers)}{" "}
					followers
				</a>
			</h2>
			<div className="grid gap-3 sm:grid-cols-2">
				{payload.shots.slice(0, 6).map((s) => (
					<a
						key={s.id}
						href={sanitizeHref(s.url)}
						target="_blank"
						rel="noreferrer"
						className={cx(
							"flex flex-col overflow-hidden rounded-xl border transition-colors",
							themed
								? "tt-panel hover:opacity-90"
								: "border-hairline bg-surface hover:bg-surface-elevated",
						)}
					>
						{s.image && (
							<img
								src={s.image}
								alt=""
								loading="lazy"
								className="aspect-video w-full object-cover"
							/>
						)}
						<div className="flex flex-1 flex-col p-4">
							<p className="truncate text-sm font-medium">{s.title}</p>
							<div
								className={cx(
									"mt-auto flex items-center gap-3 pt-3 text-[11px]",
									themed ? "tt-muted" : "text-muted-foreground",
								)}
							>
								<span className="inline-flex items-center gap-1">
									<HeartIcon className="h-3 w-3" />
									{formatCount(s.likes)}
								</span>
								<span className="inline-flex items-center gap-1">
									<EyeIcon className="h-3 w-3" />
									{formatCount(s.views)}
								</span>
							</div>
						</div>
					</a>
				))}
			</div>
		</section>
	);
}
