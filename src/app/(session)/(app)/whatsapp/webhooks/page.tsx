"use client";

import { useAuth } from "@/lib/auth/auth-context";
import { WebhooksCard } from "../../settings/whatsapp/webhooks-card";

export default function WebhooksPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("whatsapp.manage");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-stone-950 dark:text-stone-50">
          Webhooks & API
        </h1>
        <p className="mt-1 text-sm font-medium text-stone-600 dark:text-stone-400">
          Manage webhook subscriptions and API integrations.
        </p>
      </div>
      <div className="w-full max-w-3xl">
        <WebhooksCard canManage={canManage} />
      </div>
    </div>
  );
}
