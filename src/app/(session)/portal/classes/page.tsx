"use client";

import * as React from "react";
import { CalendarDays, Loader2, Users } from "lucide-react";
import { toast } from "sonner";

import { PageHero } from "@/components/shared/page-hero";
import { DataState } from "@/components/shared/data-state";
import { Panel } from "@/components/shared/panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import {
  useBookPortalClass,
  useCancelPortalClass,
  usePortalClasses,
  type PortalClassSession,
} from "@/lib/hooks/use-portal";

/**
 * The member books their own classes.
 *
 * Each row says where the member already stands, because a timetable
 * that does not is one you cannot act on -- you would have to remember
 * what you booked. The server folds that in; this only has to show it.
 */
export default function PortalClassesPage() {
  const classes = usePortalClasses();
  const book = useBookPortalClass();
  const cancel = useCancelPortalClass();
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  async function handleBook(session: PortalClassSession) {
    setPendingId(session.id);
    try {
      const result = await book.mutateAsync(session.id);
      toast.success(
        result.status === "WAITLISTED"
          ? "Class is full — you are on the waitlist"
          : `Booked ${session.className}`,
      );
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Could not book that class",
      );
    } finally {
      setPendingId(null);
    }
  }

  async function handleCancel(session: PortalClassSession) {
    if (!session.myBookingId) return;
    setPendingId(session.id);
    try {
      await cancel.mutateAsync(session.myBookingId);
      toast.success("Booking cancelled");
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Could not cancel that booking",
      );
    } finally {
      setPendingId(null);
    }
  }

  const items = classes.data?.items ?? [];

  return (
    <div className="flex flex-col gap-4">
      <PageHero icon={CalendarDays} title="Classes" description="Book a spot or cancel a booking" />
      <Panel title="Classes" titleId="portal-classes" flush>
      <div className="p-4 sm:p-5">
        <DataState
          isLoading={classes.isPending}
          isError={classes.isError}
          onRetry={() => void classes.refetch()}
          errorMessage="The timetable could not be loaded."
          isEmpty={items.length === 0}
          emptyIcon={CalendarDays}
          emptyTitle="Nothing scheduled"
          emptyDescription="There are no classes at your branch in the next two weeks."
          skeletonRows={4}
        >
          <ul className="divide-y divide-border">
            {items.map((session) => {
              const full = session.bookedCount >= session.effectiveCapacity;
              const busy = pendingId === session.id;
              return (
                <li key={session.id} className="flex flex-col gap-2 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">
                        {session.className}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {new Date(session.startTime).toLocaleString([], {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                        {session.instructorFirstName
                          ? ` · ${session.instructorFirstName} ${session.instructorLastName ?? ""}`
                          : ""}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 rounded-full">
                      <Users className="mr-1 size-3" aria-hidden="true" />
                      {session.bookedCount}/{session.effectiveCapacity}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    {session.myBookingStatus === "WAITLISTED" ? (
                      <Badge variant="secondary" className="rounded-full">
                        Waitlisted
                        {session.myWaitlistPosition
                          ? ` · #${session.myWaitlistPosition}`
                          : ""}
                      </Badge>
                    ) : session.myBookingStatus === "BOOKED" ? (
                      <Badge className="rounded-full">Booked</Badge>
                    ) : null}

                    {session.myBookingStatus ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => void handleCancel(session)}
                        className="ml-auto min-h-11 rounded-lg"
                      >
                        {busy && (
                          <Loader2
                            className="size-4 animate-spin"
                            aria-hidden="true"
                          />
                        )}
                        Cancel
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => void handleBook(session)}
                        className="ml-auto min-h-11 rounded-lg"
                      >
                        {busy && (
                          <Loader2
                            className="size-4 animate-spin"
                            aria-hidden="true"
                          />
                        )}
                        {/* Say what will happen, rather than offering
                            "Book" and then explaining it was a waitlist. */}
                        {full ? "Join waitlist" : "Book"}
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </DataState>
      </div>
    </Panel>
    </div>
  );
}
