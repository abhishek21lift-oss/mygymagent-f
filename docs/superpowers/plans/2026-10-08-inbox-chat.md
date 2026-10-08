# Inbox Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A WhatsApp-style inbox (list + thread + reply) at `(app)/inbox`, backed by stored message bodies.

**Architecture:** Backend persists the rendered body on `MessageLog` (nullable migration); frontend `use-conversations` groups existing inbound + outbound queries by digits-only phone; new route/components render the WA-AKG-style two-pane UI with 10s polling.

**Tech Stack:** Next.js 16 + React 19, TanStack Query v5, RTL + Jest; NestJS 11 + Prisma 6 (Task 1 runs in `mygymagent-b`).

**Spec:** `docs/superpowers/specs/2026-10-08-inbox-chat-design.md`

## Global Constraints

- Frontend: no new dependencies; Aurora tokens + dark-mode classes; `min-h-11` touch targets; existing query-key root `["whatsapp"]`.
- Polling `refetchInterval: 10_000` with `refetchIntervalInBackground: false`.
- Permissions: page needs `whatsapp.read`, composer needs `whatsapp.manage`.
- Backend: nullable `body String?` on `MessageLog` (no backfill); TDD per repo gates.
- Every task's requirements implicitly include this section.

## Review Focus

- An 11-digit trunk-0 number (`09876543210`) groups with its 10-digit form (`9876543210`), not as a second conversation — a reasonable person sees one thread per person.
- An old outbound row with `body: null` renders a templateKey chip, never a blank bubble or crash.
- Whitespace-only composer submit calls no mutation and shows no bubble.
- Background-tab polling stays stopped (no refetch while hidden).
- `?to=` with an unknown phone shows an empty thread with a ready composer, not an error.

---
### Task 1: Store message bodies (backend, in `mygymagent-b`)

**Files:**
- Modify: `mygymagent-b/prisma/schema.prisma` (MessageLog += `body String?` + comment)
- Modify: `mygymagent-b/src/communications/communications.service.ts` (persist rendered body in `send` + `sendAdHoc` creates)
- Modify: `mygymagent-b/src/communications/communications.service.spec.ts`
- Test: same spec (extend)

**Interfaces:**
- Consumes: existing `send`/`sendAdHoc` render pipeline (template resolve + variable render already there).
- Produces: `GET /whatsapp/messages` rows gain `body: string | null` (Prisma passthrough, no DTO change); frontend `WhatsAppMessage` += `body`.

- [ ] **Step 1: Write the failing test**

```ts
it("persists the rendered body on the log row", async () => {
  await svc.sendAdHoc({ organizationId: "o1", channel: "WHATSAPP", category: "TRANSACTIONAL", recipient: "+9198", body: "Hi {{organizationName}}" })
  expect(prisma.messageLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ body: expect.stringContaining("Hi ") }) }))
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/communications/communications.service.spec.ts` (in `mygymagent-b`)
Expected: FAIL with "body" not in create args

- [ ] **Step 3: Implement migration + persist `body` in `send`/`sendAdHoc` creates in `communications.service.ts`**

Run: `npx prisma migrate dev --name message-log-body` (in `mygymagent-b`)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/communications/communications.service.spec.ts` (in `mygymagent-b`)
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/ src/communications/communications.service.ts src/communications/communications.service.spec.ts
git commit -m "feat(whatsapp): persist message bodies for threads"
```

### Task 2: `use-conversations` hook

**Files:**
- Create: `src/lib/hooks/use-conversations.ts`
- Create test: `src/lib/hooks/use-conversations.test.tsx`
- Modify: `src/lib/types/whatsapp.ts` (`WhatsAppMessage` += `body: string | null`)

**Interfaces:**
- Consumes: `useInboundWhatsApp({limit:200})`, `useWhatsAppMessages(200)`, `useSendWhatsAppMessage` (all in `src/lib/hooks/use-whatsapp.ts`, unchanged).
- Produces: `useConversations() => { conversations: Conversation[] }` where `Conversation = { key: string; phone: string; unmatched: boolean; lastAt: string; messages: ThreadMsg[] }`, `ThreadMsg = { id, fromMe, text, status?, createdAt }`; `normalizePhone(raw: string) => string` (digits-only, strips one trunk `0`).

- [ ] **Step 1: Write the failing test**

```tsx
;(api.get as jest.Mock).mockImplementation((path: string) => path === "/whatsapp/inbound"
  ? Promise.resolve([{ id: "i1", fromPhone: "09876543210", body: "Hi", matchedMemberId: null, createdAt: "2026-10-08T10:00:00Z" }])
  : Promise.resolve([{ id: "m1", recipient: "919876543210", templateKey: "ad_hoc", body: "Hello!", status: "SENT", createdAt: "2026-10-08T10:01:00Z" }]))
// expect one conversation keyed "919876543210", two messages in time order, unmatched true
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/lib/hooks/use-conversations.test.tsx`
Expected: FAIL with "Cannot find module './use-conversations'"

- [ ] **Step 3: Implement `useConversations` + `normalizePhone` in `src/lib/hooks/use-conversations.ts`** (group by normalized digits, merge + sort asc; export `conversationPolling = { refetchInterval: 10_000, refetchIntervalInBackground: false }` and spread it into both queries so the background-tab rule is pinned by the export test below)

- [ ] **Step 3b: Pin the polling export**

```tsx
expect(conversationPolling).toEqual({ refetchInterval: 10_000, refetchIntervalInBackground: false })
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/lib/hooks/use-conversations.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/hooks/use-conversations.ts src/lib/hooks/use-conversations.test.tsx src/lib/types/whatsapp.ts
git commit -m "feat(inbox): conversation grouping hook"
```

### Task 3: Inbox components

**Files:**
- Create: `src/components/inbox/conversation-list.tsx`
- Create: `src/components/inbox/chat-thread.tsx`
- Create: `src/components/inbox/message-composer.tsx`
- Test: `src/components/inbox/inbox.test.tsx`

**Interfaces:**
- Consumes: `Conversation`/`ThreadMsg` from Task 2; shadcn `Avatar/Button/Input`, `DataState`.
- Produces: `<ConversationList conversations selectedKey onSelect />`, `<ChatThread conversation canSend />`, `<MessageComposer to disabled onSend />` (calls `useSendWhatsAppMessage`, optimistic PENDING bubble, FAILED + retry).

- [ ] **Step 1: Write the failing test**

```tsx
render(<ChatThread conversation={threadWithNullBodyOutbound} canSend />)
expect(screen.getByText("ad_hoc")).toBeInTheDocument() // templateKey chip, no crash
```

- [ ] **Step 1b: Block whitespace submits**

```tsx
fireEvent.change(screen.getByLabelText(/message/i), { target: { value: "   " } })
fireEvent.click(screen.getByRole("button", { name: /send/i }))
expect(api.post).not.toHaveBeenCalled()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/components/inbox/inbox.test.tsx`
Expected: FAIL with "Cannot find module './chat-thread'"

- [ ] **Step 3: Implement the three components** (listbox/option + arrow keys, `role=log aria-live=polite`, Enter-send/Shift+Enter, `<time dateTime>`, emerald outbound + ticks, `min-h-11`)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/components/inbox/inbox.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/inbox/
git commit -m "feat(inbox): chat list, thread, composer"
```

### Task 4: Inbox page + nav

**Files:**
- Create: `src/app/(app)/inbox/page.tsx`
- Modify: `src/lib/nav-config.ts:105-109` (Engage += `{ title: "Inbox", href: "/inbox", icon: Inbox, permission: "whatsapp.read" }`)
- Modify: `src/lib/notification-links.ts` (`/^\/whatsapp(\/inbox)?\/?$/` → `/inbox`)
- Test: `src/app/(app)/inbox/page.test.tsx`

**Interfaces:**
- Consumes: Task 2 hook + Task 3 components; `useSearchParams` `?to=` selects thread (unknown phone → empty thread + ready composer).
- Produces: gated page (no `whatsapp.read` → `ErrorState`), two-pane `sm+`, back-nav on mobile.

- [ ] **Step 1: Write the failing test**

```tsx
render(<InboxPage />) // with useConversations mocked to one conversation
expect(screen.getByRole("listbox")).toBeInTheDocument()
```

- [ ] **Step 1b: Unknown `?to=` starts an empty thread**

```tsx
// mock useSearchParams ?to=000 with no matching conversation
expect(screen.getByText(/no messages yet/i)).toBeInTheDocument()
expect(screen.getByLabelText(/message/i)).toBeEnabled()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/app/\(app\)/inbox/page.test.tsx`
Expected: FAIL with "Cannot find module './page'"

- [ ] **Step 3: Implement `page.tsx`** (search-param selection, gate, responsive panes, unmatched toggle)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/app/\(app\)/inbox/page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/\(app\)/inbox/ src/lib/nav-config.ts src/lib/notification-links.ts
git commit -m "feat(inbox): inbox route and nav"
```
