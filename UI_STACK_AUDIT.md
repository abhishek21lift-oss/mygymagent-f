# UI Stack Audit — Premium Apple Soft-Glass Bento Capability

Date: 2026-10-05 · Scope: `mygymagent-f/` (Next.js frontend only) · Backend untouched.

## 1. Current stack (verified from `package.json`, `components.json`, `globals.css`, `src/`)

- Framework: Next.js `16.3.5` (App Router), React `19.2.8`, TypeScript `^5`, Node `>=22`.
- Styling: Tailwind CSS `v4` (`@tailwindcss/postcss ^4`, `@import "tailwindcss"` in `src/app/globals.css`), `tw-animate-css ^1.4.0`, CSS-first `@theme inline` tokens, no `tailwind.config.*` (v4 idiom).
- Component system: shadcn/ui `new-york` (`components.json`, `rsc:true`, `cssVariables:true`, `baseColor: neutral`, `iconLibrary: lucide`), 17 primitives in `src/components/ui/` (button, card, dialog, dropdown-menu, popover, select, tabs, table, avatar, badge, input, textarea, label, checkbox, switch, separator, skeleton, sonner).
- Radix: avatar, checkbox, dialog, dropdown-menu, label, popover, select, separator, slot, switch, tabs, tooltip, visually-hidden.
- Icons: `lucide-react ^1.33.0`. Forms: `react-hook-form ^7.85.0` + `@hookform/resolvers ^5.9.1` + `zod ^3.25.76`. Data: `@tanstack/react-query ^5.101.4`, `@tanstack/react-table ^8.21.3`. Theme: `next-themes ^0.4.6`. Utils: `clsx ^2.1.1` + `tailwind-merge ^3.6.0` (`cn()` in `src/lib/utils.ts`) + `class-variance-authority ^0.7.1`. Toast: `sonner`. Package manager: npm (`package-lock.json`).
- Design-token architecture: **already premium and complete** — `src/app/globals.css` (~2340 lines, "THE CULT CLIENT — Aurora"):
  - 8 section accents × 6 roles each (`solid/ink/tint/wash/fill/on` + 2 gradient stops): indigo, violet, rose, emerald, amber, cyan, blue, orange — all contrast-solved (ink ≥6.1:1 on wash, fill ≥5.5:1 under white label), light + dark re-solved.
  - Surfaces: `--background/--card/--popover`, `--surface-raised/sunken/hover`, glass materials (`--glass-bg/bg-strong/bg-thin/border/blur:30px/saturate:190%` + top-highlight + sheen).
  - Radius scale `--radius:1rem` → `xs–3xl`; shadows `flat/card/raised/float/popover`; motion `--duration-fast:180ms/base:280ms/slow:420ms`, `--ease-out` + `--ease-spring`; header/sidebar/content layout tokens.
  - `data-section` / `data-nav-accent` inheritance from `src/lib/section-accent.ts` + `src/lib/nav-config.ts`; literal Tailwind scales re-pointed at tokens so ~3400 hardcoded utilities are theme-aware.
  - Component CSS: `[data-slot=card/button/input/tabs/badge/dialog/switch/table/checkbox]`, `.glass/.glass-strong`, `.page-ambient` aurora canvas, `.hero-banner` (+eyebrow/title/subtitle/actions/btn-primary/ghost), `.kpi-card` (+icon-tile/trend/value/label/hint + 8 `kpi-*` accent overrides), `.donut-*`, `.quick-action-tile`, `.category-header`, `.stat-tile`, `.panel-premium`, `.nav-item-premium`, `.bottom-tab-pill`, focus-visible ring, custom scrollbars, full `prefers-reduced-motion` coverage.
- Existing reusable components (all accessible, all token-driven):
  - `shared/page-hero.tsx` → GradientHero. `shared/stat-card.tsx` → KpiCard/MetricCard (loading/error/zero-suppression/trend). `shared/donut-chart.tsx` → pure-SVG DonutMetric (no chart dep, role=img + legend). `shared/panel.tsx` → Panel + MetricStrip (responsive 2-col-mobile grid). `shared/empty-state.tsx`, `shared/data-state.tsx`, `command-center/command-card.tsx` (+StatusChip/Metric/QueueBars), `app-shell/bottom-tab-bar.tsx` (floating frosted iOS bar + safe-area + raised AI disc), `app-shell/sidebar-nav.tsx`, `app-shell/topbar.tsx`, `app-shell/mobile-nav.tsx`, `ui/button.tsx` (gradient default/destructive), `ui/card.tsx` (slot-styled).
- Charts: **no chart dependency** — `src/lib/revenue-chart.ts` (pure SVG helpers) + `donut-chart.tsx`. `command-card.tsx:187` explicitly documents why recharts was rejected for 4 rectangles.
- Animation: **no JS animation library** — CSS transitions on cards/buttons/tabs + `@keyframes` (brand-neon, shimmer, tour-in) + `tw-animate-css` utilities. Deliberate 180–320ms decelerate curve.
- Navigation: desktop frosted sidebar rail + mobile floating `BottomTabBar` + drawer (`data-surface="rail"`); safe-area `pb-[calc(env(safe-area-inset-bottom)+…)]`; touch targets `min-h-14`.
- Theming: light-first + full `.dark` re-solve; `next-themes`; `color-scheme` set per theme.

## 2. Capability matrix vs. target (A–L)

| # | Capability | Status | Evidence |
|---|------------|--------|----------|
| A | Design system | ✅ DONE | tokens + slots + utilities in `globals.css` |
| B | Glass surfaces | ✅ DONE | `.glass`, rail/topbar/dialog/drawer/bottom-bar |
| C | Bento layouts | ⚠️ PARTIAL | `MetricStrip` grid exists; no named `BentoGrid/BentoCard` primitive |
| D | Gradient backgrounds | ✅ DONE | `.hero-banner`, kpi caps/tiles, brand-grad, auth-canvas |
| E | Soft shadows | ✅ DONE | 4-level layered shadows, never harsh |
| F | Responsive cards | ✅ DONE | `MetricStrip` 2-col mobile; container-query kpi-value (`10cqi`); `overflow-x:auto` tables |
| G | Charts | ✅ SUFFICIENT | SVG donut + revenue-chart; no donut/radial gap for current needs |
| H | Animations | ✅ SUFFICIENT | CSS transitions + keyframes; no JS lib needed for subtle Apple-like motion |
| I | Mobile navigation | ✅ DONE | floating `BottomTabBar` + drawer + safe-area |
| J | Command-center dashboards | ✅ DONE | `CommandCard`, `StatCard`, `Panel`, dashboard page |
| K | Accessibility | ✅ DONE | focus-visible ring, semantic h1/h2, aria labels, reduced-motion, 44px+ targets, contrast-solved tokens |
| L | Dark/light architecture | ✅ DONE | dual-theme tokens, next-themes, inverted scales |

## 3. Missing capabilities (only the gaps)

1. Named bento primitives (`BentoGrid`/`BentoCard`) — layout pattern exists (`MetricStrip`), name does not.
2. Named glass/gradient atoms (`GlassCard`, `GradientIcon`, `QuickActionCard`, `SectionHeader`) — CSS exists (`.glass`, `.kpi-icon-tile`, `.quick-action-tile`, `.section-title`), no typed wrappers.
3. Single-value radial progress (`ProgressRing`/`DonutMetric`) — `DonutChart` is multi-segment only.
4. One TS token map so future pages reference tokens by name instead of hardcoding (`src/lib/design-tokens.ts` — planned, zero-runtime).

## 4. Recommended libraries: NONE

Every CORE/LAYOUT/ANIMATION/CHART/FORM/UTILITY slot in the request is already filled by an installed equivalent. Installing anything would duplicate a working system.

## 5. Libraries NOT required (do not install)

- `framer-motion` / `motion` — CSS transitions + keyframes already deliver the specified subtle/fast motion; a spring runtime adds bundle + hydration risk for zero visual gain.
- `recharts` / `chart.js` / `visx` — current dataviz is 1 donut + sparkline-scale SVGs; a chart lib is justified only when a page needs axes/tooltips/composed charts.
- Any new component library, icon library (`lucide-react` covers), form library (RHF+Zod covers), or `tailwind.config` tooling (v4 CSS-first is correct).

## 6. Compatibility risks

- Tailwind v4 (no config file) — correct as-is; do NOT add `tailwind.config.js` (breaks v4 `@theme`).
- Next 16 + React 19 — new deps must support React 19; avoided entirely by adding zero deps.
- `components.json` (`css` → `src/app/globals.css`, neutral/new-york) — preserved; no overwrite.
- shadcn slot-CSS pattern (`[data-slot=card]` styles every hand-rolled section) — new primitives must emit the same `data-slot`s, not new class islands.
- Dark-mode contrast — any new surface must use existing tokens, never hardcoded hex.

## 7. Recommended implementation architecture (what Phase 3–4 will do)

- `src/lib/design-tokens.ts` — typed, zero-runtime reference to the CSS variables (accents, surfaces, radii, shadows, blur, gradients, motion). No values duplicated.
- `src/components/shared/bento.tsx` — `BentoGrid`, `BentoCard`, `GlassCard`, `GradientIcon`, `QuickActionCard`, `SectionHeader`: thin wrappers over `cn()` + existing slots/classes. Variants via `cva`, accents via existing `kpi-*` classes.
- `src/components/shared/progress-ring.tsx` — single-ring SVG reusing `--section`/token colors, `role="img"`, reduced-motion safe (no animation, just stroke).
- Zero `package.json` changes. Zero `globals.css` token changes (append nothing; reuse).
