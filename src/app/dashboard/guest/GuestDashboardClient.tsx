"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";

type DashboardUser = {
  id: string;
  username: string;
  email: string;
  role: "admin" | "member" | null;
  systemRole: "sysadmin" | "user";
};

type GuestDashboardClientProps = {
  user: DashboardUser;
};

export default function GuestDashboardClient({ user }: GuestDashboardClientProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {user.username}!</h1>
          <p className="text-muted-foreground">
            You&apos;re currently browsing as a guest
          </p>
        </div>
        <Badge variant="outline" className="text-sm">Guest</Badge>
      </div>

      <Alert>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          className="h-4 w-4"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
        <AlertTitle>Limited Access</AlertTitle>
        <AlertDescription>
          As a guest user, you have limited access to the platform.
          Join an organization to unlock more features and collaborate with teams.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Research Agent</CardTitle>
          <CardDescription>
            Search Hawaiian history, culture, and traditional practices using AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full" size="lg">
            <Link href="/research">Go to Research</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Join an Organization</CardTitle>
            <CardDescription>
              Request to join an existing organization to gain access to more features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Organizations provide access to collaborative tools, shared resources,
              and team features. Contact an organization administrator to request access.
            </p>
            <Button className="w-full">Browse Organizations</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Account</CardTitle>
            <CardDescription>
              Your current account information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Username:</span>
                <span className="font-medium">{user.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account Type:</span>
                <Badge variant="outline">Guest</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Organization:</span>
                <span className="text-muted-foreground italic">None</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Features</CardTitle>
          <CardDescription>What you can do as a guest user</CardDescription>
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
                <h4 className="text-sm font-medium">View Public Content</h4>
                <p className="text-xs text-muted-foreground">Browse publicly available resources</p>
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
                <h4 className="text-sm font-medium">Update Profile</h4>
                <p className="text-xs text-muted-foreground">Manage your account settings</p>
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
                <h4 className="text-sm font-medium text-muted-foreground">Team Collaboration</h4>
                <p className="text-xs text-muted-foreground">Requires organization membership</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-linear-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle>Ready to get started?</CardTitle>
          <CardDescription>
            Join an organization or contact an administrator to unlock the full platform experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button>Find Organizations</Button>
            <Button variant="outline">Contact Support</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
