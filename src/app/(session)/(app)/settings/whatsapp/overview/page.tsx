import { redirect } from "next/navigation"

/** The overview moved to the WhatsApp Command Center. */
export default function WhatsAppOverviewRedirect() {
  redirect("/whatsapp")
}
