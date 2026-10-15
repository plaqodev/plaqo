import { cn } from "@/lib/utils";

// The plaqo mark: a plaque on two posts — read closely, a "pq" ligature.
// Body follows currentColor; the right post (the q's tail) takes the brand
// accent, so both flip with the theme without separate dark assets.
export function LogoMark({ className }: { className?: string }) {
	return (
		<svg
			viewBox="14 17 72 72"
			aria-hidden="true"
			className={cn("h-5 w-5 shrink-0", className)}
		>
			<path
				d="M18 22H82V62H30V84H18Z M30 34H70V50H30Z"
				fill="currentColor"
				fillRule="evenodd"
			/>
			<path d="M70 62H82V84H70Z" className="fill-brand" />
		</svg>
	);
}

export function Logo({
	className,
	markClassName,
	textClassName,
}: {
	className?: string;
	markClassName?: string;
	textClassName?: string;
}) {
	return (
		<span className={cn("flex items-center gap-2", className)}>
			<LogoMark className={markClassName} />
			<span
				className={cn(
					"font-display text-xl leading-none font-[560] tracking-[-0.035em]",
					textClassName,
				)}
			>
				plaqo
			</span>
		</span>
	);
}
