# Threat Model: WhatsApp Integration (WA-AKG × MyGymAgent)

## Scope
This threat model focuses on the integration of WA-AKG's WhatsApp management features into the MyGymAgent platform, considering data flows, trust boundaries, entry points, and potential abuse vectors. We assume the underlying Baileys-based WhatsApp Web client remains the source of truth for sending/receiving messages, and that MyGymAgent's backend retains authority over authentication, tenant authorization, and business rules.

## Assets
- WhatsApp session credentials (Baileys auth state) – allow full control of a linked WhatsApp number.
- Message content (outbound/inbound) – may contain PII, PHI, or confidential business information.
- Contact lists and group memberships.
- Configuration: auto-replies, webhook URLs, bot commands, anti-spam settings.
- Audit trails: message logs, delivery receipts, webhook logs.
- System resources: CPU, memory, network bandwidth (risk of abuse leading to denial-of-service or financial impact via excessive messaging).

## Trust Boundaries
1. **Browser ↔ MyGymAgent Frontend**: HTTPS; authenticated via session cookie or JWT.  
2. **Frontend ↔ MyGymAgent Backend**: HTTPS; API calls require valid authentication token; organizationId derived from token (not trusted from client).  
3. **MyGymAgent Backend ↔ WaAkgProvider / WaSessionManager**: In-process calls; trusted.  
4. **WaSessionManager ↔ Baileys Socket**: Local process; trusted.  
5. **MyGymAgent Backend ↔ External WhatsApp Servers**: Encrypted (TLS) via Baileys library; messages signed with session keys.  
6. **MyGymAgent Backend ↔ WA-AKG API (if direct calls)**: HTTPS; requires authentication (API key or session) and organizationId verification.  
7. **WA-AKG API ↔ WA-AKG Backend**: In-process; trusted.  
8. **WA-AKG Backend ↔ Baileys Socket** (if WA-AKG also runs a Baileys client): Local process; trusted.  
9. **Database (Prisma) ↔ All services**: Access via connection strings; credentials stored in environment/secrets manager.  
10. **Redis (used for locking, QR codes, pairing codes)**: Access via network; should be protected within same VPC or via authentication if exposed.

## Data Flow Scenarios

### 1. Outbound Message (User sends via Settings UI)
1. User clicks “Send” in `whatsapp-messaging.tsx`.
2. Frontend POSTs to `/communications/send` (MyGymAgent backend) with `{channel: 'WHATSAPP', ...}`.
3. Backend validates JWT, extracts `organizationId`, calls `CommunicationsService.send()`.
4. `CommunicationsService` resolves WHATSAPP channel → `WaAkgProvider`.
5. `WaAkgProvider.send()` validates config, formats JID, calls `WaSender.enqueue()`.
6. `WaSender` checks rate limits, creates BullMQ job, returns queued response.
7. BullMQ processor `WaSendProcessor` picks up job, validates session is CONNECTED.
8. `WaSessionManager.sendNow()` uses Baileys socket to send message.
9. Baileys sends encrypted payload to WhatsApp servers.
10. WhatsApp servers deliver to recipient device; receipts flow back via Baileys to `WaSendProcessor`.
11. Processor updates `messageLog` with providerMessageId and status (SENT/FAILED).
12. Optional: Domain events emitted for analytics/UI updates.

**Trust Boundaries Crossed**: 2→3 (frontend→backend), 3→4 (backend→provider), 4→5 (provider→sender), 5→6 (sender→queue), 6→7 (queue→processor), 7→8 (processor→session manager), 8→9 (session manager→Baileys), 9↔10 (Baileys↔WhatsApp servers). All backend-to-backend calls are in-process and trusted.

### 2. Inbound Message (Received from WhatsApp)
1. Baileys socket receives message, emits `messages.upsert` event.
2. `WaSessionManager` (or dedicated inbound listener) processes message:
   - Updates `contact` table if needed.
   - Creates `MessageLog` row with direction INBOUND (or similar).
   - Emits `DomainEvent.WhatsappReceived`.
   - Triggers webhooks if configured (outbound to external URL).
3. If auto-reply matches, may trigger outbound send (flow as above).
4. UI may update via polling or websocket (not detailed).

**Trust Boundaries**: Similar to outbound but reversed; inbound data is considered untrusted until validated (e.g., JID format, content length). The Baileys library provides the raw JID and content; we must sanitize before storing or displaying.

### 3. QR Code Generation & Pairing (Linking New Device)
1. User visits WhatsApp settings page.
2. Frontend requests QR data from backend (endpoint TBD; possibly via `whatsapp-web` module).
3. Backend asks `WaSessionManager` for current QR (stored in Redis).
4. Returns QR image/data URL to frontend.
5. User scans with phone; phone sends pairing request to WhatsApp servers.
6. WhatsApp servers respond with pairing code to the device; also send to the connected Baileys socket as part of authentication flow.
7. Baileys socket emits `connection.update` with `{ qr: <code> }` (actually QR is from Baileys? In WA-AKG, QR is from Baileys; pairing code is separate).
8. Backend stores pairing code in Redis (short TTL) and returns to frontend for display.
9. After successful pairing, Baileys socket emits `connection.update` with `{ connection: 'open' }`.
10. Backend updates `waSession` record with status CONNECTED, stores credentials in `authState` table, clears QR/pairing code from Redis.

**Trust Boundaries**: The QR and pairing code are ephemeral secrets; they must be encrypted in transit (HTTPS) and not leaked to other tenants. Redis keys are scoped by `organizationId` (or `sessionId`). The pairing process must ensure that the code shown to the user matches the one expected by the Baileys socket for their session.

### 4. Configuration Update (e.g., Changing Auto‑reply)
1. User edits auto-reply in `auto-replies-card.tsx`.
2. Frontend PATCHes to `/whatsapp/:organizationId/auto-replies/[id]`.
3. Backend validates auth, extracts `organizationId`, ensures the auto-reply belongs to that organization (foreign key check).
4. Updates `AutoReply` row in DB.
5. If the change affects active bot/config, may need to notify the Baileys instance (if the bot runs in-process). In MyGymAgent, the bot logic likely lives in the same process (via `WaAkgProvider`/`WaSender`? Actually bot features may be absent). If separate, a message queue or event could trigger reload.

**Trust Boundaries**: Backend must enforce that the `organizationId` from the token matches the `organizationId` of the auto-reply being edited (via JOIN or WHERE clause). Failure could lead to cross-tenant configuration corruption.

## Identified Threats & Mitigations

| Threat | Description | Severity | Mitigation |
|--------|-------------|----------|------------|
| **T1: Credential Leakage via Logs or Error Messages** | Baileys auth state (creds.json) could be accidentally logged if exception handling prints raw objects. | High | Ensure all catch blocks log only sanitized error messages; never log `state.creds` or `state.keys`. Use structured logging with field redaction. |
| **T2: Cross‑tenant Session Hijacking** | If API endpoint accepts a raw `sessionId` or `organizationId` from client and uses it without verifying ownership, an attacker could access another tenant’s WhatsApp session. | High | Always derive `organizationId` from authenticated user’s context (token). For any resource looked up by `sessionId`, verify that the session’s `userId` (or `organizationId` via join) matches the current user’s organization. |
| **T3: Replay of Inbound Webhooks** | If outbound webhooks are used (WA-AKG feature), an attacker could capture and resend a webhook request to trigger duplicate actions. | Medium | Include a timestamp and signature (HMAC secret) in webhook payload; verify signature and reject old timestamps (>5 min). |
| **T4: Message Flood via Unchecked Send API** | Lack of rate limiting on the send endpoint could allow a compromised tenant to send thousands of messages, leading to WhatsApp blocking the number or incurring costs. | Medium | Apply per‑organization and per‑provider rate limits (already present in `WaSender` via daily limit and min gap). Ensure limits cannot be bypassed by calling internal functions directly (should be protected by same auth). |
| **T5: Insecure Direct Object Reference (IDOR) in Message Logs** | Endpoint that returns message logs by `messageLogId` without checking `organizationId` could leak another tenant’s message content. | Medium | Always include `organizationId` in WHERE clause when querying `messageLog`. |
| **T6: Redis Key Enumeration** | If Redis is exposed without authentication, an attacker could scan for `qr:*` or `code:*` keys and use them to hijack pairing. | Medium | Protect Redis with network segmentation and/or require authentication (if using Redis 6+ ACLs). Use key namespaces that are not guessable (e.g., include a random prefix or hash). |
| **T7: File Upload Leading to RCE / SSRF** | Media upload endpoint could accept malicious files or URLs that lead to remote code execution or internal server probing. | Low | Validate file type (image/png, jpeg, etc.), limit size, store with safe names, serve via sandboxed storage (e.g., AWS S3 with public read only if needed). Do not fetch remote URLs; only accept multipart upload. |
| **T8: Dependency Vulnerability in Baileys** | Baileys library may have known vulnerabilities that allow remote code execution via malicious WhatsApp messages. | Low | Keep `@whisockets/baileys` updated; monitor security advisories; consider sandboxing the Baileys process if feasible (though it runs in‑process). |
| **T9: Cross‑site Scripting (XSS) in UI** | If message content is rendered without escaping in the WhatsApp UI, stored XSS could affect administrators. | Low | Use framework’s auto‑escaping (React JSX escapes by default); sanitize any HTML if using `dangerouslySetInnerHTML`. |
| **T10: Denial‑of‑Service via Session Creation Loop** | An attacker could repeatedly create WhatsApp sessions (via API) to exhaust resources (DB rows, Redis locks). | Low | Require authentication for session creation; enforce rate limits on session creation endpoints; maybe require CAPTCHA for self‑service signup (not applicable as only org admins can create). |

## Security Controls Already Present
- **Authentication**: JWT or session cookie; middleware validates and attaches `userId`/`organizationId`.
- **Authorization**: Services check that the `organizationId` from the token matches the resource’s `organizationId` (via joins or explicit WHERE clauses).
- **Encryption at Rest**: Provider tokens and Baileys credentials are stored encrypted? Need to verify. In MyGymAgent, `waSession` table stores `lastError` but not credentials; credentials are in `authState` table (likely encrypted? Actually `authState` stores `creds` and `keys` as JSON; Prisma stores them as JSON columns – encryption at rest depends on DB encryption; not application‑level encryption).  
  **Recommendation**: Ensure the database uses encryption at rest (e.g., AWS RDS encryption) or encrypt sensitive columns via application‑level encryption before storing.
- **Input Validation**: DTOs use class‑validator or Zod (in frontend); backend uses DTOs with validation pipes.
- **Output Encoding**: APIs return JSON; no HTML injection risk.
- **Rate Limiting**: `WaSender` enforces minimum gap between sends and daily limit; BullMQ job queue provides additional throttling.
- **Secrets Management**: API keys, DB credentials, etc., are stored in environment variables or secret manager (not hard‑coded).
- **Audit Logging**: `messageLog` tracks outbound attempts; inbound messages may be logged via similar mechanism; webhook logs exist in WA-AKG; MyGymAgent may have internal audit via `DomainEvent` and possibly an audit service.

## Data Flow Diagram (Textual)
```
[User Browser] 
   <--HTTPS/Auth--> 
[MyGymAgent Frontend] 
   <--HTTPS/Auth (token)--> 
[MyGymAgent Backend (NestJS)] 
   <--In-process--> 
[WaAkgProvider] 
   <--In-process--> 
[WaSender (BullMQ)] 
   <--In-process--> 
[WaSendProcessor] 
   <--In-process--> 
[WaSessionManager] 
   <--Baileys Socket--> 
[WhatsApp Network (TLS)] 
   <--Baileys Socket--> 
[WaSessionManager] 
   <--In-process--> 
[WaSendProcessor] 
   <--In-process--> 
[MessageLog DB] 
   <--In-process--> 
[DomainEvent Bus] 
   <--In-process--> 
[Analytics/UI Updates]
```
If WA-AKG API is called directly from frontend for admin features:
```
[User Browser] 
   <--HTTPS/Auth--> 
[MyGymAgent Frontend] 
   <--HTTPS/Auth (API key or token)--> 
[WA-AKG API (Next.js)] 
   <--In-process--> 
[WA-AKG Backend (Prisma + Baileys?)] 
   <--Baileys Socket--> 
[WhatsApp Network]
```
In this case, we must ensure that WA-AKG’s Baileys socket is **not** used for the same organization as MyGymAgent’s, or we must route WA-AKG’s calls through MyGymAgent’s backend to share the same Baileys session (complex). Better to restrict WA-AKG API to read‑only administrative operations that do not require a Baileys send (e.g., querying contacts, updating auto‑replies) and let MyGymAgent’s backend handle all sends.

## Conclusion
The primary threat is cross‑tenant data leakage due to missing tenant checks. Mitigation: enforce organizationId scoping at every data access layer. Secondary threats involve credential handling and rate limiting, which are already partially addressed. The integration should preserve the existing Baileys session manager in MyGymAgent to avoid duplicate connections, and expose WA‑AKG’s administrative features via a thin adapter that calls into MyGymAgent’s existing services (or via a read‑only replica of the DB with strict row‑level security). All new endpoints must undergo the same authentication and authorization checks as existing ones.

