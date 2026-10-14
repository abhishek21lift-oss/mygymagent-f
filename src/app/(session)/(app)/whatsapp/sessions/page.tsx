"use client";

import { QrCode } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { PageHero } from "@/components/shared/page-hero";
import { WhatsAppWebCard } from "../../settings/whatsapp/whatsapp-web-card";
import { WhatsAppAdapterStatusCard } from "../../settings/whatsapp/whatsapp-status-card";

export default function SessionsPage() {
  const { user, hasPermission } = useAuth();
  const canManage = hasPermission("whatsapp.manage");

  return (
    <div className="space-y-6">
      <PageHero id="sessions-title" icon={QrCode} title="Sessions & QR" description="Connect and manage your WhatsApp number sessions." />
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
