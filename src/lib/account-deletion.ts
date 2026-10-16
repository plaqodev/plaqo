import { z } from "zod";

// Shared by the Settings form and deleteMyAccount. The answer goes to the
// support inbox, so it decides what gets built or fixed next.
export const DELETION_REASONS = [
	{ value: "not-using", label: "I don't use it anymore" },
	{ value: "missing-feature", label: "It's missing something I need" },
	{ value: "price", label: "Pro costs too much" },
	{ value: "switching", label: "I'm moving to another tool" },
	{ value: "privacy", label: "Privacy concerns" },
	{ value: "other", label: "Something else" },
] as const;

export type DeletionReason = (typeof DELETION_REASONS)[number]["value"];

export const deleteAccountInput = z.object({
	reason: z.enum(
		DELETION_REASONS.map((r) => r.value) as [
			DeletionReason,
			...DeletionReason[],
		],
	),
	details: z.string().trim().max(1000).optional(),
	username: z.string().trim().min(1).max(60),
	// Absent for accounts that only sign in with GitHub or Google: those
	// need a recent sign-in instead (better-auth's freshAge).
	password: z.string().min(1).max(256).optional(),
});

export type DeleteAccountInput = z.infer<typeof deleteAccountInput>;
