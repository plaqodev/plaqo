import { lt } from "drizzle-orm";
import { db } from "@/db/index";
import { linkClicks, pageViews } from "@/db/schema";

// The privacy policy promises profile analytics (hashed IP, device,
// referrer) are kept for 12 months. Runs from the daily cron.
export const ANALYTICS_RETENTION_DAYS = 365;

export async function purgeExpiredAnalytics(now = new Date()) {
	const cutoff = new Date(
		now.getTime() - ANALYTICS_RETENTION_DAYS * 24 * 60 * 60 * 1000,
	);
	const [views, clicks] = await Promise.all([
		db
			.delete(pageViews)
			.where(lt(pageViews.viewedAt, cutoff))
			.returning({ id: pageViews.id }),
		db
			.delete(linkClicks)
			.where(lt(linkClicks.clickedAt, cutoff))
			.returning({ id: linkClicks.id }),
	]);
	return { views: views.length, clicks: clicks.length };
}
