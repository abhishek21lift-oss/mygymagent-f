# WhatsApp Implementation Plan (remaining work)

## Done (this round)
BotConfig persistence/API/UI, flag-gated ping/uptime/welcome inbound
automation, automation-activity observability, groups + contacts + webhooks
(Phase A–A.2), overview dashboard + topbar shortcut.

## Deliberately not built (blockers documented in WA_AKG_BOT_INVENTORY.md)
1. **Media beyond text+image** (PDF/audio/video/sticker sending): `WaSendContent`
   is text|image only; no converter dep in backend. Requires sender-pipeline
   extension — high blast radius, needs its own approved phase with abuse
   review (stickers/voice are classic spam vectors).
2. **Presence behaviors** (online/auto-read/ghost): new Baileys surface +
   observable behavior change for all tenants.
3. **Anti-spam settings UI**: would duplicate `WaSender` authority.
4. **Per-JID allow/block lists, STARTS_WITH match, labels**: no verified
   gym demand; staff rules + opt-outs cover the need.
5. **Orphaned-IQ tightening** (single-flight/timeout tuning): monitor
   first; no evidence of harm at 40/min throttle.

## Before release
- Pushed-branch CI: backend E2E, frontend build.
- Staging smoke with linked test number: groups list, ping/uptime/welcome,
  `#stop` silencing, cross-tenant negative checks.
- Keep `WHATSAPP_ADAPTER_ENABLED=false` until staging passes.
