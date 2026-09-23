# MY GYM AGENT — Frontend Fix Backlog

Source: full-system deep audit, 2026-09-22 (cross-checked every route in `src/app`, every hook in
`src/lib/hooks`, `nav-config.ts`, and `AI_TASK_STATE.md` against the actual backend contract in
`mygymagent-b`). Companion to `mygymagent-b/BACKLOG.md` — items here are frontend-only; cross-repo
items are cross-referenced by ID.

Priority legend: `P0` blocks calling this production-safe · `P1` blocks calling it feature-complete
· `P2` real gap, not urgent · `P3` polish/future.

Status legend: `⬜ not started` · `🚧 in progress` · `✅ done`.

---

## P0 — Product-critical gaps

| # | Item | Status | Detail |
|---|---|---|---|
| F-P0-1 | Real member self-service portal | ⬜ | `src/app/member-portal/page.tsx` (40 lines) is a one-time-token, read-only view of memberships + attendance. No login, no session, no self-booking of PT/class sessions, no online renewal/payment, no viewing assigned workout/diet plans, no notification preferences. If members are meant to use the product directly (per `AI_TASK_STATE.md`'s product vision), this needs real member auth (separate from staff `auth-context.tsx`), and screens for: workouts/diet (read), class/PT booking (write, hits `appointments`/`pt-sessions` backend), payment/renewal (hits `online-payment.controller.ts`), and profile/notification settings. |
| F-P0-2 | Business OS UI beyond quick-create forms | ⬜ | `src/app/(app)/business-os/page.tsx` (128 lines) covers loyalty/referrals/support/feedback/marketing/accounting/kiosk with single-shot create forms and flat lists only — no support-ticket thread/reply view (backend has `POST support/tickets/:id/messages` + `PATCH support/tickets/:id`, unused by the UI), no campaign audience preview before enroll, no accounting ledger drill-down beyond trial-balance/tax-summary buttons. Build proper detail views once B-P0-1 (backend Prisma migration) lands — don't invest heavily in UI against the raw-SQL contract first. |
| F-P0-4 | Handle the MFA challenge in login, and add the enrolment UI | ✅ | Done. `POST /auth/login` now returns a discriminated `LoginResult`; `auth-context.tsx` establishes **no** session on `mfaRequired: true` (no token, no user, no `/auth/me`) and exposes `completeMfaLogin`. `login/page.tsx` branches into a code step that accepts a TOTP or a recovery code in one field. `/settings/security` covers status/setup/enable/disable, renders `otpauthUri` as a client-side QR (`qrcode`), offers the setup key for manual entry, and shows the 10 recovery codes once with copy/download behind an explicit acknowledgement. The BFF proxy route became a catch-all (`api/auth/[...action]`) because `mfa/verify` is two segments and must set the refresh cookie the same way `/auth/login` does. 4 new `auth-context` tests, each verified to fail when the `mfaRequired` branch is removed. The Security link sits outside the `settings.manage` gate — 2FA is a personal account setting, not an admin one. **B-P0-10 (mandatory MFA for privileged roles) is now unblocked.** |
| F-P0-5 | Handle the organization MFA policy in the client | ✅ | Shipped alongside `mygymagent-b` B-P0-10, because enforcement without it would 403 every page. `mfaEnrolment: { state, deadline }` now rides on the login response and `/auth/me` and is tracked in `auth-context`. On `ENFORCED` the `(app)` layout replaces the whole shell with `MfaRequiredGate` — the shell’s own chrome (nav counts, notification centre, branch picker) fetches data the confined session cannot read, so rendering it would bury the one available action in 403s. On `GRACE`, a non-dismissible `MfaGraceBanner` shows the deadline (dismissible would mean a warning seen on day one and never again on day thirteen). The enrolment flow was extracted to `components/security/mfa-enrolment.tsx` so the gate and the settings screen cannot drift. `/settings/security` gained the admin policy section — enrolment report above the switch — gated on `organizations.update`. 9 new tests; the banner’s state check was broken to confirm they detect it. |
| F-P0-3 | Verify every business-os/HR-payroll/group-training screen has real loading/error/empty states | ⬜ | `AI_TASK_STATE.md`'s own coding checklist (item 9) requires this; spot-check `payroll/page.tsx`, `classes/page.tsx`, and the business-os page against the `EmptyState`/`ErrorState`/`TableSkeleton` components already used elsewhere (`src/components/shared/`) — confirm they're not silently rendering blank on a failed fetch. |

## P1 — Feature completeness

| # | Item | Status | Detail |
|---|---|---|---|
| F-P1-1 | Push notification client registration | ⬜ | Depends on backend `B-P1-1` (FCM provider). Once that lands, add device-token registration (permission prompt + register to `notification_devices` via the business-os endpoint) in the Capacitor shell and web app, and render incoming pushes through the existing `notification-center.tsx`. |
| F-P1-2 | i18n scaffolding + first regional language | ⬜ | Zero i18n infrastructure (`grep -r "i18n\|locale\|next-intl"` returns nothing). Given Razorpay/INR defaults suggest an India-first market, add `next-intl` (or equivalent) and ship Hindi as the first additional locale — start with `sidebar-nav.tsx`, `nav-config.ts`, and the highest-traffic pages (dashboard, members, billing). Depends on backend `B-P3-1` for templated messages to be translatable end-to-end. |
| F-P1-3 | iOS build pipeline | ⬜ | `.github/workflows/android-apk.yml` exists; no iOS equivalent despite `capacitor.config.ts` being platform-agnostic. Add an iOS archive workflow (needs Apple Developer credentials — confirm with the user before spending time here). |
| F-P1-4 | Wire in-app notification center to newly-consumed events | ⬜ | Depends on backend `B-P1-2`. Once payment/membership/lead events get listeners, surface them in `notification-center.tsx` and `settings/notifications/page.tsx` (preferences already has a page — confirm it actually gates delivery once there's more than the one event type to gate). |

## P2 — Real gaps, not urgent

| # | Item | Status | Detail |
|---|---|---|---|
| F-P2-1 | HR/Payroll page audit | ⬜ | Confirm `payroll/page.tsx` targets the module that wins backend `B-P0-6`'s payroll/hr-payroll reconciliation, not the deprecated one — this page will silently break otherwise. |
| F-P2-2 | Group Training (classes) UX depth | ⬜ | `classes/page.tsx` exists but check for roster management, waitlist, and recurring-schedule UI — the backend `ClassesService` supports tenant-scoped orchestration; confirm the UI exposes all of it, not just create/list. |
| F-P2-3 | Kiosk offline handling | ⬜ | `src/app/kiosk/page.tsx` — a tablet mounted at a gym entrance will lose wifi occasionally; confirm there's a queued-retry or clear offline state rather than a silent failed check-in. |

## P3 — Polish / future

| # | Item | Status | Detail |
|---|---|---|---|
| F-P3-1 | Full i18n coverage | ⬜ | Extend F-P1-2 to every screen once the pattern is proven on the high-traffic pages. |
| F-P3-2 | Accessibility audit | ⬜ | The custom sidebar/nav/animation-heavy UI (`sidebar-nav.tsx`) hasn't had a dedicated a11y pass — screen-reader and keyboard-nav check, given the amount of custom interactive chrome. |
| F-P3-3 | Search UX upgrade | ⬜ | Depends on backend `B-P2-1`; once ranked full-text search exists server-side, revisit `search/page.tsx` for fuzzy-match affordances (did-you-mean, category filters). |

---

## Process fix

`AI_TASK_STATE.md` is the frontend's designated persistent-state file per its own header
("Read before major work and update after meaningful milestones") but hasn't been updated since
2026-08-25 despite significant shipped work since. Update it at the end of each backlog item above,
not just at phase boundaries — that's the gap that let this backlog become necessary in the first
place.
