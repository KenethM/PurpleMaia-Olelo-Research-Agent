'use client';

import { useAuth } from "@/hooks/contexts/AuthContext";
import { Button } from "../ui/button";

export default function LogoutButton() {
    const { logout } = useAuth();
  return (
    <Button
      onClick={logout}
      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
    >
      Logout
    </Button>
  )
}
