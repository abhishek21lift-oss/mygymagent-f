# API Compatibility Matrix: WA-AKG vs MyGymAgent

This matrix compares the REST API endpoints exposed by WA-AKG and the existing MyGymAgent backend (via `WhatsAppService` and `CommunicationsService`). Endpoints are grouped by resource.

## Conventions
- **WA-AKG**: Endpoints are under `/api/` in the Next.js app router (e.g., `/api/chat/[sessionId]/[jid]`).
- **MyGymAgent**: Endpoints are under the NestJS app; we inspect the relevant controllers (`WhatsAppController`, `CommunicationsController`).
- **Compatibility**:
  - **Full**: Same purpose, same request/response shape (after minor field mapping).
  - **Partial**: Same resource but different parameters or response structure; requires adapter.
  - **None**: No equivalent endpoint.
  - **Extra**: Exists only in one system.

## Sessions / Connection Status
| Feature | WA-AKG Endpoint | MyGymAgent Endpoint | Compatibility | Notes |
|---------|-----------------|---------------------|---------------|-------|
| Get session status (connected, QR, etc.) | `GET /api/session/[sessionId]`? (Not directly; status via `whatsapp-web-card` likely uses internal state) | `GET /whatsapp/:organizationId/integration` (via `WhatsappService.getIntegration`) | Partial | WA-AKG likely exposes status via Socket.IO or via session object in other endpoints; MyGymAgent has dedicated endpoint returning status, phoneNumber, etc. |
| Generate QR code | `GET /api/session/[sessionId]/qr` (inferred from Socket.IO handling) | Not exposed directly; QR is handled via `whatsapp-web-card` which likely calls backend to get QR data (maybe via `whatsapp-web` module) | Partial | Both can produce QR; WA-AKG stores QR in Redis and serves via API? Need to verify. |
| Connect / Start session | `POST /api/session/[sessionId]/start` (via manager startSession) | `POST /whatsapp/:organizationId/connect`? Not present; connection is initiated via scanning QR from UI; backend `disconnect` exists. | Partial | WA-AKG has explicit start/stop; MyGymAgent relies on UI to trigger Baileys connection via `WaSessionManager` (maybe via a gateway). |
| Disconnect / Stop session | `POST /api/session/[sessionId]/stop` | `POST /whatsapp/:organizationId/disconnect` (via `WhatsappService.disconnect`) | Full | Both stop the WhatsApp session and clear credentials (WA-AKG also deletes auth state). |
| Get session settings (daily limit, bot config) | `GET /api/settings` (user-specific) | Not directly exposed; settings are read via multiple endpoints (e.g., `whatsapp-web-card` fetches auto-replies, webhooks). | Partial | Settings are scattered; WA-AKG has a consolidated settings endpoint. |

## Messaging
| Feature | WA-AKG Endpoint | MyGymAgent Endpoint | Compatibility | Notes |
|---------|-----------------|---------------------|---------------|-------|
| Send text message | `POST /api/chats/[sessionId]/messages`? (Not found; sending likely via WebSocket or internal) | `POST /communications/send` (via `CommunicationsService.send` with channel WHATSAPP) via `WhatsAppService.sendMessage` | Partial | WA-AKG may send via `waManager.sendMessage` internal; need to confirm if there is an HTTP send endpoint. MyGymAgent uses the communications abstraction. |
| Send media message | Similar as above | Same as above | Partial |  |
| Get message history | `GET /api/chats/[sessionId]/[jid]` (GET returns paginated messages) | Not directly exposed; message history likely fetched via other modules (e.g., chat UI) not in WhatsApp settings. | None / Partial | MyGymAgent may not expose message history via WhatsApp-specific endpoint; could be in communications or module-specific. |
| Mark message as read | `POST /api/chats/[sessionId]/[jid]/[messageId]/read`? Not seen | Not exposed | None |  |
| Delete message | `POST /api/chats/[sessionId]/[jid]/[messageId]/delete`? Not seen | Not exposed | None |  |

## Contacts
| Feature | WA-AKG Endpoint | MyGymAgent Endpoint | Compatibility | Notes |
|---------|-----------------|---------------------|---------------|-------|
| List contacts | `GET /api/contacts/[sessionId]` (returns list with name, notify, profilePic) | `GET /whatsapp/:organizationId/contacts` (via `WhatsappService.listContacts`) | Full | Both return similar data (jid, name, notify, profilePic). WA-AKG may include extra fields. |
| Get contact picture | `GET /api/contacts/[sessionId]/[jid]/picture` | `GET /whatsapp/:organizationId/contact-picture` (via `WhatsappService.contactPicture`) | Full | Both return image URL or binary. |
| Search contacts | `GET /api/contacts/[sessionId]?search=...` | Not exposed directly | Partial | MyGymAgent may not have search; WA-AKG does. |

## Groups
| Feature | WA-AKG Endpoint | MyGymAgent Endpoint | Compatibility | Notes |
|---------|-----------------|---------------------|---------------|-------|
| List groups | `GET /api/groups/[sessionId]` | Not exposed | None | MyGymAgent may not expose groups via WhatsApp settings. |
| Get group metadata | `GET /api/groups/[sessionId]/[jid]` | Not exposed | None |  |
| Update group subject/description | `POST /api/groups/[sessionId]/[jid]` | Not exposed | None |  |

## Webhooks
| Feature | WA-AKG Endpoint | MyGymAgent Endpoint | Compatibility | Notes |
|---------|-----------------|---------------------|---------------|-------|
| List webhooks | `GET /api/webhooks` | Not exposed (MyGymAgent may not have outgoing webhook config for WhatsApp) | None / Extra | WA-AKG allows configuring outgoing webhooks for events; MyGymAgent uses internal event system (DomainEvent) for logging. |
| Create webhook | `POST /api/webhooks` | Not exposed | None |  |
| Update webhook | `PUT /api/webhooks/[webhookId]` | Not exposed | None |  |
| Delete webhook | `DELETE /api/webhooks/[webhookId]` | Not exposed | None |  |
| Get webhook delivery logs | `GET /api/webhook-logs` | Not exposed | None |  |

## Auto-replies
| Feature | WA-AKG Endpoint | MyGymAgent Endpoint | Compatibility | Notes |
|---------|-----------------|---------------------|---------------|-------|
| List auto-replies | `GET /api/autoreplies/[sessionId]` | `GET /whatsapp/:organizationId/auto-replies` (via `auto-replies-card` fetching from backend?) | Partial | Need to confirm MyGymAgent endpoint; likely exists. |
| Create auto-reply | `POST /api/autoreplies/[sessionId]` | `POST /whatsapp/:organizationId/auto-replies` | Partial |  |
| Update auto-reply | `PUT /api/autoreplies/[sessionId]/[id]` | `PUT /whatsapp/:organizationId/auto-replies/[id]` | Partial |  |
| Delete auto-reply | `DELETE /api/autoreplies/[sessionId]/[id]` | `DELETE /whatsapp/:organizationId/auto-replies/[id]` | Partial |  |

## Bot Configuration
| Feature | WA-AKG Endpoint | MyGymAgent Endpoint | Compatibility | Notes |
|---------|-----------------|---------------------|---------------|-------|
| Get bot config | `GET /api/botconfig/[sessionId]` | Not exposed | None | MyGymAgent may not expose bot config via WhatsApp settings. |
| Update bot config | `PUT /api/botconfig/[sessionId]` | Not exposed | None |  |

## Media
| Feature | WA-AKG Endpoint | MyGymAgent Endpoint | Compatibility | Notes |
|---------|-----------------|---------------------|---------------|-------|
| Upload media | `POST /api/media/[sessionId]` | `POST /files/upload` (generic file upload) then pass `mediaKey` to WhatsApp send | Partial | WA-AKG likely stores media via its own `File` model; MyGymAgent uses generic file service. |
| Download media | `GET /api/media/[sessionId]/[mediaId]` | `GET /files/[key]` | Partial |  |

## Miscellaneous
| Feature | WA-AKG Endpoint | MyGymAgent Endpoint | Compatibility | Notes |
|---------|-----------------|---------------------|---------------|-------|
| Get system info (timezone, app name) | `GET /api/system` | Not exposed | None |  |
| Health check | `/api/health` | `/health` (generic) | Full | Both have health endpoints. |

## Summary
- WA-AKG offers a far richer set of administrative endpoints (groups, webhooks, bot config, media, system) than MyGymAgent's current WhatsApp-specific backend.
- MyGymAgent's backend focuses on sending messages via the communications abstraction and provides basic session/status/contact endpoints needed for the settings UI.
- To integrate WA-AKG's features, we would need to either:
  1. Expose missing endpoints in MyGymAgent's backend (mapping to existing internal services or implementing new ones), or
  2. Have the frontend call WA-AKG's API directly (with proper authentication and tenant scoping) for features not covered by MyGymAgent's backend, while keeping sending/receiving through MyGymAgent's Baileys layer to avoid duplicate connections.

Given the requirement to preserve existing providers and avoid duplicate WhatsApp connections, the preferred approach is to keep the WhatsApp sending/receiving pipeline in MyGymAgent's backend (Baileys via `WaAkgProvider`/`WaSessionManager`) and use WA-AKG's API only for administrative UI where possible, adapting its endpoints to call into MyGymAgent's existing services.

