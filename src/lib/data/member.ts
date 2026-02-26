import { db } from "@/db/kysely/client";

type MemberOrg = {
  id: string;
  name: string;
  slug: string;
};

export type MemberDashboardData = {
  org: MemberOrg | null;
  teamMemberCount: number;
};

/**
 * Retrieves dashboard data for a member user, including organization details and team member count.
 * @param userId The ID of the user whose dashboard data is being fetched.
 * @returns A promise that resolves to a MemberDashboardData object containing the organization (or null) and the number of team members.
 */
export async function fetchMemberDashboardData(userId: string): Promise<MemberDashboardData> {
  const orgMembership = await db
    .selectFrom("members as m")
    .innerJoin("orgs as o", "m.org_id", "o.id")
    .select(({ ref }) => [
      ref("o.id").as("orgId"),
      ref("o.name").as("orgName"),
      ref("o.slug").as("orgSlug"),
    ])
    .where("m.user_id", "=", userId)
    .where("m.user_role", "=", "member")
    .executeTakeFirst();

  if (!orgMembership) {
    return {
      org: null,
      teamMemberCount: 0,
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
  };
}
