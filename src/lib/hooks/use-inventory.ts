import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Product, StockMovement } from "@/lib/types/gym";
import type { Paginated, PaginationParams } from "@/lib/types/pagination";
import type { CreateProductInput, CreateStockMovementInput } from "@/lib/validation/gym";

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
