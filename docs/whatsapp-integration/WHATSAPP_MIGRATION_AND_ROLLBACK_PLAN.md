# WhatsApp Migration and Rollback Plan

## Migration `20261012103735_add_bot_configs`
Additive only: `CREATE TABLE bot_configs` (id, organizationId unique,
prefix default `'#'`, enablePing/enableUptime default false,
welcomeMessage nullable, timestamps) + unique index + FK to
`organizations(id)` ON DELETE CASCADE. No existing table touched.

Verified: applied via `migrate dev` and clean-slate `migrate deploy`
against disposable local databases (both dropped afterwards).

## Rollback
1. Set `WHATSAPP_ADAPTER_ENABLED=false` (default already) — endpoints
   and UI go dark immediately, no data touched.
2. Revert code: `src/whatsapp-adapter/bot-config` paths,
   `WhatsappAutoReplyListener.botReply` + `BotIntent`, `BotConfig` model,
   frontend card/hooks. Inbound pipeline reverts to exact prior behavior
   (bot block is additive inside `reply()`).
3. If rows must go: `DROP TABLE bot_configs;` (single new table; nothing
   references it). Prisma: `prisma migrate resolve --rolled-back` + delete
   the migration directory only after code revert.
4. Frontend needs no rollback (flag-gated; legacy paths unchanged).

## Why no broader migration risk
No columns added to shared tables, no backfill, no lock-prone alters.
The table is written only by org-scoped upsert and read per inbound
message (indexed unique lookup).
