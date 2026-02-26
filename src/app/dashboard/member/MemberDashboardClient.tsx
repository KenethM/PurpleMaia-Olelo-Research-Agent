"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MemberDashboardData } from "@/lib/data/member";

const formatCount = (value: number) => value.toLocaleString();

type DashboardUser = {
  id: string;
  username: string;
  email: string;
  role: "admin" | "member" | null;
  systemRole: "sysadmin" | "user";
};

type MemberDashboardClientProps = {
  user: DashboardUser;
  data: MemberDashboardData;
};

export default function MemberDashboardClient({ user, data }: MemberDashboardClientProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user.username}!</h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening in your workspace
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data.org && (
            <Badge variant="outline" className="text-sm">{data.org.name}</Badge>
          )}
          <Badge variant="secondary" className="text-sm">Member</Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCount(data.teamMemberCount)}</div>
            <p className="text-xs text-muted-foreground">
              In your organization
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Recent Activity (*)</CardTitle>
            <CardDescription>Your latest actions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground text-center py-8">
              No recent activity to display
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Features</CardTitle>
          <CardDescription>What you can do as a organization member</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-start space-x-3">
              <div className="rounded-full bg-green-100 p-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-green-600"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-medium">Update Profile</h4>
                <p className="text-xs text-muted-foreground">Manage your account settings</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="rounded-full bg-green-100 p-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-green-600"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-medium">Manage Organization Resources</h4>
                <p className="text-xs text-muted-foreground">Read and write resources within your organization</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="rounded-full bg-zinc-100 p-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-zinc-400"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Change Organization Settings</h4>
                <p className="text-xs text-muted-foreground">Requires organization admin privileges</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
