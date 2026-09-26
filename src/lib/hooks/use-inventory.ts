import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Product, StockMovement } from "@/lib/types/gym";
import type { Paginated, PaginationParams } from "@/lib/types/pagination";
import type { CreateProductInput, CreateStockMovementInput, UpdateProductInput } from "@/lib/validation/gym";

const PRODUCTS_KEY = "products";
const STOCK_MOVEMENTS_KEY = "stock-movements";

export function useProducts(params: PaginationParams & { category?: string; isActive?: boolean } = {}) {
  return useQuery({
    queryKey: [PRODUCTS_KEY, params],
    queryFn: () => api.get<Paginated<Product>>("/products", { query: params }),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProductInput) => api.post<Product>("/products", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] }),
  });
}

/** The single product, for the edit form. */
export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: [PRODUCTS_KEY, "detail", id],
    queryFn: () => api.get<Product>(`/products/${id}`),
    enabled: Boolean(id),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProductInput }) =>
      api.patch<Product>(`/products/${id}`, input),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY, "detail", id] });
      // Price and reorder level both feed the dashboard's valuation and
      // low-stock counts.
      queryClient.invalidateQueries({ queryKey: ["inventory-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-reorder"] });
    },
  });
}

export function useRecordStockMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, input }: { productId: string; input: CreateStockMovementInput }) =>
      api.post<StockMovement>(`/products/${productId}/stock-movements`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [STOCK_MOVEMENTS_KEY] });
    },
  });
}

export function useStockMovements(params: PaginationParams & { productId?: string } = {}) {
  return useQuery({
    queryKey: [STOCK_MOVEMENTS_KEY, params],
    queryFn: () => api.get<Paginated<StockMovement>>("/stock-movements", { query: params }),
  });
}

/** Resolves a scanned QR/barcode value to a product via
 * GET /products/scan/:code. Not a query cache -- each scan must hit the
 * backend so tenant scoping and current stock are always server-derived;
 * only used imperatively from the scanner. */
export async function lookupProductByScanCode(code: string): Promise<Product> {
  return api.get<Product>(`/products/scan/${encodeURIComponent(code)}`);
}

export function useInventoryDashboard() {
  return useQuery({
    queryKey: ["inventory-dashboard"],
    queryFn: () => api.get<import("@/lib/types/gym").InventoryDashboard>("/inventory/dashboard"),
    staleTime: 30_000,
  })
}

export function useInventoryBranchStock(params: { branchId?: string; productId?: string } = {}) {
  return useQuery({
    queryKey: ["inventory-branch-stock", params],
    queryFn: () => api.get<import("@/lib/types/gym").ProductStock[]>("/inventory/branch-stock", { query: params }),
  })
}

export function useInventoryReorderSuggestions(branchId?: string) {
  return useQuery({
    queryKey: ["inventory-reorder", branchId],
    queryFn: () => api.get<Array<{
      productId: string; sku: string; name: string; quantityOnHand: number;
      reorderLevel: number; suggestedQuantity: number;
    }>>("/inventory/reorder-suggestions", { query: branchId ? { branchId } : undefined }),
  })
}

export function useInventorySuppliers(search?: string) {
  return useQuery({
    queryKey: ["inventory-suppliers", search],
    queryFn: () => api.get<import("@/lib/types/gym").InventorySupplier[]>("/inventory/suppliers", {
      query: search ? { search } : undefined,
    }),
  })
}

export function useCreateInventorySupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string; phone?: string; email?: string; address?: string; taxId?: string }) =>
      api.post("/inventory/suppliers", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory-suppliers"] }),
  })
}

export function useUpdateInventorySupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    // Nullable fields take `null` to be cleared: class-validator's
    // @IsOptional() skips null, so it reaches Prisma and empties the column,
    // where "" would fail @IsEmail and undefined would keep the old value.
    mutationFn: ({ id, input }: {
      id: string
      input: {
        name?: string
        phone?: string | null
        email?: string | null
        address?: string | null
        taxId?: string | null
        isActive?: boolean
      }
    }) => api.patch(`/inventory/suppliers/${id}`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory-suppliers"] }),
  })
}

export function useInventoryPurchaseOrders(status?: string) {
  return useQuery({
    queryKey: ["inventory-purchase-orders", status],
    queryFn: () => api.get<import("@/lib/types/gym").InventoryPurchaseOrder[]>("/inventory/purchase-orders", {
      query: status ? { status } : undefined,
    }),
  })
}

export function useCreateInventoryPurchaseOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      supplierId: string; branchId?: string; notes?: string; expectedAt?: string;
      items: Array<{ productId: string; orderedQuantity: number; unitCost: number }>
    }) => api.post("/inventory/purchase-orders", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-purchase-orders"] })
      queryClient.invalidateQueries({ queryKey: ["inventory-dashboard"] })
    },
  })
}

export function useReceiveInventoryPurchaseOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: {
      id: string; input: { branchId?: string; items: Array<{ productId: string; quantity: number }> }
    }) => api.post(`/inventory/purchase-orders/${id}/receive`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-purchase-orders"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["inventory-branch-stock"] })
      queryClient.invalidateQueries({ queryKey: ["inventory-dashboard"] })
    },
  })
}

export function useCancelInventoryPurchaseOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/inventory/purchase-orders/${id}/cancel`),
    // A cancel never touches stock -- nothing was received -- so only the
    // order list and the dashboard's open-order count move.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-purchase-orders"] })
      queryClient.invalidateQueries({ queryKey: ["inventory-dashboard"] })
    },
  })
}

export function useInventoryTransfers(status?: string) {
  return useQuery({
    queryKey: ["inventory-transfers", status],
    queryFn: () => api.get<import("@/lib/types/gym").InventoryTransfer[]>("/inventory/transfers", {
      query: status ? { status } : undefined,
    }),
  })
}

export function useCreateInventoryTransfer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      fromBranchId: string; toBranchId: string; notes?: string;
      items: Array<{ productId: string; quantity: number }>
    }) => api.post("/inventory/transfers", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory-transfers"] }),
  })
}

export function useShipInventoryTransfer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/inventory/transfers/${id}/ship`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-transfers"] })
      queryClient.invalidateQueries({ queryKey: ["inventory-branch-stock"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
    },
  })
}

export function useReceiveInventoryTransfer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/inventory/transfers/${id}/receive`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-transfers"] })
      queryClient.invalidateQueries({ queryKey: ["inventory-branch-stock"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
    },
  })
}

export function useCancelInventoryTransfer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/inventory/transfers/${id}/cancel`),
    // Cancelling in transit returns the units to the source branch, so the
    // per-branch stock and the product totals both move.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-transfers"] })
      queryClient.invalidateQueries({ queryKey: ["inventory-branch-stock"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
    },
  })
}

export function useInventorySales(status?: string) {
  return useQuery({
    queryKey: ["inventory-sales", status],
    queryFn: () => api.get<import("@/lib/types/gym").InventorySale[]>("/inventory/sales", {
      query: status ? { status } : undefined,
    }),
  })
}

export function useCreateInventorySale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      branchId?: string; memberId?: string; invoiceId?: string; discount?: number; currency?: string;
      items: Array<{ productId: string; quantity: number; unitPrice: number }>
    }) => api.post("/inventory/sales", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-sales"] })
      queryClient.invalidateQueries({ queryKey: ["inventory-dashboard"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["inventory-branch-stock"] })
    },
  })
}

export function useReturnInventorySale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/inventory/sales/${id}/return`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-sales"] })
      queryClient.invalidateQueries({ queryKey: ["inventory-dashboard"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["inventory-branch-stock"] })
    },
  })
}

export function useCancelInventorySale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/inventory/sales/${id}/cancel`),
    // Unlike a return, a cancel reverses every remaining line at once and
    // puts all of it back on hand.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-sales"] })
      queryClient.invalidateQueries({ queryKey: ["inventory-dashboard"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["inventory-branch-stock"] })
    },
  })
}
