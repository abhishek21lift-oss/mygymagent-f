# Inbox Chat Design — 2026-10-08

## Intent (agreed)
WhatsApp-style chat inside the gym app (mygymagent-f), WA-AKG dashboard
look: conversation list + thread + reply box. New `(app)/inbox` route,
full chat v1. Text only. Existing `whatsapp.read/manage` permissions,
Aurora tokens. Polling freshness (10s), no socket.

Assumptions: gym volumes fit `limit: 200` fetch windows; member names
unresolved v1 (phone + matched badge); no read receipts, media, quotes,
or group chats v1.

## Approaches considered
- **A — Client-side grouping, zero backend changes (chosen):**
  `use-conversations` hook groups existing inbound + outbound queries by
  digits-only phone; reply via existing send mutation. Hook owns grouping
  so a server thread endpoint can replace its fetch later.
- B — Server thread endpoints (`GET /whatsapp/threads[/:phone]`):
  better past thousands of msgs/month; deferred (more surface + tests).
- C — Call WA-AKG chat APIs directly: rejected (bypasses tenancy, RBAC,
  MessageLog audit).

## §1 Routes, components, data
- Route `src/app/(app)/inbox/page.tsx`: two-pane `sm+`, list→thread on
  mobile; selected conversation in `?to=<digits>` (deep-linkable from
  member-360/notifications). Nav entry under Engage, `whatsapp.read`.
- `src/components/inbox/conversation-list.tsx`: avatar initials,
  phone, preview, time label, unread dot for unmatched inbound.
- `src/components/inbox/chat-thread.tsx`: inbound left/stone bubbles,
  outbound right/emerald with SENT/DELIVERED/READ ticks.
- `src/components/inbox/message-composer.tsx`: input + send, disabled
  without `whatsapp.manage`.
- `src/lib/hooks/use-conversations.ts`: merges `useInboundWhatsApp`
  + outbound messages by digits-only key, chronological per thread,
  `refetchInterval: 10_000` while mounted.

## §2 Send, errors, freshness
- Optimistic PENDING bubble → `POST /whatsapp/messages {to, text}` →
  SENT/FAILED; FAILED inline + retry; whitespace blocked; digits-only `to`.
- 403 → composer disabled + notice; 503 → toast + FAILED bubble, thread
  readable; poll failure → stale list + silent retry, error only on manual.
- `refetchIntervalInBackground: false`; unmatched toggle from InboxCard.
- Out of v1: media/quotes/delete, WA-AKG-side read ticks, groups.

## §3 Look, a11y, tests
- Aurora tokens, dark-mode classes, `min-h-11` targets; plain scroll
  (virtualize past ~500 nodes only if needed).
- `listbox/option` + arrow keys, `role=log aria-live=polite`,
  Enter-send/Shift+Enter-newline, focus back on mobile back, `<time>`.
- `use-conversations.test.ts` (grouping, order, unmatched), thread send
  test (optimistic→SENT, FAILED+retry), page test (gate, empty).
  Manual: two-phone conversation, 10s refresh, offline FAILED+retry.
