export interface Paginated<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface PaginationParams {
  page?: number
  pageSize?: number
  search?: string
  order?: "asc" | "desc"
  // Index signature so PaginationParams (and its call-site extensions, e.g.
  // `PaginationParams & { branchId?: string }`) can be passed directly as
  // the API client's `query` option without a manual cast at every hook.
  [key: string]: string | number | boolean | undefined
}
