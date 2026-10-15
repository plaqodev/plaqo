import {
	DownloadMinimalisticIcon,
	LinkMinimalistic2Icon,
} from "@solar-icons/react/linear";
import posthog from "posthog-js";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { buildQrSvg } from "@/lib/qr";

const PNG_SIZE = 1024;

function download(href: string, filename: string) {
	const a = document.createElement("a");
	a.href = href;
	a.download = filename;
	a.click();
}

// The dashboard's "03 / Share" block, shown once the setup checklist is
// hidden: a branded QR code for the public page, plus copy and download.
export function ShareQr({
	username,
	onShowChecklist,
	accent,
}: {
	username: string;
	onShowChecklist: () => void;
	// Pro bonus: the theme accent recolors the eyes (when dark enough to scan).
	accent?: string | null;
}) {
	// The origin the dashboard is served from: plaqo.dev in production,
	// localhost or a preview URL while developing — the code opens whatever
	// deployment you're looking at. Read after mount: the server only knows
	// its configured SITE_URL, which can differ from the real origin (LAN IP,
	// preview deploy) and would make the hydrated markup disagree.
	const [origin, setOrigin] = useState<string | null>(null);
	useEffect(() => setOrigin(window.location.origin), []);
	const url = origin ? `${origin}/${username}` : null;
	const shownUrl = url?.replace(/^https?:\/\//, "") ?? "";
	const svg = useMemo(
		() => (url ? buildQrSvg(url, { accent }) : ""),
		[url, accent],
	);
	const svgSrc = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
	const filename = `plaqo-${username}-qr`;

	function downloadSvg() {
		if (!url) return;
		const href = URL.createObjectURL(
			new Blob([svg], { type: "image/svg+xml" }),
		);
		download(href, `${filename}.svg`);
		URL.revokeObjectURL(href);
		posthog.capture("qr_downloaded", { format: "svg" });
	}

	// Rasterizes the same SVG at print-friendly size.
	function downloadPng() {
		if (!url) return;
		const img = new Image();
		img.onload = () => {
			const canvas = document.createElement("canvas");
			canvas.width = PNG_SIZE;
			canvas.height = PNG_SIZE;
			canvas.getContext("2d")?.drawImage(img, 0, 0, PNG_SIZE, PNG_SIZE);
			canvas.toBlob((blob) => {
				if (!blob) return;
				const href = URL.createObjectURL(blob);
				download(href, `${filename}.png`);
				URL.revokeObjectURL(href);
			}, "image/png");
		};
		img.src = svgSrc;
		posthog.capture("qr_downloaded", { format: "png" });
	}

	async function copyLink() {
		if (!url) return;
		try {
			await navigator.clipboard.writeText(url);
			toast.success("Link copied");
		} catch {
			toast.error("Couldn't copy the link");
		}
	}

	const action =
		"inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-brand";

	return (
		<section className="py-8 lg:pl-10">
			<p className="font-mono text-[9px] uppercase tracking-[0.12em] text-brand">
				03 / Share
			</p>

			<h2 className="mt-4 font-display text-3xl tracking-[-0.03em]">
				Your QR code
			</h2>

			{/* Paper background in both themes: inverted codes scan poorly. */}
			{url ? (
				<img
					src={svgSrc}
					alt={`QR code that opens ${shownUrl}`}
					width={240}
					height={240}
					className="mt-6 aspect-square w-full max-w-60 border border-border"
				/>
			) : (
				<div className="mt-6 aspect-square w-full max-w-60 animate-pulse border border-border bg-surface" />
			)}

			<div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
				<button type="button" onClick={copyLink} className={action}>
					<LinkMinimalistic2Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
					Copy link
				</button>
				<button type="button" onClick={downloadPng} className={action}>
					<DownloadMinimalisticIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
					PNG
				</button>
				<button type="button" onClick={downloadSvg} className={action}>
					<DownloadMinimalisticIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
					SVG
				</button>
			</div>

			<button
				type="button"
				onClick={onShowChecklist}
				className="mt-8 font-mono text-[9px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
			>
				Show setup checklist
			</button>
		</section>
	);
}
