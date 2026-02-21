import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { validateSessionFromCookies } from "@/lib/auth/session";
import GuestDashboardClient from "./GuestDashboardClient";

export default async function GuestDashboard() {
  let user;
  try {
    const cookieStore = await cookies();
    user = await validateSessionFromCookies(cookieStore);
  } catch {
    redirect("/login?type=user");
  }

  if (user.system_role === "sysadmin" || user.role !== null) {
    redirect("/dashboard");
  }

  return (
    <GuestDashboardClient
      user={{
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        systemRole: user.system_role,
      }}
    />
  );
}
