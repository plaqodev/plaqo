import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth-middleware";

// Called once the OAuth onboarding has claimed a username (and connected
// GitHub when it could). sendWelcomeOnce reads everything from the session's
// user and sends at most once per account, so calling it again is a no-op.
export const sendWelcomeEmail = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.handler(async ({ context }) => {
		const { sendWelcomeOnce } = await import("@/lib/welcome.server");
		await sendWelcomeOnce(context.userId);
		return { ok: true as const };
	});
