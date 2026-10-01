import type { Metadata } from "next";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
 ArrowRight,
 BarChart3,
 Bell,
 Building2,
 Check,
 Clock,
 CreditCard,
 Dumbbell,
 FileSpreadsheet,
 HandCoins,
 IndianRupee,
 Languages,
 LockKeyhole,
 MessageCircle,
 Package,
 QrCode,
 RefreshCw,
 ShieldCheck,
 Smartphone,
 Sparkles,
 UserPlus,
 Users,
 Wallet,
 X,
 Zap,
} from "lucide-react";

import { HeroScene } from "@/components/landing/hero-scene";
import { HeroActions, LandingNav } from "@/components/landing/landing-nav";
import { Reveal, TiltCard } from "@/components/landing/motion";
import { ProductTour } from "@/components/landing/product-tour";
import { MobileCtaBar } from "@/components/landing/mobile-cta-bar";
import styles from "@/components/landing/landing.module.css";
import { PRODUCT_LOGO_SRC, PRODUCT_NAME } from "@/lib/brand";
import { LEGAL, LEGAL_LINKS } from "@/lib/legal";
import { PLATFORM_PLANS, SITE, siteUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * The public home page: what the product is, for gym owners searching
 * for gym management software, and the way in for everyone else.
 *
 * A server component end to end -- the copy, the pricing and the FAQ are
 * in the HTML a crawler receives. Only the nav, the reveal-on-scroll and
 * the pointer tilt run in the browser, and the 3D scene is CSS transforms.
 */

export function generateMetadata(): Metadata {
 const origin = siteUrl();
 const title = `${SITE.title} | ${SITE.name}`;
 return {
 metadataBase: origin,
 title: { absolute: title },
 description: SITE.description,
 keywords: [...SITE.keywords],
 alternates: { canonical: "/" },
 openGraph: {
 type: "website",
 url: "/",
 siteName: SITE.name,
 title,
 description: SITE.description,
 locale: SITE.locale,
 },
 twitter: { card: "summary_large_image", title, description: SITE.description },
 robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
 category: "business software",
 };
}

type Feature = {
 icon: LucideIcon;
 title: string;
 body: string;
 gradient: string;
 wide?: boolean;
 /** A wide card's small illustration of the feature. */
 visual?: "membership" | "training" | "reports";
};

/** What fills the extra width of a wide feature card. Decorative. */
function FeatureVisual({ kind }: { kind: NonNullable<Feature["visual"]> }) {
 if (kind === "reports") {
 const bars = [30, 44, 38, 56, 52, 68, 63, 79, 74, 90, 86, 97];
 return (
 <div aria-hidden="true" className="mt-6 flex h-20 items-end gap-1.5 rounded-2xl bg-black/[0.03] p-3 dark:bg-white/[0.04]">
 {bars.map((h, i) => (
 <span key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-blue-500 to-indigo-400" style={{ height: `${h}%` }} />
 ))}
 </div>
 );
 }
 const chips =
 kind === "membership"
 ? [["Freeze", "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300"], ["Extend", "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"], ["Upgrade", "bg-violet-500/15 text-violet-700 dark:text-violet-300"], ["Transfer", "bg-amber-500/15 text-amber-700 dark:text-amber-300"], ["Renew", "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300"]]
 : [["Assign coach", "bg-violet-500/15 text-violet-700 dark:text-violet-300"], ["10-session pack", "bg-orange-500/15 text-orange-700 dark:text-orange-300"], ["Yoga · 7 AM", "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"], ["Leg day plan", "bg-rose-500/15 text-rose-700 dark:text-rose-300"], ["8 of 10 left", "bg-sky-500/15 text-sky-700 dark:text-sky-300"]];
 return (
 <ul aria-hidden="true" className="mt-6 flex flex-wrap gap-2">
 {chips.map(([label, tone]) => (
 <li key={label} className={cn("rounded-full px-3 py-1.5 text-xs font-semibold", tone)}>
 {label}
 </li>
 ))}
 </ul>
 );
}

const FEATURES: Feature[] = [
 {
 icon: Users,
 title: "Members & memberships",
 body: "Sell a plan, then freeze, extend, upgrade, downgrade, transfer or renew it in one tap. Renewals line up with the term before them, and every change is in the audit log.",
 gradient: "from-violet-500 to-fuchsia-500",
 wide: true,
 visual: "membership",
 },
 {
 icon: MessageCircle,
 title: "WhatsApp from your own number",
 body: "Renewal and payment reminders go out on their own, and members get instant answers about plans, fees, timings and classes, in English, Hindi or Hinglish.",
 gradient: "from-emerald-500 to-teal-500",
 },
 {
 icon: Sparkles,
 title: "AI agent",
 body: "Ask in plain words: who is at risk, who owes money, what to do this week. It drafts the action; you approve it.",
 gradient: "from-fuchsia-500 to-rose-500",
 },
 {
 icon: QrCode,
 title: "Attendance & check-in",
 body: "Members check in with a QR code at a kiosk or the front desk, or on a biometric device. Streaks and visit history fill in by themselves.",
 gradient: "from-sky-500 to-cyan-500",
 },
 {
 icon: CreditCard,
 title: "Payments & invoices",
 body: "Record cash, UPI, card and bank transfers. Invoices raise themselves, dues are tracked per member, and receipts reach the member automatically.",
 gradient: "from-amber-400 to-orange-500",
 },
 {
 icon: Dumbbell,
 title: "Personal training & classes",
 body: "Assign coaches, sell PT packages, book sessions and classes, and track every session used. Workout and diet plans go straight to the member's app.",
 gradient: "from-orange-500 to-rose-500",
 wide: true,
 visual: "training",
 },
 {
 icon: HandCoins,
 title: "Staff & payroll",
 body: "Add staff with the right access, run payroll with leave and trainer commissions, and keep every role to its own branch.",
 gradient: "from-indigo-500 to-violet-500",
 },
 {
 icon: Package,
 title: "Inventory & product sales",
 body: "Supplements and merchandise with stock, purchase orders, transfers and low-stock alerts, and every sale counted in revenue.",
 gradient: "from-teal-500 to-emerald-500",
 },
 {
 icon: BarChart3,
 title: "Reports that answer questions",
 body: "Revenue, renewals, churn risk, lead conversion and branch performance on one screen, in your gym's time zone.",
 gradient: "from-blue-500 to-indigo-500",
 wide: true,
 visual: "reports",
 },
];

const AUTOMATIONS = [
 { icon: RefreshCw, title: "Renewal reminders", body: "Before a membership ends, with a tap-to-renew message." },
 { icon: Bell, title: "Payment & invoice reminders", body: "Polite nudges for dues, stopped the moment they pay." },
 { icon: Users, title: "Win back quiet members", body: "When someone stops coming, a message before they leave." },
 { icon: Dumbbell, title: "PT package expiry", body: "So sessions get renewed, not forgotten." },
 { icon: UserPlus, title: "Lead first touch & follow-up", body: "Every enquiry answered and followed up on time." },
 { icon: MessageCircle, title: "Instant replies, day and night", body: "Plans, fees, timings and classes answered from your real data." },
];

const INDIA: { icon: LucideIcon; title: string; body: string; gradient: string }[] = [
 { icon: MessageCircle, title: "WhatsApp-first", body: "Reminders and replies where your members already are, from your own number.", gradient: "from-emerald-500 to-teal-500" },
 { icon: Languages, title: "English, Hindi, Hinglish", body: "\"Fees kitna hai?\" and \"kab khulta hai?\" get an instant answer.", gradient: "from-orange-500 to-rose-500" },
 { icon: IndianRupee, title: "Rupees and UPI", body: "Prices in ₹, and cash, UPI, card or bank transfers recorded in seconds.", gradient: "from-amber-400 to-orange-500" },
 { icon: Clock, title: "Your time zone", body: "Reports, reminders and \"today\" follow your branch's clock, not a server's.", gradient: "from-sky-500 to-indigo-500" },
 { icon: Smartphone, title: "Phone-first", body: "Run the front desk from a phone, and give members an Android and iPhone app.", gradient: "from-violet-500 to-fuchsia-500" },
 { icon: Wallet, title: "Priced for Indian gyms", body: "Start free, then plans from ₹999 a month, billed monthly.", gradient: "from-pink-500 to-rose-500" },
];

const COMPARE: [string, string][] = [
 ["Renewals tracked in a register, and missed", "Renewal reminders go out on WhatsApp by themselves"],
 ["Calling every member about dues", "Dues tracked per member, with automatic payment reminders"],
 ["Answering \"what are the timings?\" all day", "Instant replies to plans, fees, timings and classes"],
 ["Attendance on paper, if at all", "QR and biometric check-in, with streaks and history"],
 ["Spreadsheets for staff salaries", "Payroll with leave and trainer commissions"],
 ["No idea who is about to quit", "Members at risk flagged, with a win-back message ready"],
];

const STEPS = [
 {
 n: "01",
 title: "Create your gym",
 body: "Sign up with your gym's name and email. Add your branches, plans and timings in the setup guide.",
 },
 {
 n: "02",
 title: "Bring your members",
 body: "Import members from a spreadsheet, or add them at the desk. Connect your WhatsApp number.",
 },
 {
 n: "03",
 title: "Let it run",
 body: "Reminders, check-ins, invoices and follow-ups happen on their own. You watch the numbers grow.",
 },
];

const AUDIENCE = [
 "Gyms",
 "Fitness studios",
 "CrossFit boxes",
 "Yoga & Pilates studios",
 "Personal training studios",
 "Multi-branch chains",
 "Martial arts academies",
 "Women-only gyms",
];

const FAQS = [
 {
 q: `What is ${PRODUCT_NAME}?`,
 a: `${PRODUCT_NAME} is gym management software for gyms and fitness studios. It runs memberships and renewals, WhatsApp reminders and AI replies, attendance and check-in, personal training and classes, payments and invoices, staff and payroll, inventory and reports, in one app on the web, iPhone and Android.`,
 },
 {
 q: "Is there a free trial?",
 a: "Yes. Every gym starts on the Free Trial plan, with up to 100 members, one branch and five staff accounts, and no card is needed to sign up. Move to Starter, Professional or Business when you are ready.",
 },
 {
 q: "Can it send WhatsApp messages from my gym's own number?",
 a: "Yes. Connect your gym's WhatsApp number in Settings and renewal reminders, payment reminders and receipts go out from it. Members also get instant replies about plans, fees, timings and classes, in English, Hindi or Hinglish; anything else is passed to your team.",
 },
 {
 q: "Do members get an app?",
 a: "Yes. Members see their plan and days left, check in with a QR code, follow their workout and diet plans and book sessions, on the web, on iPhone from the Home Screen, or in the Android app.",
 },
 {
 q: "Can I manage more than one branch?",
 a: "Yes. Each plan allows several branches, and staff can be limited to their own branch, so a branch manager sees and changes only what is theirs.",
 },
 {
 q: "How do members check in?",
 a: "With a QR code on a check-in kiosk or at the front desk, or on a supported biometric device. Every visit lands in the member's attendance history.",
 },
 {
 q: "Can I import the members I already have?",
 a: "Yes. Download the spreadsheet template, fill it in, and import it. You can export your members the same way whenever you like.",
 },
 {
 q: "Is my gym's data secure?",
 a: "Each gym's data is kept separate from every other gym's, staff only see what their role allows, sign-in supports two-factor authentication, and important changes are kept in an audit log.",
 },
];

function inr(amount: number) {
 return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

function SectionHeading({ eyebrow, title, body, id }: { eyebrow: string; title: string; body?: string; id: string }) {
 return (
 <Reveal className="mx-auto max-w-3xl text-center">
 <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-400">{eyebrow}</p>
 <h2 id={id} className="mt-3 text-balance text-4xl font-bold tracking-[-0.035em] text-foreground sm:text-5xl">
 {title}
 </h2>
 {body ? <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">{body}</p> : null}
 </Reveal>
 );
}

function JsonLd({ data }: { data: unknown }) {
 return (
 <script
 type="application/ld+json"
 dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
 />
 );
}

export default function LandingPage() {
 const origin = siteUrl().toString().replace(/\/$/, "");

 const structuredData = [
 {
 "@context": "https://schema.org",
 "@type": "Organization",
 "@id": `${origin}/#organization`,
 name: PRODUCT_NAME,
 url: origin,
 logo: `${origin}/brand/the-cult-client-512.png`,
 },
 {
 "@context": "https://schema.org",
 "@type": "WebSite",
 "@id": `${origin}/#website`,
 name: PRODUCT_NAME,
 url: origin,
 publisher: { "@id": `${origin}/#organization` },
 inLanguage: "en-IN",
 },
 {
 "@context": "https://schema.org",
 "@type": "SoftwareApplication",
 name: PRODUCT_NAME,
 url: origin,
 applicationCategory: "BusinessApplication",
 applicationSubCategory: "Gym management software",
 operatingSystem: "Web, Android, iOS",
 description: SITE.description,
 publisher: { "@id": `${origin}/#organization` },
 offers: PLATFORM_PLANS.map((plan) => ({
 "@type": "Offer",
 name: plan.name,
 price: plan.pricePerMonth,
 priceCurrency: "INR",
 url: `${origin}/register`,
 ...(plan.pricePerMonth > 0
 ? {
 priceSpecification: {
 "@type": "UnitPriceSpecification",
 price: plan.pricePerMonth,
 priceCurrency: "INR",
 unitCode: "MON",
 billingDuration: "P1M",
 },
 }
 : {}),
 })),
 featureList: FEATURES.map((f) => f.title),
 },
 {
 "@context": "https://schema.org",
 "@type": "FAQPage",
 mainEntity: FAQS.map((f) => ({
 "@type": "Question",
 name: f.q,
 acceptedAnswer: { "@type": "Answer", text: f.a },
 })),
 },
 ];

 return (
 <>
 {/* The Android app opens this address; it belongs on the sign-in
 screen, not a sales page. Capacitor's bridge is on `window` before
 the page runs, so this redirects before anything is painted. */}
 <script
 dangerouslySetInnerHTML={{
 __html: `try{if(window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform())location.replace('/login')}catch(e){}`,
 }}
 />
 <JsonLd data={structuredData} />

 <div className="relative isolate min-h-svh overflow-x-clip bg-[#fbfaff] text-foreground dark:bg-[#0a0a12]">
 {/* Colour, as light behind glass */}
 <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[1500px] overflow-hidden [mask-image:linear-gradient(to_bottom,black_55%,transparent)]">
 <div className={cn("absolute -left-[10%] -top-[10%] size-[620px] rounded-full bg-violet-400/40 blur-[120px] dark:bg-violet-600/30", styles.orb)} />
 <div className={cn("absolute right-[-12%] top-[5%] size-[560px] rounded-full bg-fuchsia-400/35 blur-[120px] dark:bg-fuchsia-600/25", styles.orbAlt)} />
 <div className={cn("absolute left-[20%] top-[45%] size-[520px] rounded-full bg-sky-300/35 blur-[120px] dark:bg-cyan-500/20", styles.orbAlt)} />
 <div className={cn("absolute right-[15%] top-[60%] size-[420px] rounded-full bg-orange-300/35 blur-[120px] dark:bg-orange-500/15", styles.orb)} />
 <div className="absolute inset-0 bg-[radial-gradient(rgba(20,10,60,0.07)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)] dark:bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)]" />
 </div>

 <LandingNav />

 <main id="main">
 {/* ── Hero ───────────────────────────────────────────── */}
 <section id="hero" aria-labelledby="hero-title" className="px-4 pb-10 pt-32 sm:px-6 sm:pt-40">
 <div className="mx-auto max-w-5xl text-center">
 <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-white/70 px-3.5 py-1.5 text-sm font-medium text-violet-700 shadow-sm backdrop-blur dark:bg-white/5 dark:text-violet-300">
 <Zap className="size-4" aria-hidden="true" />
 WhatsApp + AI, built in for Indian gyms
 </p>
 <h1
 id="hero-title"
 className="mx-auto mt-6 max-w-4xl text-balance text-[2.6rem] font-extrabold leading-[1.02] tracking-[-0.045em] text-foreground sm:text-6xl lg:text-7xl"
 >
 Gym management software that{" "}
 <span className={cn("bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-500 bg-clip-text text-transparent", styles.shine)} style={{ backgroundImage: "linear-gradient(90deg,#7c3aed,#d946ef,#f97316,#d946ef,#7c3aed)" }}>
 runs your gym for you
 </span>
 </h1>
 <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
 Memberships, renewals, WhatsApp reminders, check-ins, personal training, payments and staff, in one beautifully simple app. Built for gyms and fitness studios that want more members and fewer spreadsheets.
 </p>
 <div className="mt-9">
 <HeroActions />
 </div>
 <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
 {["Free trial, no card needed", "Web, iPhone & Android", "Your own WhatsApp number"].map((t) => (
 <li key={t} className="flex items-center gap-1.5">
 <Check className="size-4 text-emerald-500" aria-hidden="true" />
 {t}
 </li>
 ))}
 </ul>
 </div>
 <div className="mt-14 sm:mt-16">
 <HeroScene />
 </div>
 </section>

 {/* ── Who it's for ───────────────────────────────────── */}
 <section aria-label="Built for" className="py-10">
 <p className="text-center text-sm font-medium text-muted-foreground">Built for every kind of fitness business</p>
 <div className="relative mt-5 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
 <ul className={cn("flex w-max gap-3", styles.marquee)}>
 {[...AUDIENCE, ...AUDIENCE].map((label, i) => (
 <li
 key={`${label}-${i}`}
 aria-hidden={i >= AUDIENCE.length ? true : undefined}
 className="whitespace-nowrap rounded-full border border-black/5 bg-white/70 px-5 py-2.5 text-sm font-semibold text-foreground/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5"
 >
 {label}
 </li>
 ))}
 </ul>
 </div>
 </section>

 {/* ── Features ───────────────────────────────────────── */}
 <section id="features" aria-labelledby="features-title" className="scroll-mt-24 px-4 py-16 sm:px-6 sm:py-24">
 <SectionHeading
 id="features-title"
 eyebrow="Everything in one place"
 title="One app for the whole gym"
 body="From the first enquiry to the hundredth renewal, every part of running a gym, connected. No more registers, spreadsheets and five different apps."
 />
 <ul className="mx-auto mt-14 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
 {FEATURES.map((f, i) => (
 <Reveal as="li" key={f.title} delay={(i % 3) * 90} className={cn(f.wide && "sm:col-span-2")}>
 <TiltCard className="h-full">
 <article className="group relative h-full overflow-hidden rounded-[28px] border border-black/5 bg-white/75 p-6 shadow-[0_20px_50px_-25px_rgba(30,20,80,0.25)] backdrop-blur-xl sm:p-7 dark:border-white/10 dark:bg-white/[0.04]">
 <div aria-hidden="true" className={cn("pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-gradient-to-br opacity-20 blur-2xl transition duration-500 group-hover:opacity-40", f.gradient)} />
 <div className={styles.tiltInner}>
 <span className={cn("flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg", f.gradient)}>
 <f.icon className="size-6" strokeWidth={2.2} aria-hidden="true" />
 </span>
 <h3 className="mt-5 text-xl font-bold tracking-tight text-foreground">{f.title}</h3>
 <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">{f.body}</p>
 {f.visual ? <FeatureVisual kind={f.visual} /> : null}
 </div>
 </article>
 </TiltCard>
 </Reveal>
 ))}
 </ul>
 </section>

 {/* ── Product tour ───────────────────────────────────── */}
 <section id="tour" aria-labelledby="tour-title" className="scroll-mt-24 px-4 py-16 sm:px-6 sm:py-24">
 <SectionHeading
 id="tour-title"
 eyebrow="Take a look inside"
 title="Designed to feel effortless"
 body="Clean, fast and colourful, on a phone at the front desk or a laptop in the office. Here is what your day looks like."
 />
 <ProductTour />
 </section>

 {/* ── Automation ─────────────────────────────────────── */}
 <section id="automation" aria-labelledby="automation-title" className="scroll-mt-24 px-4 py-16 sm:px-6 sm:py-24">
 <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[40px] bg-[#0d0b1d] px-6 py-16 text-white shadow-2xl sm:px-12 sm:py-20">
 <div aria-hidden="true" className="pointer-events-none absolute inset-0">
 <div className={cn("absolute -left-24 top-0 size-96 rounded-full bg-violet-600/50 blur-[110px]", styles.orb)} />
 <div className={cn("absolute -right-24 bottom-0 size-96 rounded-full bg-emerald-500/35 blur-[110px]", styles.orbAlt)} />
 <div className={cn("absolute left-1/2 top-1/3 size-72 -translate-x-1/2 rounded-full bg-fuchsia-500/30 blur-[100px]", styles.orb)} />
 </div>
 <div className="relative grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
 <Reveal>
 <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">Automation</p>
 <h2 id="automation-title" className="mt-3 text-balance text-4xl font-bold tracking-[-0.035em] sm:text-5xl">
 The follow-ups you never have time for, done for you
 </h2>
 <p className="mt-5 text-pretty text-lg leading-relaxed text-white/70">
 {PRODUCT_NAME} watches every membership, payment and visit, and sends the right WhatsApp message at the right time, from your gym&apos;s own number. Members who opted out are never messaged.
 </p>
 <Link
 href="/register"
 className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 font-semibold text-[#0d0b1d] transition hover:bg-white/90 active:scale-[0.98]"
 >
 Automate my gym
 <ArrowRight className="size-4" aria-hidden="true" />
 </Link>
 </Reveal>
 <ul className="grid gap-3 sm:grid-cols-2">
 {AUTOMATIONS.map((a, i) => (
 <Reveal as="li" key={a.title} delay={i * 70}>
 <div className="h-full rounded-3xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl transition hover:bg-white/[0.1]">
 <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
 <a.icon className="size-5" aria-hidden="true" />
 </span>
 <h3 className="mt-4 font-semibold">{a.title}</h3>
 <p className="mt-1 text-sm leading-relaxed text-white/65">{a.body}</p>
 </div>
 </Reveal>
 ))}
 </ul>
 </div>
 </div>
 </section>

 {/* ── Made for India ─────────────────────────────────── */}
 <section aria-labelledby="india-title" className="px-4 py-16 sm:px-6 sm:py-24">
 <SectionHeading
 id="india-title"
 eyebrow="Made for India"
 title="Built for the way Indian gyms actually run"
 body="Not a foreign tool with rupees bolted on. Gym management software for India, from pricing to payments to the language your members message in."
 />
 <ul className="mx-auto mt-12 grid max-w-6xl grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
 {INDIA.map((item, i) => (
 <Reveal as="li" key={item.title} delay={(i % 3) * 80}>
 <div className="h-full rounded-[24px] border border-black/5 bg-white/75 p-5 backdrop-blur-xl sm:p-6 dark:border-white/10 dark:bg-white/[0.04]">
 <span className={cn("flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md", item.gradient)}>
 <item.icon className="size-5" aria-hidden="true" />
 </span>
 <h3 className="mt-4 font-bold tracking-tight text-foreground sm:text-lg">{item.title}</h3>
 <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">{item.body}</p>
 </div>
 </Reveal>
 ))}
 </ul>
 </section>

 {/* ── Member app & trust ─────────────────────────────── */}
 <section aria-labelledby="apps-title" className="px-4 py-20 sm:px-6 sm:py-24">
 <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-3">
 {[
 {
 icon: Smartphone,
 title: "An app your members love",
 body: "Their plan and days left, QR check-in, workouts, diet plans and sessions, on iPhone, Android and the web.",
 gradient: "from-violet-500 to-fuchsia-500",
 },
 {
 icon: Building2,
 title: "One branch or twenty",
 body: "See every branch together or one at a time, and keep each manager to their own.",
 gradient: "from-sky-500 to-indigo-500",
 },
 {
 icon: ShieldCheck,
 title: "Private and secure",
 body: "Your gym's data stays yours, every role sees only what it should, and two-factor sign-in protects the owner's account.",
 gradient: "from-emerald-500 to-teal-500",
 },
 ].map((card, i) => (
 <Reveal key={card.title} delay={i * 90}>
 <div className="h-full rounded-[28px] border border-black/5 bg-white/75 p-7 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
 <span className={cn("flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg", card.gradient)}>
 <card.icon className="size-6" aria-hidden="true" />
 </span>
 <h2 id={i === 0 ? "apps-title" : undefined} className="mt-5 text-xl font-bold tracking-tight text-foreground">
 {card.title}
 </h2>
 <p className="mt-2 leading-relaxed text-muted-foreground">{card.body}</p>
 </div>
 </Reveal>
 ))}
 </div>
 </section>

 {/* ── How it works ───────────────────────────────────── */}
 <section id="how-it-works" aria-labelledby="how-title" className="scroll-mt-24 px-4 py-16 sm:px-6 sm:py-24">
 <SectionHeading id="how-title" eyebrow="How it works" title="Up and running in an afternoon" />
 <ol className="mx-auto mt-14 grid max-w-5xl gap-4 md:grid-cols-3">
 {STEPS.map((step, i) => (
 <Reveal as="li" key={step.n} delay={i * 110}>
 <div className="relative h-full rounded-[28px] border border-black/5 bg-white/75 p-7 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
 <span className="bg-gradient-to-br from-violet-600 to-orange-500 bg-clip-text text-5xl font-extrabold tracking-tighter text-transparent">
 {step.n}
 </span>
 <h3 className="mt-4 text-xl font-bold tracking-tight text-foreground">{step.title}</h3>
 <p className="mt-2 leading-relaxed text-muted-foreground">{step.body}</p>
 </div>
 </Reveal>
 ))}
 </ol>
 <Reveal className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
 <FileSpreadsheet className="size-4 text-emerald-500" aria-hidden="true" />
 Switching from another software or a register? Import your members from a spreadsheet.
 </Reveal>
 </section>

 {/* ── Before / after ─────────────────────────────────── */}
 <section aria-labelledby="compare-title" className="px-4 py-16 sm:px-6 sm:py-24">
 <SectionHeading id="compare-title" eyebrow="The difference" title="From registers and reminders to running itself" />
 <div className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-2">
 <Reveal>
 <div className="h-full rounded-[28px] border border-black/5 bg-white/60 p-7 dark:border-white/10 dark:bg-white/[0.03]">
 <p className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">Without it</p>
 <ul className="mt-5 space-y-3.5">
 {COMPARE.map(([before]) => (
 <li key={before} className="flex items-start gap-3 text-muted-foreground">
 <X className="mt-0.5 size-5 shrink-0 text-rose-500" aria-hidden="true" />
 {before}
 </li>
 ))}
 </ul>
 </div>
 </Reveal>
 <Reveal delay={120}>
 <div className="relative h-full overflow-hidden rounded-[28px] bg-gradient-to-br from-violet-600 via-fuchsia-600 to-orange-500 p-7 text-white shadow-[0_30px_70px_-25px_rgba(192,38,211,0.6)]">
 <p className="text-sm font-semibold uppercase tracking-[0.14em] text-white/80">With {PRODUCT_NAME}</p>
 <ul className="mt-5 space-y-3.5">
 {COMPARE.map(([, after]) => (
 <li key={after} className="flex items-start gap-3">
 <Check className="mt-0.5 size-5 shrink-0" strokeWidth={3} aria-hidden="true" />
 {after}
 </li>
 ))}
 </ul>
 </div>
 </Reveal>
 </div>
 </section>

 {/* ── Pricing ────────────────────────────────────────── */}
 <section id="pricing" aria-labelledby="pricing-title" className="scroll-mt-24 px-4 py-16 sm:px-6 sm:py-24">
 <SectionHeading
 id="pricing-title"
 eyebrow="Pricing"
 title="Simple pricing that grows with your gym"
 body="Start free. Pay monthly when you're ready, and change plans any time."
 />
 <ul className="mx-auto mt-14 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
 {PLATFORM_PLANS.map((plan, i) => (
 <Reveal as="li" key={plan.key} delay={i * 80}>
 <article
 aria-labelledby={`plan-${plan.key}`}
 className={cn(
 "relative flex h-full flex-col rounded-[28px] border p-6 backdrop-blur-xl",
 plan.highlight
 ? "border-transparent bg-[#0d0b1d] text-white shadow-[0_30px_70px_-25px_rgba(124,58,237,0.7)] ring-2 ring-violet-500"
 : "border-black/5 bg-white/75 dark:border-white/10 dark:bg-white/[0.04]",
 )}
 >
 {plan.highlight ? (
 <span className="absolute -top-3 left-6 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-3 py-1 text-xs font-semibold text-white">
 Most popular
 </span>
 ) : null}
 <h3 id={`plan-${plan.key}`} className="text-lg font-bold tracking-tight">
 {plan.name}
 </h3>
 <p className={cn("mt-1 text-sm", plan.highlight ? "text-white/70" : "text-muted-foreground")}>{plan.blurb}</p>
 <p className="mt-6 flex items-baseline gap-1">
 <span className="text-4xl font-extrabold tracking-tight tabular-nums">
 {plan.pricePerMonth === 0 ? "Free" : inr(plan.pricePerMonth)}
 </span>
 {plan.pricePerMonth > 0 ? (
 <span className={cn("text-sm font-medium", plan.highlight ? "text-white/70" : "text-muted-foreground")}>/month</span>
 ) : null}
 </p>
 <ul className={cn("mt-6 space-y-2.5 text-sm", plan.highlight ? "text-white/85" : "text-foreground/80")}>
 {[
 `Up to ${plan.limits.members.toLocaleString("en-IN")} members`,
 `${plan.limits.branches} branch${plan.limits.branches === 1 ? "" : "es"}`,
 `${plan.limits.staff} staff accounts`,
 `${plan.limits.whatsappMonthly.toLocaleString("en-IN")} WhatsApp messages a month`,
 "Member app, AI agent & reports",
 ].map((line) => (
 <li key={line} className="flex items-start gap-2">
 <Check className={cn("mt-0.5 size-4 shrink-0", plan.highlight ? "text-violet-300" : "text-emerald-500")} aria-hidden="true" />
 {line}
 </li>
 ))}
 </ul>
 <Link
 href="/register"
 aria-label={`${plan.pricePerMonth === 0 ? "Start the free trial" : `Choose ${plan.name}`}`}
 className={cn(
 "mt-8 inline-flex min-h-12 items-center justify-center rounded-full px-5 text-sm font-semibold transition active:scale-[0.98]",
 plan.highlight
 ? "bg-white text-[#0d0b1d] hover:bg-white/90"
 : "bg-foreground text-background hover:opacity-90",
 )}
 >
 {plan.pricePerMonth === 0 ? "Start free" : "Start with a free trial"}
 </Link>
 </article>
 </Reveal>
 ))}
 </ul>
 <p className="mt-6 text-center text-sm text-muted-foreground">Prices in Indian rupees, billed monthly.</p>
 </section>

 {/* ── FAQ ────────────────────────────────────────────── */}
 <section id="faq" aria-labelledby="faq-title" className="scroll-mt-24 px-4 py-16 sm:px-6 sm:py-24">
 <SectionHeading id="faq-title" eyebrow="FAQ" title="Questions gym owners ask" />
 <div className="mx-auto mt-12 max-w-3xl space-y-3">
 {FAQS.map((f, i) => (
 <Reveal key={f.q} delay={Math.min(i, 4) * 50}>
 <details className="group rounded-3xl border border-black/5 bg-white/75 px-6 py-1 backdrop-blur-xl open:shadow-lg dark:border-white/10 dark:bg-white/[0.04]">
 <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-base font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
 <h3 className="text-base font-semibold">{f.q}</h3>
 <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-black/5 text-lg transition group-open:rotate-45 dark:bg-white/10">
 +
 </span>
 </summary>
 <p className="pb-5 pr-10 leading-relaxed text-muted-foreground">{f.a}</p>
 </details>
 </Reveal>
 ))}
 </div>
 </section>

 {/* ── Closing call ───────────────────────────────────── */}
 <section aria-labelledby="cta-title" className="px-4 pb-24 pt-8 sm:px-6">
 <Reveal className="relative mx-auto max-w-5xl overflow-hidden rounded-[40px] bg-gradient-to-br from-violet-600 via-fuchsia-600 to-orange-500 px-6 py-16 text-center text-white shadow-[0_40px_90px_-30px_rgba(192,38,211,0.7)] sm:px-12 sm:py-20">
 <div aria-hidden="true" className={cn("pointer-events-none absolute -right-24 -top-24 size-80 rounded-full border-[40px] border-white/10", styles.ring)} />
 <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-20 size-80 rounded-full bg-white/10 blur-2xl" />
 <h2 id="cta-title" className="relative text-balance text-4xl font-bold tracking-[-0.035em] sm:text-5xl">
 Spend your time on members, not admin
 </h2>
 <p className="relative mx-auto mt-4 max-w-xl text-lg text-white/85">
 Start free today. Your gym can be live with members, plans and WhatsApp in a single afternoon.
 </p>
 <div className="relative mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
 <Link
 href="/register"
 className="inline-flex min-h-[52px] items-center gap-2 rounded-full bg-white px-7 text-base font-semibold text-violet-700 shadow-xl transition hover:bg-white/90 active:scale-[0.98]"
 >
 Start your free trial
 <ArrowRight className="size-4" aria-hidden="true" />
 </Link>
 <Link
 href="/login"
 className="inline-flex min-h-[52px] items-center rounded-full border border-white/40 px-7 text-base font-semibold text-white transition hover:bg-white/10"
 >
 Sign in
 </Link>
 </div>
 </Reveal>
 </section>
 </main>

 <MobileCtaBar startAfterId="hero" stopAtId="cta-title" />

 <footer className="border-t border-black/5 px-4 pb-24 pt-14 sm:px-6 sm:pb-12 dark:border-white/10">
 <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
 <div className="max-w-sm">
 <div className="flex items-center gap-2">
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img src={PRODUCT_LOGO_SRC} alt="" width={32} height={32} className="rounded-full" loading="lazy" />
 <span className="font-bold tracking-tight">{PRODUCT_NAME}</span>
 </div>
 <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
 Gym management software with WhatsApp automation and AI, for gyms and fitness studios across India.
 </p>
 {LEGAL.supportEmail ? (
 <a href={`mailto:${LEGAL.supportEmail}`} className="mt-4 inline-block text-sm font-medium text-violet-600 hover:underline dark:text-violet-400">
 {LEGAL.supportEmail}
 </a>
 ) : null}
 </div>
 {[
 {
 title: "Product",
 links: [
 { href: "#features", label: "Features" },
 { href: "#tour", label: "Product tour" },
 { href: "#automation", label: "WhatsApp automation" },
 { href: "#pricing", label: "Pricing" },
 { href: "#faq", label: "FAQ" },
 ],
 },
 {
 title: "Get started",
 links: [
 { href: "/register", label: "Start free trial" },
 { href: "/login", label: "Sign in" },
 { href: "/contact", label: "Contact us" },
 ],
 },
 { title: "Legal", links: LEGAL_LINKS.filter((l) => l.href !== "/contact").map((l) => ({ href: l.href, label: l.label })) },
 ].map((col) => (
 <nav key={col.title} aria-label={col.title}>
 <p className="text-sm font-semibold text-foreground">{col.title}</p>
 <ul className="mt-3 space-y-2.5 text-sm">
 {col.links.map((link) => (
 <li key={link.href}>
 {link.href.startsWith("#") ? (
 <a href={link.href} className="text-muted-foreground transition hover:text-foreground">{link.label}</a>
 ) : (
 <Link href={link.href} className="text-muted-foreground transition hover:text-foreground">{link.label}</Link>
 )}
 </li>
 ))}
 </ul>
 </nav>
 ))}
 </div>
 <div className="mx-auto mt-12 flex max-w-6xl flex-col gap-2 border-t border-black/5 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
 <span className="flex items-center gap-2">
 <LockKeyhole className="size-3.5" aria-hidden="true" />© {new Date().getFullYear()} {PRODUCT_NAME}. All rights reserved.
 </span>
 <span>Made in India 🇮🇳 for gyms everywhere</span>
 </div>
 </footer>
 </div>
 </>
 );
}
