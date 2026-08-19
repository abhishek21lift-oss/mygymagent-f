import { Sparkles } from "lucide-react";
import { ComingSoonPage } from "@/components/shared/coming-soon";

export default function AiPage() {
  return (
    <ComingSoonPage
      title="AI Assistant"
      icon={Sparkles}
      description="AI Gateway, model router, and specialized agents (Gym Manager, Trainer Assistant, Nutrition Assistant, Sales Assistant, Retention Agent, Business Analyst) land here, with every AI action going through the same permission checks as the rest of the app and consequential output always requiring human approval."
    />
  );
}
