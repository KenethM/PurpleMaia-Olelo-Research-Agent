"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type HeaderUser = {
  username: string;
  email: string;
  systemRole: "sysadmin" | "user";
  role: "admin" | "member" | null;
  orgName: string | null;
};

interface DashboardHeaderProps {
  user: HeaderUser;
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const userInitials = user.username.slice(0, 2).toUpperCase();
  const isSysAdmin = user.systemRole === "sysadmin";

  const getRoleBadge = () => {
    if (isSysAdmin) return <Badge variant="destructive">System Admin</Badge>;
    if (user.role === "admin") return <Badge className="bg-purple-600">Org Admin</Badge>;
    if (user.role === "member") return <Badge variant="secondary">Member</Badge>;
    return <Badge variant="outline">Guest</Badge>;
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      const loginType = isSysAdmin ? "sysadmin" : "user";
      router.replace(`/login?type=${loginType}`);
    }
  };

  return (
    <div className="flex items-center space-x-4">
      {user.orgName && (
        <span className="text-sm text-muted-foreground hidden md:block">
          {user.orgName}
        </span>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium leading-none">{user.username}</p>
                {getRoleBadge()}
              </div>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600 cursor-pointer"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? "Logging out..." : "Log out"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
