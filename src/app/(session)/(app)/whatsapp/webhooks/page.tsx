"use client";

import { Webhook } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { PageHero } from "@/components/shared/page-hero";
import { WebhooksCard } from "../../settings/whatsapp/webhooks-card";

export default function WebhooksPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("whatsapp.manage");

  return (
    <div className="space-y-6">
      <PageHero id="webhooks-title" icon={Webhook} title="Webhooks & API" description="Manage webhook subscriptions and API integrations." />
      <div className="w-full max-w-3xl">
        <WebhooksCard canManage={canManage} />
      </div>
    </div>
  );
}
