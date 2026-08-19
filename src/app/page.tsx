import { redirect } from "next/navigation";

/**
 * The API and web app run on separate origins (see docs on
 * NEXT_PUBLIC_API_URL), so the backend's httpOnly refresh cookie is scoped
 * to the API's own origin and is never visible to a Next.js proxy/middleware
 * running on this origin -- there is nothing reliable to branch on here.
 * Real auth state is resolved client-side by <AuthProvider> (via a fetch to
 * the API, which does carry the cross-origin cookie correctly), and
 * `(app)/layout.tsx` / `(auth)/layout.tsx` redirect based on that.
 */
export default function RootPage() {
  redirect("/dashboard");
}
