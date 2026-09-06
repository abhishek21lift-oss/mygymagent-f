"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api/client"

interface User {
  id: string
  firstName: string
  lastName: string
}

export function UserSelect({
  value,
  onChange,
  placeholder = "Select a user",
  filter,
}: {
  value: string | undefined
  onChange: (value: string) => void
  placeholder?: string
  filter?: string
}) {
  const usersQuery = useQuery({
    queryKey: ["users", filter],
    queryFn: async () => {
      const res = await api.get<{ items: User[] }>("/users", { query: { pageSize: 100 } })
      return res.items
    },
    enabled: true,
  })

  return (
    <Select value={value} onValueChange={onChange} disabled={usersQuery.isLoading}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={usersQuery.isLoading ? "Loading..." : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {usersQuery.data?.map((user) => (
          <SelectItem key={user.id} value={user.id}>
            {user.firstName} {user.lastName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
