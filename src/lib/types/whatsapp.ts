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

/** A gym's own number linked as a WhatsApp Web device (mygymagent-b B-P1-13). */
export interface WhatsAppWebSession {
  /** Whether this deployment runs WhatsApp Web at all. */
  available: boolean
  /** Which server setting is missing when it doesn't. */
  unavailableReason?: "DISABLED" | "KEY_MISSING" | "KEY_INVALID" | null
  status: "DISCONNECTED" | "PAIRING" | "CONNECTED" | "LOGGED_OUT"
  phoneNumber: string | null
  useForSending: boolean
  dailyLimit: number
  sentLast24h: number
  riskAcceptedAt: string | null
  connectedAt: string | null
  lastError: string | null
  /** While pairing: the QR to scan, as an image. */
  qrDataUrl: string | null
  /** While pairing with a phone number: the code to type on the phone. */
  pairingCode: string | null
}
