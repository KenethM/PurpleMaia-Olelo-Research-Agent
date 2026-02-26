import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { validateSessionFromCookies } from "@/lib/auth/session";
import { fetchAdminDashboardData } from "@/lib/data/admin";
import AdminDashboardClient from "./AdminDashboardClient";

export default async function AdminDashboard() {
  let user;
  try {
    const cookieStore = await cookies();
    user = await validateSessionFromCookies(cookieStore);
  } catch {
    redirect("/login?type=user");
  }

  if (user.system_role === "sysadmin" || user.role !== "admin") {
    redirect("/dashboard");
  }

  const data = await fetchAdminDashboardData(user.id);

  return (
    <AdminDashboardClient
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
