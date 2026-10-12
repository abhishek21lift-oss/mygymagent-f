# WhatsApp Integration Contract (Phase 1)

This document defines the integration contract for adding WA‑AKG‑style administrative features to the MyGymAgent WhatsApp system while preserving the existing Baileys‑based messaging pipeline. The contract specifies the endpoints, their ownership, security rules, data contracts, and non‑functional requirements that must be satisfied during implementation.

## 1. Goals and Non‑Goals

### Goals
- Expose a coherent, tenant‑scoped API for managing WhatsApp configuration (auto‑replies, webhooks, bot settings, groups, media, session status, QR/pairing codes) without duplicating the underlying WhatsApp sending/receiving mechanism.
- Preserve the existing Baileys session manager (`WaSessionManager`) and the `WaAkgProvider` as the sole path for sending and receiving WhatsApp messages.
- Ensure every API call is authenticated and authorized at the organization level; no cross‑tenant data leakage.
- Keep the contract backward‑compatible: existing endpoints (`/whatsapp/integration`, `/whatsapp/messages`, etc.) remain unchanged.
- Provide clear error semantics and idempotency guarantees where applicable.

### Non‑Goals
- Do not replace or bypass the existing Baileys connection management.
- Do not expose internal Baileys sockets, credentials, or raw session state to clients.
- Do not create a second message‑sending pipeline (e.g., direct HTTP to WhatsApp Cloud API) that would run in parallel with the Baileys‑based sender.
- Do not modify the existing WhatsApp Cloud API (Meta) integration if present; it remains outside the scope of this contract.
- Do not alter the database schema in Phase 1; schema changes are deferred to Phase 2.

## 2. API Ownership Matrix

The following table lists the endpoints that will be introduced under the new WhatsApp Adapter (`WhatsAppAdapterController`). All endpoints are prefixed with `/api/whatsapp-adapter` (or an equivalent mount point) to avoid collision with existing WhatsApp endpoints.

| HTTP Method | Endpoint | Description | Owner (Service) | Notes |
|-------------|----------|-------------|-----------------|-------|
| GET | `/api/whatsapp-adapter/session/status` | Returns connection status, phone number, and (if applicable) QR code and pairing code. | `WhatsAppAdapterService` (delegates to `WhatsappService.getIntegration` + `WaSessionManager.codes`) | Status values: `CONNECTED`, `DISCONNECTED`, `PAIRING`, `LOGGED_OUT`, `NOT_CONNECTED`. |
| GET | `/api/whatsapp-adapter/contacts` | Lists contacts for the organization's WhatsApp number, with optional search and pagination. | `WhatsAppAdapterService` (extends `WhatsappService.listContacts` with search) | Returns array of `{ jid, name, notify, profilePic }`. |
| GET | `/api/whatsapp-adapter/contacts/:jid/picture` | Returns the profile picture URL or binary for a given contact JID. | `WhatsAppAdapterService` (delegates to `WhatsappService.contactPicture`) | |
| GET | `/api/whatsapp-adapter/auto-replies` | Lists auto‑reply rules for the organization. | `WhatsAppAdapterService` (reads `AutoReply` table) | Requires `AutoReply` table (to be added in Phase 2). |
| POST | `/api/whatsapp-adapter/auto-replies` | Creates a new auto‑reply rule. | `WhatsAppAdapterService` (creates `AutoReply` row) | |
| PATCH | `/api/whatsapp-adapter/auto-replies/:id` | Updates an existing auto‑reply rule. | `WhatsAppAdapterService` (updates `AutoReply` row) | |
| DELETE | `/api/whatsapp-adapter/auto-replies/:id` | Deletes an auto‑reply rule. | `WhatsAppAdapterService` (deletes `AutoReply` row) | |
| GET | `/api/whatsapp-adapter/webhooks` | Lists outgoing webhook configurations. | `WhatsAppAdapterService` (reads `Webhook` table) | Requires `Webhook` and `WebhookLog` tables (Phase 2). |
| POST | `/api/whatsapp-adapter/webhooks` | Creates a new outgoing webhook. | `WhatsAppAdapterService` (creates `Webhook` row) | |
| PATCH | `/api/whatsapp-adapter/webhooks/:id` | Updates an outgoing webhook. | `WhatsAppAdapterService` (updates `Webhook` row) | |
| DELETE | `/api/whatsapp-adapter/webhooks/:id` | Deletes an outgoing webhook. | `WhatsAppAdapterService` (deletes `Webhook` row) | |
| GET | `/api/whatsapp-adapter/bot/config` | Returns the bot configuration for the organization's WhatsApp session. | `WhatsAppAdapterService` (joins `Session` → `BotConfig`) | |
| PATCH | `/api/whatsapp-adapter/bot/config` | Updates the bot configuration. | `WhatsAppAdapterService` (upserts `BotConfig` row) | |
| GET | `/api/whatsapp-adapter/groups` | Lists groups the WhatsApp number is a member of (read‑only). | `WhatsAppAdapterService` (reads `Group` table) | Returns `{ jid, subject }`. |
| POST | `/api/whatsapp-adapter/media/upload` | Uploads a media file (image/video/document) and returns a `mediaKey`. | `WhatsAppAdapterService` (delegates to existing `FileStorageService`) | Reuses existing upload endpoint; returns `{ mediaKey: string }`. |
| GET | `/api/whatsapp-adapter/media/:mediaKey` | Streams or returns metadata for a previously uploaded media file. | `WhatsAppAdapterService` (delegates to existing file download) | |

### Existing Endpoints (Unchanged)

| HTTP Method | Endpoint | Description | Owner |
|-------------|----------|-------------|-------|
| GET | `/whatsapp/integration` | Returns WhatsApp integration status (same fields as `getIntegration`). | `WhatsappService.getIntegration` |
| POST | `/whatsapp/messages` | Sends a WhatsApp message (text/media). | `WhatsappService.sendMessage` → `WaAkgProvider` → `WaSender` |
| POST | `/whatsapp/test-send` | Sends a test message via the template pipeline. | `WhatsappService.testSend` |
| POST | `/whatsapp/disconnect` | Disconnects the WhatsApp session. | `WhatsappService.disconnect` |
| GET | `/whatsapp/contacts` | Lists contacts (legacy; may be kept for compatibility). | `WhatsappService.listContacts` |
| GET | `/whatsapp/contact-picture` | Returns contact picture. | `WhatsappService.contactPicture` |
| GET | `/whatsapp/auto-replies` | Lists auto‑replies (if already present). | TBD |
| POST | `/whatsapp/auto-replies` | Creates auto‑reply. | TBD |
| ... | ... | ... | ... |

> **Note:** The existing endpoints under `/whatsapp/` are preserved exactly as they are. The new adapter endpoints live under a separate prefix to avoid any risk of breaking changes.

## 3. Provider Capability Matrix

The adapter does not change the underlying provider for sending/receiving messages. It uses the existing `WaAkgProvider` (which in turn uses the `WaSender` and `WaSessionManager` to talk to Baileys). Therefore, the capability matrix for **message transmission** remains:

| Capability | Meta Cloud API (Existing) | Baileys (via WaAkgProvider) | Notes |
|------------|--------------------------|-----------------------------|-------|
| Send text message | ✅ (via template pipeline) | ✅ (direct via Baileys) | MyGymAgent currently uses Baileys for all WhatsApp sends; the Meta Cloud API path is not used in the current codebase (the `WaAkgProvider` is the only WhatsApp provider bound to `WHATSAPP_PROVIDER` in `CommunicationsModule`). |
| Send media (image) | ✅ (via template) | ✅ (via Baileys) | Limited to images in the current `assertSendableImage` check (P1 sends images only). |
| Receive messages (inbound) | ❌ (not configured) | ✅ (via Baileys event listeners) | Inbound messages are processed by the `whatsapp-web` module (inbound listener) and stored in `messageLog` as inbound. |
| Delivery receipts (sent → delivered → read) | ❌ | ✅ (via Baileys) | Receipts update `messageLog.status`. |
| Typing indicators, presence | ❌ | ✅ (Baileys provides) | Not currently exposed in MyGymAgent. |
| Group management (create, update, leave) | ✅ (Meta Cloud API) | ❌ (Baileys does not support group creation via unofficial client) | MyGymAgent does not expose group mutation; only listing groups is possible via Baileys (they are synced to the `Group` table). |
| Changing profile picture / status | ❌ | ✅ (Baileys can) | Not exposed. |
| Setting webhooks (outbound) | ✅ (Meta Cloud API) | ❌ (Baileys does not) | MyGymAgent does not currently have outgoing webhook configuration; the adapter will introduce a `Webhook` table and a simple HTTP‑POST webhook dispatcher that fires on DomainEvents (e.g., `WhatsappSent`, `WhatsappReceived`). This is **not** a replacement for Meta Cloud API webhooks; it is an internal notification mechanism. |
| Auto‑replies | ❌ (Meta Cloud API has away messages only) | ❌ (Baileys does not) | Auto‑replies are implemented entirely in the application layer (via the `whatsapp-web` module's inbound listener or a separate listener). The adapter will expose CRUD for the `AutoReply` table. |
| Bot commands / custom keywords | ❌ | ❌ | Handled by application logic (e.g., `whatsapp-web` module's command listener). The adapter will expose the `BotConfig` table (already linked to `Session`). |

**Conclusion:** The adapter will **not** introduce a new provider; it will simply expose configuration and status for the existing Baileys‑based provider. All message sending/receiving continues to flow through the existing `WaAkgProvider` → `WaSender` → `WaSessionManager` → Baileys socket.

## 4. Tenant Authorization Rules

All adapter endpoints must enforce the following rules:

1. **Authentication**: The request must include a valid authentication token (JWT or session cookie) that identifies a `User`.
2. **Organization Extraction**: The `organizationId` is derived from the authenticated user's `organizationId` field (or via a join from `User` → `Organization`). **Never** trust a client‑supplied `organization_id` parameter.
3. **Permission Check**: The user must have a permission that grants them the ability to manage WhatsApp for the organization. Recommended permission: `whatsapp.manage` (already used by existing endpoints like `sendMessage`, `disconnect`, `getIntegration`).
4. **Resource Ownership**: For any endpoint that operates on a specific resource (e.g., updating an auto‑reply by `id`), the service must verify that the resource belongs to the organization (e.g., `WHERE organizationId = :organizationId AND id = :id`). This prevents Insecure Direct Object References (IDOR).
5. **Session‑Level Resources**: For resources tied to a specific WhatsApp session (e.g., bot config, QR code), the service must first resolve the organization's `waSession` record (via `organizationId`) and then ensure the requested resource is linked to that session.

If any of these checks fails, the endpoint must return:
- `401 Unauthorized` if authentication is missing or invalid.
- `403 Forbidden` if the user is authenticated but lacks the required permission or the resource does not belong to their organization.
- `404 Not Found` if the requested resource does not exist (or exists but belongs to another organization, to avoid leaking existence).

## 5. Session Lifecycle and QR/Pairing Handling

The adapter will **not** manage the Baileys socket lifecycle; it will only read state from the existing `WaSessionManager` and `WhatsappService`.

### 5.1 Status Endpoint
`GET /api/whatsapp-adapter/session/status` returns:
- `status`: one of `CONNECTED`, `DISCONNECTED`, `PAIRING`, `LOGGED_OUT`, `NOT_CONNECTED` (mirroring the values from `WaSessionManager.getStatus` and `waSession.status`).
- `phoneNumber`: the registered phone number (from `waSession.phoneNumber`).
- `displayPhoneNumber`: same as `phoneNumber` when `status === 'CONNECTED'`, else `null`.
- `qrDataUrl`: a data URL (base64 PNG) of the current QR code, if the session is in `PAIRING` state (i.e., a QR is available in Redis). Otherwise `null`.
- `pairingCode`: the current pairing code (numeric string) if available in Redis, else `null`.
- `connectedAt`, `createdAt`, `updatedAt`: timestamps from the `waSession` record.

The service will:
1. Call `this.whatsapp.getIntegration(organizationId)` to get base status and session timestamps.
2. Call `this.waSessionManager.codes(organizationId)` to obtain the raw QR string and pairing code from Redis.
3. Convert the QR string to a data URL using `QRCode.toDataURL` (if present).
4. Return the assembled object.

### 5.2 Pairing Flow (User‑Initiated)
1. User opens WhatsApp settings page; the frontend calls the status endpoint.
2. If status is `DISCONNECTED` or `NOT_CONNECTED`, the UI shows a “Link WhatsApp Number” button.
3. Clicking the button triggers the frontend to call the **existing** `/whatsapp/disconnect` endpoint (if needed) and then simply displays the QR and pairing code from the status endpoint (the pairing process is started by the user scanning the QR with their phone; the backend does not need to initiate anything beyond making the QR available).
4. When the user scans the QR, the Baileys socket (managed by `WaSessionManager`) receives the pairing request, completes authentication, and updates the session to `CONNECTED`.
5. The status endpoint will then reflect `CONNECTED` and the QR/pairing fields will become `null`.

Thus, the adapter does **not** add any new pairing logic; it merely exposes the QR and pairing code that the existing `WaSessionManager` already produces.

## 6. Message Idempotency

The existing WhatsApp sending pipeline already provides idempotency via the `messageLog` table:

- When a send request is received, `CommunicationsService.createMessageLog` creates a row with `status = 'PENDING'`.
- The `WaAkgProvider` sends a `providerMessageId` (the Baileys message key) back to the sender upon successful send.
- The `WaSendProcessor` updates the `messageLog` row with `status = 'SENT'` and stores the `providerMessageId`.
- Inbound receipts (from Baileys) update the same row to `DELIVERED`/`READ`.
- If a send request is retried (e.g., due to a transient failure), the same `messageLogId` is used (the caller passes it in), preventing duplicate logs.

The adapter **does not** introduce any new message‑sending endpoints; it reuses the existing `/whatsapp/messages` endpoint. Therefore, the idempotency guarantees remain unchanged.

## 7. Webhook Contracts (Outgoing)

The adapter will introduce a simple outgoing webhook feature that is **internal to MyGymAgent** (not a replacement for Meta Cloud API webhooks). It will:

- Allow an administrator to configure a webhook URL and a secret (for HMAC‑SHA256 signing).
- Subscribe to a set of DomainEvents (e.g., `WhatsappSent`, `WhatsappReceived`, `WhatsappFailed`, `ConnectionUpdated`).
- When an event occurs, compute an HMAC signature of the payload (using the secret) and POST a JSON payload to the configured URL.
- Include headers: `X-Signature: sha256=<hex>`, `X-Event-Type: <event>`, `X-Delivery-Id: <uuid>`.
- Attempt delivery with retries (exponential backoff, limited attempts) and log successes/failures to a `WebhookLog` table.
- Provide an endpoint to list webhook configurations and their recent delivery logs.

This feature is **optional** and will be gated by a feature flag (default `false`). It does not interfere with any existing internal event handling (e.g., analytics, audit logs) because it merely publishes additional events.

## 8. Error Semantics

All adapter endpoints must follow the same error‑handling pattern as the existing MyGymAgent backend:

| Condition | HTTP Status | Error Body Shape |
|-----------|-------------|------------------|
| Missing/invalid authentication token | 401 | `{ statusCode: 401, message: "Unauthorized" }` |
| Authenticated but missing required permission (`whatsapp.manage`) | 403 | `{ statusCode: 403, message: "Forbidden" }` |
| Resource not found (or does not belong to org) | 403 (to avoid leaking existence) or 404 if existence is not sensitive | `{ statusCode: 403/404, message: "Not found" }` |
| Validation failure (DTO) | 400 | `{ statusCode: 400, message: "<validation error>" }` |
| WhatsApp not connected (when attempting an operation that requires a live session) | 503 | `{ statusCode: 503, message: "WhatsApp session not connected" }` |
| Internal server error (unexpected exception) | 500 | `{ statusCode: 500, message: "Internal server error" }` |

The adapter must catch all exceptions and map them appropriately; never leak stack traces or internal details.

## 9. Feature Flags

All new functionality exposed via the adapter must be behind a feature flag that defaults to `false` (disabled). The flag can be toggled via environment variable or database setting (to be decided in Phase 2). Example flag name: `FEATURE_WHATSAPP_ADAPTER`.

When the flag is disabled:
- The adapter controller routes are not registered (or return 404).
- The UI does not display controls for the new features.
- Existing WhatsApp functionality remains unaffected.

This allows safe rollout and testing in staging before enabling in production.

## 10. Security Controls (Invariants)

The implementation must uphold the following invariants, verified by tests and code review:

- **I1. Organization Scoping**: Every database query in the adapter includes a `WHERE organizationId = :organizationId` clause (or equivalent join) for all tables (`waSession`, `AutoReply`, `Webhook`, `WebhookLog`, `Group`, `BotConfig`, `File` etc.).
- **I2. No Credential Leakage**: Logs and error messages never contain raw Baileys auth state (`creds.json` or `keys.json`), API keys, or secrets.
- **I3. Rate Limiting Preserved**: The adapter does not bypass the `WaSender`’s minimum gap (`MIN_GAP_MS`) or daily limit (`dailyLimit`) checks.
- **I4. No Duplicate Baileys Connections**: The adapter never instantiates a new `WaSocket` or `WaSessionManager`; it only reads from the existing singleton instances.
- **I5. Webhook Signature Integrity**: If outgoing webhooks are enabled, signatures are verified using HMAC‑SHA256 with a strong secret; timestamps are validated to prevent replay.
- **I6. Input Sanitization**: All user‑supplied strings (e.g., auto‑reply keywords, webhook URLs) are validated for length and format; no SQL or NoSQL injection possible.
- **I7. Audit Trail**: Changes to configuration (auto‑replies, webhooks, bot config) generate a DomainEvent or are logged via the existing audit mechanism (to be decided).

## 11. Acceptance Tests (To Be Written in Phase 2)

The following test scenarios must be covered by automated unit/integration tests:

### 10.1 Authentication & Authorization
- Unauthenticated requests to any adapter endpoint return 401.
- Authenticated user lacking `whatsapp.manage` permission returns 403.
- User attempts to access another organization's auto‑reply/webhook/group returns 403/404 (no leakage).

### 10.2 Session Status Endpoint
- Returns correct status when Baileys socket is `CONNECTED`, `DISCONNECTED`, `PAIRING`, `LOGGED_OUT`.
- QR code and pairing code are present only when appropriate.
- Data URL is correctly formatted and decodes to a valid PNG.

### 10.3 Auto‑Reply CRUD
- Creating an auto‑reply persists to the DB and is retrievable via list.
- Updating an auto‑reply modifies the record.
- Deleting removes the record.
- Attempting to update/delete a non‑existent or cross‑tenant record returns 403/404.
- Validation rejects empty keyword or excessively long response.

### 10.4 Webhook CRUD (if enabled)
- Similar to auto‑reply tests, plus verification that payloads are signed and sent to the configured URL (using a mock server in tests).
- Webhook logs record success/failure and response details.

### 10.5 Media Upload/Download
- Uploading a valid image returns a `mediaKey` that can be used in an existing `/whatsapp/messages` send request.
- Downloading returns the correct file bytes or metadata.
- Rejects non‑image files if the backend enforces image‑only for WhatsApp (to be checked).

### 10.6 Groups Endpoint
- Returns a list of groups the session is a member of (jid and subject).
- Returns empty list if no groups.
- Does not expose group mutation endpoints.

### 10.7 Feature Flag
- When flag is disabled, all adapter endpoints return 404 (or are not registered).
- When flag is enabled, endpoints are accessible subject to auth/z.

### 10.8 Integration with Existing Flow
- Sending a message via `/whatsapp/messages` still works and uses the Baileys pipeline.
- The adapter’s status endpoint reflects the true connection state.
- No increase in the number of Baileys sockets per organization (verified via mocking or inspection).

## 12. Rollback Plan (Post‑Phase 2)

Since Phase 1 forbids database migrations, the rollback plan for a future Phase 2 that introduces the schema changes is:

1. **Code Rollback**: Revert the adapter service, controller, DTOs, and any related utility files.
2. **Database Rollback**: Execute the inverse migration (drop the newly added tables: `AutoReply`, `Webhook`, `WebhookLog`, and any columns added to existing tables for the adapter, if any).
3. **Feature Flag**: Ensure the feature flag defaults to `false` so that even if the code is accidentally left enabled, the adapter routes are inactive.
4. **Frontend**: Revert any UI changes that call the adapter endpoints; the existing WhatsApp settings UI will continue to work with the original endpoints.
5. **Backward Compatibility**: Because the adapter only adds new endpoints and does not modify existing ones, rolling back the adapter does not affect the core WhatsApp sending/receiving flow.

If, during Phase 2, we discover that the schema changes are not backward‑compatible (e.g., we need to rename a column), we will produce a migration script that is safe to run and can be rolled back using Prisma’s migration system.

## 13. Files That Would Change in Phase 2 (Implementation)

The following files are expected to be added or modified when moving to Phase 2 (implementation). This list is for planning purposes only; **no changes to these files should be made during Phase 1**.

### Backend (`mygymagent-b`)
- `src/whatsapp-adapter/whatsapp-adapter.service.ts` (new)
- `src/whatsapp-adapter/whatsapp-adapter.controller.ts` (new)
- `src/whatsapp-adapter/dto/` (new directory with DTOs for auto‑reply, webhook, bot config, media, etc.)
- `src/whatsapp-adapter/whatsapp-adapter.module.ts` (new)
- `src/app/whatsapp-adapter/whatsapp-adapter.controller.ts` (if using a different mount point; adjust as needed)
- Migrations: `prisma/migrations/xxxxxxxxxxxx_add_whatsapp_adapter_tables/migration.sql` (new)
- Potential updates to `src/whatsapp/whatsapp.service.ts` if we need to expose a method for getting QR/pairing codes (but we can use `WaSessionManager` directly).
- Updates to `src/app/whatsapp/whatsapp.controller.ts` only if we decide to alias the adapter under the existing `/whatsapp` prefix (not recommended; we keep separate prefix).
- Updates to `src/lib/types/whatsapp.ts` (if needed to add new DTO types, but we can keep them in the adapter module).

### Frontend (`mygymagent-f`)
- `src/lib/hooks/use-whatsapp-adapter.ts` (new custom hooks for each resource)
- Updates to `src/app/(session)/(app)/settings/whatsapp/` cards:
  - `auto-replies-card.tsx`: add create/edit/delete functionality using the new hooks.
  - `webhooks-card.tsx`: add webhook CRUD and log display.
  - Optional: `bot-config-card.tsx` (new) to manage bot settings.
  - Optional: `groups-card.tsx` (new) to show group list.
  - Optional: `media-card.tsx` (new) for media upload/download.
- Updates to `src/app/(session)/(app)/settings/whatsapp/page.tsx` to route to the new cards/tabs.
- Potential updates to `src/app/(session)/(app)/settings/whatsapp/whatsapp-web-card.tsx` if we want to show QR/pairing code there (already shows via status?).
- Updates to `src/lib/types/whatsapp.ts` (if needed to add new types for adapter resources; otherwise keep in adapter-specific types).

### Testing
- Unit tests for the new adapter service and controller.
- Integration tests for the endpoints (using NestJS testing utilities).
- Frontend unit tests for the new hooks and components (using Jest/React Testing Library).
- E2E test scenarios (if the test framework supports) for the new features.

## 14. Risks and Mitigations (Relevant to Phase 1 Deliverables)

Even though we are not writing code in Phase 1, we must ensure that the contract we define does not introduce unacceptable risks. The following risks have been considered and mitigated in the contract:

| Risk | Mitigation in Contract |
|------|------------------------|
| **Accidental duplicate Baileys connection** | The adapter only reads from the existing `WaSessionManager` and never creates a new `WaSocket`. The contract explicitly forbids instantiating new Baileys resources. |
| **Credential leakage via logs or error messages** | Error semantics section mandates sanitized messages; no logging of raw secrets. |
| **Rate limiting bypass** | The adapter does not expose any new send endpoints; sending continues through the existing `WaSender` which enforces pacing and daily limits. |
| **Cross‑tenant data access** | Tenant authorization rules require organizationId scoping on every query and ownership checks on resources. |
| **Insecure webhook handling** | The outgoing webhook feature (if enabled) uses HMAC signatures, timestamp validation, and retry limits; it is optional and disabled by default. |
| **Silent provider fallback** | The contract preserves the existing `WaAkgProvider` as the sole WhatsApp provider; no fallback to another provider is introduced. |
| **Database schema lock‑in during Phase 1** | No schema changes are permitted in Phase 1; all table additions are deferred to Phase 2 with a clear migration plan. |
| **Feature flag not respected** | The contract requires that the adapter controller checks the feature flag and returns 404 (or does not register routes) when disabled. |

## 15. Conclusion

This integration contract provides a clear, secure, and backward‑compatible path to bring WA‑AKG’s administrative features into the MyGymAgent WhatsApp system. By keeping the existing Baileys‑based messaging pipeline intact and exposing only configuration and status through a tenant‑scoped adapter layer, we satisfy the goals of preserving reliability, avoiding duplicate connections, and maintaining strict tenant isolation.

Please review this contract. If it meets with your approval, we will proceed to Phase 2—implementation—where we will write the code, run migrations, and update the frontend accordingly.

--- 

*End of Phase 1 Deliverable*  