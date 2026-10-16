import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";

export const Route = createFileRoute("/privacy")({
	head: () => ({
		meta: [
			{ title: "Privacy Policy — plaqo" },
			{
				name: "description",
				content: "How plaqo collects, uses, and protects your data.",
			},
		],
	}),
	component: PrivacyPage,
});

const EFFECTIVE_DATE = "October 16, 2026";
const CONTACT_EMAIL = "support@plaqo.dev";

function Section({ title, children }: { title: string; children: ReactNode }) {
	return (
		<section className="border-t border-border py-10 first:border-t-0 first:pt-0">
			<h2 className="font-display text-2xl tracking-[-0.02em] sm:text-3xl">
				{title}
			</h2>
			<div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
				{children}
			</div>
		</section>
	);
}

function PrivacyPage() {
	return (
		<div className="min-h-dvh bg-background text-foreground">
			<Header />

			<main className="mx-auto max-w-editorial px-5 py-24 sm:px-8 sm:py-32">
				<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand">
					Legal
				</p>

				<h1 className="mt-6 max-w-2xl font-display text-5xl leading-[0.95] tracking-[-0.04em] sm:text-6xl">
					Privacy Policy.
				</h1>

				<p className="mt-6 max-w-lg text-sm leading-relaxed text-muted-foreground">
					Effective {EFFECTIVE_DATE}. This describes what plaqo collects, why,
					and what control you have over it.
				</p>

				<div className="mt-16">
					<Section title="Who this is">
						<p>
							plaqo (plaqo.dev) is a developer profile and link-in-bio tool
							operated by Francis Castillo Cruz, an individual developer — not a
							registered company. This policy covers the plaqo dashboard, public
							profile pages (plaqo.dev/username), and the marketing site.
						</p>
						<p>
							For anything in this policy, or to exercise any of the rights
							below, email{" "}
							<a
								href={`mailto:${CONTACT_EMAIL}`}
								className="text-foreground underline decoration-border underline-offset-4 hover:decoration-brand"
							>
								{CONTACT_EMAIL}
							</a>
							.
						</p>
					</Section>

					<Section title="Information we collect">
						<p>
							<strong className="text-foreground">Account information.</strong>{" "}
							When you sign up, we collect your name, email address, and a
							password (if you use email/password) — or, if you sign in with
							GitHub or Google, the name, email, and avatar your OAuth provider
							shares with us. You choose a username, which becomes your public
							profile address.
						</p>
						<p>
							When you sign in with GitHub or Google, we also store the access
							token that provider gives us, encrypted. We use the GitHub token
							only to connect your GitHub account to your profile when you sign
							up, so you don't have to type your username again. Neither token
							is ever sent to your browser or shared.
						</p>
						<p>
							<strong className="text-foreground">Email confirmation.</strong>{" "}
							We email you a link to confirm your address. Confirming it is
							required before you can pay for Pro, so receipts, refunds and
							billing notices reach you.
						</p>
						<p>
							<strong className="text-foreground">Profile content.</strong>{" "}
							Anything you add to build your profile — bio, location, primary
							language, seniority, availability for hire, website, links,
							projects, code snippets, articles, talks, support/donation links,
							and theme settings (including custom CSS, on the Pro plan). Your
							profile page is public by design: everything here is meant to be
							visible to anyone who visits your plaqo URL.
						</p>
						<p>
							If you turn on{" "}
							<strong className="text-foreground">Discover</strong> (off by
							default), your profile also appears in the public directory at
							plaqo.dev/discover, searchable by stack, seniority, availability
							and country. Turn it off at any time and it leaves the directory.
						</p>
						<p>
							<strong className="text-foreground">
								Connected accounts (integrations).
							</strong>{" "}
							plaqo can display live stats from other services on your profile.
							Most integrations (GitHub, GitLab, Dev.to, Medium, Stack Overflow,
							WakaTime, LeetCode, npm, Bluesky, Mastodon, Docker Hub, YouTube,
							Hugging Face) only need the public username you type in — we fetch
							publicly available data from that service's own API and cache it.
							We don't authenticate as you or store a password or token for
							these.
						</p>
						<p>
							Three integrations — Product Hunt, Dribbble, and Pinterest — work
							differently: their APIs only expose your own content when you
							connect via OAuth, so we store an access token (and refresh token,
							if the service issues one) after you authorize the connection.
							That token is used only to fetch your own posts, shots, or pins
							for display on your profile — never to act on your behalf
							otherwise, and never shared with anyone else.
						</p>
						<p>
							<strong className="text-foreground">Billing.</strong> If you
							upgrade to Pro, Dodo Payments runs the checkout as merchant of
							record: they collect your payment details, billing address and any
							tax information, under their own privacy policy. We store a Dodo
							customer ID, your plan, and the status of your subscription
							(active, renewed, payment failed, cancelled). We never see or
							store your card number.
						</p>
						<p>
							<strong className="text-foreground">
								Contact form and support.
							</strong>{" "}
							If you email us or use the contact form, we keep your name, email,
							and message to respond to you. They live in our support inbox,
							hosted by Zoho Mail. If you delete your account, the reason you
							pick reaches the same inbox along with your username.
						</p>
						<p>
							<strong className="text-foreground">Avatar images.</strong>{" "}
							Profile pictures you upload are stored on Cloudflare R2, our file
							storage provider.
						</p>
					</Section>

					<Section title="Information we collect automatically">
						<p>
							<strong className="text-foreground">
								Profile visit analytics.
							</strong>{" "}
							When someone views a public plaqo profile or clicks a link on one,
							we log: a hashed version of the visitor's IP address (we never
							store the raw IP; it's run through SHA-256 with a secret salt that
							changes every week, so it can't be reversed and the same visitor
							can only be recognized within that week), a coarse
							device/browser/OS category parsed from the user agent, country
							(from a CDN header, not precise location), the referring page, and
							which link was clicked. This exists so profile owners can see
							aggregate traffic to their own page — we don't use it to build a
							profile of individual visitors.
						</p>
						<p>
							<strong className="text-foreground">Session cookies.</strong> When
							you sign in, we set a session cookie so you stay logged in. The
							session record includes your IP address and user agent, used only
							to detect suspicious activity (like a login from an unexpected
							location).
						</p>
						<p>
							<strong className="text-foreground">Security logs.</strong>{" "}
							Sign-ins, password changes, blocked requests and similar security
							events are logged with the IP address involved, to detect and stop
							abuse. Our host, Vercel, keeps these logs for a limited period and
							then deletes them. To limit how often forms can be sent, we also
							store a keyed hash of your IP address, never the IP itself.
						</p>
						<p>
							<strong className="text-foreground">Product analytics.</strong> We
							use PostHog to understand how people use plaqo (which pages get
							visited, which features get used). PostHog only builds a full
							identity profile for signed-in users; anonymous visitors are not
							persistently tracked across sessions.
						</p>
					</Section>

					<Section title="How we use your information">
						<ul className="list-disc space-y-2 pl-5">
							<li>To create and run your plaqo account and public profile.</li>
							<li>To fetch and display data from services you've connected.</li>
							<li>To process Pro subscription payments.</li>
							<li>
								To send account and billing emails: email confirmation, password
								reset, a welcome email, and notices about your Pro plan
								(welcome, a failed payment, the plan ending). We don't send
								marketing emails or newsletters.
							</li>
							<li>To respond to support requests.</li>
							<li>
								To keep the service secure — detecting abuse, fraud, or
								unauthorized access.
							</li>
							<li>
								To understand usage patterns and improve plaqo (product
								analytics).
							</li>
							<li>To comply with legal obligations.</li>
						</ul>
						<p>We do not sell your personal information, ever.</p>
					</Section>

					<Section title="Who we share information with">
						<p>
							We don't sell or rent your data. We share it only with the service
							providers that make plaqo work, each only for the purpose below:
						</p>
						<ul className="list-disc space-y-2 pl-5">
							<li>
								<strong className="text-foreground">Neon</strong> — hosts our
								Postgres database (all account and profile data).
							</li>
							<li>
								<strong className="text-foreground">Vercel</strong> — hosts the
								application, runs our scheduled jobs and keeps server and
								security logs.
							</li>
							<li>
								<strong className="text-foreground">Cloudflare R2</strong> —
								stores uploaded avatar images.
							</li>
							<li>
								<strong className="text-foreground">Resend</strong> — sends our
								account and billing emails (listed above).
							</li>
							<li>
								<strong className="text-foreground">Zoho Mail</strong> — hosts
								our support inbox: contact form messages and your replies to our
								emails.
							</li>
							<li>
								<strong className="text-foreground">Dodo Payments</strong> —
								merchant of record for Pro: checkout, payments, invoices, taxes
								and refunds.
							</li>
							<li>
								<strong className="text-foreground">PostHog</strong> — product
								analytics.
							</li>
							<li>
								<strong className="text-foreground">
									GitHub, Google, Product Hunt, Dribbble, Pinterest
								</strong>{" "}
								— OAuth sign-in or, for the last three, the connected-account
								flow described above.
							</li>
							<li>
								<strong className="text-foreground">
									The other services you connect
								</strong>{" "}
								(GitLab, Dev.to, Medium, Stack Overflow, WakaTime, LeetCode,
								npm, Bluesky, Mastodon, Docker Hub, YouTube, Hugging Face) — we
								send them only the public username you provide, to fetch your
								public data from their API.
							</li>
						</ul>
						<p>
							We may also disclose information if required by law, or to protect
							the rights, property, or safety of plaqo, our users, or the
							public.
						</p>
					</Section>

					<Section title="Where your data lives">
						<p>
							plaqo and the providers listed above operate infrastructure in the
							United States. If you're accessing plaqo from outside the US, your
							information is processed there. Transfers from the EU and UK are
							covered by the Standard Contractual Clauses in each provider's
							data processing agreement.
						</p>
					</Section>

					<Section title="How long we keep your data">
						<ul className="list-disc space-y-2 pl-5">
							<li>
								Account and profile data: kept as long as your account exists.
							</li>
							<li>
								Deleting your account (Settings → Delete your account) removes
								your account, profile, content, integrations, cached data from
								connected services, your page's analytics and your avatar right
								away. Dodo keeps its own billing records as the law requires.
								Product analytics events in PostHog aren't removed
								automatically; email us and we'll delete them.
							</li>
							<li>
								Profile visit analytics (hashed IP, device, referrer): deleted
								automatically after 12 months.
							</li>
							<li>
								Contact form messages: kept for as long as needed to resolve
								your request, generally no more than 2 years.
							</li>
						</ul>
					</Section>

					<Section title="Your rights">
						<p>
							Depending on where you live, you may have the right to access,
							correct, delete, or export your data, or to object to or restrict
							certain processing. To exercise any of these, email{" "}
							<a
								href={`mailto:${CONTACT_EMAIL}`}
								className="text-foreground underline decoration-border underline-offset-4 hover:decoration-brand"
							>
								{CONTACT_EMAIL}
							</a>
							. We'll respond within 30 days.
						</p>
						<p>
							You can also edit or delete your profile content from the
							dashboard at any time, disconnect any integration, and delete your
							whole account from Settings.
						</p>
						<p>
							For EU and UK users, the legal bases we rely on are: providing the
							service you signed up for (your account, profile, integrations,
							payments and account emails); our legitimate interest in keeping
							plaqo secure and in showing profile owners their own traffic
							(security logs, profile analytics); and your consent for product
							analytics (PostHog), which you can withdraw at any time.
						</p>
						<p>
							If you're in the EU/UK and believe we haven't addressed your
							concern, you have the right to lodge a complaint with your local
							data protection authority.
						</p>
					</Section>

					<Section title="Cookies">
						<p>
							We use a session cookie (to keep you signed in) and a short-lived
							cookie during the OAuth connection flow for Product Hunt,
							Dribbble, and Pinterest (to prevent cross-site request forgery —
							it's deleted immediately after the connection completes). Both are
							strictly necessary — the site doesn't work without them, so
							they're not something you can opt out of.
						</p>
						<p>
							We also save a few preferences in your browser's local storage,
							not in cookies: light or dark mode, the plan you picked before
							signing up, and whether you hid the setup checklist. They never
							leave your browser.
						</p>
						<p>
							Product analytics (PostHog) is different: it only runs if you
							accept it in the cookie banner shown on your first visit. Nothing
							is captured before you choose, and you can change your mind at any
							time by clearing your browser's site data for plaqo.dev. We don't
							use advertising or cross-site tracking cookies at all.
						</p>
					</Section>

					<Section title="Security">
						<p>
							We use industry-standard measures to protect your data: encrypted
							connections (HTTPS) everywhere, hashed passwords, OAuth tokens
							stored server-side and never exposed to the browser, and IP
							addresses hashed with a rotating salt for analytics rather than
							stored raw. No system is 100% secure, but if we ever discover a
							breach affecting your data, we'll notify you.
						</p>
					</Section>

					<Section title="Children's privacy">
						<p>
							plaqo is not directed at children under 13, and we don't knowingly
							collect data from them. If you believe a child has created an
							account, email us and we'll delete it.
						</p>
					</Section>

					<Section title="Changes to this policy">
						<p>
							If we make a material change to this policy, we'll update the
							effective date above and, for significant changes, notify you by
							email.
						</p>
					</Section>

					<Section title="Contact">
						<p>
							Questions about this policy or your data:{" "}
							<a
								href={`mailto:${CONTACT_EMAIL}`}
								className="text-foreground underline decoration-border underline-offset-4 hover:decoration-brand"
							>
								{CONTACT_EMAIL}
							</a>
							.
						</p>
					</Section>
				</div>
			</main>

			<Footer />
		</div>
	);
}
