# UI Visual QA Report — Pixel-Polish Pass (all 8 pages)

Date: 2026-10-05. Scope: presentation only. No browser/backend available — see §Browser.

## Executive Summary

Audited all 8 migrated pages + shared primitives against the 12 QA targets (A–L). Found 5 real inconsistencies (1×P1, 4×P2), fixed 4, deliberately skipped 1 (documented). No P0 issues: no overflow, no unreadable text, no broken responsive behavior, no a11y regressions. Radii, typography, shadows, glass, motion all flow from the token layer and were already consistent.

## Pages Audited

Overview `/dashboard` · Users `/staff` · Studios `/branches` · Revenue `/billing` · Operations `/attendance` · AI `/ai` · Security `/settings/security` · Control `/settings`.

## Visual Issues Found & Fixed

| # | Page | Component | Problem | Severity | Fix | Why |
|---|---|---|---|---|---|---|
| 1 | All (QuickActionCard) | badge + label | Absolute count badge could slide under long labels on narrow 2-col tiles | P1 | Text span gets `pr-10` when badge present (`bento.tsx`) | Guarantees no overlap at 320px without changing tile size |
| 2 | Operations | board rows | `text-stone-900` (not bridge-covered) + redundant `dark:` override | P1 | → `text-foreground` | Single token, correct in both themes |
| 3 | Studios | contact icons | Dead `text-cyan-600` class alongside winning `section-ink` inline style | P2 | Removed dead class | One color source per element |
| 4 | AI | aside glow orb | Hardcoded `bg-cyan-400/20` on violet gradient card | P2 | → `bg-white/20` | Decorative light stays token-pure |
| — | Overview | priorities tile | Hand-rolled gradient tile duplicates GradientIcon | P2 | SKIPPED | Tile is already token-pure (`--a-*-grad` + white); replacement churned against unfamiliar indentation twice with zero visual delta. Candidates for a future dedupe pass. |

## Deliberately left alone (audited, no change)

- `rounded-lg` on buttons/controls/alerts/tabs = 16px via the radius scale — intentional, matches token hierarchy (cards 2xl/3xl).
- `btn-sheen` class is undefined in CSS (dead) — zero visual effect; removing touches 6+ lines across pages for no gain. Future cleanup.
- Dashboard mixes `category-header` (KPI groups) + `SectionHeader` (sections) — two systemic patterns for two hierarchy levels, not drift.
- Jump-to 7-tile orphan (3+3+1) mirrors the reference's own 7 categories; no fake 8th tile invented.
- Donut sizes 140 (dashboard) vs 160 (staff) — intentional hierarchy (card vs feature visual).
- `dark:` overrides that duplicate token behavior — harmless, not worth churn risk.

## Responsive QA (structural, per breakpoint)

- 320/360/375/390/414: 2-col bento everywhere (`grid-cols-2` base), tiles `min-h-11`, badge overlap fixed (#1), donut stacks above text (staff), roster/tables use built-in mobile cards, bottom bar + safe-area intact. No fixed widths introduced; no horizontal overflow vectors found in source.
- 768: `sm:`/`lg:` step-ups verified in class strings (bento 3-col at lg, KPI 4-col at xl, charts 1.4fr/1fr at xl).
- 1024/1280/1440/1920: max-width content column + sidebar rail unchanged; whitespace generous via existing gaps.
- Tables: DataTable `overflow-x-auto` container + mobile cards preserved on all directory pages.

## Accessibility QA

- Links stay links, buttons stay buttons (prompts → QuickActionCard render `button` with `aria-label`; tiles render `Link` with `aria-label`).
- Headings hierarchy unchanged; sections labeled; donut/bubbles keep `role="img"`/labels; badge text lives inside the link's accessible name.
- Focus-visible, contrast (solved token pairs), reduced-motion all inherited — no new animation added.

## Performance QA

- Zero new dependencies, zero new client boundaries, zero new CSS architecture (4 class-level edits + 1 span class). No new queries or re-renders (badge padding is static markup).

## Validation

- Typecheck: PASS (exit 0) · Lint: PASS (exit 0, 53 pre-existing warnings, 0 errors) · Tests: 356/356 PASS, 48 suites (exit 0) · Build: PASS (exit 0, 82/82 pages)

## Files Changed (this pass)

- MODIFIED: `src/components/shared/bento.tsx` (badge padding), `src/app/(app)/attendance/page.tsx` (foreground rows), `src/app/(app)/branches/page.tsx` (dead class), `src/app/(app)/ai/page.tsx` (orb).
- Prior phases: 8 migrated pages + 3 infra files (unchanged by this pass except bento.tsx).

## Safety Verification

- Backend untouched · Database untouched · APIs untouched · Auth untouched · Permissions untouched · Business logic untouched · No fake data introduced · No dependencies added. Confirmed via `git status` (frontend-only files) + diff grep (no query/mutation/permission/href changes).

## Remaining Limitations

- Pixel-level browser QA was unavailable; visual validation is structural only. No screenshots taken, no pixel-perfect claims.
- Live-data states (populated tables, charts with values) verified via unit tests, not eyes.
