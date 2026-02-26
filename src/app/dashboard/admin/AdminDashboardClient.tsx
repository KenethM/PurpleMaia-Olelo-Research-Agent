"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdminDashboardData } from "@/lib/data/admin";

const formatCount = (value: number) => value.toLocaleString();

type DashboardUser = {
  id: string;
  username: string;
  email: string;
  role: "admin" | "member" | null;
  systemRole: "sysadmin" | "user";
};

type AdminDashboardClientProps = {
  user: DashboardUser;
  data: AdminDashboardData;
};

export default function AdminDashboardClient({ user, data }: AdminDashboardClientProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organization Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your organization&apos;s members and settings
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data.org && (
            <Badge variant="outline" className="text-sm">{data.org.name}</Badge>
          )}
          <Badge className="bg-purple-600 text-sm">Org Admin</Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
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
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <path d="m2 10 10 5 10-5" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCount(data.pendingInvites)}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting response
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Member Management</CardTitle>
            <CardDescription>
              Invite new members and manage existing team roles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full">
              Manage Members (*)
            </Button>
            <Button variant="outline" className="w-full">
              Invite New Member (*)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organization Settings</CardTitle>
            <CardDescription>
              Configure your organization&apos;s profile and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Organization Settings (*)
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>Your organization&apos;s information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Organization Name:</span>
              <p className="font-medium">{data.org?.name || "N/A"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Organization Slug:</span>
              <p className="font-mono">{data.org?.slug || "N/A"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Your Username:</span>
              <p className="font-medium">{user.username}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Your Email:</span>
              <p className="font-medium">{user.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Features</CardTitle>
          <CardDescription>What you can do as a organization admin user</CardDescription>
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
                <h4 className="text-sm font-medium">Manage Organization Members</h4>
                <p className="text-xs text-muted-foreground">Allow new members to join and assign tasks to current members</p>
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
                <h4 className="text-sm font-medium">Manage Organization Settings</h4>
                <p className="text-xs text-muted-foreground">Configure billing, security, and access policies</p>
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
                <h4 className="text-sm font-medium text-muted-foreground">System Configuration</h4>
                <p className="text-xs text-muted-foreground">Requires system administrator access</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
