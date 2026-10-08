import type { Metadata } from "next";

import { LEGAL } from "@/lib/legal";
import { EmailFact, Fact, LegalPage, LegalSection } from "../legal-ui";

export const metadata: Metadata = {
  title: "Contact",
  description: `How to reach ${LEGAL.productName} for help with your gym's account, plans, billing or data.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <LegalPage
      title="Contact us"
      summary="For help with your gym's account, plans and billing, or anything about your data, reach us here. If you are a gym member, your gym can help fastest with your membership, payments and bookings."
    >
      <LegalSection title="Support">
        <p>
          Email: <EmailFact value={LEGAL.supportEmail} label="support email" />
          <br />
          Phone:{" "}
          {LEGAL.supportPhone ? (
            <a href={`tel:${LEGAL.supportPhone}`} className="font-medium text-primary underline-offset-4 hover:underline">
              {LEGAL.supportPhone}
            </a>
          ) : (
            <Fact value={null} label="support phone" />
          )}
        </p>
      </LegalSection>

      <LegalSection title="Registered office">
        <p>
          <Fact value={LEGAL.entityName} label="company name" />
          <br />
          <Fact value={LEGAL.address} label="registered address" />
        </p>
      </LegalSection>

      <LegalSection title="Privacy and grievances">
        <p>
          Grievance Officer: <Fact value={LEGAL.grievanceOfficerName} label="Grievance Officer name" />
          <br />
          Email: <EmailFact value={LEGAL.grievanceOfficerEmail} label="Grievance Officer email" />
        </p>
      </LegalSection>
    </LegalPage>
  );
}
