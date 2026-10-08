import type { Metadata } from "next";

import { LEGAL } from "@/lib/legal";
import { Fact, LegalPage, LegalSection } from "../legal-ui";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `The terms on which gyms use ${LEGAL.productName}.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      summary={`These terms are an agreement between the gym business that signs up ("you", "the gym") and ${LEGAL.productName}. Anyone who creates a gym account or uses it on a gym's behalf accepts them for that gym.`}
    >
      <LegalSection title="The service">
        <p>
          {LEGAL.productName} is operated by <Fact value={LEGAL.entityName} label="company name" />. It gives gyms
          software to manage members, memberships, payments, attendance, staff, training and communication, together
          with a portal and app for their members. Features vary by subscription plan.
        </p>
      </LegalSection>

      <LegalSection title="Your account">
        <ul>
          <li>You must give accurate details and keep your sign-in credentials confidential.</li>
          <li>
            You are responsible for everything done under your gym&rsquo;s account, including by staff you invite, and
            for giving each of them only the access their role needs.
          </li>
          <li>Tell us promptly if you believe your account has been accessed without permission.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Your members' data">
        <ul>
          <li>
            You own the data you put into the service. You are the Data Fiduciary for your members under the DPDP
            Act, and we process their data on your behalf, as described in our Privacy Policy.
          </li>
          <li>
            You are responsible for having a lawful basis, including consent where it is required, for the data you
            collect. This applies in particular to health information, data about anyone under 18, and messages you
            send members by SMS, email or WhatsApp.
          </li>
          <li>You can ask us for a copy of your gym&rsquo;s data while your account is active.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Acceptable use">
        <p>You must not:</p>
        <ul>
          <li>use the service for anything unlawful, or to send spam or messages people have not agreed to receive;</li>
          <li>try to access another gym&rsquo;s data, probe or disrupt the service, or get around its limits;</li>
          <li>copy, resell or reverse-engineer the software, except where the law allows it.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Plans, fees and taxes">
        <ul>
          <li>
            Subscription fees are set by the plan you are on and billed in advance for each billing period. Prices
            are in Indian rupees, and applicable taxes such as GST are added.
          </li>
          <li>
            If a fee is overdue, we may limit the account after giving you notice. Your data is not deleted because
            a payment is late.
          </li>
          <li>We will give at least 30 days&rsquo; notice before changing the price of your plan.</li>
          <li>
            Payments your members make to your gym are between you and them. Your own terms and refund policy apply
            to those payments, not ours.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Availability and support">
        <p>
          We work to keep the service available and your data safe, and we take regular backups. We may need to pause
          the service for maintenance, and will try to do this outside peak gym hours. Third-party services the
          software relies on, such as SMS, WhatsApp, payment and AI providers, may sometimes be unavailable.
        </p>
      </LegalSection>

      <LegalSection title="Liability">
        <p>
          The service is provided &ldquo;as is&rdquo;. To the extent the law allows, we are not liable for indirect
          or consequential loss, or for loss of profit. Our total liability for any claim is limited to the fees you
          paid us in the 12 months before the claim. Nothing in these terms limits liability that cannot be limited by
          law.
        </p>
      </LegalSection>

      <LegalSection title="Ending the agreement">
        <ul>
          <li>You can cancel at any time. Cancellation takes effect at the end of the current billing period.</li>
          <li>
            We may suspend or end an account that breaches these terms. Where the breach can be fixed, we will first
            give you notice and a chance to fix it.
          </li>
          <li>
            After an account ends, you can ask for an export of your data for 30 days, after which we delete it as
            described in our Privacy Policy.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Changes to these terms">
        <p>
          If we change these terms, we will update the effective date and notify gym owners. If you keep using the
          service after a change takes effect, you accept the new terms.
        </p>
      </LegalSection>

      <LegalSection title="Governing law">
        <p>
          These terms are governed by the laws of India. The courts at{" "}
          <Fact value={LEGAL.jurisdictionCity} label="city" /> have exclusive jurisdiction.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
