import { Megaphone } from "lucide-react";
import { ComingSoonPage } from "@/components/shared/coming-soon";

export default function CrmPage() {
  return (
    <ComingSoonPage
      title="Leads / CRM"
      icon={Megaphone}
      description="Lead pipeline from first contact through trial to won or lost, with AI-assisted prioritization once the AI module lands."
    />
  );
}
