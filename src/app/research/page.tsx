'use client';

import { ResearchProvider, useResearch } from '@/hooks/contexts/ResearchContext';
import { ResearchQueryForm } from '@/components/research/ResearchQueryForm';
import { ClarifyingQuestions } from '@/components/research/ClarifyingQuestions';
import { ResearchStream } from '@/components/research/ResearchStream';
import { ResearchResults } from '@/components/research/ResearchResults';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import Link from 'next/link';

function ResearchPageContent() {
  const { state, reset } = useResearch();

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Hawaiian Research Assistant</h1>
          <p className="text-muted-foreground">
            Explore Hawaiian history and culture through our curated databases
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/research/history">
              <ArrowLeft className="mr-2 h-4 w-4" />
              View History
            </Link>
          </Button>
          {state.status !== 'idle' && (
            <Button variant="outline" onClick={reset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              New Research
            </Button>
          )}
        </div>
      </div>

      {/* Query Form - Always visible when idle or after reset */}
      {state.status === 'idle' && <ResearchQueryForm />}

      {/* Clarifying Questions - Show when agent needs more info */}
      {state.status === 'clarifying' && <ClarifyingQuestions />}

      {/* Research Stream - Show when researching or complete */}
      {(state.status === 'researching' || state.status === 'complete') && (
        <>
          <ResearchStream />

          {/* Results - Show when complete */}
          {state.status === 'complete' && state.results && <ResearchResults />}
        </>
      )}

      {/* Error State */}
      {state.status === 'error' && state.error && (
        <div className="p-6 border-2 border-destructive rounded-lg bg-destructive/5">
          <h2 className="text-lg font-semibold text-destructive mb-2">
            Research Error
          </h2>
          <p className="text-sm text-muted-foreground mb-4">{state.error}</p>
          <Button onClick={reset} variant="outline">
            <RotateCcw className="mr-2 h-4 w-4" />
            Start Over
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ResearchPage() {
  return (
    <ResearchProvider>
      <ResearchPageContent />
    </ResearchProvider>
  );
}
