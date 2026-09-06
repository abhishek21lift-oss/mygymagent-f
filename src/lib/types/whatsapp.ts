export interface WhatsAppIntegration {
  id: string
  organization_id: string
  waba_id: string | null
  phone_number_id: string
  business_account_id: string | null
  display_phone_number: string | null
  display_name: string | null
  status: "CONNECTED" | "DISCONNECTED" | string
  last_verified_at: string | null
}

export interface WhatsAppMessage {
  id: string
  phone_number_id: string
  provider_message_id: string | null
  direction: "INBOUND" | "OUTBOUND" | string
  from_number: string | null
  to_number: string | null
  message_type: string
  text: string | null
  status: string
  created_at: string
  updated_at: string
}
