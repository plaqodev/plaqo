import {
	ArrowRightUpIcon,
	LockKeyholeIcon,
	MonitorIcon,
	RestartIcon,
	SmartphoneIcon,
	UnreadIcon,
} from "@solar-icons/react/linear";
import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import posthog from "posthog-js";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { PlanComparisonTable } from "@/components/dashboard/PlanComparisonTable";
import { PageTitle } from "@/components/motion/PageTitle";
import { Button } from "@/components/ui/button";
import {
	ColorPicker,
	ColorPickerArea,
	ColorPickerContent,
	ColorPickerEyeDropper,
	ColorPickerFormatSelect,
	ColorPickerHueSlider,
	ColorPickerInput,
	ColorPickerSwatch,
	ColorPickerTrigger,
} from "@/components/ui/color-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { startProCheckout } from "@/lib/billing";
import { useProMonthlyLabel } from "@/lib/queries/pricing";
import {
	useApplyThemeTemplate,
	useProfileCore,
	useProfileData,
	useResetTheme,
	useUpdateTheme,
} from "@/lib/queries/profile-data";
import { SITE_DOMAIN } from "@/lib/site";
import {
	type FontCategory,
	type FontKey,
	fontOptions,
	isValidThemeColor,
	type ThemeV2,
} from "@/lib/theme-config";
import {
	PREVIEW_READY_MESSAGE,
	PREVIEW_THEME_MESSAGE,
} from "@/lib/theme-preview";
import { templates } from "@/lib/theme-templates";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/theme")({
	head: () => ({ meta: [{ title: "Theme — plaqo" }] }),
	component: ThemePage,
});

type Tab = "templates" | "colors" | "type" | "layout" | "effects" | "css";

function ThemePage() {
	const { user } = useRouteContext({ from: "/_authenticated/dashboard" });
	const data = useProfileData();
	const core = useProfileCore();

	const updateTheme = useUpdateTheme();
	const applyTemplate = useApplyThemeTemplate();
	const resetTheme = useResetTheme();

	const [tab, setTab] = useState<Tab>("templates");
	const [confirmingReset, setConfirmingReset] = useState(false);

	const theme = data.theme;
	const isPro = core.data?.plan === "pro";

	const set = (patch: Partial<ThemeV2>) => {
		updateTheme.mutate(patch, {
			onError: (err) =>
				toast.error(err instanceof Error ? err.message : "Couldn't save"),
		});
	};

	return (
		<div className="mx-auto w-full max-w-350">
			<header className="border-b border-border pb-8">
				<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand">
					11 / Theme
				</p>

				<div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
					<div className="min-w-0">
						<PageTitle className="font-display text-5xl leading-[0.95] tracking-[-0.04em] sm:text-6xl">
							Theme.
						</PageTitle>

						<p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
							Design your public page. Changes are previewed live and saved
							automatically.
						</p>
					</div>

					<Button
						variant="ghost"
						onClick={() => setConfirmingReset(true)}
						className="h-9 self-start rounded-none px-2 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground hover:bg-transparent hover:text-foreground lg:self-auto"
					>
						<RestartIcon size={14} />
						Reset
					</Button>
				</div>
			</header>

			{confirmingReset && (
				<ConfirmDialog
					title="Reset theme"
					description="This resets colors, type, layout, and effects back to the default theme. Your links, projects, and other content stay untouched."
					confirmLabel="Reset theme"
					pending={resetTheme.isPending}
					onClose={() => setConfirmingReset(false)}
					onConfirm={() => {
						resetTheme.mutate(undefined, {
							onSuccess: () => {
								toast.success("Theme reset");
								setConfirmingReset(false);
							},
							onError: (err) =>
								toast.error(
									err instanceof Error ? err.message : "Couldn't reset",
								),
						});
					}}
				/>
			)}

			{/* Controls in a narrow column, the preview as the main canvas, so
			    the desktop layout shows big enough to read. The controls
			    respond to their own column width (@container), not the
			    viewport. */}
			<div className="mt-8 grid min-w-0 gap-10 lg:grid-cols-[22.5rem_minmax(0,1fr)] xl:gap-12">
				<div className="@container min-w-0">
					<nav
						className="grid min-w-0 grid-cols-6 border-b border-border"
						aria-label="Theme sections"
					>
						{(
							[
								["templates", "Templates"],
								["colors", "Colors"],
								["type", "Type"],
								["layout", "Layout"],
								["effects", "Effects"],
								["css", "CSS"],
							] as const
						).map(([value, label]) => (
							<TabBtn
								key={value}
								active={tab === value}
								onClick={() => setTab(value)}
							>
								{label}
							</TabBtn>
						))}
					</nav>

					<div className="pt-8">
						{tab === "templates" && (
							<TemplatesPane
								currentTemplateId={data.templateId}
								onApply={(templateId) =>
									applyTemplate.mutate(templateId, {
										onSuccess: () => toast.success("Template applied"),
										onError: (err) =>
											toast.error(
												err instanceof Error ? err.message : "Couldn't apply",
											),
									})
								}
							/>
						)}

						{tab === "colors" && <ColorsPane theme={theme} set={set} />}

						{tab === "type" && <TypePane theme={theme} set={set} />}

						{tab === "layout" && <LayoutPane theme={theme} set={set} />}

						{tab === "effects" && <EffectsPane theme={theme} set={set} />}

						{tab === "css" && <CssPane theme={theme} set={set} isPro={isPro} />}
					</div>

					<div className="mt-8 border-t border-border pt-5">
						<a
							href={`/${user.username ?? ""}`}
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-brand"
						>
							Open my public page
							<ArrowRightUpIcon size={12} aria-hidden />
						</a>
					</div>
				</div>

				{/* Below lg the preview comes first and sticks under the dashboard
				    header, so changes stay visible while the controls scroll
				    underneath. */}
				<div className="sticky top-16 z-20 order-first -mx-5 min-w-0 bg-background px-5 pt-3 pb-4 sm:-mx-8 sm:px-8 lg:top-24 lg:order-none lg:mx-0 lg:self-start lg:px-0 lg:pt-0 lg:pb-0">
					<ThemePreview
						theme={theme}
						username={user.username ?? ""}
						isPro={isPro}
					/>
				</div>
			</div>
		</div>
	);
}

function TabBtn({
	active,
	onClick,
	children,
}: {
	active: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	const reduceMotion = useReducedMotion();

	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"relative min-w-0 whitespace-nowrap overflow-hidden px-0.5 pb-3 font-mono text-[9px] uppercase tracking-[0.02em] transition-colors @md:px-1 @md:text-[10px] @md:tracking-wider",
				active
					? "text-foreground"
					: "text-muted-foreground hover:text-foreground",
			)}
		>
			{children}

			{active && (
				<motion.span
					layoutId="theme-tab-indicator"
					className="absolute inset-x-0 bottom-0 h-px bg-brand"
					transition={{
						duration: reduceMotion ? 0 : 0.25,
						ease: [0.16, 1, 0.3, 1],
					}}
				/>
			)}
		</button>
	);
}

function Pane({ children }: { children: React.ReactNode }) {
	return <section className="min-w-0 space-y-7">{children}</section>;
}

function Row({
	label,
	hint,
	children,
}: {
	label: string;
	hint?: string;
	children: React.ReactNode;
}) {
	return (
		<div className="min-w-0 border-b border-border pb-6">
			<div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
				<Label className="font-mono text-[10px] uppercase tracking-[0.08em]">
					{label}
				</Label>

				{hint && (
					<span className="font-mono text-[9px] text-muted-foreground">
						{hint}
					</span>
				)}
			</div>

			{children}
		</div>
	);
}

function ColorField({
	label,
	value,
	onChange,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
}) {
	// The text input keeps a local draft and only saves once it's a valid
	// color — every save hits the server, which rejects partial values like
	// "#1a" and would roll the field back mid-typing.
	const [draft, setDraft] = useState(value);
	useEffect(() => setDraft(value), [value]);

	const commit = (next: string) => {
		setDraft(next);
		const trimmed = next.trim();
		if (isValidThemeColor(trimmed) && trimmed !== value) onChange(trimmed);
	};

	return (
		<Row label={label}>
			<ColorPicker value={value} onValueChange={commit}>
				<div className="flex min-w-0 items-center gap-3">
					<ColorPickerTrigger asChild>
						<button
							type="button"
							aria-label={`Pick ${label.toLowerCase()} color`}
							className="flex h-10 w-12 shrink-0 items-center justify-center border border-border bg-background p-1.5 transition-colors hover:border-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						>
							<ColorPickerSwatch className="h-full w-full rounded-none border-0 shadow-none" />
						</button>
					</ColorPickerTrigger>

					<Input
						value={draft}
						onChange={(event) => commit(event.target.value)}
						aria-invalid={!isValidThemeColor(draft.trim())}
						className="h-10 min-w-0 flex-1 rounded-none border-x-0 border-t-0 border-b-border bg-transparent px-0 font-mono text-xs shadow-none focus-visible:border-brand focus-visible:ring-0"
					/>
				</div>

				<ColorPickerContent
					align="start"
					className="w-72 rounded-none border-border bg-background p-4 shadow-none"
				>
					<ColorPickerArea className="rounded-none" />

					<div className="mt-4 flex items-center gap-3">
						<ColorPickerEyeDropper className="h-8 w-8 shrink-0 rounded-none border-border p-0" />

						<ColorPickerHueSlider className="flex-1" />
					</div>

					<div className="mt-3 flex items-center gap-2">
						<ColorPickerFormatSelect className="w-20 shrink-0 rounded-none" />
						<ColorPickerInput className="flex-1 rounded-none" />
					</div>
				</ColorPickerContent>
			</ColorPicker>
		</Row>
	);
}

function TemplatesPane({
	currentTemplateId,
	onApply,
}: {
	currentTemplateId: string | null;
	onApply: (templateId: string) => void;
}) {
	return (
		<Pane>
			<div>
				<p className="font-display text-2xl tracking-tight">
					Start with a direction.
				</p>

				<p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
					Choose a preset, then continue shaping every detail to your taste.
				</p>
			</div>

			<div className="grid gap-px border border-border bg-border @lg:grid-cols-2">
				{templates.map((template) => {
					const active = currentTemplateId === template.id;

					return (
						<button
							type="button"
							key={template.id}
							onClick={() => onApply(template.id)}
							className={cn(
								"group relative min-w-0 border-0 p-5 text-left transition-all active:scale-[0.98]",
								active
									? "ring-1 ring-inset ring-foreground"
									: "hover:opacity-85",
							)}
							style={{
								background: template.config.bg,
								color: template.config.fg,
							}}
						>
							<div className="flex min-w-0 items-start justify-between gap-4">
								<div className="min-w-0">
									<p className="truncate font-display text-xl tracking-tight">
										{template.name}
									</p>

									<p className="mt-2 max-w-sm text-xs leading-relaxed opacity-70">
										{template.description}
									</p>
								</div>

								{active && <UnreadIcon size={25} className="shrink-0" />}
							</div>

							<div className="mt-5 flex gap-1.5">
								<span
									className="h-4 w-4 rounded-full"
									style={{ background: template.config.accent }}
								/>

								<span
									className="h-4 w-4 rounded-full"
									style={{
										background:
											template.config.accent2 ?? template.config.accent,
									}}
								/>

								<span
									className="h-4 w-4 rounded-full border"
									style={{
										background: template.config.surface,
										borderColor: template.config.border,
									}}
								/>
							</div>
						</button>
					);
				})}
			</div>
		</Pane>
	);
}

function ColorsPane({
	theme,
	set,
}: {
	theme: ThemeV2;
	set: (patch: Partial<ThemeV2>) => void;
}) {
	return (
		<Pane>
			<div className="grid gap-6 @lg:grid-cols-2">
				<ColorField
					label="Background"
					value={theme.bg}
					onChange={(value) => set({ bg: value })}
				/>

				<ColorField
					label="Text"
					value={theme.fg}
					onChange={(value) => set({ fg: value })}
				/>

				<ColorField
					label="Muted text"
					value={theme.muted}
					onChange={(value) => set({ muted: value })}
				/>

				<ColorField
					label="Surface"
					value={theme.surface}
					onChange={(value) => set({ surface: value })}
				/>

				<ColorField
					label="Border"
					value={theme.border}
					onChange={(value) => set({ border: value })}
				/>

				<ColorField
					label="Accent"
					value={theme.accent}
					onChange={(value) => set({ accent: value })}
				/>

				<ColorField
					label="Accent 2"
					value={theme.accent2 ?? theme.accent}
					onChange={(value) => set({ accent2: value })}
				/>
			</div>

			<Row label="Background style">
				<div className="flex flex-wrap gap-x-5 gap-y-3">
					{(
						["solid", "gradient", "radial", "mesh", "grid", "dots"] as const
					).map((style) => (
						<ChoiceButton
							key={style}
							active={theme.bgStyle === style}
							onClick={() => set({ bgStyle: style })}
						>
							{style}
						</ChoiceButton>
					))}
				</div>
			</Row>

			{theme.bgStyle === "gradient" && (
				<Row label="Gradient angle" hint={`${theme.bgAngle}°`}>
					<Slider
						value={[theme.bgAngle]}
						min={0}
						max={360}
						step={5}
						onValueChange={([value]) => set({ bgAngle: value })}
					/>
				</Row>
			)}
		</Pane>
	);
}

function TypePane({
	theme,
	set,
}: {
	theme: ThemeV2;
	set: (patch: Partial<ThemeV2>) => void;
}) {
	return (
		<Pane>
			<FontPicker
				label="Heading font"
				value={theme.headingFont}
				onChange={(value) => set({ headingFont: value })}
				categories={["sans", "serif"]}
			/>

			<FontPicker
				label="Body font"
				value={theme.bodyFont}
				onChange={(value) => set({ bodyFont: value })}
				categories={["sans", "serif"]}
			/>

			<FontPicker
				label="Mono font"
				value={theme.monoFont}
				onChange={(value) => set({ monoFont: value })}
				categories={["mono"]}
			/>

			<Row
				label="Font size scale"
				hint={`${Math.round(theme.fontSizeScale * 100)}%`}
			>
				<Slider
					value={[theme.fontSizeScale]}
					min={0.85}
					max={1.25}
					step={0.05}
					onValueChange={([value]) => set({ fontSizeScale: value })}
				/>
			</Row>

			<Row label="Letter spacing" hint={`${theme.letterSpacing}`}>
				<Slider
					value={[theme.letterSpacing]}
					min={-2}
					max={4}
					step={0.5}
					onValueChange={([value]) => set({ letterSpacing: value })}
				/>
			</Row>
		</Pane>
	);
}

// Con cada fuente nueva la grilla crece — siempre arranca colapsada para que
// el picker no empuje el resto del panel fuera de vista. Si el valor activo
// cae fuera de las primeras N, ocupa el último lugar visible: la selección
// actual se ve sin tener que expandir la lista entera.
const FONT_PICKER_COLLAPSED_COUNT = 6;

function FontPicker({
	label,
	value,
	onChange,
	categories,
}: {
	label: string;
	value: FontKey;
	onChange: (value: FontKey) => void;
	categories: readonly FontCategory[];
}) {
	const options = fontOptions.filter((font) =>
		categories.includes(font.category),
	);
	const hiddenCount = options.length - FONT_PICKER_COLLAPSED_COUNT;
	const [expanded, setExpanded] = useState(false);

	const collapsed = options.slice(0, FONT_PICKER_COLLAPSED_COUNT);
	const active = options.find((font) => font.value === value);
	if (active && !collapsed.includes(active)) {
		collapsed[collapsed.length - 1] = active;
	}
	const visible = expanded || hiddenCount <= 0 ? options : collapsed;

	return (
		<Row label={label}>
			<div className="grid gap-px border border-border bg-border @lg:grid-cols-2">
				{visible.map((font) => (
					<button
						type="button"
						key={font.value}
						onClick={() => onChange(font.value)}
						className={cn(
							"min-w-0 border-0 bg-background px-4 py-3 text-left transition-colors",
							value === font.value
								? "bg-surface-elevated text-foreground"
								: "text-muted-foreground hover:text-foreground",
						)}
						style={{ fontFamily: font.stack }}
					>
						<span className="block truncate text-sm">{font.label}</span>

						<span className="mt-1 block font-mono text-[8px] uppercase tracking-[0.08em] text-muted-foreground">
							{font.value}
						</span>
					</button>
				))}
			</div>

			{hiddenCount > 0 && (
				<button
					type="button"
					onClick={() => setExpanded((current) => !current)}
					className="mt-2 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground"
				>
					{expanded ? "Show less" : `Show ${hiddenCount} more`}
				</button>
			)}
		</Row>
	);
}

function LayoutPane({
	theme,
	set,
}: {
	theme: ThemeV2;
	set: (patch: Partial<ThemeV2>) => void;
}) {
	return (
		<Pane>
			<Row label="Corner radius" hint={`${theme.radius}px`}>
				<Slider
					value={[theme.radius]}
					min={0}
					max={32}
					step={1}
					onValueChange={([value]) => set({ radius: value })}
				/>
			</Row>

			<Row label="Card padding" hint={`${theme.cardPadding}px`}>
				<Slider
					value={[theme.cardPadding]}
					min={8}
					max={40}
					step={1}
					onValueChange={([value]) => set({ cardPadding: value })}
				/>
			</Row>

			<Row label="Spacing scale" hint={`${theme.spacing.toFixed(2)}×`}>
				<Slider
					value={[theme.spacing]}
					min={0.75}
					max={1.5}
					step={0.05}
					onValueChange={([value]) => set({ spacing: value })}
				/>
			</Row>

			<Row label="Content width">
				<div className="flex flex-wrap gap-x-5 gap-y-3">
					{(["narrow", "default", "wide"] as const).map((width) => (
						<ChoiceButton
							key={width}
							active={theme.cardWidth === width}
							onClick={() => set({ cardWidth: width })}
						>
							{width}
						</ChoiceButton>
					))}
				</div>
			</Row>

			<Row label="Button style">
				<div className="flex flex-wrap gap-x-5 gap-y-3">
					{(["solid", "outline", "ghost", "gradient", "glass"] as const).map(
						(style) => (
							<ChoiceButton
								key={style}
								active={theme.buttonStyle === style}
								onClick={() => set({ buttonStyle: style })}
							>
								{style}
							</ChoiceButton>
						),
					)}
				</div>
			</Row>

			<Row label="Button border" hint={`${theme.buttonBorder}px`}>
				<Slider
					value={[theme.buttonBorder]}
					min={0}
					max={3}
					step={1}
					onValueChange={([value]) => set({ buttonBorder: value })}
				/>
			</Row>
		</Pane>
	);
}

function EffectsPane({
	theme,
	set,
}: {
	theme: ThemeV2;
	set: (patch: Partial<ThemeV2>) => void;
}) {
	return (
		<Pane>
			<Row label="Shadow">
				<div className="flex flex-wrap gap-x-5 gap-y-3">
					{(["none", "sm", "md", "lg", "glow"] as const).map((shadow) => (
						<ChoiceButton
							key={shadow}
							active={theme.shadow === shadow}
							onClick={() => set({ shadow })}
						>
							{shadow}
						</ChoiceButton>
					))}
				</div>
			</Row>

			<Row label="Hover effect">
				<div className="flex flex-wrap gap-x-5 gap-y-3">
					{(["none", "lift", "glow", "scale", "shift"] as const).map(
						(hover) => (
							<ChoiceButton
								key={hover}
								active={theme.hover === hover}
								onClick={() => set({ hover })}
							>
								{hover}
							</ChoiceButton>
						),
					)}
				</div>
			</Row>

			<Row label="Glass on cards">
				<button
					type="button"
					onClick={() => set({ glass: !theme.glass })}
					className={cn(
						"font-mono text-[10px] uppercase tracking-[0.08em] transition-colors",
						theme.glass
							? "text-brand"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					{theme.glass ? "/ Enabled" : "Disabled"}
				</button>
			</Row>
		</Pane>
	);
}

function ChoiceButton({
	active,
	onClick,
	children,
}: {
	active: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"font-mono text-[10px] uppercase tracking-wider transition-colors",
				active ? "text-brand" : "text-muted-foreground hover:text-foreground",
			)}
		>
			{active && <span className="mr-1.5">/</span>}
			{children}
		</button>
	);
}

function CssPane({
	theme,
	set,
	isPro,
}: {
	theme: ThemeV2;
	set: (patch: Partial<ThemeV2>) => void;
	isPro: boolean;
}) {
	const [draft, setDraft] = useState(theme.customCss);

	useEffect(() => {
		if (!isPro) posthog.capture("paywall_shown", { resource: "custom_css" });
	}, [isPro]);

	const proPrice = useProMonthlyLabel();

	async function handleUpgrade() {
		posthog.capture("paywall_upgrade_clicked", { resource: "custom_css" });
		try {
			await startProCheckout();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Couldn't start checkout",
			);
		}
	}

	if (!isPro) {
		return (
			<Pane>
				<div className="flex items-start gap-4 border-b border-border pb-8">
					<div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center border border-border text-brand">
						<LockKeyholeIcon className="h-4 w-4" strokeWidth={1.5} />
					</div>

					<div>
						<p className="font-mono text-[9px] uppercase tracking-[0.12em] text-brand">
							Pro feature
						</p>

						<h3 className="mt-3 font-display text-2xl tracking-[-0.03em]">
							Custom CSS is part of Pro.
						</h3>

						<p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
							Write your own CSS, scoped to your public page, for full control
							over how it looks.
						</p>

						<div className="max-w-md">
							<PlanComparisonTable highlight="custom_css" />
						</div>

						<Button
							onClick={handleUpgrade}
							className="mt-5 h-9 rounded-none bg-foreground px-4 font-mono text-[10px] uppercase tracking-[0.08em] text-background shadow-none transition-transform active:scale-[0.98] hover:bg-brand hover:text-brand-foreground"
						>
							Upgrade to Pro — {proPrice}
						</Button>
					</div>
				</div>
			</Pane>
		);
	}

	return (
		<Pane>
			<Row
				label="Custom CSS"
				hint="Applied inside a scoped block on your public page"
			>
				<Textarea
					value={draft}
					onChange={(event) => setDraft(event.target.value)}
					rows={14}
					spellCheck={false}
					className="resize-none rounded-none border-border bg-surface font-mono text-xs leading-relaxed shadow-none focus-visible:border-brand focus-visible:ring-0"
					placeholder={`.tt-card { border-width: 2px; }\n.tt-btn:hover { transform: rotate(-1deg); }`}
				/>
			</Row>

			<div className="flex flex-wrap gap-5">
				<Button
					size="sm"
					onClick={() => {
						set({ customCss: draft });
						toast.success("Custom CSS applied");
					}}
					className="h-9 rounded-none bg-foreground px-4 font-mono text-[10px] uppercase tracking-[0.08em] text-background shadow-none transition-transform active:scale-[0.98] hover:bg-brand hover:text-brand-foreground"
				>
					Apply CSS
				</Button>

				<button
					type="button"
					onClick={() => {
						setDraft("");
						set({ customCss: "" });
					}}
					className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground"
				>
					Clear
				</button>
			</div>

			<p className="text-[10px] leading-relaxed text-muted-foreground">
				Scoped selectors: <code>.tt-card</code>, <code>.tt-btn</code>,{" "}
				<code>.tt-muted</code>. Vars: <code>--tt-bg</code>, <code>--tt-fg</code>
				, <code>--tt-accent</code>, <code>--tt-radius</code>,{" "}
				<code>--tt-heading-font</code>, <code>--tt-body-font</code>,{" "}
				<code>--tt-mono-font</code>…
			</p>
		</Pane>
	);
}

type PreviewDevice = "desktop" | "mobile";

// Layout width the page renders at for each device. 1024 is the smallest
// width that gets the two-column desktop layout (lg in $username.tsx), so
// it's scaled down the least. Mobile shows at (or near) its real size.
const DEVICE_WIDTH: Record<PreviewDevice, number> = {
	desktop: 1024,
	mobile: 390,
};

// Below this panel width the desktop layout scales under ~55% and gets
// hard to read, so the preview opens on mobile instead.
const DESKTOP_MIN_PANEL = 560;

// Mobile on a panel wide enough to leave space around it: the page sits
// in a phone frame on a dotted backdrop, so the empty sides read as
// intentional. Narrower panels (a real phone) show the page edge to edge.
// statusBar: the strip under the notch; the page starts below it, like a
// real phone, so the notch never covers the page.
const PHONE = { minPanel: 480, margin: 20, bezel: 10, statusBar: 30 } as const;

type PreviewLayout = {
	framed: boolean;
	scale: number;
	// The page's own layout size (what the iframe renders at).
	frameWidth: number;
	frameHeight: number;
	// Where the page starts inside the device (below the status bar).
	frameTop: number;
	// The visible device box (frame included) and its position.
	deviceWidth: number;
	deviceHeight: number;
	left: number;
	top: number;
};

function previewLayout(
	device: PreviewDevice,
	box: { width: number; height: number },
): PreviewLayout {
	const frameWidth = DEVICE_WIDTH[device];

	if (device === "mobile" && box.width >= PHONE.minPanel) {
		const inset = PHONE.margin + PHONE.bezel;
		const innerHeight = Math.max(0, box.height - inset * 2);
		const scale = Math.min(1, (box.width - inset * 2) / frameWidth);
		const deviceWidth = frameWidth * scale + PHONE.bezel * 2;
		return {
			framed: true,
			scale,
			frameWidth,
			frameHeight: (innerHeight - PHONE.statusBar) / scale,
			frameTop: PHONE.statusBar,
			deviceWidth,
			deviceHeight: innerHeight + PHONE.bezel * 2,
			left: (box.width - deviceWidth) / 2,
			top: PHONE.margin,
		};
	}

	const scale = box.width ? Math.min(1, box.width / frameWidth) : 1;
	const deviceWidth = frameWidth * scale;
	return {
		framed: false,
		scale,
		frameWidth,
		frameHeight: box.height / scale,
		frameTop: 0,
		deviceWidth,
		deviceHeight: box.height,
		// Centered when narrower than the panel, pinned left when scaled.
		left: Math.max(0, (box.width - deviceWidth) / 2),
		top: 0,
	};
}

const devices: {
	value: PreviewDevice;
	label: string;
	icon: typeof MonitorIcon;
}[] = [
	{ value: "desktop", label: "Desktop", icon: MonitorIcon },
	{ value: "mobile", label: "Mobile", icon: SmartphoneIcon },
];

// The real public page in an iframe (/username?preview=true), so the preview
// is exactly what gets published: same layout, blocks, breakpoints and
// custom CSS. The unsaved theme is posted in on every change; the page
// swaps it in without reloading (see lib/theme-preview.ts).
function ThemePreview({
	theme,
	username,
	isPro,
}: {
	theme: ThemeV2;
	username: string;
	isPro: boolean;
}) {
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const frameBoxRef = useRef<HTMLDivElement>(null);
	const [device, setDevice] = useState<PreviewDevice>("desktop");
	const devicePicked = useRef(false);
	const [ready, setReady] = useState(false);
	const [box, setBox] = useState({ width: 0, height: 0 });

	// The public page drops custom CSS on the Free plan; match it here.
	const draft = useMemo(
		() => (isPro ? theme : { ...theme, customCss: "" }),
		[theme, isPro],
	);

	useEffect(() => {
		const el = frameBoxRef.current;
		if (!el) return;
		const observer = new ResizeObserver(([entry]) => {
			const { width, height } = entry.contentRect;
			setBox({ width, height });
			// First measurement picks the readable default; after that the
			// user's choice stands.
			if (!devicePicked.current) {
				devicePicked.current = true;
				if (width < DESKTOP_MIN_PANEL) setDevice("mobile");
			}
		});
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		function onMessage(event: MessageEvent) {
			if (event.origin !== window.location.origin) return;
			if (event.source !== iframeRef.current?.contentWindow) return;
			if (event.data?.type === PREVIEW_READY_MESSAGE) setReady(true);
		}
		window.addEventListener("message", onMessage);
		return () => window.removeEventListener("message", onMessage);
	}, []);

	useEffect(() => {
		if (!ready) return;
		iframeRef.current?.contentWindow?.postMessage(
			{ type: PREVIEW_THEME_MESSAGE, theme: draft },
			window.location.origin,
		);
	}, [ready, draft]);

	const layout = previewLayout(device, box);
	const { scale } = layout;

	return (
		<>
			<div className="mb-4 flex items-center justify-between border-b border-border pb-3">
				<p className="font-mono text-[9px] uppercase tracking-[0.12em] text-brand">
					Live preview
				</p>

				<fieldset className="flex items-center gap-1">
					<legend className="sr-only">Preview size</legend>
					{devices.map(({ value, label, icon: Icon }) => (
						<button
							key={value}
							type="button"
							aria-pressed={device === value}
							onClick={() => {
								devicePicked.current = true;
								setDevice(value);
							}}
							className={cn(
								"inline-flex items-center gap-1.5 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] transition-colors",
								device === value
									? "text-foreground"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							<Icon size={14} strokeWidth={1.5} aria-hidden />
							{label}
						</button>
					))}
				</fieldset>
			</div>

			<div
				ref={frameBoxRef}
				className="relative h-[40dvh] overflow-hidden border border-border bg-surface lg:h-[calc(100dvh-10rem)] lg:max-h-225 lg:min-h-110"
			>
				{box.width > 0 && (
					// Same element tree in every mode, only sizes and classes
					// change, so switching devices never reloads the iframe.
					<div
						className={cn(
							"absolute inset-0",
							layout.framed &&
								"bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] bg-size-[14px_14px]",
						)}
					>
						<div
							className={cn(
								"absolute overflow-hidden",
								layout.framed &&
									"rounded-[2.5rem] border-10 border-[#141311] bg-[#141311] shadow-[0_30px_60px_-24px_rgb(0_0_0/0.55)] ring-1 ring-border",
							)}
							style={{
								left: layout.left,
								top: layout.top,
								width: layout.deviceWidth,
								height: layout.deviceHeight,
							}}
						>
							<iframe
								ref={iframeRef}
								title="Live preview of your public page"
								src={`/${username}?preview=true`}
								className={cn(
									"absolute left-0 border-0 bg-background transition-opacity duration-300 motion-reduce:transition-none",
									ready ? "opacity-100" : "opacity-0",
								)}
								style={{
									top: layout.frameTop,
									width: layout.frameWidth,
									height: layout.frameHeight,
									transform: `scale(${scale})`,
									transformOrigin: "top left",
								}}
							/>

							{layout.framed && (
								<span
									aria-hidden="true"
									className="pointer-events-none absolute top-1.5 left-1/2 h-4.5 w-21 -translate-x-1/2 rounded-full bg-black/60"
								/>
							)}
						</div>
					</div>
				)}

				{!ready && (
					<div className="absolute inset-0 grid place-items-center">
						<p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
							Loading preview…
						</p>
					</div>
				)}
			</div>

			<p className="mt-3 hidden font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground lg:block">
				{SITE_DOMAIN}/{username}
				{scale < 1 && ` · ${Math.round(scale * 100)}%`}
			</p>
		</>
	);
}
