# WhatsApp Integration Audit Report

## Overview
This report summarizes the findings of a read-only audit of the WA-AKG project and the existing WhatsApp integration in MyGymAgent. The goal is to understand the similarities, differences, and compatibility between the two systems to inform a secure integration.

## Repository Inspection

### WA-AKG
- **Location**: `/home/oem/Desktop/mygymagentwasflksldjb/WA-AKG`
- **Type**: Standalone Next.js application with API routes and a Prisma-backed PostgreSQL/MySQL database.
- **Key Technologies**: Next.js (App Router), TypeScript, Prisma, Baileys (@whiskeysockets/baileys) for WhatsApp Web protocol, Socket.IO for real-time UI updates.
- **Core Functionality**:
  - Session management (QR code generation, pairing, connection status).
  - Contact and group synchronization.
  - Message storage and retrieval.
  - Broadcast messaging.
  - Webhook configuration and delivery.
  - Auto-reply and anti-spam rules.
  - Bot configuration (custom commands, prefixes).
  - Media handling (upload/download via local storage).
- **API Routes**: RESTful endpoints under `/src/app/api/` for chats, messages, contacts, groups, webhooks, settings, etc. (see `api-compatibility-matrix.md`).
- **Authentication**: Session-based or API key via `x-api-key` header; validated via `getAuthenticatedUser` and `canAccessSession` (tenant-scoped).
- **Tenant Isolation**: Each WhatsApp session is tied to a `sessionId` which is linked to a `userId` (organization representative). Access checks ensure users can only access sessions belonging to their organization (via `canAccessSession`). The `Session` model has a `userId` foreign key to `User`.
- **Database Schema**: Includes models for `User`, `Session`, `Contact`, `Message`, `Group`, `AutoReply`, `Webhook`, `BotConfig`, `AuthState`, `WebhookLog`, `SystemConfig`. Notable fields: `sessionId` (unique identifier used by Baileys), `apiKey` for external access.
- **Real-time Updates**: Socket.IO used to push connection status and events to the UI.

### MyGymAgent (Frontend)
- **Location**: `/home/oem/Desktop/mygymagentwasflksldjb/mygymagent-f`
- **Existing WhatsApp UI**: Located in `src/app/(session)/(app)/settings/whatsapp/`.
  - Components: `page.tsx` (settings landing), `auto-replies-card.tsx`, `webhooks-card.tsx`, `whatsapp-messaging.tsx`, `whatsapp-web-card.tsx`.
  - Uses React, Next.js, Chakra UI/Headless UI, React Hook Form, Zod validation.
  - Communicates with backend via `@/lib/api/client` (axios-like wrapper).
- **Backend WhatsApp Integration** (`mygymagent-b`):
  - **WhatsApp Service** (`src/whatsapp/whatsapp.service.ts`): Provides methods to get integration status, send messages, list contacts, etc.
  - **Communications Layer** (`src/communications/`): Abstracts providers; WHATSAPP channel uses `WaAkgProvider`.
  - **WaAkgProvider** (`src/whatsapp/wa-akg.provider.ts`): Implements `MessageProvider` interface; delegates to `WaSender` (Baileys-based).
  - **Baileys Implementation** (`src/whatsapp-web/`):
    - `WaSessionManager`: Manages persistent Baileys connections per organization, using Redis locking for multi-instance safety.
    - `WaSender`: Queues messages via BullMQ to enforce rate limiting.
    - `WaSendProcessor`: Processes jobs, uses `WaSessionManager.sendNow()` to send via Baileys socket.
    - `wa-types.ts`: Type definitions and Baileys utilities.
  - **Message Flow**: Outbound messages go through `CommunicationsService.send()` → `WaAkgProvider.send()` → `WaSender.enqueue()` → BullMQ job → `WaSendProcessor.process()` → `WaSessionManager.sendNow()` → Baileys `socket.sendMessage()`.
  - **Inbound Messages**: Handled by `whatsapp-web` module via Baileys event listeners (not deeply inspected but assumed to update `MessageLog` and trigger webhooks).
  - **Tenant Isolation**: All backend calls require `organizationId` derived from authenticated user's session (via JWT or session). Providers receive `organizationId` and use it to scope DB queries (e.g., `prisma.waSession.findUnique({ where: { organizationId } })`). The `WaSessionManager` keys entries by `organizationId`.
  - **Database Schema**: Includes tables: `waSession` (stores sessionId, phoneNumber, lastError, timestamps), `messageLog` (stores outbound attempts with providerMessageId), `whatsappWebSession` (prefs like dailyLimit), plus existing tables for users, organizations, members, etc.
  - **Webhooks**: Inbound messages and delivery statuses are processed to update `messageLog` and trigger events; external webhooks can be configured via `Webhook` model (in WA-AKG) but in MyGymAgent it's unclear if there is an outgoing webhook feature—likely uses internal event system.

## Compatibility Summary
Both systems use Baileys (@whiskeysockets/baileys) as the underlying WhatsApp Web protocol implementation. Therefore, the core protocol layer is compatible. Differences lie in:
- **Architecture**: WA-AKG is a standalone Next.js app with its own API and UI; MyGymAgent embeds WhatsApp logic within a NestJS backend and React UI.
- **Database Schema**: While both use Prisma and have similar models (User, Session, Contact, Message, etc.), field names and exact schemas differ. WA-AKG includes more features (broadcasts, webhook logs, bot config, anti-spam, etc.) out of the box.
- **API Surface**: WA-AKG exposes a rich REST API for managing WhatsApp; MyGymAgent's backend exposes a narrower set of endpoints via `WhatsAppService` and `CommunicationsService`.
- **Real-time Communication**: WA-AKG uses Socket.IO to push updates to its UI; MyGymAgent relies on HTTP polling or potentially websockets elsewhere (not inspected for WhatsApp specifically).
- **Authentication**: Both use session or API key; WA-AKG's `getAuthenticatedUser` checks `x-api-key` or NextAuth session; MyGymAgent uses its own auth mechanism (likely JWT or session cookie).

Because the underlying Baileys implementation is the same, integrating WA-AKG's features into MyGymAgent is feasible by either:
1. Replacing MyGymAgent's `whatsapp-web` module with WA-AKG's `modules/whatsapp` (adjusting for NestJS vs Next.js context), or
2. Exposing WA-AKG's functionality as a microservice that MyGymAgent's backend calls via HTTP (preserving MyGymAgent's existing backend as the authority for auth, tenant context, and business rules).

Given the mandate to preserve existing providers and make the integration tenant-safe, the recommended approach is to keep MyGymAgent's backend as the authoritative layer and adapt WA-AKG's UI and API to communicate with it, rather than duplicating the messaging layer.

## Assumptions vs Verified Facts
- **Assumption**: WA-AKG implements WhatsApp Cloud API (official). **Verified Fact**: WA-AKG uses Baileys, same as existing MyGymAgent integration (WhatsApp Web/unofficial).
- **Assumption**: MyGymAgent's backend does not have WhatsApp capability. **Verified Fact**: MyGymAgent backend already has a WhatsApp integration via Baileys (see `whatsapp-web` and `WaAkgProvider`).
- **Assumption**: The two systems are incompatible due to different databases. **Verified Fact**: Both use Prisma; schema differences can be reconciled via migration or adapter layer.

## Risks Identified
- **Duplicate Message Sending**: If both systems attempt to send via the same Baileys session without coordination, messages could be sent twice or cause conflicts.
- **Session State Divergence**: Running two Baileys clients for the same organization would break WhatsApp's single-device rule.
- **Inconsistent Data**: Separate databases would lead to divergent contact lists, message histories, etc.
- **Security Gaps**: Improperly scoped API endpoints could leak tenant data.
- **Operational Complexity**: Running two separate WhatsApp connections increases resource usage and failure points.

## Recommendation
Adopt a **strangler fig** pattern: gradually replace MyGymAgent's WhatsApp UI with WA-AKG's UI, while keeping MyGymAgent's backend as the source of truth for authorization and tenant context. Expose a thin adapter layer in MyGymAgent's backend that translates between WA-AKG's API expectations and the existing `CommunicationsService`/`WaAkgProvider` flow. This preserves the existing Baileys session management and avoids duplicate connections.

Detailed implementation steps are outlined in `implementation-plan.md`.

