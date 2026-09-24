"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, Send, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { useEnablePortalLogin } from "@/lib/hooks/use-portal";
import { ApiError } from "@/lib/api/client";

/**
 * Whether this member can sign in to the app, and the one control that
 * changes the answer.
 *
 * `POST /portal/enable/:memberId` shipped with the portal but had no
 * caller anywhere in the UI, so no gym owner could actually grant a
 * member a login -- the same missing-writer shape as `Branch.deviceKey`
 * and the payroll salary fields before it. The portal existed and was
 * unreachable.
 *
 * Three states, because they call for different words: never granted
 * (invite), granted but never accepted (the link is still outstanding,
 * so resend), and signed up (nothing to do, but say so).
 */
export function PortalAccessCard({
  member,
}: {
  // Only the three fields this needs, so the card does not force every
  // caller to hold a full member payload.
  member: {
    id: string;
    email: string | null;
    user?: {
      id: string;
      email: string;
      status: "INVITED" | "ACTIVE" | "SUSPENDED" | "DISABLED";
    } | null;
  };
}) {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("portal.manage");
  const enable = useEnablePortalLogin();

  const login = member.user ?? null;
  const email = member.email?.trim() ?? "";

  async function handleInvite() {
    try {
      const result = await enable.mutateAsync(member.id);
      toast.success(`Sign-in link sent to ${result.email}`);
    } catch (error) {
      // The two refusals worth reading: no email on the record, and an
      // email that already belongs to somebody else's account.
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Could not send the sign-in link",
      );
    }
  }

  return (
    <section
      aria-labelledby="member-portal-access"
      className="overflow-hidden rounded-lg border border-border bg-card"
    >
      <div className="border-b border-border px-5 py-3">
        <h2
          id="member-portal-access"
          className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground"
        >
          Member app access
        </h2>
      </div>

      <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Smartphone
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <div className="min-w-0">
            {login?.status === "ACTIVE" ? (
              <>
                <p className="text-sm font-medium">Signed up</p>
                <p className="truncate text-sm text-muted-foreground">
                  Signs in as {login.email} and sees their own plan,
                  membership and visits.
                </p>
              </>
            ) : login ? (
              <>
                <p className="text-sm font-medium">Invitation outstanding</p>
                <p className="truncate text-sm text-muted-foreground">
                  Sent to {login.email}. They have not set a password yet.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium">No login yet</p>
                <p className="text-sm text-muted-foreground">
                  {email
                    ? "Send a link and they can sign in to see their own data."
                    : "Add an email address to this member first — there is nowhere to send the link."}
                </p>
              </>
            )}
          </div>
        </div>

        {canManage && (
          <Button
            variant={login ? "outline" : "default"}
            size="sm"
            onClick={() => void handleInvite()}
            disabled={enable.isPending || !email}
            className="min-h-11 shrink-0 rounded-lg"
          >
            {enable.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="size-4" aria-hidden="true" />
            )}
            {login ? "Resend link" : "Invite to member app"}
          </Button>
        )}
      </div>
    </section>
  );
}
