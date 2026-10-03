import type { AuthUser } from "@/lib/types/auth"

/**
 * Where a signed-in user belongs.
 *
 * A member landing in the staff app sees every request 403 and no way
 * out; a staff account landing in the portal sees a page that will never
 * have anything in it. Both are decided by one field the server sets at
 * sign-in, and every caller -- the login page, the staff and trainer
 * shells, the not-found page, the landing CTAs -- reads it from here so
 * they cannot drift apart.
 *
 * Platform staff are checked FIRST. Their home is the Command Center: a
 * platform owner signed in to a product dashboard of revenue and member
 * counts they have no business seeing, and then had to go hunting the
 * sidebar for the one page they actually came for. Checked last, the
 * `memberId` branch below would send them to `/dashboard` anyway.
 *
 * It matters that `/platform/command-center` is not the staff app's home
 * for everyone: `(app)/layout.tsx` and `trainer-shell.tsx` only call this
 * when the user IS a member, so a platform owner can still open
 * `/platform/organizations`, `/settings` or `/dashboard` by hand. This
 * only decides where they *land*.
 */
export function homeRouteFor(
  user: Pick<AuthUser, "memberId" | "platformRole"> | null,
): "/platform/command-center" | "/portal" | "/dashboard" {
  if (user?.platformRole) return "/platform/command-center";
  return user?.memberId ? "/portal" : "/dashboard";
}
