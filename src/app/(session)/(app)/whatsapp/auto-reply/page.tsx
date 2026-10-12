"use client";

import { useAuth } from "@/lib/auth/auth-context";
import { AutoRepliesCard } from "../../settings/whatsapp/auto-replies-card";

export default function AutoReplyPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("whatsapp.manage");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-stone-950 dark:text-stone-50">
          Auto Reply
        </h1>
        <p className="mt-1 text-sm font-medium text-stone-600 dark:text-stone-400">
          Configure automatic replies for incoming messages.
        </p>
      </div>
      <div className="w-full max-w-3xl">
        <AutoRepliesCard canManage={canManage} />
      </div>
    </div>
  );
}
