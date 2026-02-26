import { db } from "@/db/kysely/client";

type AdminOrg = {
  id: string;
  name: string;
  slug: string;
};

export type AdminDashboardData = {
  org: AdminOrg | null;
  teamMemberCount: number;
  pendingInvites: number;
};

/**
 * Retrieves dashboard data for an admin user, including organization details, team member count, and pending invites.
 * @param userId The ID of the admin user.
 * @returns A promise that resolves to an AdminDashboardData object containing the organization (or null), team member count, and pending invites count.
 */
export async function fetchAdminDashboardData(userId: string): Promise<AdminDashboardData> {
  const orgMembership = await db
    .selectFrom("members as m")
    .innerJoin("orgs as o", "m.org_id", "o.id")
    .select(({ ref }) => [
      ref("o.id").as("orgId"),
      ref("o.name").as("orgName"),
      ref("o.slug").as("orgSlug"),
    ])
    .where("m.user_id", "=", userId)
    .where("m.user_role", "=", "admin")
    .executeTakeFirst();

  if (!orgMembership) {
    return {
      org: null,
      teamMemberCount: 0,
      pendingInvites: 0,
    };
  }

  const teamCountResult = await db
    .selectFrom("members")
    .select(({ fn }) => fn.count<number>("id").as("count"))
    .where("org_id", "=", orgMembership.orgId)
    .executeTakeFirst();

  return {
    org: {
      id: orgMembership.orgId,
      name: orgMembership.orgName,
      slug: orgMembership.orgSlug,
    },
    teamMemberCount: Number(teamCountResult?.count ?? 0),
    pendingInvites: 0,
  };
}
