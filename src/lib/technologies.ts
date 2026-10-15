import { LANGUAGES } from "@/lib/languages";

// Sugerencias para el autocompletado del campo "Technologies" en
// /dashboard/profile (Be Discoverable) — no es una lista cerrada, el campo
// sigue aceptando cualquier texto libre, esto solo evita que la gente escriba
// "React" y "react.js" como dos tags distintos.
export const TECHNOLOGY_SUGGESTIONS = [
	// Frontend
	"React",
	"Vue",
	"Angular",
	"Svelte",
	"SolidJS",
	"Next.js",
	"Nuxt",
	"Remix",
	"Astro",
	"Qwik",
	"HTML",
	"CSS",
	"Tailwind CSS",
	"Sass",
	"Redux",
	"Zustand",
	"Vite",
	"Webpack",
	"TanStack Start",
	"TanStack Router",
	"TanStack Query",
	"TanStack Form",
	"shadcn/ui",
	"Radix UI",
	"Motion",

	// Backend / runtimes
	"Node.js",
	"Deno",
	"Bun",
	"Express",
	"Hono",
	"Fastify",
	"NestJS",
	"Django",
	"Flask",
	"FastAPI",
	"Ruby on Rails",
	"Laravel",
	"Spring Boot",
	"ASP.NET",
	"Phoenix",
	"Gin",

	// Mobile
	"React Native",
	"Flutter",
	"SwiftUI",
	"Jetpack Compose",
	"Ionic",

	// Databases
	"PostgreSQL",
	"MySQL",
	"SQLite",
	"MongoDB",
	"Redis",
	"Cassandra",
	"DynamoDB",
	"Elasticsearch",
	"Neo4j",
	"CockroachDB",
	"PlanetScale",

	// Data access
	"Prisma",
	"Drizzle",
	"TypeORM",
	"Sequelize",
	"SQLAlchemy",
	"Mongoose",
	"GraphQL",
	"tRPC",
	"Better Auth",
	"REST",
	"gRPC",
	"Apollo",

	// Platforms / infra
	"Docker",
	"Kubernetes",
	"Terraform",
	"Ansible",
	"AWS",
	"Google Cloud",
	"Azure",
	"Vercel",
	"Netlify",
	"Cloudflare",
	"Firebase",
	"Supabase",
	"Nginx",
	"Linux",
	"GitHub Actions",
	"CircleCI",
	"Jenkins",

	// Testing
	"Jest",
	"Vitest",
	"Cypress",
	"Playwright",
	"Selenium",
	"JUnit",
	"PyTest",

	// AI / ML / data
	"TensorFlow",
	"PyTorch",
	"scikit-learn",
	"Pandas",
	"NumPy",
	"Hugging Face",
	"LangChain",
	"OpenAI API",

	// Messaging
	"Kafka",
	"RabbitMQ",
	"WebSockets",

	// Tools
	"Git",
	"Figma",
	"Postman",

	// Game dev
	"Unity",
	"Unreal Engine",
	"Godot",

	// Web3
	"Solidity",
	"Ethereum",
	"Web3.js",

	// CMS
	"WordPress",
	"Contentful",
	"Sanity",
	"Strapi",
];

// Casing/punctuation-insensitive key: "tanstack router", "TanstackRouter" and
// "TanStack-Router" all collapse to the same key. + and # survive so C++ and
// C# don't collide with C.
function techKey(value: string): string {
	return value.toLowerCase().replace(/[^a-z0-9+#]/g, "");
}

// Short forms people type that don't collapse to the canonical key on their own.
const ALIASES: Record<string, string> = {
	ts: "TypeScript",
	js: "JavaScript",
	node: "Node.js",
	next: "Next.js",
	vue: "Vue",
	vuejs: "Vue",
	reactjs: "React",
	postgres: "PostgreSQL",
	tailwind: "Tailwind CSS",
	k8s: "Kubernetes",
	gcp: "Google Cloud",
	shadcn: "shadcn/ui",
	framermotion: "Motion",
	drizzleorm: "Drizzle",
	reactquery: "TanStack Query",
};

const CANONICAL = new Map<string, string>(
	[...LANGUAGES, ...TECHNOLOGY_SUGGESTIONS].map((name) => [
		techKey(name),
		name,
	]),
);

// Maps a free-text technology tag to its canonical spelling when we know it
// ("typescript" → "TypeScript"); unknown tags are returned trimmed, as typed.
export function canonicalTech(value: string): string {
	const trimmed = value.trim();
	const key = techKey(trimmed);
	return CANONICAL.get(key) ?? ALIASES[key] ?? trimmed;
}

// canonicalTech over a whole list, dropping blanks and the duplicates that
// canonicalizing can create ("typescript" + "TypeScript").
export function canonicalTechList(values: readonly string[]): string[] {
	const seen = new Set<string>();
	const out: string[] = [];
	for (const value of values) {
		const name = canonicalTech(value);
		const key = name.toLowerCase();
		if (!name || seen.has(key)) continue;
		seen.add(key);
		out.push(name);
	}
	return out;
}
