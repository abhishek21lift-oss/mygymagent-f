# SEO Audit — THE CULT CLIENT (mygymagent.tech)

_Audited 8 October 2026 against `main` @ `3a04a9a` (frontend) and `56ec543` (API)._

## Status

Fixed on branch `claude/project-seo-audit-o45rid` (checked against a fresh production build):

- **P0 1:** `/register`, `/login` and `/forgot-password` have their own titles and descriptions;
  `/register` and `/login` have canonicals; `/register` and `/forgot-password` render a real
  `<h1>`. `/login` already had one, but it renders client-side, behind its `useSearchParams`
  Suspense boundary. Google renders JS, so it still sees it.
- **P0 2:** the OG image is served as a JPEG, 458 KB → 53 KB.
- **P0 3:** root `title.template` (`%s · THE CULT CLIENT`); canonicals on all public pages.
- **P0 4:** meta description is now 152 characters.
- **P0 5:** `/contact` description copy fixed.
- **P1 8 (part):** `/forgot-password` is `noindex`.
- **P1 12:** the API sends `X-Robots-Tag: noindex, nofollow` (in `mygymagent-b`).
- **P2 17 (part):** `<html lang="en-IN">`.

Everything else below is still open.

## How this was audited

- Read every public route, the metadata files (`layout.tsx`, `page.tsx`, `robots.ts`, `sitemap.ts`,
  `manifest.ts`, `opengraph-image.tsx`, `src/lib/site.ts`) and the deploy config.
- Ran a production build (`next build && next start`) and fetched each public URL with `curl`, so
  everything below about titles, tags and headers comes from the HTML a crawler actually gets.
- The live site (`mygymagent.tech`) could not be reached from the audit environment. Anything that
  depends on the production server (www/http redirects, env vars set on the VPS) is marked
  **verify on prod**.

## What the project is

- **Product:** THE CULT CLIENT, a multi-tenant gym management SaaS for Indian gyms and studios
  (memberships, WhatsApp reminders and AI replies, attendance/kiosk, PT, billing, payroll,
  inventory, member portal and trainer app).
- **`mygymagent-f`:** Next.js 16 App Router frontend, deployed by Docker to a VPS
  (`.github/workflows/deploy.yml`). It holds the public marketing site and the signed-in app.
- **`mygymagent-b`:** NestJS + Prisma API. It is a JSON API only and has no crawlable pages, so
  nearly all SEO work is in the frontend.
- **Public, indexable surface today:** `/` (landing), `/register`, `/login`, `/privacy`, `/terms`,
  `/refund-policy`, `/contact`. Everything else is behind sign-in.

## Scorecard

| Area | Status | Notes |
|---|---|---|
| Rendering / crawlability | ✅ Strong | The landing page is a static server component. All copy, pricing and FAQ are in the HTML (about 2,000 words). Reveal animations start visible, so crawlers never see hidden content. |
| Landing page metadata | ✅ Strong | Unique title (60 chars), canonical, OG and Twitter cards, a 1200×630 OG image, `en_IN` locale. |
| Structured data | 🟡 Good | Organization, WebSite, SoftwareApplication (with INR offers) and FAQPage. Missing `sameAs` and `contactPoint`. Since 2023 Google shows FAQ rich results only for government and health sites, so FAQPage gives no visible SERP benefit. |
| robots.txt / sitemap | 🟡 Good | Private routes are disallowed and a sitemap is advertised. `/login` is in the sitemap, `/forgot-password` is neither listed nor blocked, and there are no `lastModified` dates. |
| Secondary pages metadata | 🔴 Weak | `/register`, `/login` and `/forgot-password` use the generic site title and have **no `<h1>`**. No page except `/` has a canonical. |
| Social sharing (WhatsApp) | 🔴 Issue | The OG image is **458 KB**. WhatsApp is widely reported to drop link-preview images over about 300 KB, and WhatsApp is this product's main channel. |
| Performance / Core Web Vitals | 🟡 OK | No webfont, static HTML, `s-maxage` caching. About 245 KB gzipped JS on the landing page, because the whole app's providers load there. Heavy CSS blur and infinite animations will be slow on low-end Android phones. |
| Content depth / keyword coverage | 🔴 Main gap | One page targets about 11 head keywords. There are no feature, use-case, comparison, city or blog pages, no testimonials and no case studies. |
| Brand / entity | 🟡 Risk | The brand is "THE CULT CLIENT" but the domain is `mygymagent.tech`. Brand searches for "cult" compete with cult.fit. |
| Measurement | 🔴 Missing | No analytics and no Search Console verification. The current CSP would also block GA4 / GTM. |

---

## Findings and fixes, by priority

### P0 — Fix now (small code changes, real impact)

**1. `/register` has no title, description, canonical or `<h1>`.**
This is the main conversion page and is priority 0.8 in the sitemap, yet it is served as
`<title>THE CULT CLIENT</title>` with the generic description *"AI-driven gym management and
personal training platform"*. `/login` and `/forgot-password` have the same problem. All three pages
are `"use client"`, so they cannot export `metadata` themselves.
*Fix:* add a small server `layout.tsx` in each route folder (e.g. `src/app/(auth)/register/layout.tsx`)
that exports `metadata`:
- `/register`: title "Start your free gym software trial", a ~150-character description,
  `alternates.canonical: "/register"`.
- `/login`: title "Sign in", canonical.
- `/forgot-password`: `robots: { index: false }`.

Also render the card title on these pages as a real `<h1>` (today it is a `CardTitle` div).

**2. Shrink the OG image below ~300 KB.**
`/opengraph-image` is a 458 KB PNG. Links shared on WhatsApp, the channel these gym owners live on,
may show no preview image.
*Fix:* reduce the gradient complexity, or render it once to an optimised JPEG / WebP in `public/`
and point `openGraph.images` at that file. Target under 200 KB.

**3. Add a root title template and a canonical on every public page.**
The root layout sets `title: PRODUCT_NAME` with no template, so every page builds its title by hand
(`Privacy Policy · THE CULT CLIENT`). Only `/` has a canonical. `site.ts` notes that the app
answers on more than one host (the VPS and Vercel previews), so the legal and auth pages can be
indexed under duplicate hosts.
*Fix:* in `src/app/layout.tsx` use
`title: { default: PRODUCT_NAME, template: "%s · THE CULT CLIENT" }`, and give each public page
`alternates: { canonical: "/<path>" }`.

**4. Shorten the meta description.**
`SITE.description` is 233 characters, and Google cuts at about 155–160. Lead with the value and the
keyword. For example:
> "Gym management software for Indian gyms: memberships, WhatsApp renewal reminders, QR check-in,
> PT, payments and payroll in one app. Free trial, no card."

**5. Copy fix on `/contact`:** the description reads *"How to reach the THE CULT CLIENT team."*
(doubled "the").

### P1 — This month (technical hygiene)

**6. Legal and contact pages: fill in the business details (verify on prod).**
When the `NEXT_PUBLIC_LEGAL_*` env vars are unset, `/privacy`, `/terms` and `/contact` render
visible "[company name — to be published]" markers. For a SaaS that takes payments, a real company
name, address, email and phone are trust (E-E-A-T) signals. Razorpay and other payment gateways
also check them during KYC. Confirm they are set on the VPS build.

**7. Make the landing page lighter.**
- `src/app/layout.tsx` wraps every route, including the marketing page, in
  `QueryProvider` + `AuthProvider` + `Toaster`. Each anonymous visit to `/` therefore makes a
  cross-origin auth bootstrap call and downloads app-only code (about 245 KB gzipped JS in total).
  Move those providers into the `(app)`, `(auth)`, `portal` and `trainer` layouts, and keep the
  landing page's client code to the nav, `Reveal` and the tour.
- The landing page has 4–6 elements with `blur-[110–120px]` sized 400–620 px, many
  `backdrop-blur-xl` cards and several infinite animations (marquee, orbs, shine, sway). These are
  costly to paint on the ₹8–15k Android phones many gym owners use. Pause animations off-screen,
  reduce blur radius on mobile, and check INP and LCP in PageSpeed Insights (mobile).

**8. Sitemap and robots tidy-up.**
- Add `lastModified` to sitemap entries (Google uses it; it ignores `priority` and `changefreq`).
- Consider dropping `/login` from the sitemap; it has no search value beyond brand navigation,
  which Google finds anyway.
- Add `/forgot-password` to `PRIVATE_PATH_PREFIXES`, or mark it `noindex` (pick one: a page blocked
  in robots.txt cannot have its `noindex` read).
- The `Host:` line in robots.txt is ignored by Google and Bing (only Yandex reads it). It is
  harmless and can be left in.

**9. Strengthen structured data.**
- Organization: add `sameAs` (Play Store listing, Instagram, LinkedIn, YouTube), `contactPoint`
  (support phone/email from `LEGAL`) and `address` once these are public.
- SoftwareApplication: link the Android app (`installUrl` / `downloadUrl` to Play Store). Only add
  `aggregateRating` / `review` when there are **real** reviews; fabricated ratings risk a manual
  action.
- Keep FAQPage (it still helps AI answers and Bing), but do not expect FAQ rich results in Google.

**10. Set up measurement before content work.**
- Verify the domain in **Google Search Console** and **Bing Webmaster Tools** (DNS verification
  needs no code), then submit `/sitemap.xml`.
- Add privacy-friendly analytics (Plausible, Umami or GA4). The current CSP in `next.config.ts`
  allows scripts only from `self`, cdnjs and Facebook, so GA4 / GTM would be **silently blocked**
  until `script-src` and `connect-src` are updated.
- Track `/register` completions as the conversion goal.

**11. Host consolidation (verify on prod).** Confirm the VPS reverse proxy sends a single 301 from
`http://`, `www.` and the raw IP to `https://mygymagent.tech/`. The README says Vercel while
`deploy.yml` deploys to a VPS. If any Vercel deployment still serves production traffic, its
`vercel.json` sets `Cache-Control: private, no-store` on all HTML, landing page included, which
disables CDN caching.

**12. Keep the API out of the index.** `mygymagent-b` sends no `X-Robots-Tag`. Add
`X-Robots-Tag: noindex, nofollow` globally (one line in `main.ts` next to helmet) or serve a
`Disallow: /` robots.txt, so `api.*` URLs never appear in results.

### P2 — Growth (content and authority: where rankings actually come from)

The technical base is above average. The ceiling now is **content breadth and authority**. The
site is a single page competing for "gym management software India" against established players
(FitnessForce, Gymshim, WellnessLiving, Zenoti, Gymdesk) that each have hundreds of indexed pages,
reviews and backlinks.

**13. Build a page per search intent, not one page for all of them.**

| Page type | Example URLs | Target queries |
|---|---|---|
| Feature pages | `/features/whatsapp-reminders`, `/features/attendance-qr-checkin`, `/features/personal-training`, `/features/gym-billing`, `/features/member-app` | "gym WhatsApp reminder software", "gym attendance system QR", "PT management software" |
| Use-case pages | `/for/yoga-studios`, `/for/crossfit-boxes`, `/for/pt-studios`, `/for/multi-branch-gyms` | "yoga studio management software India" |
| Standalone pricing | `/pricing` | "gym software price", "gym management software cost India" |
| Comparison / alternatives | `/compare/excel-vs-gym-software`, `/alternatives/<competitor>` | "<competitor> alternative", high buying intent |
| Hindi landing | `/hi` with `hreflang` en-IN / hi-IN | "जिम मैनेजमेंट सॉफ्टवेयर": low competition, fits the Hinglish positioning |
| City pages (careful) | `/gym-software/kanpur`, `/delhi`, … | Only with real local proof (local customers, testimonials); otherwise these are thin doorway pages |

`FEATURES`, `INDIA` and `FAQS` in `page.tsx` are already good seeds for these pages. Move them into
`src/lib/site.ts` or MDX so the landing page and the feature pages share one source.

**14. A resources / blog section written by practitioners.**
Gym-owner problems with real search volume: *"how to reduce gym member churn"*, *"gym membership
renewal WhatsApp message templates"*, *"how to price PT packages"*, *"gym SOPs for front desk"*,
*"how to start a gym in India: costs and licences"*. Bylines from a working, certified trainer and
competitive lifter (author pages with credentials) are exactly the first-hand **Experience /
Expertise** Google's quality guidelines reward, and most software competitors cannot match it.

**15. Free tools as link magnets.** A *gym membership fee & renewal calculator*, a *PT package
pricing calculator*, or a downloadable *WhatsApp template pack* earn natural backlinks and capture
top-of-funnel owners.

**16. Proof and off-site authority.**
- Case study from a real gym already on the platform (members imported, renewals recovered,
  hours saved), with the gym's permission.
- Listings on **Capterra / G2 / GetApp** and Indian directories (**SoftwareSuggest, Techjockey**),
  which rank on page 1 for most "best gym software India" queries.
- A Google Business Profile for the company, a Play Store listing with a full description linking
  back, and YouTube walkthroughs (they also show up in Google video results).

**17. Brand clarity.** "THE CULT CLIENT" on `mygymagent.tech` splits brand signals, and "cult" is
strongly associated with cult.fit in India. Decide on one name/domain pairing. If the brand stays,
consider securing a matching domain and 301-ing to it, and use consistent casing ("The Cult
Client") in titles, since all-caps in SERP titles reads as shouting and may be rewritten by Google.
Also set `<html lang="en-IN">` to match the `en_IN` / `en-IN` already used in OG and JSON-LD.

---

## Already done well (keep these)

- Static server-rendered landing page, with all content in the HTML (comments in `page.tsx` and
  `motion.tsx` show this was deliberate).
- `robots.ts`, `sitemap.ts` and `siteUrl()` driven from one source (`src/lib/site.ts`), with a
  fixed canonical origin regardless of host.
- Title of 60 characters, keyword-first, brand last.
- JSON-LD with real INR prices that mirror the `subscription_plans` table.
- One `<h1>`, a logical h2/h3 outline, `alt` on every image, semantic `<main>`, `<nav>` and
  `<footer>`.
- Custom 404 returns a real **404 status** with `noindex`.
- No webfont, so no layout shift from font loading; the logo uses `next/image` with `priority`.
- Kiosk is `noindex`; private app routes are disallowed in robots.txt.
- PWA manifest and icons (installable; helps app-like engagement).
- Strong security headers (HSTS preload, CSP, `X-Frame-Options`), which are a mild trust signal.

## Suggested order of work

1. P0 items 1–5: about half a day, all in `mygymagent-f`.
2. Search Console + Bing + analytics (item 10), so the impact of everything after is measurable.
3. P1 items 6–9, 11, 12.
4. `/pricing` and the first 3 feature pages, then the Hindi page, then publish one blog post a week.
5. Reviews, directory listings and a case study, running in parallel.
