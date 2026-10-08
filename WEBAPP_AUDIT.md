# Web App Wiring & Duplicates Audit

_Audited 8 October 2026 against `main`: frontend `3a04a9a`, API `56ec543`._

## How this was checked

Static analysis and live testing, across both repos:

| Check | Method | Result |
|---|---|---|
| Backend dependency wiring | Every `@Injectable` / `@Controller` / `@Processor` class matched against module registrations | ✅ 248 / 248 registered |
| Frontend → API wiring | Every `api.get/post/patch/delete` and `apiFetch` call (478) matched by method + path against the API's live route table | ✅ 478 / 478 hit a real route |
| API → frontend | Every live route (491) checked for a web caller | 20 have none (7 are webhooks / devices / public forms, as expected) |
| Navigation | Every `href`, `router.push` and nav entry matched against the 79 pages | 2 broken targets (below) |
| Database | Migrations applied to a fresh Postgres 16; schema-vs-migrations drift; every model checked for use | ✅ applies cleanly, no drift, all 123 models used |
| API runtime | API booted against the seeded DB; every `GET` endpoint called as the gym owner, IDs filled from real records | ✅ 192 calls, **zero 5xx**; every 4xx is expected validation or role-gating |
| Web runtime | Next.js run against the local API; Playwright signed in as the owner and opened all 55 staff pages | ✅ every page renders its heading; no crashes, JS exceptions or error screens |
| Targeted flows | Workout session (plan → assign → start → log set → complete → history); PT double-booking | Workout flow ✅; double booking reproduced ❌ |

**Not covered live:** the member portal (`/portal/*`) as a signed-in member (demo members sign in by SMS OTP), the kiosk, payment and WhatsApp webhooks (need live Razorpay / Meta credentials), and AI chat (needs an LLM provider). Most write flows were not driven by hand; they rely on the API's 70 e2e suites (green in CI).

---

## 🔴 Broken: users hit these today

### 1. Trainer app: "Start" and "Resume" lead to a 404
`src/app/trainer/page.tsx:115` and `:130` link each session card to `/trainer/session/<id>`. That page has never existed in git history, so a trainer tapping their next session sees "This page does not exist" (confirmed in the browser).
The backend for it **works**: start, log sets, complete and history were all verified live. Only the page is missing.
**Fix:** build `src/app/trainer/session/[id]/page.tsx` on the existing `/workout-sessions/:id`, `…/sets` and `…/complete` endpoints. Until then, point the buttons at `/workout-sessions`.

### 2. A trainer can be double-booked
Personal training can be booked two ways:
- as a **PT session** (`PtSession`, `/pt-sessions`), or
- as an **appointment** of type `PT_SESSION` (`Appointment`, `/appointments`).

Each clash check only looks at its own table: `appointments.service.ts:126` (`assertNoStaffOverlap`) and `pt-sessions.service.ts:166`. **Reproduced live:** trainer1 got a PT session at 07:00–08:00. A second PT session at the same time was correctly rejected, but an appointment for that same trainer and hour was accepted.
The two tables also identify the trainer differently: `PtSession.trainerId` is a `StaffProfile` id, while `Appointment.staffId` is a `User` id.
**Fix:** one shared "is this trainer free" check that queries both tables, used by both create and reschedule paths. Longer term, decide whether `Appointment.type = PT_SESSION` should exist at all (see 6).

### 3. Leave management can't be used
The Payroll page lists leave types and leave requests and lets a manager approve or reject them, but nothing in the app can **create** a leave type or **submit** a leave request. `POST /hr-payroll/leave-types` and `POST /hr-payroll/leave-requests` exist and have no caller, so the list is always empty. The home page advertises "payroll with leave".
**Fix:** add "Add leave type" (settings) and "Request leave" (staff self-service or manager on behalf).

---

## 🟠 Duplicates

### 4. Two member portals
| | `/member-portal` (old) | `/portal` (current) |
|---|---|---|
| Access | One-off token pasted by hand | Real login (SMS OTP) |
| Issued from | Business OS page → `POST /portal/invites/:id` | Member profile → `POST /portal/enable/:id` |
| Content | Memberships + attendance, read-only | Full app: plan, check-in QR, classes, workouts, diet, billing, renewal |

Both are live. The old one hands staff a raw token to forward manually, and its page (`src/app/member-portal/page.tsx`) is unstyled compared with the rest of the app.
**Fix:** retire `/member-portal`, `POST /portal/invites*`, `GET /portal/bootstrap/:token` and the `PortalInvite` model. Point the Business OS button at the member-profile "portal access" flow.

### 5. Two exercise-history endpoints, and one is broken
- `GET /workouts/exercise-history` is used by the app and **correct**.
- `GET /workout-sessions/member/:memberId/exercise/:exerciseId/history` **always returns `[]`**. `WorkoutSessionSet.exerciseId` stores the *session's* exercise-entry id, not the exercise-library id, so the filter in `workout-sessions.service.ts` (`getMemberExerciseHistory`) never matches. Verified live: the same member and exercise returned one set from the first endpoint and nothing from this one.

Its only caller, `useMemberExerciseHistory` (`src/lib/hooks/use-workout-history.ts`), is used by no screen.
**Fix:** delete the broken endpoint and the hook. Consider renaming the column to `sessionExerciseId` so the next reader isn't misled.

### 6. Three versions of "today's numbers"
| Endpoint | Used by |
|---|---|
| `GET /briefing/daily` | Dashboard |
| `GET /analytics/coo-briefing` | `/coo` "Morning briefing" |
| `GET /owner-os/briefing` | No page (`/owner-os` now redirects to `/dashboard`); `OwnerOsService` is still used by the AI agent's tools |

Each computes members, revenue, attendance and expiries its own way, so the AI agent can quote figures that differ from the dashboard.
**Fix:** one briefing service; have the AI tool read the same one the dashboard does; delete the `owner-os` controller.

### 7. Duplicate hooks for the same call
- `useInviteStaff` and `useAddStaff` both `POST /users`, and only `useAddStaff` is used.
- `useCreateMember` (`POST /members`) is unused; the onboarding wizard posts `/members` itself in `use-onboarding.ts`.

**Fix:** delete the unused ones.

### 8. Payroll split across two modules with confusing names
`src/payroll/` holds trainer **commissions** and `src/hr-payroll/` holds **pay runs, leave and staff pay**. They are complementary (pay runs approve commissions and deduct unpaid leave), not duplicates, but the names suggest otherwise. Consider merging them into one `payroll` module with `commissions` and `runs` sub-areas.

### 9. Two AI logs
`AiUsageLog` (tokens, cost, latency per provider call) and `AiCommandLog` (written by raw SQL in `global-ai-command.service.ts`, read nowhere in `src/`). Fold the command record into `AiUsageLog`, or give it a reader.

---

## 🟡 Built on the backend, not reachable in the UI

These hooks are written but **no screen uses them**, so the backend feature exists and users can't reach it. Each needs a call: wire it, or delete the hook (and the endpoint if nothing else needs it).

| Area | Unused hook(s) | What users can't do |
|---|---|---|
| AI agent | `useAiConversations`, `useDeleteAiConversation` (+ `GET /ai/conversations/:id`, no hook) | See or reopen past AI chats |
| Members | `useMemberAssessments`, `useCreateMemberAssessment` | Record fitness assessments |
| Members | `useCreateMemberTag`, `useUpdateMemberTag`, `useDeleteMemberTag`, `useMemberTag` | Manage the tag list (create, rename, delete) |
| Members | `useUpdateMemberAddress`; `PATCH …/notes/:id`, `PATCH …/emergency-contacts/:id` (no hooks) | Edit an address, note or emergency contact (only add and delete) |
| Memberships | `useUnpauseMembership`, `useChangeMembershipPlan`, `useRecordPaymentFailure` | Unpause, switch plan mid-term, record a failed payment |
| Plans | `useDeleteMembershipPlan` | Delete a plan |
| WhatsApp | `useDisconnectWhatsApp`, `useWhatsAppMessages`, `useSendWhatsAppMessage` | Disconnect the number, read or send messages from the app |
| Finance | `useUpdateExpense` | Edit an expense |
| Payroll | `useUpdateCommissionRule` | Edit a commission rule |
| Calendar | `useUpdateAppointment`, `useDeleteTimeOff` | Edit an appointment's details, remove a time-off block |
| Intelligence | `useAtRiskAssessments` | (Risk list is shown through another hook; this one may be redundant) |
| Notifications | `unarchiveNotification` | Restore an archived notification |
| Branches | `DELETE /branches/:id` (no hook) | Delete a branch (likely deliberate) |
| Subscription | `POST /platform-billing/subscription` (no hook) | Change plan themselves (deliberate: page says "talk to us") |

Also unused: `ComingSoonPage` (`src/components/shared/coming-soon.tsx`). The README still says every unbuilt domain has a "coming soon" route; none do now. Update the README and delete the component.

---

## 🟢 Smaller issues

10. **Route order is load-bearing.** `GET /members/segments`, `/members/tags`, `/members/overview` and `/members/timeline` live in other controllers than `GET /members/:id`. They work today only because their modules register first (verified in the boot log). A module reorder would silently turn them into "member not found". Add an e2e test for each, or move them under distinct prefixes.
11. **`/engage` is not a page.** The "Engage" nav group's `href` (`src/lib/nav-config.ts:105`) points nowhere. It's never rendered as a link today (empty groups are dropped), but set it to its first child like the other groups.
12. **`/platform/command-center` for non-admins** renders the console stuck on "Measuring…". Its siblings (`/platform/organizations`, `/platform/ai-infrastructure`) correctly show "Platform staff only"; this one should too.
13. **Extra round trip on every app open.** The auth bootstrap calls `/auth/me` before it has a token (the token lives only in memory), gets a 401, refreshes, then retries. Calling `/auth/refresh` first when no token is held saves a request on every launch.
14. **Dev-only console noise.** The development CSP lacks `'unsafe-eval'`, so React warns on every page in `next dev`. Add it to the dev-only branch in `next.config.ts`; production is unaffected.
15. **Raw SQL.** Platform billing and the AI command log use 18 `$queryRawUnsafe` calls instead of the Prisma client. All are parameterised (no injection found), but they bypass type checking, and a schema rename won't be caught at build time.
16. **Test gaps.** No e2e coverage for `/workout-sessions` (7 routes, behind finding 1), `/admin/ai` (34 routes), `/communications` (5), or `/global-ai`, `/client-360`, `/billing`, `/crm`, `/lead-follow-ups` (1 each).
17. **Dev seed is incomplete.** `npm run db:seed:dev` doesn't load the exercise library, so on a fresh dev database no workout plan can be created until `npm run db:seed:exercises` is run. Chain it into `db:seed:dev`.

---

## Suggested order

1. Findings 1–3 (broken for users today).
2. Finding 5 (delete the broken endpoint), 7 (duplicate hooks), 4 (retire the old portal).
3. Finding 6 (one briefing source), then the table above: decide wire-or-delete per row.
4. Findings 10 and 16 (tests that protect the wiring), then the rest.
