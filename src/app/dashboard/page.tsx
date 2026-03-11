import { cookies } from "next/headers";
import { validateSessionFromCookies } from "@/lib/auth/session";
import DashboardRedirectClient from "./DashboardRedirectClient";

/**
 * Dashboard Index Page
 *
 * Redirects users to their appropriate role-based dashboard:
 * - /dashboard/sysadmin - System administrators
 * - /dashboard/admin - Organization administrators
 * - /dashboard/member - Organization members
 * - /dashboard/guest - Guest users (no organization)
 */
export default async function DashboardPage() {
  let destination = "/login?type=user";

  try {
    const cookieStore = await cookies();
    const user = await validateSessionFromCookies(cookieStore);
    if (user.system_role === "sysadmin") {
      destination = "/dashboard/sysadmin";
    } else {
      destination = "/research";
    }
  } catch {
    destination = "/login?type=user";
  }

  return <DashboardRedirectClient destination={destination} />;
}
