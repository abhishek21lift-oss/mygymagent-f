"use client";

import { Bot } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { PageHero } from "@/components/shared/page-hero";
import { AutoRepliesCard } from "../../settings/whatsapp/auto-replies-card";

export default function AutoReplyPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("whatsapp.manage");

  return (
    <div className="space-y-6">
      <PageHero id="auto-reply-title" icon={Bot} title="Auto Reply" description="Configure automatic replies for incoming messages." />
      <div className="w-full max-w-3xl">
        <AutoRepliesCard canManage={canManage} />
      </div>
    </div>
  );
}
