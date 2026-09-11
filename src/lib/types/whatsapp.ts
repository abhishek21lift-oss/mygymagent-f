// Shapes returned by the NestJS backend (camelCase, matching Prisma):
// GET /whatsapp/integration -> WhatsappIntegration | null
// GET /whatsapp/messages -> MessageLog[] (WHATSAPP channel only)

export interface WhatsAppIntegration {
  id: string
  organizationId: string
  status: "NOT_CONNECTED" | "CONNECTED" | "DISCONNECTED" | "ERROR"
  wabaId: string | null
  phoneNumberId: string | null
  displayPhoneNumber: string | null
  displayName: string | null
  businessAccountId: string | null
  lastError: string | null
  connectedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface WhatsAppMessage {
  id: string
  organizationId: string | null
  channel: "WHATSAPP"
  category: string
  templateKey: string
  recipient: string
  memberId: string | null
  status: "PENDING" | "SENT" | "FAILED" | "SKIPPED_NO_CONSENT"
  attempts: number
  errorMessage: string | null
  sentAt: string | null
  createdAt: string
}
