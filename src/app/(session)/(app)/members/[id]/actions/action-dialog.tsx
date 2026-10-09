"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import { ApiError } from "@/lib/api/client";

/**
 * Every query an action on a member can move. The member's own record
 * carries their latest memberships, so it is refreshed too: the
 * membership mutations used to refresh only the memberships list, and the
 * profile went on showing a term as Active after it had been frozen.
 */
export function useRefreshMember(memberId: string) {
 const queryClient = useQueryClient();
 return React.useCallback(
 () =>
 Promise.all(
 [
 ["members"],
 ["memberships"],
 ["member-payments", memberId],
 ["payments"],
 ["invoices"],
 ["pt-packages"],
 ["appointments"],
 ["member-pt-sessions", memberId],
 ["member-details", memberId],
 ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
 ),
 [queryClient, memberId],
 );
}

/** The message to show for a failed request: the server's own, when it gave one. */
export function errorMessage(error: unknown, fallback: string): string {
 return error instanceof ApiError ? error.message : fallback;
}

/**
 * The frame every Member 360 action opens in: what it does, its inputs,
 * and one confirm button that stays busy until the server answers. A
 * refusal keeps the dialog open with the server's reason; success
 * closes it.
 */
export function ActionDialog({
 open,
 onOpenChange,
 title,
 description,
 confirmLabel,
 destructive = false,
 canConfirm = true,
 onConfirm,
 children,
}: {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 title: string;
 description?: React.ReactNode;
 confirmLabel: string;
 destructive?: boolean;
 canConfirm?: boolean;
 /** Resolves with the success message, or throws to keep the dialog open. */
 onConfirm: () => Promise<string>;
 children?: React.ReactNode;
}) {
 const [pending, setPending] = React.useState(false);

 async function confirm(event: React.FormEvent) {
 event.preventDefault();
 if (!canConfirm || pending) return;
 setPending(true);
 try {
 toast.success(await onConfirm());
 onOpenChange(false);
 } catch (error) {
 toast.error(errorMessage(error, `Couldn't ${confirmLabel.toLowerCase()}`));
 } finally {
 setPending(false);
 }
 }

 return (
 <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
 <DialogContent className="border-border bg-card sm:max-w-md">
 <form onSubmit={confirm} className="flex flex-col gap-4">
 <DialogHeader>
 <DialogTitle>{title}</DialogTitle>
 {description ? <DialogDescription>{description}</DialogDescription> : null}
 </DialogHeader>
 {children ? <div className="flex flex-col gap-4">{children}</div> : null}
 <DialogFooter className="gap-2 sm:gap-0">
 <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
 Back
 </Button>
 <Button type="submit" variant={destructive ? "destructive" : "default"} disabled={!canConfirm || pending}>
 {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
 {confirmLabel}
 </Button>
 </DialogFooter>
 </form>
 </DialogContent>
 </Dialog>
 );
}

/** A labelled field with optional help text, so every dialog reads the same. */
export function Field({
 id,
 label,
 help,
 error,
 children,
}: {
 id: string;
 label: string;
 help?: React.ReactNode;
 error?: string | null;
 children: React.ReactNode;
}) {
 return (
 <div className="flex flex-col gap-1.5">
 <label htmlFor={id} className="text-sm font-medium text-foreground">
 {label}
 </label>
 {children}
 {error ? (
 <p id={`${id}-error`} className="text-xs font-medium text-destructive">
 {error}
 </p>
 ) : help ? (
 <p id={`${id}-help`} className="text-xs text-muted-foreground">
 {help}
 </p>
 ) : null}
 </div>
 );
}

/** Whole days typed into a box: a number in [min, max], or null. */
export function parseDays(value: string, min: number, max: number): number | null {
 if (!/^\d+$/.test(value.trim())) return null;
 const days = Number(value);
 return days >= min && days <= max ? days : null;
}

export function addDays(iso: string | number, days: number): Date {
 return new Date(new Date(iso).getTime() + days * 86_400_000);
}

export function formatDay(date: Date | string): string {
 return new Date(date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export const PAYMENT_METHODS = [
 { value: "CASH", label: "Cash" },
 { value: "UPI", label: "UPI" },
 { value: "CARD", label: "Card" },
 { value: "BANK_TRANSFER", label: "Bank transfer" },
 { value: "OTHER", label: "Other" },
] as const;

export type PaymentMethodValue = (typeof PAYMENT_METHODS)[number]["value"];
