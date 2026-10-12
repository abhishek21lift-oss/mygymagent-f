# WhatsApp Test Report (Phase A–A.2 + bot automation)

All runs local, isolated (mocked Prisma/sockets/API). No production or
shared databases touched. E2E requires pushed-branch CI (not run here).

## Backend (`mygymagent-b`)
- `npx jest src/whatsapp-adapter src/automation src/whatsapp-web src/whatsapp` — **27 suites, 251/251 pass** (2 consecutive green runs).
- `npm run typecheck` — exit 0. `npx eslint` on touched files — clean.
- Coverage highlights: guard fail-closed both states; controller org
  scoping per endpoint (incl. bot-config + activity); invalid/boundary
  limits; service clamp; manager closed/timeout/error/mapping/PII-strip/
  fallback/concurrent; bot ping/uptime/welcome/precedence/opt-out/
  disabled/no-row/disconnected/once-ever.
- Migration: `20261012103735_add_bot_configs` applied to two disposable
  local DBs via `migrate dev` AND clean-slate `migrate deploy`; both
  dropped afterwards.

## Frontend (`mygymagent-f`)
- `npx jest --testPathPatterns whatsapp` — 35/35 pass (overview flag
  on/off, debounce 300ms, groups states + PII absence + legacy hidden,
  bot-config CRUD/permission/activity).
- `npx tsc --noEmit` — exit 0. ESLint — 0 errors (1 pre-existing warning).
- Production `next build` not run locally (needs `NEXT_PUBLIC_API_URL`;
  runs in CI).

## Notes
- One transient single-test failure occurred mid-session, then 2 clean
  full runs (251/251, 27 suites). Treated as load flake; CI will confirm.
- Live Baileys behavior (group fetch shape/latency, QR flows) verified
  against installed package types + JS implementation, NOT a live
  session — staging smoke still required.
