'use client';

import { useEffect, useRef } from 'react';
import { useResearch } from '@/hooks/contexts/ResearchContext';
import { useResearchStream } from '@/hooks/useResearchStream';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ActivityItem } from './ActivityItem';
import { Loader2, Radio } from 'lucide-react';

export function ResearchStream() {
  const { state } = useResearch();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Connect to SSE stream when researching
  useResearchStream({
    sessionId: state.sessionId,
    enabled: state.status === 'researching',
  });

  // Auto-scroll to bottom when new activities arrive
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current;
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  }, [state.activityStream.length]);

  if (state.status !== 'researching' && state.activityStream.length === 0) {
    return null;
  }

  const isActive = state.status === 'researching';

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isActive ? (
              <Radio className="h-5 w-5 text-green-600 animate-pulse" />
            ) : (
              <Radio className="h-5 w-5 text-gray-400" />
            )}
            <CardTitle>Research Activity</CardTitle>
          </div>
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? 'Active' : 'Complete'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {/* Query Display */}
        {state.query && (
          <>
            <div className="mb-4 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium text-muted-foreground mb-1">Researching:</p>
              <p className="text-sm text-foreground">{state.query}</p>
            </div>
            <Separator className="mb-4" />
          </>
        )}

        {/* Activity Stream */}
        <ScrollArea className="h-[400px] pr-4" ref={scrollRef}>
          {state.activityStream.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Initializing research agent...
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {state.activityStream.map((activity, index) => (
                <ActivityItem
                  key={activity.id}
                  activity={activity}
                  isLatest={index === state.activityStream.length - 1 && isActive}
                />
              ))}

              {/* Active indicator at the end */}
              {isActive && state.activityStream.length > 0 && (
                <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Research in progress...</span>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Status Messages */}
        {state.error && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{state.error}</p>
          </div>
        )}

        {state.status === 'complete' && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200 font-medium">
              Research complete! Results are ready below.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
