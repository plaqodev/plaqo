import {
	ArrowRightUpIcon,
	CloseIcon,
	HamburgerMenuIcon,
} from "@solar-icons/react/linear";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
	type RefObject,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";

import { GithubIcon } from "@/components/brand-icons";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

const nav = [
	{ label: "Features", href: "/#features" },
	{ label: "Pricing", href: "/#pricing" },
	{ label: "Discover", href: "/discover" },
	{ label: "Blog", href: "/blog" },
];

const ease = [0.16, 1, 0.3, 1] as const;
// Leaving accelerates out (ease-in), the mirror of the ease-out entrance.
const easeIn = [0.7, 0, 0.84, 0] as const;

const GITHUB_URL = "https://github.com/plaqodev/plaqo";

export function Header() {
	const { data: session } = authClient.useSession();
	const user = session?.user ?? null;
	const isAuthenticated = Boolean(user);
	const reduceMotion = useReducedMotion();
	const [mobileOpen, setMobileOpen] = useState(false);
	const menuButtonRef = useRef<HTMLButtonElement>(null);
	const closeMenu = useCallback(() => setMobileOpen(false), []);

	return (
		<>
			<header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-sm">
				<motion.div
					className="mx-auto grid h-16 max-w-editorial grid-cols-[1fr_auto_1fr] items-center border-b border-border px-5 sm:px-8"
					initial={reduceMotion ? false : { opacity: 0, y: -12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{
						duration: reduceMotion ? 0.01 : 0.55,
						ease,
					}}
				>
					<motion.div
						initial={reduceMotion ? false : { opacity: 0, x: -10 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{
							duration: reduceMotion ? 0.01 : 0.5,
							delay: reduceMotion ? 0 : 0.05,
							ease,
						}}
					>
						<Link to="/" className="group flex w-fit items-center gap-2.5">
							<Logo className="text-foreground" />

							<span className="hidden font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground transition-colors group-hover:text-brand min-[360px]:inline">
								01
							</span>
						</Link>
					</motion.div>

					<motion.nav
						className="col-start-2 hidden items-center justify-self-center gap-7 md:flex"
						initial={reduceMotion ? false : { opacity: 0, y: -6 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{
							duration: reduceMotion ? 0.01 : 0.45,
							delay: reduceMotion ? 0 : 0.12,
							ease,
						}}
					>
						{nav.map((item, index) => (
							<motion.a
								key={item.href}
								href={item.href}
								className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
								initial={reduceMotion ? false : { opacity: 0, y: 6 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{
									duration: reduceMotion ? 0.01 : 0.4,
									delay: reduceMotion ? 0 : 0.16 + index * 0.05,
									ease,
								}}
							>
								{item.label}
							</motion.a>
						))}
					</motion.nav>

					<motion.div
						className="col-start-3 flex items-center justify-self-end gap-1 sm:gap-4"
						initial={reduceMotion ? false : { opacity: 0, x: 10 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{
							duration: reduceMotion ? 0.01 : 0.5,
							delay: reduceMotion ? 0 : 0.1,
							ease,
						}}
					>
						<a
							href={GITHUB_URL}
							target="_blank"
							rel="noreferrer"
							aria-label="GitHub"
							className="hidden text-muted-foreground transition-[color,transform] active:scale-90 hover:text-foreground sm:inline-flex"
						>
							<GithubIcon size={16} />
						</a>

						<ThemeToggle />

						{isAuthenticated && user ? (
							<Link
								to="/dashboard"
								className="group inline-flex items-center gap-2 border border-foreground px-3 py-3 font-mono text-[10px] uppercase tracking-[0.08em] text-foreground transition-[color,border-color,transform] active:scale-[0.97] hover:border-brand hover:text-brand min-[360px]:px-4 md:py-2"
							>
								Dashboard
								<ArrowRightUpIcon
									size={13}
									className="hidden transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 min-[360px]:block"
								/>
							</Link>
						) : (
							<>
								<Link
									to="/login"
									search={{ redirect: undefined }}
									className="hidden font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
								>
									Sign in
								</Link>

								<Link
									to="/signup"
									search={{ username: undefined }}
									className="group inline-flex items-center gap-2 border border-foreground px-3 py-3 font-mono text-[10px] uppercase tracking-[0.08em] text-foreground transition-[color,border-color,transform] active:scale-[0.97] hover:border-brand hover:text-brand min-[360px]:px-4 md:py-2"
								>
									Get started
									<ArrowRightUpIcon
										size={13}
										className="hidden transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 min-[360px]:block"
									/>
								</Link>
							</>
						)}

						{/* Last, at the right edge, where a thumb expects it. */}
						<button
							ref={menuButtonRef}
							type="button"
							onClick={() => setMobileOpen((open) => !open)}
							aria-label={mobileOpen ? "Close menu" : "Open menu"}
							aria-expanded={mobileOpen}
							aria-controls="mobile-menu"
							className="relative -mr-2 inline-flex h-11 w-11 items-center justify-center text-muted-foreground transition-[color,transform] active:scale-90 hover:text-foreground md:hidden"
						>
							<HamburgerMenuIcon
								strokeWidth={1.7}
								className={cn(
									"absolute h-5 w-5 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
									mobileOpen
										? "rotate-90 scale-50 opacity-0"
										: "rotate-0 scale-100 opacity-100",
								)}
							/>
							<CloseIcon
								strokeWidth={1.7}
								className={cn(
									"absolute h-5 w-5 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
									mobileOpen
										? "rotate-0 scale-100 opacity-100"
										: "-rotate-90 scale-50 opacity-0",
								)}
							/>
						</button>
					</motion.div>
				</motion.div>
			</header>

			{/* Outside <header>: its backdrop-filter makes it the containing
			    block for fixed descendants, which clipped the old panel to the
			    header's own height. */}
			<AnimatePresence>
				{mobileOpen && (
					<MobileMenu
						onClose={closeMenu}
						isAuthenticated={isAuthenticated}
						reduceMotion={Boolean(reduceMotion)}
						menuButtonRef={menuButtonRef}
					/>
				)}
			</AnimatePresence>
		</>
	);
}

// Full-screen menu under the header: a curtain that unrolls downward, then
// the links rise in one after another. Locks page scroll, closes on Escape,
// keeps Tab inside (menu button + panel), and hands focus back on close.
function MobileMenu({
	onClose,
	isAuthenticated,
	reduceMotion,
	menuButtonRef,
}: {
	onClose: () => void;
	isAuthenticated: boolean;
	reduceMotion: boolean;
	menuButtonRef: RefObject<HTMLButtonElement | null>;
}) {
	const panelRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const root = document.documentElement;
		const previousOverflow = root.style.overflow;
		root.style.overflow = "hidden";

		// Focus the panel itself rather than its first link: screen readers
		// land inside the dialog, and a tap doesn't paint a focus ring on
		// "Features". The first Tab then reaches the links.
		panelRef.current?.focus({ preventScroll: true });

		function onKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				event.preventDefault();
				onClose();
				return;
			}
			if (event.key !== "Tab" || !panelRef.current) return;
			const focusables = [
				menuButtonRef.current,
				...panelRef.current.querySelectorAll<HTMLElement>("a[href], button"),
			].filter((el): el is HTMLElement => el !== null);
			const first = focusables[0];
			const last = focusables[focusables.length - 1];
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		}

		window.addEventListener("keydown", onKeyDown);
		return () => {
			root.style.overflow = previousOverflow;
			window.removeEventListener("keydown", onKeyDown);
			menuButtonRef.current?.focus({ preventScroll: true });
		};
	}, [onClose, menuButtonRef]);

	const list = {
		hidden: {},
		shown: {
			transition: {
				staggerChildren: reduceMotion ? 0 : 0.06,
				delayChildren: reduceMotion ? 0 : 0.18,
			},
		},
	};
	const item = {
		hidden: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 28 },
		shown: {
			opacity: 1,
			y: 0,
			transition: { duration: reduceMotion ? 0.01 : 0.55, ease },
		},
	};
	// The footer settles last, after the links. The delay lives in the
	// variant: a variant's own transition overrides the `transition` prop.
	const footer = {
		hidden: item.hidden,
		shown: {
			...item.shown,
			transition: {
				...item.shown.transition,
				delay: reduceMotion ? 0 : 0.45,
			},
		},
	};

	return (
		<motion.div
			id="mobile-menu"
			ref={panelRef}
			role="dialog"
			aria-modal="true"
			aria-label="Menu"
			tabIndex={-1}
			className="fixed inset-x-0 top-16 bottom-0 z-40 flex flex-col overflow-y-auto overscroll-contain bg-background outline-none md:hidden"
			initial={
				reduceMotion ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }
			}
			animate={
				reduceMotion
					? { opacity: 1, transition: { duration: 0.15 } }
					: {
							clipPath: "inset(0 0 0% 0)",
							transition: { duration: 0.5, ease },
						}
			}
			exit={
				reduceMotion
					? { opacity: 0, transition: { duration: 0.15 } }
					: {
							clipPath: "inset(0 0 100% 0)",
							transition: { duration: 0.32, ease: easeIn },
						}
			}
		>
			<motion.nav
				aria-label="Main"
				className="flex flex-1 flex-col justify-center px-5 py-10 sm:px-8"
				variants={list}
				initial="hidden"
				animate="shown"
			>
				<motion.p
					variants={item}
					className="mb-4 font-mono text-[10px] uppercase tracking-[0.14em] text-brand"
				>
					Menu
				</motion.p>

				<ul className="border-t border-border">
					{nav.map((link, index) => (
						<motion.li key={link.href} variants={item}>
							<a
								href={link.href}
								onClick={onClose}
								className="group flex items-baseline gap-4 border-b border-border py-5"
							>
								<span className="font-mono text-[10px] tabular-nums text-muted-foreground transition-colors group-hover:text-brand">
									{String(index + 1).padStart(2, "0")}
								</span>
								<span className="font-display text-5xl leading-none tracking-[-0.035em] text-foreground transition-colors group-hover:text-brand">
									{link.label}
								</span>
								<ArrowRightUpIcon
									size={18}
									className="ml-auto self-center text-muted-foreground transition-[translate,color] duration-300 group-hover:text-brand motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5"
								/>
							</a>
						</motion.li>
					))}
				</ul>
			</motion.nav>

			<motion.div
				variants={footer}
				initial="hidden"
				animate="shown"
				className="flex items-center justify-between gap-4 border-t border-border px-5 py-3 sm:px-8"
			>
				<a
					href={GITHUB_URL}
					target="_blank"
					rel="noreferrer"
					onClick={onClose}
					className="inline-flex h-11 items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
				>
					<GithubIcon size={16} />
					<span className="font-mono text-[10px] uppercase tracking-widest">
						GitHub
					</span>
				</a>

				{!isAuthenticated && (
					<Link
						to="/login"
						search={{ redirect: undefined }}
						onClick={onClose}
						className="inline-flex h-11 items-center font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground"
					>
						Sign in
					</Link>
				)}
			</motion.div>
		</motion.div>
	);
}
