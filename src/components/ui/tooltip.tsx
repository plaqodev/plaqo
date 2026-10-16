import { Tooltip as TooltipPrimitive } from "radix-ui";
import type * as React from "react";

import { cn } from "#/lib/utils.ts";

function TooltipProvider({
	delayDuration = 250,
	skipDelayDuration = 400,
	...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
	return (
		<TooltipPrimitive.Provider
			data-slot="tooltip-provider"
			delayDuration={delayDuration}
			skipDelayDuration={skipDelayDuration}
			{...props}
		/>
	);
}

function Tooltip(props: React.ComponentProps<typeof TooltipPrimitive.Root>) {
	return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

function TooltipTrigger(
	props: React.ComponentProps<typeof TooltipPrimitive.Trigger>,
) {
	return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

// Ink label in mono caps, the same voice as the "01 /" section labels.
// Slides in from the trigger's side; reduced motion keeps only the fade.
function TooltipContent({
	className,
	sideOffset = 8,
	children,
	...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
	return (
		<TooltipPrimitive.Portal>
			<TooltipPrimitive.Content
				data-slot="tooltip-content"
				sideOffset={sideOffset}
				className={cn(
					"z-50 flex items-center gap-2 bg-foreground px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-background",
					"origin-(--radix-tooltip-content-transform-origin) animate-in fade-in-0 duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]",
					"data-[side=right]:slide-in-from-left-1 data-[side=left]:slide-in-from-right-1 data-[side=top]:slide-in-from-bottom-1 data-[side=bottom]:slide-in-from-top-1",
					"data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-100",
					"motion-reduce:slide-in-from-left-0 motion-reduce:slide-in-from-right-0 motion-reduce:slide-in-from-top-0 motion-reduce:slide-in-from-bottom-0",
					className,
				)}
				{...props}
			>
				{children}
			</TooltipPrimitive.Content>
		</TooltipPrimitive.Portal>
	);
}

// Keyboard hint inside a tooltip, e.g. <Kbd>Ctrl B</Kbd>.
function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
	return (
		<kbd
			className={cn(
				"border border-background/25 px-1 py-px font-mono text-[9px] tracking-normal text-background/70",
				className,
			)}
			{...props}
		/>
	);
}

export { Kbd, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
