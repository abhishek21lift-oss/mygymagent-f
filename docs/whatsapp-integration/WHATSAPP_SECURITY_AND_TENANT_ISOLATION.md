# WhatsApp Security and Tenant Isolation (new surface)

## Invariants (all verified by tests)
- **I1 org scoping:** every adapter query filters by `organizationId`
  (controller passes `CurrentUser.organizationId!`; service methods scope
  `waSession`/`autoReplyRule`/`waContact`/`botConfig`/`messageLog` by it;
  mutations use `{id, organizationId}`).
- **I2 no credential leakage:** QR/pairing are transient Redis values;
  `lastError` is display text; webhook secrets never listed; group
  responses contain no participant JIDs (type-level: `WaGroupRow` has no
  such field); activity endpoint selects metadata only, never bodies.
- **I3 limits preserved:** all sends still flow through `WaSender`
  (pacing + daily limits); bot replies share the 10/hour cap.
- **I4 single socket:** adapter never instantiates sockets; groups use the
  org's own open entry or return unavailable.
- **I5 opt-outs honored:** `#stop`/opt-out checks run before bot behaviors.
- **I6 validation:** prefix 1–3 chars, welcome ≤1000 chars, limits clamped;
  invalid input falls back to defaults (codebase convention), never 500s
  with internals (global filter sanitizes).
- **I7 audit:** config PATCH is `@Audited`; bot sends carry
  `auto_reply.bot_*` keys in `messageLog`.

## Threat notes
- Bot commands only fire for non-staff, non-opted-out 1:1 chats; group
  chats never trigger bot replies.
- Welcome is once-ever per sender (messageLog lookup doubles as the
  retried-event duplicate guard).
- `groupFetchAllParticipating` emits an ignored `groups.update` event;
  no listener acts on it.
- Orphaned IQ on 10s timeout resolves within Baileys' 60s default;
  bounded by 40/min throttle. No new lock (reads only).
