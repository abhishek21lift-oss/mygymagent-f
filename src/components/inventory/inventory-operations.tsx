"use client";

import * as React from "react";
import {
  ArrowDownToLine,
  ArrowRightLeft,
  RotateCcw,
  ShoppingBag,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import { useBranches } from "@/lib/hooks/use-branches";
import {
  useCreateInventoryPurchaseOrder,
  useCreateInventorySale,
  useCreateInventorySupplier,
  useCreateInventoryTransfer,
  useInventoryDashboard,
  useInventoryPurchaseOrders,
  useInventorySales,
  useInventorySuppliers,
  useInventoryTransfers,
  useReceiveInventoryPurchaseOrder,
  useReceiveInventoryTransfer,
  useReturnInventorySale,
  useShipInventoryTransfer,
  useProducts,
} from "@/lib/hooks/use-inventory";
import { Button } from "@/components/ui/button";
import { InventoryNav } from "@/components/inventory/inventory-nav";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatCard } from "@/components/shared/stat-card";
import { BentoGrid } from "@/components/shared/bento";

function Field(props: React.ComponentProps<typeof Input> & { label: string }) {
  const { label, ...input } = props;
  return (
    <label className="grid gap-1.5 text-xs font-semibold text-foreground">
      {label}
      <Input className="h-10 rounded-xl bg-card text-sm" {...input} />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = "Select...",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}) {
  return (
    <div className="grid gap-1.5 text-xs font-semibold text-foreground">
      <span>{label}</span>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger className="h-10 rounded-xl bg-card text-sm font-medium">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function InventoryOperationsPanel() {
  const { hasPermission } = useAuth();
  const dashboard = useInventoryDashboard();
  const branches = useBranches({ page: 1, pageSize: 100 });
  const products = useProducts({ page: 1, pageSize: 100, isActive: true });
  const suppliers = useInventorySuppliers();
  const purchaseOrders = useInventoryPurchaseOrders();
  const transfers = useInventoryTransfers();
  const sales = useInventorySales();

  const createSupplier = useCreateInventorySupplier();
  const createPurchaseOrder = useCreateInventoryPurchaseOrder();
  const receivePurchaseOrder = useReceiveInventoryPurchaseOrder();
  const createTransfer = useCreateInventoryTransfer();
  const shipTransfer = useShipInventoryTransfer();
  const receiveTransfer = useReceiveInventoryTransfer();
  const createSale = useCreateInventorySale();
  const returnSale = useReturnInventorySale();

  const [activeTab, setActiveTab] = React.useState<"po" | "transfer" | "sale" | "supplier">("po");
  const [supplierName, setSupplierName] = React.useState("");
  const [po, setPo] = React.useState({ supplierId: "", branchId: "", productId: "", quantity: "1", unitCost: "0" });
  const [transfer, setTransfer] = React.useState({ from: "", to: "", productId: "", quantity: "1" });
  const [sale, setSale] = React.useState({ branchId: "", productId: "", quantity: "1", unitPrice: "" });

  const run = async (fn: () => Promise<unknown>, message: string) => {
    try {
      await fn();
      toast.success(message);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Inventory operation failed");
    }
  };

  if (!hasPermission("inventory.read")) return null;

  const branchOptions = (branches.data?.items ?? []).map((b) => ({ value: b.id, label: b.name }));
  const productOptions = (products.data?.items ?? []).map((p) => ({ value: p.id, label: `${p.name} · ${p.sku}` }));
  const supplierOptions = (suppliers.data ?? []).map((s) => ({ value: s.id, label: s.name }));
  const selectedSaleProduct = (products.data?.items ?? []).find((p) => p.id === sale.productId);

  return (
    <section className="grid gap-6" aria-labelledby="inventory-operations">
      <InventoryNav />

      <div>
        <h2 id="inventory-operations" className="text-lg font-bold tracking-tight text-foreground">
          Operations & Ledger
        </h2>
        <p className="mt-1 text-sm font-medium text-muted-foreground">
          Procure, receive, transfer, and sell without bypassing the stock ledger.
        </p>
      </div>

      {dashboard.data && (
        <BentoGrid columns={4} label="Inventory metrics">
          <StatCard
            icon={Wallet}
            title="Inventory Value"
            value={`₹ ${dashboard.data.inventoryCostValue.toFixed(2)}`}
            hint="Total cost on ledger"
            isLoading={dashboard.isLoading}
            tone="primary"
            accent="indigo"
          />
          <StatCard
            icon={Truck}
            title="Open Purchase Orders"
            value={dashboard.data.openPurchaseOrders}
            hint="Pending delivery"
            isLoading={dashboard.isLoading}
            tone="warning"
            accent="amber"
          />
          <StatCard
            icon={ArrowRightLeft}
            title="Transfers in Transit"
            value={dashboard.data.transfersInTransit}
            hint="Moving between branches"
            isLoading={dashboard.isLoading}
            tone="primary"
            accent="violet"
          />
          <StatCard
            icon={ShoppingBag}
            title="Product Sales"
            value={`₹ ${dashboard.data.salesTotal.toFixed(2)}`}
            hint="Gross sales revenue"
            isLoading={dashboard.isLoading}
            tone="success"
            accent="emerald"
          />
        </BentoGrid>
      )}

      {hasPermission("inventory.manage") && (
        <div className="overflow-hidden rounded-3xl border border-border/80 bg-card p-5 shadow-card backdrop-blur-xl sm:p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
            <div>
              <h3 className="text-base font-bold tracking-tight text-foreground">
                Perform Inventory Action
              </h3>
              <p className="text-xs text-muted-foreground">
                Create orders, move stock, or log sales through verified workflows
              </p>
            </div>
            <div role="tablist" aria-label="Inventory operations" className="inline-flex flex-wrap gap-1 rounded-2xl border border-border/70 bg-muted/30 p-1">
              <Button
                type="button"
                variant={activeTab === "po" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("po")}
                className="rounded-xl px-3.5 text-xs font-bold"
              >
                <Truck className="mr-1.5 size-3.5" /> Purchase Order
              </Button>
              <Button
                type="button"
                variant={activeTab === "transfer" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("transfer")}
                className="rounded-xl px-3.5 text-xs font-bold"
              >
                <ArrowRightLeft className="mr-1.5 size-3.5" /> Transfer
              </Button>
              <Button
                type="button"
                variant={activeTab === "sale" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("sale")}
                className="rounded-xl px-3.5 text-xs font-bold"
              >
                <ArrowDownToLine className="mr-1.5 size-3.5" /> Quick Sale
              </Button>
              <Button
                type="button"
                variant={activeTab === "supplier" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("supplier")}
                className="rounded-xl px-3.5 text-xs font-bold"
              >
                <Users className="mr-1.5 size-3.5" /> Supplier
              </Button>
            </div>
          </div>

          {activeTab === "po" && (
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!po.supplierId || !po.productId) return;
                void run(
                  () =>
                    createPurchaseOrder.mutateAsync({
                      supplierId: po.supplierId,
                      branchId: po.branchId || undefined,
                      items: [
                        {
                          productId: po.productId,
                          orderedQuantity: Number(po.quantity),
                          unitCost: Number(po.unitCost),
                        },
                      ],
                    }),
                  "Purchase order created",
                );
              }}
            >
              <SelectField
                label="Supplier"
                value={po.supplierId}
                onChange={(v) => setPo((x) => ({ ...x, supplierId: v }))}
                options={supplierOptions}
              />
              <SelectField
                label="Destination branch"
                value={po.branchId}
                onChange={(v) => setPo((x) => ({ ...x, branchId: v }))}
                options={branchOptions}
                placeholder="Org stock"
              />
              <div className="sm:col-span-2">
                <SelectField
                  label="Product"
                  value={po.productId}
                  onChange={(v) => setPo((x) => ({ ...x, productId: v }))}
                  options={productOptions}
                />
              </div>
              <Field
                label="Quantity"
                type="number"
                min="1"
                value={po.quantity}
                onChange={(e) => setPo((x) => ({ ...x, quantity: e.target.value }))}
              />
              <Field
                label="Unit cost (₹)"
                type="number"
                min="0"
                step="0.01"
                value={po.unitCost}
                onChange={(e) => setPo((x) => ({ ...x, unitCost: e.target.value }))}
              />
              <div className="sm:col-span-2 flex justify-end pt-2">
                <Button type="submit" disabled={createPurchaseOrder.isPending} className="min-h-11 rounded-2xl px-6 font-bold">
                  {createPurchaseOrder.isPending ? "Creating PO..." : "Create Purchase Order"}
                </Button>
              </div>
            </form>
          )}

          {activeTab === "transfer" && (
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!transfer.from || !transfer.to || !transfer.productId) return;
                void run(
                  () =>
                    createTransfer.mutateAsync({
                      fromBranchId: transfer.from,
                      toBranchId: transfer.to,
                      items: [{ productId: transfer.productId, quantity: Number(transfer.quantity) }],
                    }),
                  "Transfer created",
                );
              }}
            >
              <SelectField
                label="Source Branch"
                value={transfer.from}
                onChange={(v) => setTransfer((x) => ({ ...x, from: v }))}
                options={branchOptions}
              />
              <SelectField
                label="Destination Branch"
                value={transfer.to}
                onChange={(v) => setTransfer((x) => ({ ...x, to: v }))}
                options={branchOptions}
              />
              <div className="sm:col-span-2">
                <SelectField
                  label="Product"
                  value={transfer.productId}
                  onChange={(v) => setTransfer((x) => ({ ...x, productId: v }))}
                  options={productOptions}
                />
              </div>
              <Field
                label="Quantity to transfer"
                type="number"
                min="1"
                value={transfer.quantity}
                onChange={(e) => setTransfer((x) => ({ ...x, quantity: e.target.value }))}
              />
              <div className="sm:col-span-2 flex justify-end pt-2">
                <Button type="submit" disabled={createTransfer.isPending} className="min-h-11 rounded-2xl px-6 font-bold">
                  {createTransfer.isPending ? "Creating transfer..." : "Create Transfer"}
                </Button>
              </div>
            </form>
          )}

          {activeTab === "sale" && (
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!sale.productId) return;
                const price = Number(sale.unitPrice || selectedSaleProduct?.unitPrice || 0);
                void run(
                  () =>
                    createSale.mutateAsync({
                      branchId: sale.branchId || undefined,
                      items: [{ productId: sale.productId, quantity: Number(sale.quantity), unitPrice: price }],
                    }),
                  "Sale recorded",
                );
              }}
            >
              <SelectField
                label="Branch"
                value={sale.branchId}
                onChange={(v) => setSale((x) => ({ ...x, branchId: v }))}
                options={branchOptions}
                placeholder="Org stock"
              />
              <SelectField
                label="Product"
                value={sale.productId}
                onChange={(v) => setSale((x) => ({ ...x, productId: v }))}
                options={productOptions}
              />
              <Field
                label="Quantity"
                type="number"
                min="1"
                value={sale.quantity}
                onChange={(e) => setSale((x) => ({ ...x, quantity: e.target.value }))}
              />
              <Field
                label="Unit price (₹)"
                type="number"
                min="0"
                step="0.01"
                value={sale.unitPrice || selectedSaleProduct?.unitPrice || ""}
                onChange={(e) => setSale((x) => ({ ...x, unitPrice: e.target.value }))}
              />
              <div className="sm:col-span-2 flex justify-end pt-2">
                <Button type="submit" disabled={createSale.isPending} className="min-h-11 rounded-2xl px-6 font-bold">
                  {createSale.isPending ? "Recording sale..." : "Record Sale"}
                </Button>
              </div>
            </form>
          )}

          {activeTab === "supplier" && (
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!supplierName.trim()) return;
                void run(
                  () => createSupplier.mutateAsync({ name: supplierName.trim() }),
                  "Supplier created",
                ).then(() => setSupplierName(""));
              }}
            >
              <div className="sm:col-span-2">
                <Field
                  label="Supplier name"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="e.g. Optimum Nutrition India"
                  required
                />
              </div>
              <div className="sm:col-span-2 flex justify-end pt-2">
                <Button type="submit" disabled={createSupplier.isPending} className="min-h-11 rounded-2xl px-6 font-bold">
                  {createSupplier.isPending ? "Adding supplier..." : "Add Supplier"}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="overflow-hidden rounded-3xl border border-border/80 bg-card p-5 shadow-card backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-foreground">Purchase orders</h3>
            <Badge variant="secondary" className="rounded-full">
              {purchaseOrders.data?.length ?? 0}
            </Badge>
          </div>
          <div className="grid gap-2.5">
            {(purchaseOrders.data ?? []).slice(0, 6).map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-muted/20 p-3 transition-colors hover:bg-muted/40"
              >
                <div>
                  <p className="text-sm font-bold text-foreground">{order.number}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.supplier?.name ?? "Supplier"} · {order.status}
                  </p>
                </div>
                {hasPermission("inventory.manage") &&
                  (order.status === "ORDERED" || order.status === "PARTIALLY_RECEIVED") && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() =>
                        void run(
                          () =>
                            receivePurchaseOrder.mutateAsync({
                              id: order.id,
                              input: {
                                items: order.items.map((i) => ({
                                  productId: i.productId,
                                  quantity: i.orderedQuantity - i.receivedQuantity,
                                })),
                              },
                            }),
                          "PO received",
                        )
                      }
                    >
                      Receive
                    </Button>
                  )}
              </div>
            ))}
            {(purchaseOrders.data ?? []).length === 0 && (
              <p className="py-4 text-center text-xs text-muted-foreground">No purchase orders found</p>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-border/80 bg-card p-5 shadow-card backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-foreground">Branch transfers</h3>
            <Badge variant="secondary" className="rounded-full">
              {transfers.data?.length ?? 0}
            </Badge>
          </div>
          <div className="grid gap-2.5">
            {(transfers.data ?? []).slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-muted/20 p-3 transition-colors hover:bg-muted/40"
              >
                <div>
                  <p className="text-sm font-bold text-foreground">{item.number}</p>
                  <p className="text-xs text-muted-foreground">{item.status}</p>
                </div>
                {hasPermission("inventory.manage") && item.status === "DRAFT" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => void run(() => shipTransfer.mutateAsync(item.id), "Transfer shipped")}
                  >
                    Ship
                  </Button>
                )}
                {hasPermission("inventory.manage") && item.status === "IN_TRANSIT" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => void run(() => receiveTransfer.mutateAsync(item.id), "Transfer received")}
                  >
                    Receive
                  </Button>
                )}
              </div>
            ))}
            {(transfers.data ?? []).length === 0 && (
              <p className="py-4 text-center text-xs text-muted-foreground">No active transfers</p>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-border/80 bg-card p-5 shadow-card backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-foreground">Recent product sales</h3>
            <Badge variant="secondary" className="rounded-full">
              {sales.data?.length ?? 0}
            </Badge>
          </div>
          <div className="grid gap-2.5">
            {(sales.data ?? []).slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-muted/20 p-3 transition-colors hover:bg-muted/40"
              >
                <div>
                  <p className="text-sm font-bold text-foreground">{item.number}</p>
                  <p className="text-xs text-muted-foreground">
                    ₹ {item.total} · {item.status}
                  </p>
                </div>
                {hasPermission("inventory.manage") && item.status === "COMPLETED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => void run(() => returnSale.mutateAsync(item.id), "Sale returned")}
                  >
                    <RotateCcw className="mr-1 size-3" /> Return
                  </Button>
                )}
              </div>
            ))}
            {(sales.data ?? []).length === 0 && (
              <p className="py-4 text-center text-xs text-muted-foreground">No recorded sales</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
