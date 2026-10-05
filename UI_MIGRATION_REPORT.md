# UI Migration Report — Soft-Glass Bento Production Migration

## 1. Pages migrated

- OVERVIEW (`/dashboard`): DONE, validated. See per-page table below.
- Users / Studios / Revenue / Operations / AI / Security / Control: NOT STARTED (awaiting instruction).

## 2. Components reused

`PageHero`, `StatCard`, `DonutChart`, `Panel` patterns, `BentoGrid`, `QuickActionCard`, `SectionHeader`, `Button`, `Card`, `Skeleton`, `EmptyState`, `ErrorState`, `Select`, `BottomTabBar` (untouched), `CommandCard` (untouched).

## 3. Components created

- `QuickActionCard` `badge` prop (backward-compatible count/status pill; used by Jump-to tiles).
- No other new components — composition over rewriting.

## 4. Design tokens reused

`--a-{blue,cyan,emerald,violet,orange,rose,indigo}` accents + grad stops, `--radius-2xl`, `--shadow-card/raised`, glass tokens (via existing classes), `kpi-*` accent classes, `var(--section-*)` donut colors. Zero hardcoded colors introduced; 8 hardcoded `oklch()` values removed.

## 5. Reference characteristics implemented (Overview)

- Bento "Jump to" navigation: 7 color-coded tiles (Branches blue, Members cyan, Revenue emerald, AI violet, Operations orange, Security rose, Control indigo) with gradient icon tiles, titles, descriptions, live count badges.
- 2-column mobile bento, 3-column desktop bento.
- KPI grids, gradient hero, donut, quick actions retained in the same language.

## 6. Responsive behavior

`BentoGrid` columns=3 → `grid-cols-2 lg:grid-cols-3`; KPI grids `grid-cols-2 xl:grid-cols-4`; `min-w-0`/`truncate` guards; badge `absolute` inside `relative overflow-hidden` tile; 44px+ touch targets (`min-h-11`); bottom nav + safe-area untouched. Structural QA done; live-device screenshots blocked (no backend in this env — only login/loading states render).

## 7. Accessibility

New tiles are real `Link`s with `aria-label`s inside a labeled `section`; badge is decorative text within the link name; headings hierarchy unchanged (`h1` hero, `h2` sections); focus-visible, reduced-motion, contrast all inherited from token layer.

## 8. Motion

No new animation; tiles inherit existing hover-lift/press-scale CSS + `prefers-reduced-motion` handling. No Framer Motion.

## 9. Data visualization

Donut now token-colored; revenue bars unchanged; no new chart library.

## 10. Existing functionality preserved

Hooks, queries, permissions, branch localStorage, StaffHome gate, loading/error/empty/permission states, routes/hrefs — all unchanged. No ticket-queue data exists in this repo, so no ticket card was invented; "Needs attention" remains the attention surface. Platform command-center page (the screenshot source) untouched.

## 11. Files changed

- MODIFIED: `src/app/(app)/dashboard/page.tsx` (+67/−46).
- MODIFIED (infra): `src/components/shared/bento.tsx` (+badge prop; untracked file).
- NEW (earlier, validated): `UI_STACK_AUDIT.md`, `UI_DESIGN_SYSTEM_REPORT.md`, `src/lib/design-tokens.ts`, `src/components/shared/progress-ring.tsx`.

## 12. Dependencies changed

None added, none removed.

## 13–15. Validation results (Overview)

- Typecheck: PASS (exit 0)
- Lint: PASS (exit 0, no new warnings)
- Tests: 14/14 dashboard suite PASS
- Build: PASS (exit 0, 82/82 pages, CI env)

## Users migration (`/staff` — DONE, validated 2026-10-05)

- Route: `/staff` (the account directory: `GET /users` + `GET /users/stats`; no `/users` route exists; `users.*` is the staff-account namespace).
- Files changed: MODIFIED `src/app/(app)/staff/page.tsx` only. No other files touched in this phase.
- Components reused: `PageHero`, `BentoCard`, `BentoGrid`, `SectionHeader`, `StatCard`, `DonutChart`, `ErrorState`, `DataTable` (untouched), `AddStaffDialog`/`ManageRolesDialog`/`StaffRowActions`/`RolePill`/`AccessBadge` (untouched).
- Components created: none (removed hand-rolled `StatTile`, replaced by `StatCard`).
- Data preserved: same queries (`staff` list + `staff stats` keys), same debounced search, same pagination; Switched-off derived as `max(0, total−active−invited−noAccess)` — partition verified read-only against `users.service stats`. No new API calls. No MFA/Deleted states rendered (not in the model — not invented).
- Functionality preserved: permissions (`users.create/update/delete/manage_roles`), row actions, role assignment, invite/deactivate flows, roster heading, empty/loading/error states (stats error now shows retry instead of silent hide). Diff review confirms no query/permission/href/mutation changes.
- Permissions preserved: yes, identical gates.
- Responsive: 2-col mobile bento grids, donut stacks above trainer row on phones, roster keeps its built-in mobile cards; no new fixed widths; structural QA only (no backend for screenshots).
- Accessibility: labeled sections, real links/buttons, unchanged table semantics, inherited focus/motion/contrast.
- Visual QA: structural only — explicitly NO live-screenshot validation (backend data unavailable in this environment). Not claiming pixel-perfect verification.
- Typecheck: PASS (exit 0). Lint: PASS (exit 0). Tests: staff 9/9 + FULL suite 356/356 PASS (exit 0). Build: PASS (exit 0, 82/82).
- Known limitations: "Security"/n/a — roster table container intentionally left as-is (already token-styled); hero renamed to Users/Directory per spec while rail still reads Staff (repo taxonomy preserved everywhere else).

## 16. Known issues

- Live-screenshot QA not possible without a backend; structural responsive QA only.
- Jump-to "Security"/"Control" tiles carry no count badge (no suitable pre-loaded metric; deliberately left blank rather than faked).

## 17. Remaining visual improvements

- None required for Overview. Users page is next when instructed.

---

## Per-page status

| PAGE | STATUS | FUNCTIONALITY PRESERVED | VISUAL MIGRATION COMPLETE | RESPONSIVE CHECKED | TYPECHECK | LINT | TESTS |
|---|---|---|---|---|---|---|---|
| Overview `/dashboard` | DONE | YES | YES | STRUCTURAL ONLY (no backend for screenshots) | PASS | PASS | 14/14 PASS |
| Users `/staff` | DONE | YES | YES | STRUCTURAL ONLY (no backend for screenshots) | PASS | PASS | 356/356 FULL SUITE PASS |
| Studios `/branches` | DONE | YES | YES | STRUCTURAL ONLY | PASS | PASS | branch suites 6/6 + full 356/356 PASS |
| Revenue `/billing` | DONE | YES | YES | STRUCTURAL ONLY | PASS | PASS (1 pre-existing warning) | full 356/356 PASS |
| Operations `/attendance` | DONE | YES | YES | STRUCTURAL ONLY | PASS | PASS | full 356/356 PASS |
| AI `/ai` | DONE | YES | YES | STRUCTURAL ONLY | PASS | PASS | full 356/356 PASS |
| Security `/settings/security` | DONE | YES | YES | STRUCTURAL ONLY | PASS | PASS | full 356/356 PASS |
| Control `/settings` | DONE | YES | YES | STRUCTURAL ONLY | PASS | PASS | full 356/356 PASS |

## Batch migration detail (all validated 2026-10-05, one execution)

### STUDIOS — `/branches` (`branches/page.tsx`)
- Reused: BentoGrid(3), GradientIcon, Badge(success), tokens. Created: `BRANCH_ACCENTS` cycle (blue/cyan/violet/emerald).
- Real metrics: branch list + ACTIVE status only (no revenue/capacity data exists — omitted, documented).
- Preserved: create/edit dialogs + validation, devices row, `branches.create/update` gates, loading/error/empty.
- Removed hardcoded `bg-cyan/teal/violet` tiles, `text-stone-950`, emerald badge fill; count pill now solved fill/white pair.

### REVENUE — `/billing` (`billing/page.tsx`)
- Light tokenization (already premium): cells →foreground, Fully-refunded pill →Badge secondary, Ask-AI link →tokens.
- Real metrics: page-derived collected/refunded/count (unchanged formulas); currency logic untouched; tabs, DataTable pagination, invoices/expenses sections, refund flow + `payments.refund` gate untouched. No chart lib (no axes needed).

### OPERATIONS — `/attendance` (`attendance/page.tsx`)
- Added 3-StatCard strip (Inside now emerald / Denied today rose / Logged visits cyan) derived from loaded live+log data, zero new requests; boards →rounded-3xl + solved pills; method badge →outline; form/log shells tokenized.
- Preserved: check-in/out mutations + gate copy, branch/member pickers, live polling, visit-log pagination, `attendance.create` gate. Severity logic untouched.

### AI — `/ai` (`ai/page.tsx`)
- Tokenized: user bubble →`var(--brand-grad)` white label; assistant bubble →border-border/foreground; thinking →muted + `--ai` dot; violet tiles →gradient style; starter prompts →QuickActionCard(onClick); aside card →violet-grad + white; textarea ring default.
- Preserved: chat mutation + history, 503 handling, approval-queue links, Power prompts, Enter/Shift+Enter, aria-live log. No usage/latency/cost shown (no endpoints — not faked).

### SECURITY — `/settings/security` (`security/page.tsx`)
- Tokenized: stone→muted, emerald/amber-700 →text-success/warning, report box →surface-sunken.
- Preserved: 2FA enrol/disable (password+code), SignOutEverywhere ConfirmAction, AuditLogPanel gates, MFA policy + grace/enforce flows, destructive-button distinctness. No semantics weakened.

### CONTROL — `/settings` (`settings/page.tsx`)
- Tokenized: links →border-border/foreground; WhatsApp hero link →orange gradient; gym tile →GradientIcon indigo; WhatsApp card →emerald-grad + frosted icon tile.
- Preserved: Security-link ungated-by-design comment honored, `settings.manage` gates, org query + edit/view switch, Manage link. No CORE/DANGEROUS taxonomy invented (no dangerous controls on this page); no confirmations weakened anywhere.

## Derived metrics ledger (batch)

| Metric | Formula | Source | Valid because |
|---|---|---|---|
| Logged visits (attendance strip) | `attendanceQuery.data?.total` | Already-loaded visit-log page | Direct field, no math |
| Inside now / Denied today | `inside.length` / `denied.length` | Already-loaded `useAttendanceLive` | Direct lengths |
| Studios/Revenue/AI/Security/Control | none derived | — | No derivation needed |

## Cross-batch validation (final)

- Typecheck: PASS (exit 0). Lint: PASS (exit 0, 53 warnings all pre-existing). Tests: 356/356 PASS (48 suites, exit 0). Build: PASS (exit 0, 82/82, CI env).
- Git: 8 MODIFIED frontend pages, 0 backend/DB/auth/API/dependency changes (`mygymagent-b` status empty).
- Visual QA: structural only for all six — "Live screenshot QA unavailable in this environment." No pixel-perfect claims.

## Final completion table

| PAGE | STATUS | FUNCTIONALITY | TYPECHECK | LINT | TESTS | BUILD | VISUAL QA |
|------|--------|---------------|-----------|------|-------|-------|-----------|
| Overview | COMPLETE | PRESERVED | PASS | PASS | PASS | PASS | STRUCTURAL ONLY |
| Users | COMPLETE | PRESERVED | PASS | PASS | PASS | PASS | STRUCTURAL ONLY |
| Studios | COMPLETE | PRESERVED | PASS | PASS | PASS | PASS | STRUCTURAL ONLY |
| Revenue | COMPLETE | PRESERVED | PASS | PASS | PASS | PASS | STRUCTURAL ONLY |
| Operations | COMPLETE | PRESERVED | PASS | PASS | PASS | PASS | STRUCTURAL ONLY |
| AI | COMPLETE | PRESERVED | PASS | PASS | PASS | PASS | STRUCTURAL ONLY |
| Security | COMPLETE | PRESERVED | PASS | PASS | PASS | PASS | STRUCTURAL ONLY |
| Control | COMPLETE | PRESERVED | PASS | PASS | PASS | PASS | STRUCTURAL ONLY |
