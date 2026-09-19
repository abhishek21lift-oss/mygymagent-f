import type { LucideIcon } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
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
    <div className="flex flex-col gap-4">
      <PageHero id={`coming-soon-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} icon={icon} title={title} />
      <EmptyState
        icon={icon}
        title={`${title} is coming soon`}
        description={description}
      />
    </div>
  );
}
