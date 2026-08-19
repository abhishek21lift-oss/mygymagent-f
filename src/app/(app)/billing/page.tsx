import { Wallet } from "lucide-react";
import { ComingSoonPage } from "@/components/shared/coming-soon";

export default function BillingPage() {
  return (
    <ComingSoonPage
      title="Billing"
      icon={Wallet}
      description="Payments, invoices, refunds, discounts, taxes, and trainer payouts, built on an immutable ledger the same way membership history already is."
    />
  );
}
