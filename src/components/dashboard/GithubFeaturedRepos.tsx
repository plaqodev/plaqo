import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
	AddIcon,
	CloseIcon,
	SortVerticalIcon,
} from "@solar-icons/react/linear";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { IntegrationAccount } from "@/lib/api/integrations/account.functions";
import { REPO_SLUG_RE } from "@/lib/integrations/repo-slug";
import {
	useMyGithubRepos,
	useRefreshIntegration,
	useUpsertIntegrationAccount,
} from "@/lib/queries/integrations";

const MAX_FEATURED = 6;

type Mode = "github" | "manual";

function savedPins(account: IntegrationAccount): string[] {
	const pinned = account.config?.pinned;
	return Array.isArray(pinned)
		? pinned.filter((p): p is string => typeof p === "string")
		: [];
}

// Which repositories the GitHub block on the public profile shows: the ones
// pinned on GitHub (default, nothing stored), or up to six picked and
// ordered here, stored as config.pinned on the integration.
export function GithubFeaturedRepos({
	account,
}: {
	account: IntegrationAccount;
}) {
	const initial = savedPins(account);
	const [mode, setMode] = useState<Mode>(
		initial.length > 0 ? "manual" : "github",
	);
	const [selected, setSelected] = useState<string[]>(initial);
	const [query, setQuery] = useState("");

	// Re-sync local state when the saved config changes underneath (save,
	// reconnect, another tab).
	const savedKey = initial.join("\n");
	useEffect(() => {
		const pins = savedKey ? savedKey.split("\n") : [];
		setSelected(pins);
		setMode(pins.length > 0 ? "manual" : "github");
	}, [savedKey]);

	const repos = useMyGithubRepos(account.handle, mode === "manual");
	const upsert = useUpsertIntegrationAccount();
	const refresh = useRefreshIntegration();
	const busy = upsert.isPending || refresh.isPending;

	const effective = mode === "manual" ? selected : [];
	const dirty = effective.join("\n") !== savedKey;

	const byName = useMemo(
		() => new Map((repos.data ?? []).map((r) => [r.full_name, r])),
		[repos.data],
	);

	const trimmed = query.trim();
	const available = (repos.data ?? []).filter(
		(r) =>
			!selected.includes(r.full_name) &&
			r.full_name.toLowerCase().includes(trimmed.toLowerCase()),
	);
	// Repos the account doesn't own (an org's, a contribution) aren't in the
	// list; a full owner/repo can be added directly.
	const canAddTyped =
		REPO_SLUG_RE.test(trimmed) &&
		!selected.includes(trimmed) &&
		!byName.has(trimmed);
	const full = selected.length >= MAX_FEATURED;

	function add(slug: string) {
		if (full || selected.includes(slug)) return;
		setSelected((s) => [...s, slug]);
		setQuery("");
	}

	function remove(slug: string) {
		setSelected((s) => s.filter((x) => x !== slug));
	}

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	function onDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (!over || active.id === over.id) return;
		setSelected((s) => {
			const from = s.indexOf(String(active.id));
			const to = s.indexOf(String(over.id));
			return from === -1 || to === -1 ? s : arrayMove(s, from, to);
		});
	}

	async function save() {
		try {
			await upsert.mutateAsync({
				provider: "github",
				handle: account.handle,
				config: effective.length > 0 ? { pinned: effective } : {},
			});
			// Re-fetch right away so the public profile reflects the change
			// without a separate Sync.
			await refresh.mutateAsync("github");
			toast.success("Featured repositories updated");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Save failed");
		}
	}

	return (
		<section className="mt-7 border-t border-border pt-6">
			<div className="flex flex-wrap items-baseline justify-between gap-3">
				<h3 className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
					Featured repositories
				</h3>
				<p className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
					{mode === "manual"
						? `${selected.length} / ${MAX_FEATURED}`
						: "Synced from GitHub"}
				</p>
			</div>

			<fieldset className="mt-4 flex flex-wrap gap-2">
				<legend className="sr-only">Which repositories to feature</legend>
				{(
					[
						["github", "My GitHub pins"],
						["manual", "Choose manually"],
					] as const
				).map(([value, label]) => (
					<label
						key={value}
						className={`inline-flex h-9 cursor-pointer items-center border px-3 font-mono text-[9px] uppercase tracking-[0.08em] transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring ${
							mode === value
								? "border-foreground text-foreground"
								: "border-border text-muted-foreground hover:text-foreground"
						}`}
					>
						<input
							type="radio"
							name="github-featured-mode"
							value={value}
							checked={mode === value}
							onChange={() => setMode(value)}
							className="sr-only"
						/>
						{label}
					</label>
				))}
			</fieldset>

			{mode === "github" ? (
				<p className="mt-4 max-w-prose text-sm leading-relaxed text-muted-foreground">
					Your profile shows the repositories pinned on your GitHub profile, in
					the same order. With no pins, it shows the ones you pushed to most
					recently.
				</p>
			) : (
				<div className="mt-5 grid gap-6 lg:grid-cols-2">
					<div className="min-w-0">
						<p className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
							Shown on your profile
						</p>
						{selected.length === 0 ? (
							<p className="mt-3 text-sm text-muted-foreground">
								Nothing picked yet — add repositories from the list.
							</p>
						) : (
							<DndContext
								sensors={sensors}
								collisionDetection={closestCenter}
								onDragEnd={onDragEnd}
							>
								<SortableContext
									items={selected}
									strategy={verticalListSortingStrategy}
								>
									<ol className="mt-2">
										{selected.map((slug, i) => (
											<SelectedRepo
												key={slug}
												slug={slug}
												position={i + 1}
												language={byName.get(slug)?.language ?? null}
												onRemove={() => remove(slug)}
											/>
										))}
									</ol>
								</SortableContext>
							</DndContext>
						)}
					</div>

					<div className="min-w-0">
						<label
							htmlFor="github-featured-search"
							className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground"
						>
							Add a repository
						</label>
						<Input
							id="github-featured-search"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search, or owner/repo"
							disabled={full}
							className="mt-2 h-10 w-full min-w-0 rounded-none border-x-0 border-t-0 border-b-border bg-transparent px-0 shadow-none focus-visible:border-brand focus-visible:ring-0"
						/>
						{full ? (
							<p className="mt-3 text-sm text-muted-foreground">
								That's the maximum of {MAX_FEATURED}. Remove one to add another.
							</p>
						) : repos.isPending ? (
							<p className="mt-3 text-sm text-muted-foreground">
								Loading your repositories…
							</p>
						) : repos.isError ? (
							<p className="mt-3 text-sm text-destructive">
								Couldn't load your repositories. You can still add one as
								owner/repo.
							</p>
						) : null}
						{!full && (
							<ul className="mt-2 max-h-72 overflow-y-auto">
								{canAddTyped && (
									<AvailableRepo
										name={trimmed}
										language={null}
										onAdd={() => add(trimmed)}
									/>
								)}
								{available.slice(0, 30).map((r) => (
									<AvailableRepo
										key={r.full_name}
										name={r.full_name}
										language={r.language}
										onAdd={() => add(r.full_name)}
									/>
								))}
							</ul>
						)}
					</div>
				</div>
			)}

			<div className="mt-6 flex items-center gap-3">
				<Button
					onClick={save}
					disabled={busy || !dirty}
					className="h-9 rounded-none bg-foreground px-3 font-mono text-[9px] uppercase tracking-[0.08em] text-background shadow-none transition-transform active:scale-[0.98] hover:bg-brand hover:text-brand-foreground"
				>
					{busy ? "Saving…" : "Save featured"}
				</Button>
				{mode === "manual" && dirty && selected.length === 0 && (
					<p className="text-xs text-muted-foreground">
						Saving with nothing picked goes back to your GitHub pins.
					</p>
				)}
			</div>
		</section>
	);
}

function SelectedRepo({
	slug,
	position,
	language,
	onRemove,
}: {
	slug: string;
	position: number;
	language: string | null;
	onRemove: () => void;
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: slug });

	return (
		<li
			ref={setNodeRef}
			style={{
				transform: CSS.Transform.toString(transform),
				transition,
				zIndex: isDragging ? 10 : undefined,
			}}
			className={`flex items-center gap-2 border-b border-border bg-background py-2 ${
				isDragging ? "shadow-lg" : ""
			}`}
		>
			<button
				type="button"
				{...attributes}
				{...listeners}
				aria-label={`Reorder ${slug}`}
				className="flex h-8 w-8 shrink-0 cursor-grab touch-none items-center justify-center text-muted-foreground transition-colors active:cursor-grabbing hover:text-foreground"
			>
				<SortVerticalIcon className="h-4 w-4" strokeWidth={1.5} />
			</button>
			<span className="w-5 shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
				{String(position).padStart(2, "0")}
			</span>
			<span className="min-w-0 flex-1 truncate font-mono text-sm">{slug}</span>
			{language && (
				<span className="hidden shrink-0 font-mono text-[10px] text-muted-foreground sm:inline">
					{language}
				</span>
			)}
			<button
				type="button"
				onClick={onRemove}
				aria-label={`Remove ${slug}`}
				className="flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-destructive"
			>
				<CloseIcon className="h-4 w-4" strokeWidth={1.5} />
			</button>
		</li>
	);
}

function AvailableRepo({
	name,
	language,
	onAdd,
}: {
	name: string;
	language: string | null;
	onAdd: () => void;
}) {
	return (
		<li>
			<button
				type="button"
				onClick={onAdd}
				className="flex w-full items-center gap-3 border-b border-border py-2.5 text-left transition-colors hover:bg-surface/60"
			>
				<AddIcon
					className="h-4 w-4 shrink-0 text-muted-foreground"
					strokeWidth={1.5}
				/>
				<span className="min-w-0 flex-1 truncate font-mono text-sm">
					{name}
				</span>
				{language && (
					<span className="shrink-0 font-mono text-[10px] text-muted-foreground">
						{language}
					</span>
				)}
			</button>
		</li>
	);
}
