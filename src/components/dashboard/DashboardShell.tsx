import {
	Chart2Icon,
	CloseIcon,
	CodeSquareIcon,
	FolderWithFilesIcon,
	HamburgerMenuIcon,
	HeartIcon,
	Home2Icon,
	LinkMinimalistic2Icon,
	Logout2Icon,
	MicrophoneIcon,
	NotesIcon,
	PaletteIcon,
	PlugCircleIcon,
	SettingsIcon,
	SidebarMinimalisticIcon,
	UserIcon,
} from "@solar-icons/react/linear";
import {
	Link,
	useNavigate,
	useRouteContext,
	useRouter,
} from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import {
	type ComponentType,
	type CSSProperties,
	Fragment,
	type ReactNode,
	type SVGProps,
	useEffect,
	useState,
} from "react";
import toast from "react-hot-toast";
import { Logo } from "@/components/site/Logo";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import {
	Kbd,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { authClient } from "@/lib/auth-client";
import {
	peekCheckoutIntent,
	startProCheckout,
	takeCheckoutIntent,
} from "@/lib/billing";
import { PLAN_LIMITS } from "@/lib/plan-limits";
import type { Billing } from "@/lib/pricing";
import { useProfileCore } from "@/lib/queries/profile-data";
import { isSidebarCollapsed, setSidebarCollapsed } from "@/lib/sidebar";
import { SITE_DOMAIN } from "@/lib/site";
import { cn } from "@/lib/utils";
import { VerifyEmailBanner } from "./VerifyEmail";

type NavIcon = ComponentType<SVGProps<SVGSVGElement>>;

type NavItem = {
	label: string;
	to: string;
	icon: NavIcon;
	end?: boolean;
};

// Grouped by intent: how the page is doing; what it shows (in the order
// it appears on the page); how it's put together; the account. Only the
// two middle groups need a name; the others read on their own. The
// "NN /" label on each page follows this order, so renumber those when
// it changes.
const navGroups: { label?: string; items: NavItem[] }[] = [
	{
		items: [
			{ label: "Overview", to: "/dashboard", icon: Home2Icon, end: true },
			{ label: "Analytics", to: "/dashboard/analytics", icon: Chart2Icon },
		],
	},
	{
		label: "Your page",
		items: [
			{ label: "Profile", to: "/dashboard/profile", icon: UserIcon },
			{ label: "Links", to: "/dashboard/links", icon: LinkMinimalistic2Icon },
			{
				label: "Projects",
				to: "/dashboard/projects",
				icon: FolderWithFilesIcon,
			},
			{ label: "Snippets", to: "/dashboard/snippets", icon: CodeSquareIcon },
			{ label: "Articles", to: "/dashboard/articles", icon: NotesIcon },
			{ label: "Talks", to: "/dashboard/talks", icon: MicrophoneIcon },
			// The page covers support links (Ko-fi, Sponsors) and community
			// links; "Support" alone read like a help center.
			{ label: "Community", to: "/dashboard/support", icon: HeartIcon },
		],
	},
	{
		label: "Setup",
		items: [
			{
				label: "Integrations",
				to: "/dashboard/integrations",
				icon: PlugCircleIcon,
			},
			{ label: "Theme", to: "/dashboard/theme", icon: PaletteIcon },
		],
	},
	{
		items: [
			{ label: "Settings", to: "/dashboard/settings", icon: SettingsIcon },
		],
	},
];

export function DashboardShell({ children }: { children: ReactNode }) {
	const { user } = useRouteContext({ from: "/_authenticated" });
	const navigate = useNavigate();
	const router = useRouter();
	const pathname = router.state.location.pathname;
	const core = useProfileCore();
	const isPro = core.data?.plan === "pro";
	const [mobileNavOpen, setMobileNavOpen] = useState(false);
	const [upgradePending, setUpgradePending] = useState(false);

	// "Go Pro" on the landing page while signed out leaves a checkout intent;
	// once the new account reaches the dashboard, pick the checkout back up.
	// Checkout needs a confirmed email (gated in auth.ts), so an unconfirmed
	// account keeps the intent until the confirmation link brings it back.
	// Already-Pro accounts just drop it.
	const plan = core.data?.plan;
	const verified = user.emailVerified;
	const [pendingIntent, setPendingIntent] = useState(false);
	// biome-ignore lint/correctness/useExhaustiveDependencies: run once per loaded plan and verification; handleUpgrade only touches state setters
	useEffect(() => {
		if (!plan) return;
		if (plan !== "pro" && !verified) {
			setPendingIntent(peekCheckoutIntent() !== null);
			return;
		}
		setPendingIntent(false);
		const intent = takeCheckoutIntent();
		if (intent && plan !== "pro") handleUpgrade(intent);
	}, [plan, verified]);

	// Landing from the confirmation email (see VERIFY_EMAIL_CALLBACK). An
	// expired or used link comes back with ?error= instead.
	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const ok = params.get("verified") === "1";
		const failed = params.get("error");
		if (!ok && !failed) return;
		if (failed) {
			toast.error(
				"That confirmation link expired or was already used. Send a new one below.",
			);
		} else if (verified) {
			toast.success("Email confirmed.");
		}
		params.delete("verified");
		params.delete("error");
		const query = params.toString();
		window.history.replaceState(
			null,
			"",
			window.location.pathname + (query ? `?${query}` : ""),
		);
	}, [verified]);

	// Desktop sidebar. The <html data-sidebar> attribute (set before paint
	// by noFlashSidebarScript) drives the CSS; this state only feeds labels
	// and tooltips, so it starts expanded and syncs after mount.
	const [collapsed, setCollapsed] = useState(false);
	const [modKey, setModKey] = useState("Ctrl");
	useEffect(() => {
		setCollapsed(isSidebarCollapsed());
		if (/Mac|iPhone|iPad/.test(navigator.platform)) setModKey("⌘");
	}, []);

	function toggleSidebar() {
		const next = !isSidebarCollapsed();
		setSidebarCollapsed(next);
		setCollapsed(next);
	}

	// Ctrl/⌘ + B, like most editors. Ignored while typing so it never
	// steals a shortcut from a text field.
	// biome-ignore lint/correctness/useExhaustiveDependencies: toggleSidebar only reads the DOM and calls setters
	useEffect(() => {
		function onKey(event: KeyboardEvent) {
			if (event.key.toLowerCase() !== "b") return;
			if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey)
				return;
			const target = event.target as HTMLElement | null;
			if (target?.closest("input, textarea, select, [contenteditable='true']"))
				return;
			if (!window.matchMedia("(min-width: 768px)").matches) return;
			event.preventDefault();
			toggleSidebar();
		}
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);

	async function handleSignOut() {
		await authClient.signOut();
		await router.invalidate();
		await navigate({ to: "/" });
	}

	async function handleUpgrade(billing: Billing = "monthly") {
		setUpgradePending(true);
		try {
			await startProCheckout(billing);
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Couldn't start checkout",
			);
			setUpgradePending(false);
		}
	}

	return (
		<TooltipProvider>
			<div className="min-h-dvh bg-background text-foreground">
				<div className="mx-auto flex min-h-dvh max-w-360">
					<aside
						data-desktop-sidebar
						className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col overflow-hidden border-r border-border bg-background transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none md:flex sidebar-collapsed:w-17"
						// La sidebar no cambia entre subpáginas del dashboard — sin
						// nombre propio, la view transition del router la incluiría
						// en el crossfade de "root" y animaría píxeles idénticos.
						style={{ viewTransitionName: "dashboard-sidebar" } as CSSProperties}
					>
						<div className="flex h-16 items-center border-b border-border px-6">
							<Link
								to="/"
								aria-label="plaqo home"
								className="flex items-center gap-2.5"
							>
								<Logo textClassName={fadeWhenCollapsed} />

								<span
									className={cn(
										"font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground",
										fadeWhenCollapsed,
									)}
								>
									01
								</span>
							</Link>
						</div>

						<div className="flex min-h-0 flex-1 flex-col px-4 py-5">
							<WorkspaceNav
								pathname={pathname}
								isPro={isPro}
								onUpgrade={() => handleUpgrade()}
								upgradePending={upgradePending}
								collapse={{ collapsed }}
							/>
						</div>
					</aside>

					{mobileNavOpen && (
						<MobileNavDrawer onClose={() => setMobileNavOpen(false)}>
							{(requestClose) => (
								<>
									<div className="flex h-16 items-center justify-between border-b border-border px-6">
										<Link
											to="/"
											className="flex items-center gap-2.5"
											onClick={requestClose}
										>
											<Logo />

											<span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
												01
											</span>
										</Link>

										<button
											type="button"
											onClick={requestClose}
											aria-label="Close menu"
											className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground transition-[color,transform] active:scale-90 hover:text-foreground"
										>
											<CloseIcon className="h-4 w-4" strokeWidth={1.5} />
										</button>
									</div>

									<div className="flex flex-1 flex-col overflow-y-auto px-4 py-5">
										<WorkspaceNav
											pathname={pathname}
											isPro={isPro}
											onUpgrade={() => {
												requestClose();
												handleUpgrade();
											}}
											upgradePending={upgradePending}
											onNavigate={requestClose}
										/>
									</div>
								</>
							)}
						</MobileNavDrawer>
					)}

					<div className="flex min-w-0 flex-1 flex-col">
						<header
							className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/95 px-5 backdrop-blur-sm sm:px-8"
							style={
								{ viewTransitionName: "dashboard-header" } as CSSProperties
							}
						>
							<div className="flex min-w-0 items-center gap-3">
								<button
									type="button"
									onClick={() => setMobileNavOpen(true)}
									aria-label="Open menu"
									className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground transition-[color,transform] active:scale-90 hover:text-foreground md:hidden"
								>
									<HamburgerMenuIcon className="h-5 w-5" strokeWidth={1.7} />
								</button>

								{/* Desktop takes the hamburger's spot: same size, same slot. */}
								<Tooltip>
									<TooltipTrigger asChild>
										<button
											type="button"
											onClick={toggleSidebar}
											aria-label={
												collapsed ? "Expand sidebar" : "Collapse sidebar"
											}
											aria-expanded={!collapsed}
											className="-ml-1.5 hidden h-8 w-8 shrink-0 items-center justify-center text-muted-foreground transition-[color,transform] active:scale-90 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:inline-flex"
										>
											<SidebarMinimalisticIcon
												className={cn(
													"h-5 w-5 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
													collapsed && "-scale-x-100",
												)}
												strokeWidth={1.5}
											/>
										</button>
									</TooltipTrigger>
									<TooltipContent side="bottom">
										{collapsed ? "Expand" : "Collapse"}
										<Kbd>{modKey} B</Kbd>
									</TooltipContent>
								</Tooltip>

								<span
									aria-hidden="true"
									className="hidden h-4 w-px bg-border md:block"
								/>

								<Link
									to="/$username"
									params={{ username: user.username ?? "" }}
									className="group flex min-w-0 items-center gap-2"
								>
									<span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
										{SITE_DOMAIN}/
									</span>

									<span className="truncate font-mono text-[10px] uppercase tracking-[0.08em] text-foreground transition-colors group-hover:text-brand">
										{user.username}
									</span>
								</Link>
							</div>

							<div className="flex items-center gap-3">
								<Link
									to="/$username"
									params={{ username: user.username ?? "" }}
									className="hidden border border-border px-3 py-2 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground sm:inline-flex"
								>
									View public page
								</Link>

								<Tooltip>
									<TooltipTrigger asChild>
										<ThemeToggle />
									</TooltipTrigger>
									<TooltipContent side="bottom">Theme</TooltipContent>
								</Tooltip>

								<Tooltip>
									<TooltipTrigger asChild>
										<button
											type="button"
											onClick={handleSignOut}
											aria-label="Sign out"
											className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground transition-[color,transform] active:scale-90 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
										>
											<Logout2Icon className="h-4 w-4" strokeWidth={1.7} />
										</button>
									</TooltipTrigger>
									<TooltipContent side="bottom">Sign out</TooltipContent>
								</Tooltip>

								<div className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden border border-border bg-surface font-display text-sm text-foreground">
									{user.image ? (
										<img
											src={user.image}
											alt=""
											className="h-full w-full object-cover"
										/>
									) : (
										user.name.slice(0, 1).toUpperCase()
									)}
								</div>
							</div>
						</header>

						{!verified && (
							<VerifyEmailBanner
								email={user.email}
								finishingUpgrade={pendingIntent}
							/>
						)}

						<main className="flex-1 px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
							{children}
						</main>
					</div>
				</div>
			</div>
		</TooltipProvider>
	);
}

// Text that fades out while the desktop sidebar collapses. visibility
// follows opacity (it flips at the end of the fade), so hidden text also
// leaves the tab order and the accessibility tree.
const fadeWhenCollapsed =
	"whitespace-nowrap transition-[opacity,visibility] duration-200 ease-out motion-reduce:transition-none sidebar-collapsed:invisible sidebar-collapsed:opacity-0";

type SidebarCollapse = { collapsed: boolean };

function WorkspaceNav({
	pathname,
	isPro,
	onUpgrade,
	upgradePending,
	onNavigate,
	collapse,
}: {
	pathname: string;
	isPro: boolean;
	onUpgrade: () => void;
	upgradePending: boolean;
	onNavigate?: () => void;
	// Only the desktop sidebar collapses; the mobile drawer leaves it out.
	collapse?: SidebarCollapse;
}) {
	const reduceMotion = useReducedMotion();
	const collapsed = collapse?.collapsed ?? false;

	return (
		<>
			{/* Scrolls on its own on short screens so the plan below never
			    gets cut off. -mx-4/px-4 keep the active indicator (at
			    -left-4) inside the scroll container's clip box. No x scroll:
			    collapsed, the hidden labels are still wider than the rail. */}
			<nav
				aria-label="Dashboard"
				className="-mx-4 min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pb-2 [scrollbar-width:thin]"
			>
				{navGroups.map((group) => (
					// Collapsed, the groups close up into one icon column: the
					// gap and the label's height animate away with the width.
					<div
						key={group.items[0].to}
						className="transition-[margin] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] not-first:mt-4 motion-reduce:transition-none sidebar-collapsed:not-first:mt-0.5"
					>
						{group.label && (
							<p
								className={cn(
									"mb-2 h-3 overflow-hidden px-2 font-mono text-[9px] leading-3 uppercase tracking-[0.14em] whitespace-nowrap text-muted-foreground transition-[height,margin,opacity,visibility] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sidebar-collapsed:invisible sidebar-collapsed:mb-0 sidebar-collapsed:h-0 sidebar-collapsed:opacity-0",
								)}
							>
								{group.label}
							</p>
						)}
						<div className="space-y-0.5">
							{group.items.map((item) => {
								const active = item.end
									? pathname === item.to
									: pathname.startsWith(item.to);

								const Icon = item.icon;

								const link = (
									<Link
										to={item.to}
										onClick={onNavigate}
										aria-current={active ? "page" : undefined}
										className={`group relative flex items-center gap-3 px-2 py-2.5 text-sm transition-colors ${
											active
												? "text-foreground"
												: "text-muted-foreground hover:bg-surface/60 hover:text-foreground"
										}`}
									>
										{active && (
											<motion.span
												layoutId="active-nav-indicator"
												className="absolute -left-4 top-0 h-full w-px bg-brand"
												transition={{
													duration: reduceMotion ? 0 : 0.25,
													ease: [0.16, 1, 0.3, 1],
												}}
											/>
										)}

										<Icon
											className={`size-5 shrink-0 transition-colors ${
												active
													? "text-brand"
													: "text-muted-foreground group-hover:text-foreground"
											}`}
											strokeWidth={1}
										/>

										<span className={collapse ? fadeWhenCollapsed : undefined}>
											{item.label}
										</span>
									</Link>
								);

								if (!collapse) return <Fragment key={item.to}>{link}</Fragment>;

								// Labels are hidden while collapsed, so the name moves to a
								// tooltip. Expanded, the tooltip would only repeat the label.
								return (
									<Tooltip key={item.to}>
										<TooltipTrigger asChild>{link}</TooltipTrigger>
										{collapsed && (
											<TooltipContent side="right">{item.label}</TooltipContent>
										)}
									</Tooltip>
								);
							})}
						</div>
					</div>
				))}
			</nav>

			<div className="mt-auto">
				<div className="relative border-t border-border pt-5">
					<div
						className={cn(
							"flex w-56 items-start justify-between gap-4",
							collapse && fadeWhenCollapsed,
						)}
					>
						<div>
							<p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
								Current plan
							</p>

							<p className="mt-2 font-display text-2xl tracking-[-0.02em]">
								{isPro ? "Pro" : "Free"}
							</p>

							<p className="mt-1 whitespace-normal text-xs leading-relaxed text-muted-foreground">
								{isPro
									? "Unlimited links · projects · snippets"
									: `${PLAN_LIMITS.free.links} links · ${PLAN_LIMITS.free.projects} projects · ${PLAN_LIMITS.free.snippets} snippets`}
							</p>
						</div>

						{!isPro && (
							<button
								type="button"
								onClick={onUpgrade}
								disabled={upgradePending}
								className="font-mono text-[9px] uppercase tracking-[0.08em] text-brand transition-colors hover:text-foreground disabled:opacity-50"
							>
								{upgradePending ? "Redirecting…" : "Upgrade"}
							</button>
						)}
					</div>

					{/* Collapsed: the plan shrinks to a mono chip in the same spot. */}
					{collapse && (
						<div className="invisible absolute top-5 left-0 flex w-9 justify-center opacity-0 transition-[opacity,visibility] duration-200 ease-out motion-reduce:transition-none sidebar-collapsed:visible sidebar-collapsed:opacity-100">
							{isPro ? (
								<span className="font-mono text-[9px] uppercase tracking-[0.12em] text-foreground">
									Pro
								</span>
							) : (
								<Tooltip>
									<TooltipTrigger asChild>
										<button
											type="button"
											onClick={onUpgrade}
											disabled={upgradePending}
											aria-label="Upgrade to Pro"
											className="font-mono text-[9px] uppercase tracking-[0.12em] text-brand transition-colors hover:text-foreground disabled:opacity-50"
										>
											Free
										</button>
									</TooltipTrigger>
									{collapsed && (
										<TooltipContent side="right">Upgrade to Pro</TooltipContent>
									)}
								</Tooltip>
							)}
						</div>
					)}
				</div>
			</div>
		</>
	);
}

const DRAWER_EXIT_MS = 200;

function MobileNavDrawer({
	onClose,
	children,
}: {
	onClose: () => void;
	children: (requestClose: () => void) => ReactNode;
}) {
	const [closing, setClosing] = useState(false);

	function requestClose() {
		setClosing(true);
	}

	useEffect(() => {
		if (!closing) return;
		const timer = setTimeout(onClose, DRAWER_EXIT_MS);
		return () => clearTimeout(timer);
	}, [closing, onClose]);

	return (
		<div className="fixed inset-0 z-50 md:hidden" role="presentation">
			<button
				type="button"
				className={cn(
					"absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-200 motion-reduce:transition-none",
					closing ? "opacity-0" : "opacity-100",
				)}
				onClick={requestClose}
				aria-label="Close menu"
			/>

			<div
				className={cn(
					"relative z-10 flex h-dvh w-72 max-w-[85vw] flex-col border-r border-border bg-background transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] starting:-translate-x-full motion-reduce:transition-none",
					closing ? "-translate-x-full" : "translate-x-0",
				)}
				role="dialog"
				aria-modal="true"
				aria-label="Dashboard navigation"
			>
				{children(requestClose)}
			</div>
		</div>
	);
}

export function EmptyState({
	icon: Icon,
	title,
	description,
}: {
	icon: NavIcon;
	title: string;
	description: string;
}) {
	return (
		<div className="border-t border-b border-border py-16 text-center">
			<div className="mx-auto flex h-10 w-10 items-center justify-center text-muted-foreground">
				<Icon className="h-5 w-5" strokeWidth={1.5} />
			</div>

			<h3 className="mt-5 font-display text-2xl tracking-[-0.02em]">{title}</h3>

			<p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
				{description}
			</p>

			<button
				type="button"
				disabled
				className="mt-5 border border-border px-4 py-2 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground opacity-70"
			>
				Coming soon
			</button>
		</div>
	);
}
