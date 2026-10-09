"use client"

import * as React from "react"
import { toast } from "sonner"

import { ApiError } from "@/lib/api/client"
import { useUpdateInventorySupplier } from "@/lib/hooks/use-inventory"
import type { InventorySupplier } from "@/lib/types/gym"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/**
 * Edits one supplier's contact details.
 *
 * The form lives in its own component so it unmounts with the dialog: that
 * resets the fields to the supplier's current values on every open without
 * an effect syncing props into state.
 */
function SupplierForm({
  supplier,
  onDone,
}: {
  supplier: InventorySupplier
  onDone: () => void
}) {
  const update = useUpdateInventorySupplier()
  const [name, setName] = React.useState(supplier.name)
  const [phone, setPhone] = React.useState(supplier.phone ?? "")
  const [email, setEmail] = React.useState(supplier.email ?? "")
  const [address, setAddress] = React.useState(supplier.address ?? "")
  const [taxId, setTaxId] = React.useState(supplier.taxId ?? "")

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim()) return
    try {
      await update.mutateAsync({
        id: supplier.id,
        input: {
          name: name.trim(),
          // An emptied field is sent as null so it actually clears;
          // undefined would leave the old value in place.
          phone: phone.trim() || null,
          email: email.trim() || null,
          address: address.trim() || null,
          taxId: taxId.trim() || null,
        },
      })
      toast.success("Supplier updated")
      onDone()
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Could not update this supplier.",
      )
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="supplier-name">Name</Label>
        <Input
          id="supplier-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="supplier-phone">Phone</Label>
          <Input
            id="supplier-phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="supplier-email">Email</Label>
          <Input
            id="supplier-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="supplier-address">Address</Label>
        <Input
          id="supplier-address"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="supplier-tax-id">GSTIN / tax ID</Label>
        <Input
          id="supplier-tax-id"
          value={taxId}
          onChange={(event) => setTaxId(event.target.value)}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={update.isPending} aria-busy={update.isPending}>
          {update.isPending ? "Saving..." : "Save supplier"}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function SupplierEditDialog({ supplier }: { supplier: InventorySupplier }) {
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        Edit
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit supplier</DialogTitle>
            <DialogDescription>
              Contact details used on purchase orders raised against {supplier.name}.
            </DialogDescription>
          </DialogHeader>
          {open ? (
            <SupplierForm supplier={supplier} onDone={() => setOpen(false)} />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
