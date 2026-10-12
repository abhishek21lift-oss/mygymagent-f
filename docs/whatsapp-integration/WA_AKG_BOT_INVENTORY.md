# WA-AKG Bot Inventory → MyGymAgent Mapping

WA-AKG has no bot-registry table. Its "bots" are per-session automation
capabilities. Each row: WA-AKG capability → MyGymAgent status → evidence.

| # | WA-AKG capability (source) | MyGymAgent status | Evidence / blocker |
|---|---|---|---|
| 1 | BotConfig: `prefix`, `enablePing`, `enableUptime` | Implemented | `BotConfig` table (`bot_configs` migration), `GET/PATCH /whatsapp-adapter/bot/config`, `BotConfigCard`, inbound `#ping`/`#uptime` in `WhatsappAutoReplyListener.botReply()` |
| 2 | BotConfig: `welcomeMessage` | Implemented | Same as above; once-ever via `messageLog` lookup, `{{organizationName}}` rendering |
| 3 | BotConfig: `alwaysOnline`, `autoRead`, `ghostMode`, `antiDelete` | Blocked | Needs new Baileys presence/socket calls; would change observable behavior for all tenants. No socket presenter exists for these. |
| 4 | BotConfig: `enableSticker`, `enableVideoSticker`, `maxStickerDuration`, `removeBgApiKey` | Blocked | `WaSendContent` is text+image only; no webp converter dep in backend (`sharp`/`ffmpeg`/`cwebp` absent from `package.json`); storing flags without enforcement would be fake UI |
| 5 | BotConfig: anti-spam delay queue | Rejected (unsafe duplicate) | `WaSender` pacing + daily limits are authoritative; a second delay layer double-throttles and changes send behavior |
| 6 | BotConfig: `botMode`/`botAllowedJids`/`botBlockedJids` | Partially implemented | Staff `#` commands + opt-outs + staff keyword rules already enforce precedence; per-JID allow/block lists not carried over (no verified gym use-case) |
| 7 | AutoReply rules (EXACT/CONTAINS/REGEX, scope) | Implemented (earlier phase) | Adapter + legacy CRUD, flag-gated |
| 8 | AutoReply `STARTS_WITH`, media attachments | Missing | No verified gym demand; adapter `matchType` union is EXACT/CONTAINS/REGEX (contract) |
| 9 | Scheduler (one-time + cron) | Existing | `ScheduledMessagesCard`, `scheduled-message.service` — untouched |
| 10 | Broadcast campaigns | Existing | `/broadcasts` + `broadcast.service` — untouched |
| 11 | Webhooks CRUD + logs + HMAC signing | Existing | `WebhooksController`, `WebhookSubscription`/`WebhookDelivery`, `WebhooksCard` — untouched |
| 12 | Chat/text/media send APIs | Existing | Inbox, `message-composer`, scheduled sends — untouched |
| 13 | Contacts/groups/labels per session | Partial | Contacts search implemented (Phase A); groups read-only implemented (Phase A.2); labels missing (no verified demand) |
| 14 | Media library / on-disk media | Partial | Generic file service reused; WhatsApp-specific library not built (no demand evidence) |
| 15 | System monitor / users / API keys / SUPERADMIN | Out of scope | Platform concepts, not gym-tenant features |

Nothing is marked integrated unless code + tests exist above. Items 3–5, 8, 14 are documented blockers, not roadmap promises.
