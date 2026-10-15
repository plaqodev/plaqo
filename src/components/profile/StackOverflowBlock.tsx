import { SiStackoverflow } from "@icons-pack/react-simple-icons";
import { ArrowRightUpIcon } from "@solar-icons/react/linear";
import { formatCount } from "@/lib/format";
import type { StackOverflowPayload } from "@/lib/integrations/types";
import { sanitizeHref } from "@/lib/safe-url";

function cx(...classes: Array<string | false | null | undefined>) {
	return classes.filter(Boolean).join(" ");
}

export function StackOverflowBlock({
	payload,
	themed = false,
}: {
	payload: StackOverflowPayload;
	themed?: boolean;
}) {
	const { user, answers } = payload;
	return (
		<section>
			<div className="mb-4 flex items-baseline justify-between">
				<h2
					className={cx(
						"flex items-center gap-2 text-sm font-medium uppercase tracking-widest",
						themed ? "tt-muted" : "text-muted-foreground",
					)}
				>
					<SiStackoverflow className="h-3.5 w-3.5" /> Stack Overflow
				</h2>
				<a
					href={sanitizeHref(user.link)}
					target="_blank"
					rel="noreferrer"
					className={cx(
						"font-mono text-[11px] transition-opacity",
						themed
							? "tt-muted hover:opacity-100"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					{user.display_name} · {formatCount(user.reputation)} rep
				</a>
			</div>
			<div
				className={cx(
					"rounded-xl border p-4",
					themed ? "tt-panel" : "border-hairline bg-surface",
				)}
			>
				<div className="flex items-center gap-4 text-xs">
					<Badge
						color="bg-amber-400"
						count={user.badges.gold}
						label="gold"
						themed={themed}
					/>
					<Badge
						color="bg-zinc-300"
						count={user.badges.silver}
						label="silver"
						themed={themed}
					/>
					<Badge
						color="bg-orange-400"
						count={user.badges.bronze}
						label="bronze"
						themed={themed}
					/>
				</div>
				{answers.length > 0 && (
					<ul
						className={cx(
							"mt-4 divide-y",
							themed ? "divide-(--tt-border)" : "divide-hairline",
						)}
					>
						{answers.map((a) => (
							<li key={a.answer_id}>
								<a
									href={sanitizeHref(a.link)}
									target="_blank"
									rel="noreferrer"
									className={cx(
										"group flex items-center justify-between gap-4 py-2 text-sm transition-opacity",
										themed ? "hover:opacity-80" : "hover:text-foreground",
									)}
								>
									<span className="min-w-0 truncate">{a.title}</span>
									<span
										className={cx(
											"inline-flex items-center gap-2 font-mono text-xs",
											themed ? "tt-muted" : "text-muted-foreground",
										)}
									>
										+{formatCount(a.score)}
										<ArrowRightUpIcon
											size={14}
											className={cx(
												"h-3.5 w-3.5 transition-[translate,color] duration-300 motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5",
												themed
													? "group-hover:text-(--tt-accent)!"
													: "group-hover:text-brand",
											)}
										/>
									</span>
								</a>
							</li>
						))}
					</ul>
				)}
			</div>
		</section>
	);
}

function Badge({
	color,
	count,
	label,
	themed,
}: {
	color: string;
	count: number;
	label: string;
	themed?: boolean;
}) {
	return (
		<span
			className={cx(
				"inline-flex items-center gap-1.5",
				themed ? "tt-muted" : "text-muted-foreground",
			)}
		>
			<span className={`h-2 w-2 rounded-full ${color}`} />
			<span
				className={themed ? undefined : "text-foreground"}
				style={themed ? { color: "var(--tt-fg)" } : undefined}
			>
				{formatCount(count)}
			</span>
			{label}
		</span>
	);
}
