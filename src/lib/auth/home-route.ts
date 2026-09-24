import type { AuthUser } from "@/lib/types/auth"

/**
 * Where a signed-in user belongs.
 *
 * A member landing in the staff app sees every request 403 and no way
 * out; a staff account landing in the portal sees a page that will never
 * have anything in it. Both are decided by one field the server sets at
 * sign-in, and both callers -- the login page and the staff layout --
 * read it from here so they cannot drift apart.
 */
export function homeRouteFor(user: Pick<AuthUser, "memberId"> | null): "/portal" | "/dashboard" {
  return user?.memberId ? "/portal" : "/dashboard"
}
