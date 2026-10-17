import { useEffect, useState } from "react";
import { parseThemeConfig, type ThemeV2 } from "@/lib/theme-config";

// The theme editor shows the real public page in an iframe
// (/username?preview=true) and streams the unsaved theme into it with
// postMessage. Same origin only: both ends check event.origin, and the
// page only listens to its own parent window.
export const PREVIEW_THEME_MESSAGE = "plaqo:theme-preview";
export const PREVIEW_READY_MESSAGE = "plaqo:preview-ready";

// Public page side. Returns the draft theme from the editor, or null when
// the page isn't a preview (then the saved theme applies as usual).
export function usePreviewTheme(enabled: boolean): ThemeV2 | null {
	const [theme, setTheme] = useState<ThemeV2 | null>(null);

	useEffect(() => {
		if (!enabled || window.parent === window) return;

		function onMessage(event: MessageEvent) {
			if (event.origin !== window.location.origin) return;
			if (event.source !== window.parent) return;
			if (event.data?.type !== PREVIEW_THEME_MESSAGE) return;
			setTheme(parseThemeConfig(event.data.theme));
		}

		// Links stay inert: a click would navigate the preview away from
		// the page being styled. Stopped in the capture phase on document,
		// before React's root listener, so link click tracking never runs.
		function onClick(event: MouseEvent) {
			if ((event.target as Element | null)?.closest("a")) {
				event.preventDefault();
				event.stopPropagation();
			}
		}

		window.addEventListener("message", onMessage);
		document.addEventListener("click", onClick, true);
		window.parent.postMessage(
			{ type: PREVIEW_READY_MESSAGE },
			window.location.origin,
		);

		return () => {
			window.removeEventListener("message", onMessage);
			document.removeEventListener("click", onClick, true);
		};
	}, [enabled]);

	return theme;
}
