'use client';

import { useAuth } from "@/hooks/contexts/AuthContext";
import { ResearchProvider } from "@/hooks/contexts/ResearchContext";
import { ResearchQueryForm } from "@/components/research/ResearchQueryForm";
import { ClarifyingQuestions } from "@/components/research/ClarifyingQuestions";
import { ResearchStream } from "@/components/research/ResearchStream";
import { ResearchResults } from "@/components/research/ResearchResults";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ResearchPage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="text-lg text-zinc-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-zinc-900 mb-2">Research</h1>
            <p className="text-zinc-600">
              Explore Hawaiian history, culture, and traditional practices
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        {!isAuthenticated ? (
          <Card>
            <CardHeader>
              <CardTitle>Authentication Required</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-zinc-600">
                Please log in to access research features.
              </p>
              <Link href="/login">
                <Button>Go to Login</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <ResearchProvider>
            <div className="space-y-6">
              <ResearchQueryForm />
              <ClarifyingQuestions />
              <ResearchStream />
              <ResearchResults />
            </div>
          </ResearchProvider>
        )}
      </div>
    </div>
  );
}
