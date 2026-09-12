"use client";

import * as React from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Receipt, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MemberPicker } from "@/components/shared/member-picker";
import { useAuth } from "@/lib/auth/auth-context";
import { ApiError } from "@/lib/api/client";
import { createInvoiceSchema, type CreateInvoiceInput } from "@/lib/validation/gym";
import { useCreateInvoice } from "@/lib/hooks/use-invoices";

type RaiseInvoiceForm = Omit<CreateInvoiceInput, "memberId">;

const formSchema = createInvoiceSchema.omit({ memberId: true });

export function RaiseInvoiceDialog() {
  const { hasPermission } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [member, setMember] = React.useState<{ id: string; label: string } | null>(null);
  const createInvoice = useCreateInvoice();

  const form = useForm<RaiseInvoiceForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lines: [{ label: "", amount: 0, qty: 1 }],
      discount: 0,
      dueAt: "",
      draft: false,
    },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "lines" });
  const watched = useWatch({ control: form.control });

  const subtotal = (watched.lines ?? []).reduce(
    (sum, l) => sum + Number(l?.amount || 0) * Number(l?.qty || 1),
    0,
  );
  const discount = Number(watched.discount || 0);
  const previewTotal = Math.max(0, subtotal - discount);

  function reset() {
    setMember(null);
    form.reset({ lines: [{ label: "", amount: 0, qty: 1 }], discount: 0, dueAt: "", draft: false });
  }

  async function onSubmit(values: RaiseInvoiceForm) {
    if (!member) {
      toast.error("Select a member first");
      return;
    }
    try {
      const payload: CreateInvoiceInput = {
        ...values,
        memberId: member.id,
        discount: values.discount ? Number(values.discount) : undefined,
        dueAt: values.dueAt || undefined,
        lines: values.lines.map((l) => ({
          label: l.label,
          amount: Number(l.amount),
          qty: l.qty ? Number(l.qty) : undefined,
        })),
      };
      const created = await createInvoice.mutateAsync(payload);
      toast.success(`Invoice ${created.number} raised for ${member.label}`);
      setOpen(false);
      reset();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to raise invoice");
    }
  }

  if (!hasPermission("payments.create")) return null;

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) reset(); }}>
      <DialogTrigger asChild>
        <Button className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[linear-gradient(105deg,#059669,#0d9488_55%,#0ea5e9)] px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-500/25 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
          <Receipt className="size-4" aria-hidden="true" /> Raise invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader><DialogTitle>Raise an invoice</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-1.5 text-sm font-medium">Member</p>
            <MemberPicker value={member} onChange={setMember} />
          </div>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Lines</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-11"
                  onClick={() => append({ label: "", amount: 0, qty: 1 })}
                >
                  <Plus className="size-3.5" aria-hidden="true" /> Add line
                </Button>
              </div>
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 gap-2 rounded-2xl border border-stone-200/70 p-3 sm:grid-cols-[1fr_110px_70px_44px] sm:items-end dark:border-white/10">
                  <div>
                    <Label htmlFor={`line-label-${index}`}>Label</Label>
                    <Input
                      id={`line-label-${index}`}
                      className="mt-1.5"
                      placeholder="Membership fee, PT pack..."
                      {...form.register(`lines.${index}.label`)}
                    />
                    {form.formState.errors.lines?.[index]?.label && (
                      <p className="mt-1 text-xs text-destructive">{form.formState.errors.lines[index]?.label?.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor={`line-amount-${index}`}>Amount</Label>
                    <Input
                      id={`line-amount-${index}`}
                      className="mt-1.5"
                      type="number"
                      step="0.01"
                      {...form.register(`lines.${index}.amount`)}
                    />
                    {form.formState.errors.lines?.[index]?.amount && (
                      <p className="mt-1 text-xs text-destructive">{form.formState.errors.lines[index]?.amount?.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor={`line-qty-${index}`}>Qty</Label>
                    <Input
                      id={`line-qty-${index}`}
                      className="mt-1.5"
                      type="number"
                      step="1"
                      {...form.register(`lines.${index}.qty`)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="min-h-11 min-w-11"
                    aria-label={`Remove line ${index + 1}`}
                    disabled={fields.length <= 1}
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              ))}
              {form.formState.errors.lines?.message && (
                <p className="text-xs text-destructive">{form.formState.errors.lines.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="invoice-discount">Discount (optional)</Label>
                <Input
                  id="invoice-discount"
                  className="mt-1.5"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...form.register("discount")}
                />
                {form.formState.errors.discount && (
                  <p className="mt-1 text-xs text-destructive">{form.formState.errors.discount.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="invoice-due">Due date (optional)</Label>
                <Input id="invoice-due" className="mt-1.5" type="date" {...form.register("dueAt")} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="invoice-draft"
                checked={!!watched.draft}
                onCheckedChange={(v) => form.setValue("draft", v)}
              />
              <Label htmlFor="invoice-draft">Save as draft</Label>
            </div>

            <div className="rounded-2xl border border-stone-200/70 bg-stone-50/70 p-3 text-sm tabular-nums dark:border-white/10 dark:bg-white/5">
              <p className="flex justify-between text-stone-600 dark:text-stone-400"><span>Subtotal</span><span>{subtotal.toFixed(2)}</span></p>
              <p className="flex justify-between text-stone-600 dark:text-stone-400"><span>Discount</span><span>−{discount.toFixed(2)}</span></p>
              <p className="mt-1 flex justify-between border-t border-stone-200/70 pt-1 font-black text-stone-950 dark:border-white/10 dark:text-white">
                <span>Preview total</span><span>{previewTotal.toFixed(2)}</span>
              </p>
              <p className="mt-1 text-[11px] text-stone-500">Preview only — the server computes the final total.</p>
            </div>

            <DialogFooter>
              <Button type="submit" className="min-h-11 w-full sm:w-auto" disabled={createInvoice.isPending}>
                {createInvoice.isPending ? "Raising..." : "Raise invoice"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
