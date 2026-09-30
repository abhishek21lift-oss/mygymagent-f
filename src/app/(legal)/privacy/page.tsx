import type { Metadata } from "next";

import { LEGAL } from "@/lib/legal";
import { EmailFact, Fact, LegalPage, LegalSection } from "../legal-ui";

export const metadata: Metadata = {
  title: `Privacy Policy · ${LEGAL.productName}`,
  description: `How ${LEGAL.productName} collects, uses and protects personal data.`,
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      summary={`${LEGAL.productName} is software that gyms use to run their business: members, memberships, payments, attendance, training and communication. This policy explains what personal data passes through it, who is responsible for that data, and the rights you have over it under India's Digital Personal Data Protection Act, 2023 ("DPDP Act").`}
    >
      <LegalSection title="Who we are">
        <p>
          {LEGAL.productName} is operated by <Fact value={LEGAL.entityName} label="company name" />,{" "}
          <Fact value={LEGAL.address} label="registered address" /> (&ldquo;we&rdquo;, &ldquo;us&rdquo;).
        </p>
      </LegalSection>

      <LegalSection title="Two kinds of data, two responsible parties">
        <ul>
          <li>
            <strong>Gym owner and staff accounts.</strong> When a gym signs up and adds staff, we decide why and how
            that account data is used. For it, we are the Data Fiduciary.
          </li>
          <li>
            <strong>Gym members.</strong> Member records are entered and controlled by the gym. The gym is the Data
            Fiduciary for its members and decides what it collects. We process that data only on the gym&rsquo;s
            instructions, to provide the service. We are the gym&rsquo;s Data Processor. If you are a member, the gym
            you joined is your first point of contact for your data, and we will help it answer you.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="What we collect">
        <ul>
          <li>
            <strong>Account data:</strong> name, email, phone number, password (stored only as a one-way hash), role,
            and multi-factor authentication settings.
          </li>
          <li>
            <strong>Member records a gym keeps:</strong> name, contact details, date of birth, gender, address,
            emergency contact, photo and documents the gym uploads, memberships, payments, attendance and check-in
            credentials, workout and nutrition plans, body measurements and goals.
          </li>
          <li>
            <strong>Health information:</strong> answers to a gym&rsquo;s health screening questionnaire, injuries,
            allergies and medical notes, where the gym records them. This is sensitive. A gym should collect it only
            with the member&rsquo;s consent and only to train them safely.
          </li>
          <li>
            <strong>Technical data:</strong> IP address, device and browser type, sign-in times, push-notification
            tokens, and security and audit logs of actions taken in the software.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Why we use it">
        <ul>
          <li>To provide the service: sign-in, running the gym&rsquo;s records, reminders and notifications.</li>
          <li>To keep it secure: detecting abuse, rate-limiting sign-in attempts, keeping audit trails.</li>
          <li>To bill gyms for their subscription and meet tax and accounting obligations.</li>
          <li>To support you when you contact us, and to fix faults.</li>
        </ul>
        <p>
          We do not sell personal data, and we do not use member data for advertising.
        </p>
      </LegalSection>

      <LegalSection title="Service providers we share data with">
        <p>We use trusted providers to run the service. Each receives only what its task needs:</p>
        <ul>
          <li>Cloud hosting, database and file storage, for running the application and storing records.</li>
          <li>MSG91, for SMS sign-in codes.</li>
          <li>Email delivery, for account, password-reset and gym messages.</li>
          <li>Meta (WhatsApp Business), for WhatsApp messages a gym chooses to send.</li>
          <li>Google Firebase Cloud Messaging, for push notifications to devices you have turned them on for.</li>
          <li>Razorpay and Stripe, for payments. We do not store card numbers.</li>
          <li>
            OpenRouter and the AI model providers it routes to, for AI features a gym uses. A request carries only
            the data that feature needs.
          </li>
          <li>Sentry, for error reports that help us fix faults.</li>
        </ul>
        <p>
          We may also disclose data where the law requires it, for example to comply with a valid order from a court
          or government authority.
        </p>
      </LegalSection>

      <LegalSection title="How long we keep it">
        <p>
          We keep data while the gym&rsquo;s account is active. When a gym closes its account, we delete or anonymise
          its data within a reasonable period, unless the law requires us to keep it longer, for example tax and
          invoice records. A gym decides how long it keeps an individual member&rsquo;s record while its account is
          active.
        </p>
      </LegalSection>

      <LegalSection title="How we protect it">
        <p>
          Data is encrypted in transit. Passwords are hashed. Each gym&rsquo;s data is kept separate from every other
          gym&rsquo;s, and access inside a gym is limited by staff role. Owners can require multi-factor
          authentication, and sensitive actions are recorded in an audit log.
        </p>
      </LegalSection>

      <LegalSection title="Your rights">
        <p>Under the DPDP Act you can ask to:</p>
        <ul>
          <li>know what personal data is held about you and how it is used;</li>
          <li>have inaccurate or incomplete data corrected, and out-of-date data updated;</li>
          <li>have your data erased once it is no longer needed, unless the law requires it to be kept;</li>
          <li>withdraw consent you gave, which does not affect anything done before you withdrew it;</li>
          <li>nominate someone to exercise these rights for you if you die or become unable to;</li>
          <li>have a grievance addressed, and escalate it to the Data Protection Board of India if it is not.</li>
        </ul>
        <p>
          Members should contact their gym first. You can also write to our Grievance Officer below, and we will
          respond within the time the law requires.
        </p>
      </LegalSection>

      <LegalSection title="Children">
        <p>
          The service is not meant for use by anyone under 18 on their own. Where a gym registers a member under 18,
          the gym must obtain verifiable consent from a parent or lawful guardian before recording their data, as the
          DPDP Act requires.
        </p>
      </LegalSection>

      <LegalSection title="Grievance Officer">
        <p>
          <Fact value={LEGAL.grievanceOfficerName} label="Grievance Officer name" />
          <br />
          Email: <EmailFact value={LEGAL.grievanceOfficerEmail} label="Grievance Officer email" />
          <br />
          Address: <Fact value={LEGAL.address} label="registered address" />
        </p>
      </LegalSection>

      <LegalSection title="Changes to this policy">
        <p>
          We will update the effective date above when this policy changes, and tell gym owners in the app or by email
          before a significant change takes effect.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
