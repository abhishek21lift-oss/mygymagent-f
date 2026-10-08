import type { Metadata } from "next";

import { LEGAL } from "@/lib/legal";
import { EmailFact, LegalPage, LegalSection } from "../legal-ui";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description: `How cancellations and refunds work for ${LEGAL.productName} subscriptions.`,
  alternates: { canonical: "/refund-policy" },
};

export default function RefundPolicyPage() {
  return (
    <LegalPage
      title="Refund & Cancellation Policy"
      summary={`This policy covers the subscription fees a gym pays for ${LEGAL.productName}. It does not cover payments a member makes to their gym: those follow the gym's own refund policy, and the gym is the one to contact about them.`}
    >
      <LegalSection title="Cancelling a subscription">
        <ul>
          <li>
            A gym owner can cancel at any time by writing to{" "}
            <EmailFact value={LEGAL.supportEmail} label="support email" />.
          </li>
          <li>
            Cancellation takes effect at the end of the billing period already paid for. The account keeps working
            until then.
          </li>
          <li>We do not charge a cancellation fee.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Refunds">
        <ul>
          <li>Fees for a billing period that has already started are not refunded for the unused part of it.</li>
          <li>
            If you were charged twice, charged the wrong amount, or charged after you cancelled, we refund the excess
            in full.
          </li>
          <li>
            If the service was unavailable for a significant part of a billing period because of a fault on our
            side, we will refund or credit that period in proportion to the time lost.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="How refunds are paid">
        <p>
          Approved refunds go back to the original payment method within 7 working days of approval. Your bank or
          card issuer may take longer to show the credit.
        </p>
      </LegalSection>

      <LegalSection title="Asking for a refund">
        <p>
          Write to <EmailFact value={LEGAL.supportEmail} label="support email" /> with your gym&rsquo;s name, the
          invoice or payment reference, and what went wrong. We reply within 3 working days.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
