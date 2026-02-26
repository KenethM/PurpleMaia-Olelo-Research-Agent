import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { validateSessionFromCookies } from "@/lib/auth/session";
import { fetchSysAdminDashboardData } from "@/lib/data/sysadmin";
import SysAdminDashboardClient from "./SysAdminDashboardClient";

export default async function SysAdminDashboard() {
  let user;
  try {
    const cookieStore = await cookies();
    user = await validateSessionFromCookies(cookieStore);
  } catch {
    redirect("/login?type=sysadmin");
  }

  if (user.system_role !== "sysadmin") {
    redirect("/dashboard");
  }

  const data = await fetchSysAdminDashboardData();

  return (
    <SysAdminDashboardClient
      user={{
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        systemRole: user.system_role,
      }}
      data={data}
    />
  );
}
