"use client";

import { useAuth } from "@/lib/auth/auth-context";
import { WhatsAppWebCard } from "../../settings/whatsapp/whatsapp-web-card";
import { WhatsAppAdapterStatusCard } from "../../settings/whatsapp/whatsapp-status-card";

export default function SessionsPage() {
  const { user, hasPermission } = useAuth();
  const canManage = hasPermission("whatsapp.manage");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-stone-950 dark:text-stone-50">
          Sessions & QR
        </h1>
        <p className="mt-1 text-sm font-medium text-stone-600 dark:text-stone-400">
          Connect and manage your WhatsApp number sessions.
        </p>
      </div>
      <div className="w-full max-w-3xl">
        <WhatsAppWebCard canManage={canManage} />
      </div>
      {user?.features?.whatsappAdapter && (
        <div className="w-full max-w-3xl">
          <WhatsAppAdapterStatusCard canManage={canManage} />
        </div>
      )}
    </div>
  );
}
