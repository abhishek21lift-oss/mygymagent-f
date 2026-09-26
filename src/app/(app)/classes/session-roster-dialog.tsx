"use client"

import * as React from "react"
import { toast } from "sonner"
import { ClipboardList } from "lucide-react"

import { ApiError } from "@/lib/api/client"
import { useAuth } from "@/lib/auth/auth-context"
import {
 useCancelClassBooking,
 useClassSessionBookings,
 useMarkClassAttendance,
 type ClassBooking,
 type ClassBookingStatus,
} from "@/lib/hooks/use-classes"
import { ConfirmAction } from "@/components/shared/confirm-action"
import { DataState } from "@/components/shared/data-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog"

const STATUS_VARIANT: Record<ClassBookingStatus, "default" | "secondary" | "success" | "outline"> = {
 BOOKED: "default",
 WAITLISTED: "secondary",
 ATTENDED: "success",
 NO_SHOW: "outline",
 CANCELLED: "outline",
}

function BookingRow({ booking, sessionId }: { booking: ClassBooking; sessionId: string }) {
 const { hasPermission } = useAuth()
 const attendance = useMarkClassAttendance()
 const cancelBooking = useCancelClassBooking()

 async function mark(status: "ATTENDED" | "NO_SHOW") {
  try {
   await attendance.mutateAsync({ bookingId: booking.id, sessionId, status })
   toast.success(status === "ATTENDED" ? "Marked attended" : "Marked no-show")
  } catch (error) {
   toast.error(error instanceof ApiError ? error.message : "Could not record attendance.")
  }
 }

 // The API takes attendance on a booking that is BOOKED, ATTENDED or
 // NO_SHOW -- so a mark can be corrected, but a waitlisted or cancelled
 // place cannot be marked at all.
 const canMark = booking.status === "BOOKED" || booking.status === "ATTENDED" || booking.status === "NO_SHOW"
 const canCancel = booking.status === "BOOKED" || booking.status === "WAITLISTED"

 return (
  <div className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
   <div className="min-w-0">
    <p className="truncate text-sm font-bold">{booking.memberName}</p>
    <p className="truncate text-xs text-muted-foreground">
     {booking.memberCode}
     {booking.memberPhone ? ` · ${booking.memberPhone}` : ""}
     {booking.status === "WAITLISTED" && booking.waitlistPosition !== null
      ? ` · #${booking.waitlistPosition} on the waitlist`
      : ""}
    </p>
   </div>
   <div className="flex flex-wrap items-center gap-2">
    <Badge variant={STATUS_VARIANT[booking.status]}>{booking.status.replace("_", " ")}</Badge>
    {hasPermission("classes.attendance") && canMark && (
     <>
      <Button
       size="sm"
       variant={booking.status === "ATTENDED" ? "default" : "outline"}
       disabled={attendance.isPending}
       onClick={() => void mark("ATTENDED")}
      >
       Attended
      </Button>
      <Button
       size="sm"
       variant={booking.status === "NO_SHOW" ? "default" : "outline"}
       disabled={attendance.isPending}
       onClick={() => void mark("NO_SHOW")}
      >
       No-show
      </Button>
     </>
    )}
    {hasPermission("classes.book") && canCancel && (
     <ConfirmAction
      label="Cancel"
      title={`Cancel ${booking.memberName}'s place?`}
      description={
       booking.status === "BOOKED"
        ? "The seat is released and the first person on the waitlist takes it."
        : "They come off the waitlist. Nobody is promoted, because no seat frees up."
      }
      confirmLabel="Cancel booking"
      pendingLabel="Cancelling..."
      successMessage="Booking cancelled"
      errorMessage="Could not cancel this booking."
      onConfirm={() => cancelBooking.mutateAsync({ bookingId: booking.id, sessionId })}
     />
    )}
   </div>
  </div>
 )
}

function RosterBody({ sessionId }: { sessionId: string }) {
 const roster = useClassSessionBookings(sessionId)
 return (
  <DataState
   isLoading={roster.isPending}
   isError={roster.isError}
   onRetry={() => void roster.refetch()}
   errorMessage="Could not load the roster for this session."
   isEmpty={(roster.data ?? []).length === 0}
   emptyIcon={ClipboardList}
   emptyTitle="Nobody booked yet"
   emptyDescription="Bookings taken for this session will appear here."
  >
   <div className="grid max-h-[60vh] gap-2 overflow-y-auto pr-1">
    {(roster.data ?? []).map((booking) => (
     <BookingRow key={booking.id} booking={booking} sessionId={sessionId} />
    ))}
   </div>
  </DataState>
 )
}

export function SessionRosterDialog({
 sessionId,
 // Not `className`: that name on a component reads as a CSS prop, and this
 // is the class programme's name.
 programName,
 startTime,
}: {
 sessionId: string
 programName: string
 startTime: string
}) {
 const [open, setOpen] = React.useState(false)
 return (
  <>
   <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
    <ClipboardList className="mr-1 size-3.5" aria-hidden="true" />Roster
   </Button>
   <Dialog open={open} onOpenChange={setOpen}>
    <DialogContent className="sm:max-w-2xl">
     <DialogHeader>
      <DialogTitle>{programName}</DialogTitle>
      <DialogDescription>
       {new Date(startTime).toLocaleString()} · mark attendance or release a place
      </DialogDescription>
     </DialogHeader>
     {open ? <RosterBody sessionId={sessionId} /> : null}
    </DialogContent>
   </Dialog>
  </>
 )
}
