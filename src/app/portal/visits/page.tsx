"use client";

import { CalendarCheck } from "lucide-react";

import { DataState } from "@/components/shared/data-state";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/shared/panel";
import { usePortalVisits } from "@/lib/hooks/use-portal";

export default function PortalVisits() {
  const visits = usePortalVisits(60);
  const items = visits.data?.items ?? [];

  return (
    <Panel title="Your visits" titleId="portal-visits" flush>
      <div className="p-4 sm:p-5">
        <DataState
          isLoading={visits.isPending}
          isError={visits.isError}
          onRetry={() => void visits.refetch()}
          errorMessage="Your visits could not be loaded."
          isEmpty={items.length === 0}
          emptyIcon={CalendarCheck}
          emptyTitle="No visits yet"
          emptyDescription="Your check-ins will show up here."
          skeletonRows={5}
        >
          <ul className="divide-y divide-border">
            {items.map((v) => (
              <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {new Date(v.checkInAt).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {v.branch?.name ?? "—"}
                    {v.checkOutAt
                      ? ` · out at ${new Date(v.checkOutAt).toLocaleTimeString()}`
                      : ""}
                  </p>
                </div>
                {v.deniedReason ? (
                  // A denied entry is the one row a member actively needs
                  // to understand, so it carries its reason rather than
                  // just a colour.
                  <Badge variant="destructive" className="rounded-full">
                    {v.deniedReason}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="rounded-full">
                    {v.method}
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        </DataState>
      </div>
    </Panel>
  );
}
