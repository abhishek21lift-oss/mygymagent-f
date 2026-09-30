/**
 * Click-to-chat: a wa.me link that opens WhatsApp on the staff member's own
 * phone or computer with the message already typed, for them to send.
 *
 * Nothing is sent by the app, so it costs nothing and carries none of the
 * ban risk of automating a number -- it is exactly what the staff member
 * would do by hand, minus the typing.
 */

const INDIA = /^(in|ind|india|bharat)$/i

/**
 * The number as wa.me wants it -- digits with the country code -- or null
 * when it cannot be known. Mirrors the server's rule for WhatsApp Web:
 * local Indian numbers get 91 only at an Indian branch, because a guessed
 * country code opens a chat with a stranger.
 */
export function whatsappNumber(phone: string | null | undefined, branchCountry: string | null | undefined): string | null {
  const raw = phone?.trim()
  if (!raw) return null
  const international = raw.startsWith("+") || raw.startsWith("00")
  let digits = raw.replace(/\D/g, "")
  if (raw.startsWith("00")) digits = digits.slice(2)
  if (!international && INDIA.test(branchCountry?.trim() ?? "")) {
    if (digits.length === 10) digits = `91${digits}`
    else if (digits.length === 11 && digits.startsWith("0")) digits = `91${digits.slice(1)}`
  }
  if (digits.length < 11 || digits.length > 15) return null
  return digits
}

export function whatsappLink(number: string, text?: string): string {
  return `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ""}`
}

export interface WhatsappDraft {
  id: string
  label: string
  text: string
}

/**
 * The messages a front desk sends most, ready to edit in WhatsApp. Only
 * the ones that make sense for this member are offered: no renewal
 * reminder for someone without a membership.
 */
export function whatsappDrafts(input: {
  firstName: string
  staffFirstName?: string | null
  branchName?: string | null
  planName?: string | null
  endDate?: string | null
  daysLeft?: number | null
}): WhatsappDraft[] {
  const from = [input.staffFirstName, input.branchName].filter(Boolean).join(" from ")
  const hello = `Hi ${input.firstName}${from ? `, this is ${from}` : ""}.`
  const drafts: WhatsappDraft[] = [{ id: "hello", label: "Say hello", text: `${hello} ` }]

  if (input.endDate && input.daysLeft != null) {
    const ends = new Date(input.endDate).toLocaleDateString(undefined, { day: "numeric", month: "short" })
    const plan = input.planName ? `your ${input.planName} membership` : "your membership"
    drafts.push({
      id: "renewal",
      label: "Renewal reminder",
      text:
        input.daysLeft > 0
          ? `${hello} A quick reminder that ${plan} ends on ${ends}. Would you like to renew so there's no break in your training?`
          : `${hello} ${plan.charAt(0).toUpperCase()}${plan.slice(1)} ended on ${ends}. We'd love to have you back. Shall we renew it?`,
    })
  }

  drafts.push(
    {
      id: "missed",
      label: "We miss you",
      text: `${hello} We haven't seen you at the gym for a while. Is everything okay? Let us know if we can help you get back on track.`,
    },
    {
      id: "payment",
      label: "Payment reminder",
      text: `${hello} A gentle reminder that a payment is due on your account. You can pay at the front desk or reply here and we'll help.`,
    },
  )
  return drafts
}
