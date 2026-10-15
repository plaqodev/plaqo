import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

// Invented handles — none of them belong to a real profile.
const HANDLES = [
	"your-handle",
	"maria-dev",
	"kenji",
	"amara-builds",
	"lucas-codes",
	"ines",
	"devon-rs",
];

const TYPE_MS = 85;
const DELETE_MS = 45;
const HOLD_MS = 1800;
const GAP_MS = 350;

// Types a handle, holds it, deletes it, moves on to the next one. Starts on
// "your-handle" and only begins cycling after mount, so the server render and
// the first client render match. Reduced motion keeps the static handle.
export function HandleTypewriter() {
	const reduceMotion = useReducedMotion();
	const [index, setIndex] = useState(0);
	const [length, setLength] = useState(HANDLES[0].length);
	const [deleting, setDeleting] = useState(false);
	const [started, setStarted] = useState(false);

	useEffect(() => {
		if (reduceMotion) return;
		const id = setTimeout(() => setStarted(true), HOLD_MS);
		return () => clearTimeout(id);
	}, [reduceMotion]);

	useEffect(() => {
		if (!started || reduceMotion) return;
		const word = HANDLES[index];

		if (!deleting && length === word.length) {
			const id = setTimeout(() => setDeleting(true), HOLD_MS);
			return () => clearTimeout(id);
		}
		if (deleting && length === 0) {
			const id = setTimeout(() => {
				setDeleting(false);
				setIndex((i) => (i + 1) % HANDLES.length);
			}, GAP_MS);
			return () => clearTimeout(id);
		}
		const id = setTimeout(
			() => setLength((l) => l + (deleting ? -1 : 1)),
			deleting ? DELETE_MS : TYPE_MS,
		);
		return () => clearTimeout(id);
	}, [started, reduceMotion, index, length, deleting]);

	return (
		<>
			<span className="sr-only">your-handle</span>
			<span aria-hidden="true" className="text-foreground">
				{HANDLES[index].slice(0, length)}
				<span className="ml-px inline-block h-[1.05em] w-[0.5em] translate-y-[0.15em] bg-brand motion-safe:animate-pulse" />
			</span>
		</>
	);
}
