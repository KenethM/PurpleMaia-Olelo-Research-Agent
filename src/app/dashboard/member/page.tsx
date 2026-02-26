import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { validateSessionFromCookies } from "@/lib/auth/session";
import { fetchMemberDashboardData } from "@/lib/data/member";
import MemberDashboardClient from "./MemberDashboardClient";

export default async function MemberDashboard() {
  let user;
  try {
    const cookieStore = await cookies();
    user = await validateSessionFromCookies(cookieStore);
  } catch {
    redirect("/login?type=user");
  }

  if (user.system_role === "sysadmin" || user.role !== "member") {
    redirect("/dashboard");
  }

  const data = await fetchMemberDashboardData(user.id);

  return (
    <MemberDashboardClient
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
