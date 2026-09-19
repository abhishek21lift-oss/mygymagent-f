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
      <div className="relative">
        <PageHeader title={title} />
      </div>
      <div className="skeuo-plate skeuo-screws relative overflow-hidden rounded-[14px] border p-2">
        <div aria-hidden="true" className="h-2 rounded-t-[10px] border-b border-[#4a3f2a] bg-[repeating-linear-gradient(90deg,#6b5d42_0_6px,#3a3222_6px_12px)]" />
        <EmptyState
          icon={icon}
          title={`${title} is on the workbench`}
          description={description}
          className="border border-dashed shadow-[inset_0_2px_8px_rgba(40,25,10,0.4)]"
        />
      </div>
    </div>
  );
}
