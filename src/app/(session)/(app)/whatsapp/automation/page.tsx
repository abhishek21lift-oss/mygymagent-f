"use client";

import { useAuth } from "@/lib/auth/auth-context";
import { BotConfigCard } from "../../settings/whatsapp/bot-config-card";
import { ScheduledAutomationsCard } from "../../settings/whatsapp/scheduled-automations-card";
import { EventTriggersCard } from "../../settings/whatsapp/event-triggers-card";

export default function AutomationPage() {
  const { user, hasPermission } = useAuth();
  const canManage = hasPermission("whatsapp.manage");
  const canSend = hasPermission("whatsapp.manage");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-stone-950 dark:text-stone-50">
          Bot Automation
        </h1>
        <p className="mt-1 text-sm font-medium text-stone-600 dark:text-stone-400">
          Automate your WhatsApp messaging with rules and triggers.
        </p>
      </div>
      {user?.features?.whatsappAdapter && (
        <div className="w-full max-w-3xl">
          <BotConfigCard canManage={canManage} />
        </div>
      )}
      <ScheduledAutomationsCard canManage={canSend} />
      <EventTriggersCard canManage={canSend} />
    </div>
  );
}
