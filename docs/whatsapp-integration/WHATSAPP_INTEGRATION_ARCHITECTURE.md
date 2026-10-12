# WhatsApp Integration Architecture (adapter + bot automation)

## Authority
`WaSessionManager` owns the single Baileys socket per organization (Redis
lock, reconnect, lifecycle). `WaAkgProvider` → `WaSender` (BullMQ) is the
only send path. Meta Cloud integration is separate and untouched. Nothing
added here creates a socket, sender, consumer, or pipeline.

## Adapter surface (`mygymagent-b/src/whatsapp-adapter/`)
All routes behind `WhatsAppAdapterFeatureGuard` (default off) + throttle
(40/min) + `CurrentUser.organizationId` scoping:

- `GET /whatsapp-adapter/status` — session status, QR/pairing codes
- `GET/PATCH /whatsapp-adapter/bot/config` — BotConfig singleton per org
- `GET /whatsapp-adapter/auto-replies` (+POST/PATCH/DELETE)
- `GET /whatsapp-adapter/contacts?limit&search`
- `GET /whatsapp-adapter/groups?limit`
- `GET /whatsapp-adapter/automation/activity` — `auto_reply.*` messageLog rows

## Inbound precedence (`WhatsappAutoReplyListener.reply()`)
Group skip → linked+autoReply master switch → staff `#` commands →
opt-out → staff keyword rules → **bot prefix commands** → **welcome
(once-ever)** → gym intents. Bot sends use `auto_reply.bot_*` keys, so the
shared 10/hour cap and same-answer gaps apply. Outbound bot replies never
re-emit inbound events (no recursion). `#stop` silences everything.

## Frontend (`settings/whatsapp/`)
Overview dashboard (stats, quick actions, sessions, contacts, groups) +
`BotConfigCard` (flag-gated) + existing cards. Adapter/legacy split by
`user.features.whatsappAdapter`; hooks unconditional within each branch.
