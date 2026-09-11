import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export function ComingSoonPage({
  title,
  icon,
  description,
}: {
  title: string;
  icon: LucideIcon;
  description: string;
}) {
  return (
    <div className="relative flex flex-col gap-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-10 size-64 rounded-full bg-fuchsia-400/15 blur-3xl motion-safe:animate-blob"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-16 top-40 size-64 rounded-full bg-cyan-400/15 blur-3xl"
      />
      <div className="relative">
        <PageHeader title={title} />
      </div>
      <div className="relative overflow-hidden rounded-[28px] border border-white/90 bg-white/88 p-2 shadow-[0_20px_60px_-38px_rgba(79,70,229,.35)] backdrop-blur-xl dark:border-white/10 dark:bg-card/90">
        <div aria-hidden="true" className="h-1.5 rounded-t-[22px] bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400" />
        <EmptyState
          icon={icon}
          title={`${title} is on the roadmap`}
          description={description}
          className="border-0 bg-transparent shadow-none backdrop-blur-none"
        />
      </div>
    </div>
  );
}
