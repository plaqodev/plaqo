import { escapeHtml } from "@/lib/email";
import { SITE_DOMAIN, SITE_URL } from "@/lib/site";

// The editorial look of the site, translated into what email clients obey:
// table layout, inline styles, no web fonts (Newsreader/Instrument/Geist are
// named first for clients that have them, then safe fallbacks).
const PAPER = "#F4F1EB";
const INK = "#181714";
const MUTED = "#6b665d";
const HAIRLINE = "#d9d3c7";
const VERMILION = "#9D3326";

const SERIF = "Newsreader, Georgia, 'Times New Roman', serif";
const SANS =
	"'Instrument Sans', -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const MONO = "'Geist Mono', ui-monospace, Menlo, Consolas, monospace";

// A paragraph is either plain text (escaped here) or { html } for copy that
// carries inline markup the template itself wrote — never user input.
export type Paragraph = string | { html: string };

export type EmailContent = {
	// Inbox preview line, after the subject. Hidden in the body.
	preheader: string;
	// Mono label above the title, e.g. "01 / Account".
	eyebrow: string;
	title: string;
	paragraphs: Paragraph[];
	cta?: { label: string; url: string };
	// Small print under the button (expiry, "didn't ask for this?").
	note?: string;
	// Human sign-off, after the button: "Francis, founder of plaqo".
	signoff?: string;
};

function paragraphHtml(p: Paragraph) {
	return typeof p === "string" ? escapeHtml(p) : p.html;
}

function paragraphText(p: Paragraph) {
	return typeof p === "string"
		? p
		: p.html
				.replace(/<br\s*\/?>/g, "\n")
				.replace(/<[^>]+>/g, "")
				.replace(/&amp;/g, "&")
				.replace(/&lt;/g, "<")
				.replace(/&gt;/g, ">")
				.replace(/&quot;/g, '"');
}

export function renderEmail(content: EmailContent): {
	html: string;
	text: string;
} {
	const { preheader, eyebrow, title, paragraphs, cta, note, signoff } = content;
	const logo = `${SITE_URL}/favicon-96.png`;

	const body = paragraphs
		.map(
			(p) =>
				`<p style="margin:0 0 16px;font-family:${SANS};font-size:15px;line-height:1.6;color:${INK};">${paragraphHtml(p)}</p>`,
		)
		.join("");

	const button = cta
		? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px;"><tr><td style="background:${INK};" bgcolor="${INK}"><a href="${escapeHtml(cta.url)}" style="display:inline-block;padding:14px 22px;font-family:${MONO};font-size:12px;letter-spacing:1px;text-transform:uppercase;color:${PAPER};text-decoration:none;">${escapeHtml(cta.label)} &rarr;</a></td></tr></table>
<p style="margin:12px 0 0;font-family:${MONO};font-size:11px;line-height:1.5;color:${MUTED};word-break:break-all;">Or open: <a href="${escapeHtml(cta.url)}" style="color:${MUTED};">${escapeHtml(cta.url)}</a></p>`
		: "";

	const signoffHtml = signoff
		? `<p style="margin:28px 0 0;font-family:${SANS};font-size:15px;line-height:1.6;color:${INK};">${escapeHtml(signoff)}</p>`
		: "";

	const noteHtml = note
		? `<p style="margin:24px 0 0;font-family:${SANS};font-size:13px;line-height:1.5;color:${MUTED};">${escapeHtml(note)}</p>`
		: "";

	const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${PAPER};" bgcolor="${PAPER}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${PAPER};">${escapeHtml(preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${PAPER};" bgcolor="${PAPER}">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
<tr><td style="padding:0 0 24px;border-bottom:1px solid ${HAIRLINE};">
<a href="${SITE_URL}" style="text-decoration:none;color:${INK};"><img src="${logo}" width="22" height="22" alt="" style="vertical-align:middle;border:0;"> <span style="font-family:${SERIF};font-size:20px;font-weight:600;letter-spacing:-0.5px;vertical-align:middle;color:${INK};">plaqo</span></a>
</td></tr>
<tr><td style="padding:36px 0 0;">
<p style="margin:0 0 18px;font-family:${MONO};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${VERMILION};">${escapeHtml(eyebrow)}</p>
<h1 style="margin:0 0 24px;font-family:${SERIF};font-size:34px;line-height:1.1;font-weight:500;letter-spacing:-0.8px;color:${INK};">${escapeHtml(title)}</h1>
${body}${button}${signoffHtml}${noteHtml}
</td></tr>
<tr><td style="padding:40px 0 0;">
<p style="margin:0;padding-top:20px;border-top:1px solid ${HAIRLINE};font-family:${MONO};font-size:11px;line-height:1.6;letter-spacing:0.5px;color:${MUTED};">plaqo &middot; Developer identity, in one address.<br><a href="${SITE_URL}" style="color:${MUTED};">${SITE_DOMAIN}</a> &middot; Reply to this email to reach a person.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

	const text = [
		eyebrow.toUpperCase(),
		"",
		title,
		"",
		...paragraphs.flatMap((p) => [paragraphText(p), ""]),
		...(cta ? [`${cta.label}: ${cta.url}`, ""] : []),
		...(signoff ? [signoff, ""] : []),
		...(note ? [note, ""] : []),
		"--",
		`plaqo · ${SITE_DOMAIN}`,
		"Reply to this email to reach a person.",
	].join("\n");

	return { html, text };
}
