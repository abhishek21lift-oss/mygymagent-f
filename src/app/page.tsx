import { redirect } from "next/navigation";

/**
 * Start unauthenticated visitors on the public login route.
 * The dashboard performs the real auth check after sign-in.
 */
export default function RootPage() {
  redirect("/login");
}
