# Batch Migration Plan — Studios / Revenue / Operations / AI / Security / Control

Audit date: 2026-10-05. Rule: presentation only; same queries/keys/mutations/permissions/routes.

## STUDIOS → `/branches` (`branches/page.tsx`, 274 lines)

- Current: PageHero(Branches) + actions (CreateBranchDialog gated `branches.create`, Staff link); "All locations" + count pill; states loading/error/empty; cards grid (sm:2 lg:3) with hardcoded `bg-cyan/teal/violet` tops+tiles, `text-stone-*`, `text-cyan-600` icons, emerald status badge; BranchEditDialog (`branches.update`); BranchDevicesRow.
- Data: `useBranches({pageSize:50})`, `useCreateBranch`. No revenue/capacity metrics — none invented.
- Reuse: BentoGrid(3), GradientIcon, SectionHeader, Badge(success), tokens via `kpi-*` cycling classes.
- Plan: cycle accents [blue,cyan,violet,emerald] via `kpi-*`; GradientIcon tiles; status Badge success/secondary; icons `var(--section-ink)`; count pill section-fill/white; cards rounded-3xl; text tokenized. Dialogs/forms untouched.
- Unsupported: per-studio revenue/health (no data).

## REVENUE → `/billing` (`billing/page.tsx` + sections/dialogs)

- Current: PageHero(Finance) + RecordPaymentDialog (`payments.create`), Ask-AI link; MetricStrip 3 FinanceMetrics (page-derived collected/refunded/count — derived from loaded page, valid); payments/invoices tabs; DataTable (no search; pagination via page badge); InvoicesSection; ExpensesSection; refund flow (`payments.refund`).
- Data: `usePayments({page,pageSize:20,order:desc})`. Currency from first item.
- Plan: LIGHT tokenization (page is already premium): column cells `text-stone-900/950`→foreground, keep 600 (bridged); RefundCell pill→Badge secondary; Ask-AI link emerald hardcode→tokens; hero eyebrow default. No chart lib (no axes needed). No calc changes.
- Tests: none for this page (settings/billing test is a different route).

## OPERATIONS → `/attendance` (`attendance/page.tsx`, 268 lines)

- Current: PageHero + Members/Ask-AI links; CheckInForm (`attendance.create`, BranchSelect/MemberPicker, gate alert); LiveBoards (`useAttendanceLive`: inside[] + deniedToday[]); visit-log DataTable (`useAttendance`, checkout mutation).
- Derived metrics (valid, loaded): Inside now = inside.length; Denied today = denied.length; Logged visits = log total.
- Plan: add 3-StatCard strip (emerald/rose/cyan) after hero; boards → rounded-3xl + token text + section-fill pills; method badge → outline; form/log containers radius bump. Severity logic untouched.
- Priority order preserved: denied board already rose-accented.

## AI → `/ai` (`ai/page.tsx`, 247 lines)

- Current: real chat (`useAiChat`, history, 503→notConfigured card), approval-queue links, 3 starter prompts, Power prompts aside, grounded-answers aside card. No usage/latency/cost endpoints — none shown, none faked.
- Plan: tokenize only: user bubble hex gradient→`var(--brand-grad)`; assistant bubble→border-border/foreground; thinking pill→muted+`--ai` dot; violet tiles→gradient style; starter prompts→QuickActionCard(onClick, rose/violet/cyan); textarea ring default; aside dark card→`--a-violet-grad` + white; Power prompts keep Buttons. Chat logic byte-identical.

## SECURITY → `/settings/security` (page + audit-log-panel + mfa components)

- Current: PageHero + Settings back-link; 2FA enrol/disable (password+code, confirm copy kept); sessions SignOutEverywhere (ConfirmAction kept); AuditLogPanel (`audit.read`); MFA policy + enrolment report (`organizations.update`); destructive buttons distinct.
- Plan: tokenize `text-stone-600`→muted, `text-emerald/amber-700`→text-success/warning; report box→surface-sunken/border; Cards keep slot styling. NO status-score invention; NO semantic changes; dangerous actions stay destructive + confirmed.
- Tests: mfa-grace-banner + confirm-action tests must stay green (untouched files).

## CONTROL → `/settings` (`settings/page.tsx`, 109 lines)

- Current: PageHero + Security link (ungated by design) + settings.manage links; gym-profile card (`useOrganization`, edit/view by `organizations.update`); WhatsApp gradient card.
- Plan: tokenize stone/indigo hardcodes (tile→GradientIcon indigo; WhatsApp card→`--a-emerald-grad` + white); hero action links→token borders/text. Grouping: page is small (profile + integrations) — no artificial CORE/DANGEROUS taxonomy (no dangerous controls live here). Confirm dialogs: none on this page; none weakened anywhere.
- Tests: settings/billing + profile tests are other routes; untouched.

## Cross-page consistency

Heroes keep route-mapped accents; SectionHeader + BentoGrid + QuickActionCard + StatCard everywhere; radius 3xl cards / 2xl tiles; white-label gradient tiles only; motion inherited; mobile 2-col bento, no fixed widths, BottomTabBar untouched.

## Implementation status (2026-10-05 — all six COMPLETE in one execution)

- STUDIOS: DONE (accent-cycled BentoCards, GradientIcons, solved badges/pills).
- REVENUE: DONE (light tokenization; calcs/tabs/flows untouched).
- OPERATIONS: DONE (3-StatCard live strip, tokenized boards/form/log).
- AI: DONE (tokenized bubbles/tiles/cards, QuickAction prompts, logic identical).
- SECURITY: DONE (tokenized, semantics + destructive distinctness preserved).
- CONTROL: DONE (tokenized tiles/cards/links, gates + ungated Security link preserved).
- Blockers: none. One repaired mid-flight: a malformed WhatsApp-link tag during Control edits (duplicate className) — caught by tsc/eslint, fixed, verified clean.
- Final results: typecheck PASS · lint PASS (53 pre-existing warnings) · tests 356/356 PASS · build PASS (82/82).
