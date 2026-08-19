# MyGymAgent — Web

Next.js (App Router) frontend for the MyGymAgent multi-tenant gym management platform, talking to
the NestJS API in `mygymagent-b`.

See that repo's `docs/ARCHITECTURE.md` for the full technical blueprint. This app implements the
core gym domain (auth, dashboard, members, membership plans, memberships, attendance, staff,
branches, org settings) built there; every other product domain (AI, billing, workouts, nutrition,
inventory, CRM) has a "coming soon" route already wired into navigation and permission-gated, ready
to be filled in once its backend module lands.

## Stack

- Next.js 16 (App Router, Turbopack) + React 19 + TypeScript
- Tailwind CSS v4, a hand-built shadcn/ui-style component set (Radix primitives + CVA — the
  `ui.shadcn.com` CLI registry isn't reachable from this environment, so components were written
  directly against the same underlying packages the CLI would have used)
- React Hook Form + Zod for form validation
- TanStack Query for server state, TanStack Table for data tables
- next-themes for light/dark mode

## Local setup

Requires the API (`mygymagent-b`) running locally first.

```bash
npm install
cp .env.local.example .env.local   # point NEXT_PUBLIC_API_URL at the API
npm run dev
```

## Auth architecture

The API and this app run on separate origins in local dev (and typically in production too). The
backend's refresh token lives in an `httpOnly` cookie scoped to *its own* origin — a Next.js
proxy/middleware on this app's origin can never see that cookie, so there's no server-side
"is this request authenticated" check possible here. Instead:

- `<AuthProvider>` (`src/lib/auth/auth-context.tsx`) bootstraps the session client-side on load by
  calling `POST /auth/refresh` with `credentials: 'include'` — that fetch *does* correctly carry
  the cross-origin cookie, since it's a request to the API's own origin regardless of which page
  initiated it.
- `(app)/layout.tsx` and `(auth)/layout.tsx` redirect based on `useAuth()` once that bootstrap
  resolves, rather than on any cookie-based route gate.
- The access token itself is held in memory only (`src/lib/api/token-store.ts`), never in
  localStorage, to keep it out of reach of an XSS payload.

If the API and web app are later deployed under the same origin (e.g. `/api/*` proxied through
this app), a real edge-level auth gate becomes possible again — until then, treat client-side
gating as the mechanism, with the API's own auth/permission checks as the actual security boundary
(the frontend gate is UX only, exactly like permission-aware navigation elsewhere in this app).

## Design tokens

`src/app/globals.css` defines the full token set (colors, radius, motion) as CSS variables — a
single indigo brand color for trust/professionalism, a warm amber accent used sparingly, neutral
grays for everything else. Both light and dark themes are defined; `next-themes` toggles via a
`class` on `<html>`.
