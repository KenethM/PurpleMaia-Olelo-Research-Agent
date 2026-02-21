"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type DashboardRedirectClientProps = {
  destination: string;
};

export default function DashboardRedirectClient({ destination }: DashboardRedirectClientProps) {
  const router = useRouter();

  useEffect(() => {
    router.replace(destination);
  }, [destination, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-lg text-muted-foreground">Redirecting to your dashboard...</div>
    </div>
  );
}
