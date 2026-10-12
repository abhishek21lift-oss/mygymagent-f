# Implementation Plan: Integrating WA-AKG Features into MyGymAgent WhatsApp System

## Goal
Enable the MyGymAgent webapp to configure, connect, operate, and monitor WhatsApp functionality using a secure, tenant‑isolated architecture that preserves the existing Baileys‑based WhatsApp Web integration (via `WaAkgProvider`/`WaSessionManager`) while incorporating valuable administrative features from WA-AKG (auto‑replies, webhooks, bot configuration, media management, groups, etc.).

## Guiding Principles
1. **Preserve Existing WhatsApp Pipeline**: Keep the Baileys session management in `mygymagent-b` as the sole sender/receiver of WhatsApp messages to avoid duplicate connections and protocol conflicts.
2. **Tenant Isolation at Every Layer**: All API endpoints must derive `organizationId` from the authenticated user's context (JWT/session) and verify ownership before accessing any resource.
3. **Backward Compatibility**: Do not break existing contracts; new features should be additive and default to disabled unless explicitly enabled.
4. **Least Privilege**: Expose only the minimum necessary functionality via new endpoints; avoid exposing internal Baileys sockets or raw credentials.
5. **Reuse Where Possible**: Map WA-AKG's features to existing MyGymAgent services or extend them minimally; avoid rewriting core logic.
6. **Observable & Operable**: Add logging, metrics, and health checks for new codepaths; ensure failures are visible and actionable.

## Phased Approach

### Phase 0: Preparation (Completed)
- Audit WA-AKG and MyGymAgent repositories (see `audit-report.md`, `api-compatibility-matrix.md`, `threat-model.md`).
- Identify reusable components and gaps.
- Define integration contract and data flow.
- Obtain stakeholder approval for the scoped implementation.

### Phase 1: Define Integration Contract
We will create a thin adapter layer in `mygymagent-b` that exposes WA‑AKG‑style administrative endpoints while delegating to existing services.

#### 1.1 Adapter Interface (TypeScript)
Create `src/whatsapp-adapter/whatsapp-adapter.service.ts` with methods matching WA‑AKG's administrative API:
- `getSessionStatus(organizationId)` → returns `{ status, phoneNumber, qrDataUrl?, pairingCode? }` (maps to existing `getIntegration` and QR/ pairing logic from `WaSessionManager`).
- `listContacts(organizationId, limit?, search?)` → extends existing `listContacts` with search.
- `getContactPicture(organizationId, jid)` → reuse existing.
- `listAutoReplies(organizationId, limit?)` → new; reads from `AutoReply` table.
- `createAutoReply(organizationId, dto)` → new; validates and creates row.
- `updateAutoReply(organizationId, id, dto)` → new.
- `deleteAutoReply(organizationId, id)` → new.
- `listWebhooks(organizationId)` → new; reads from `Webhook` table (to be added).
- `createWebhook(organizationId, dto)` → new.
- `updateWebhook(organizationId, id, dto)` → new.
- `deleteWebhook(organizationId, id)` → new.
- `getBotConfig(organizationId)` → new; reads from `BotConfig` table (already exists via `waSession` relation? Actually `BotConfig` is linked to `Session`; we need to expose via organization).
- `updateBotConfig(organizationId, dto)` → new.
- `listGroups(organizationId, limit?)` → new; reads from `Group` table (if we decide to expose groups).
- `uploadMedia(organizationId, file)` → reuses existing file upload service; returns `mediaKey`.
- `getMedia(organizationId, mediaKey)` → reuses existing file download.

#### 1.2 Data Transfer Objects (DTOs)
Define DTOs in `src/whatsapp-adapter/dto/` mirroring WA-AKG's request/response shapes where beneficial, but keep them simple.

#### 1.3 Validation & Authorization
Each adapter method will:
- Extract `organizationId` from the request's authenticated user (via `@Req()` or custom decorator).
- Verify that the caller has permission to manage WhatsApp for that organization (e.g., role `OWNER` or `ADMIN`; reuse existing permission system).
- For resource‑level calls (e.g., updating a specific auto‑reply), ensure the resource belongs to the organization (foreign key check).

#### 1.4 Error Handling
Map internal exceptions to appropriate HTTP statuses:
- `401 Unauthorized` – missing/invalid auth.
- `403 Forbidden` – authenticated but not allowed to manage WhatsApp for this org.
- `404 Not Found` – resource not found or does not belong to org.
- `400 Bad Request` – validation failure.
- `409 Conflict` – business rule conflict (e.g., webhook URL already exists).
- `503 Service Unavailable` – WhatsApp not connected (when relevant).

### Phase 2: Implement Adapter Endpoints
Create a new NestJS controller `WhatsAppAdapterController` that routes HTTP requests to the adapter service.

#### 2.1 Router
- Prefix: `/api/whatsapp-adapter` (or integrate under existing `/whatsapp` prefix if we prefer to keep a single namespace; we will use `/api/whatsapp-adapter` to avoid confusion with existing WhatsApp endpoints).
- Example endpoints:
  - `GET  /api/whatsapp-adapter/session/status`
  - `GET  /api/whatsapp-adapter/contacts`
  - `GET  /api/whatsapp-adapter/contacts/:jid/picture`
  - `POST /api/whatsapp-adapter/auto-replies`
  - `GET  /api/whatsapp-adapter/auto-replies`
  - `PATCH /api/whatsapp-adapter/auto-replies/:id`
  - `DELETE /api/whatsapp-adapter/auto-replies/:id`
  - `GET  /api/whatsapp-adapter/webhooks`
  - `POST  /api/whatsapp-adapter/webhooks`
  - `PATCH /api/whatsapp-adapter/webhooks/:id`
  - `DELETE /api/whatsapp-adapter/webhooks/:id`
  - `GET  /api/whatsapp-adapter/bot/config`
  - `PATCH /api/whatsapp-adapter/bot/config`
  - `GET  /api/whatsapp-adapter/groups`
  - `POST  /api/whatsapp-adapter/media/upload`
  - `GET  /api/whatsapp-adapter/media/:mediaKey`

#### 2.2 Reuse Existing Services Where Possible
- **Session status & QR/pairing**: Use `WhatsappService.getIntegration()` for base status; add QR/pairing logic by calling `WaSessionManager.codes()` (already exists; we can expose a method).
- **Contacts**: Extend `WhatsappService.listContacts()` to accept optional `search` parameter (prisma `where: { OR: [{ name: { contains: search } }, { notify: { contains: search } }, { jid: { contains: search } }] }`).
- **Auto-replies**: Implement simple CRUD on `AutoReply` table (already exists? Need to verify if mygymagent-b has an `AutoReply` table; likely not, as WA-AKG defines it. We will need to add the table via migration.)
- **Webhooks**: New table `Webhook` (same as WA-AKG) to store outgoing webhook configs; we will also need a lightweight webhook delivery service (can reuse WA-AKG's `WebhookLog` logic or implement a simple version that fires HTTP requests on events).
- **Bot config**: The `BotConfig` table already exists linked to `Session` (via `sessionId`). To expose per‑organization, join `Session` → `User` → `Organization`. Ensure that only the organization linked to the session can modify its bot config.
- **Groups**: The `Group` table exists; expose read‑only list (maybe limited to group jid and subject) for informational purposes.
- **Media**: Use existing `FileStorageService` and `File` entity; upload endpoint already exists at `/files/upload` (we saw in mygymagent-b?). We'll need to verify and possibly create a thin wrapper that returns the `file.id` as `mediaKey`.

#### 2.3 Database Migrations
Create a new migration script that adds missing tables:
- `AutoReply` (if not present)
- `Webhook`
- `WebhookLog`
- Ensure existing tables (`Session`, `Message`, `Contact`, `Group`, `BotConfig`) have the necessary columns (compare with WA-AKG schema; add any missing columns that are required for the features we expose, but keep backward compatibility by making new columns nullable with sensible defaults).

We will use Prisma's migration system (`prisma migrate dev`) to generate the migration files.

#### 2.4 Unit & Integration Tests
- Write unit tests for the adapter service (mocking dependencies).
- Write integration tests for the controller (using NestJS testing utilities) that verify:
  - Authentication enforcement.
  - Tenant isolation (attempt to access another org's data returns 404/403).
  - Validation of input.
  - Correct mapping to internal services.
- Add e2e tests if the test infrastructure supports it (maybe using the existing e2e framework).

### Phase 3: Frontend Integration
Update the MyGymAgent frontend (`mygymagent-f`) to consume the new adapter endpoints.

#### 3.1 Endpoint Mapping
Replace calls to any placeholder or non‑existent endpoints with calls to `/api/whatsapp-adapter/...`.
- The existing WhatsApp settings UI already makes requests to the backend (likely under `/whatsapp/`). We will need to either:
  - Update the proxy or API client to route those calls to the new adapter, or
  - Modify the backend to alias the new adapter under the existing `/whatsapp/` prefix (by adding routes in the same controller or using a prefix mapper).
Given the instruction to avoid breaking existing contracts, we will keep the existing WhatsApp endpoints unchanged (they already work for basic features) and **add** new endpoints under `/whatsapp-adapter/` for the extra WA‑AKG features. The frontend will be updated to use the new endpoints where needed.

#### 3.2 UI Enhancements
- **Auto‑replies Card**: Enable create/edit/delete operations using the new endpoints.
- **Webhooks Card**: Add ability to add, edit, delete webhooks; show delivery status (if we implement webhook logging).
- **Bot Config Card**: Allow toggling bot features, setting prefix, allowed/blocked JIDs, anti‑spam settings.
- **Groups Panel**: Show list of groups the WhatsApp number is a member of (read‑only).
- **Media Manager**: Simple upload/download for media used in messages.
- **Session Status**: Enhance the status widget to show QR code when disconnected, pairing code when pairing, and allow initiating pairing (via a button that triggers the backend to start pairing process — actually pairing is initiated by scanning QR; we just need to show the QR and pairing code).

#### 3.3 Authentication
Ensure the frontend includes the auth token (JWT or session cookie) in requests to the new endpoints (the existing `api` client already does this).

#### 3.4 Testing
- Run the existing test suite for the WhatsApp settings pages to ensure no regression.
- Add new unit/tests for the new UI components (if using Jest/React Testing Library).
- Perform manual QA of the new features (QR display, auto‑reply creation, webhook setup, etc.).

### Phase 4: Verification & Validation
- Run the full backend test suite (`npm test` in `mygymagent-b`) to ensure no regressions.
- Run the full frontend test suite (`npm test` in `mygymagent-f`).
- Perform type-check (`npm run typecheck`) and lint (`npm run lint`) on both repositories.
- Verify that the build succeeds (`npm run build`).
- Check that linting introduces no new errors or warnings.
- Confirm that all existing WhatsApp-related tests still pass.
- Validate tenant isolation by attempting to access another organization's data (should return 403/404).
- Verify that rate limiting and anti‑spam controls still function.
- Ensure that no new endpoints expose credentials or raw Baileys keys.

### Phase 5: Documentation & Rollback Plan
- Update internal documentation (README, architecture decision records) to describe the new adapter layer.
- Prepare a rollback plan: since changes are additive (new tables, new endpoints, new UI), rolling back involves:
  - Dropping the new tables via a migration (if needed).
  - Removing the new controller, service, DTOs.
  - Reverting frontend changes to use old endpoints only.
  - The core WhatsApp sending/receiving pipeline remains untouched, so rollback is low‑risk.

## Approval Requested
We request approval to proceed with Phase 1 (define integration contract) and Phase 2 (implement adapter endpoints and database migrations). Upon completion of those phases, we will present the detailed design and request approval to proceed with Phase 3 (frontend integration).

## Estimated Effort
- Phase 1: 2 days (contract definition, DTO design).
- Phase 2: 5 days (adapter service, controller, migrations, unit tests).
- Phase 3: 4 days (frontend updates, UI components, testing).
- Phase 4: 2 days (verification, regression testing).
- Phase 5: 1 day (documentation).

Total: ~14 days of development effort.

## Open Questions
1. **Should we expose outgoing webhook configuration and delivery?**  
   WA-AKG includes webhook logs; MyGymAgent currently does not. We propose to add a simple `Webhook` table and a service that, upon DomainEvent (e.g., `WhatsappSent`, `WhatsappReceived`), performs an HTTP POST to the configured URL with a signed payload. This is optional and can be disabled by default.

2. **How to handle groups?**  
   Groups are mostly informational; exposing a read‑only list is low‑risk. We will not expose group mutation endpoints unless explicitly requested.

3. **What about the anti‑spam settings?**  
   WA-AKG has an anti‑spam module; we can expose its settings as part of bot config or as a separate endpoint. We will start with enabling/disabling and configuring limits via the bot config endpoint.

4. **Should we use the same Prisma instance or a separate connection?**  
   We will reuse the existing `PrismaService` to maintain transactional consistency and avoid extra pool overhead.

5. **How to secure Redis keys for QR/pairing?**  
   We will scope keys by `organizationId` (e.g., `whatsapp:org:{orgId}:qr`). Ensure Redis is not exposed publicly; if using a managed service, enable authentication and restrict to the application's VPC.

## Success Criteria
- All new features are accessible via the new `/api/whatsapp-adapter/` endpoints.
- Each endpoint properly enforces authentication and tenant isolation.
- Existing WhatsApp sending/receiving functionality continues to work unchanged.
- No increase in the number of Baileys connections per organization (still exactly one via `WaSessionManager`).
- Database migrations are backward‑compatible and can be rolled back if needed.
- Unit and integration tests cover the new code with ≥80% coverage.
- Manual QA confirms UI works as expected.
- No new lint or type‑check errors are introduced.
- Build and deployment (to staging) succeed.

## Risks & Mitigations (Revisited)
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Accidentally creating a second Baileys connection (if adapter incorrectly instantiates a new WaSessionManager) | Low | High (protocol conflicts, WhatsApp may ban the number) | Ensure adapter only reuses existing `WaSessionManager` and `WhatsappService`; never create new socket instances. |
| Migration failure due to locking on large tables | Low | Medium | Test migration on a copy of production schema; use `prisma migrate deploy` with `--skip-seed` if needed; run during maintenance window. |
| Frontend UI bugs causing poor UX | Medium | Low | Conduct component testing and manual QA; use feature flags to hide incomplete UI. |
| Rate limiting bypass via direct internal calls | Low | Medium | Ensure all internal paths (e.g., service methods) still respect the same limits; keep limits encapsulated in `WaSender`. |
| Credential leakage via logs | Low | High | Audit logs for any printing of `creds` or `keys`; replace with generic messages. |

## References
- WA-AKG source code: `/home/oem/Desktop/mygymagentwasflksldjb/WA-AKG`
- MyGymAgent backend: `/home/oem/Desktop/mygymagentwasflksldjb/mygymagent-b`
- MyGymAgent frontend: `/home/oem/Desktop/mygymagentwasflksldjb/mygymagent-f`
- Audit report: `docs/whatsapp-integration/audit-report.md`
- API compatibility matrix: `docs/whatsapp-integration/api-compatibility-matrix.md`
- Threat model: `docs/whatsapp-integration/threat-model.md`

