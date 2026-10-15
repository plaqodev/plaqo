// Shared by every "claim your profile" button on the landing page: focus the
// CTA's username field inside the tap itself (iOS only raises the keyboard
// for focus() during the user gesture), then bring it to the middle of the
// screen.
export function focusClaimField(reduceMotion: boolean | null) {
	const input = document.getElementById("cta-username");
	if (!input) return;
	input.focus({ preventScroll: true });
	input.scrollIntoView({
		behavior: reduceMotion ? "auto" : "smooth",
		block: "center",
	});
	history.replaceState(null, "", "#cta");
}
