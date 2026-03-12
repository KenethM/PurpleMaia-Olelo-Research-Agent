'use client';

import { useEffect, useRef } from 'react';
import { useResearch } from './contexts/ResearchContext';
import type { StreamEvent, ActivityMessage, ResearchResult } from '@/types/research';

interface UseResearchStreamOptions {
  sessionId: string | null;
  enabled?: boolean;
}

export function useResearchStream({ sessionId, enabled = true }: UseResearchStreamOptions) {
  const { dispatch } = useResearch();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Don't connect if disabled or no session ID
    if (!enabled || !sessionId) {
      return;
    }

    // Create EventSource connection
    const eventSource = new EventSource(`/api/research/stream/${sessionId}`);
    eventSourceRef.current = eventSource;

    // Handle incoming messages
    eventSource.onmessage = (event) => {
      try {
        const streamEvent: StreamEvent = JSON.parse(event.data);

        if (!streamEvent || typeof streamEvent.type !== 'string') {
          console.warn('[stream] Received malformed event:', event.data);
          return;
        }

        switch (streamEvent.type) {
          case 'activity': {
            const activity = streamEvent.data as ActivityMessage;
            if (!activity || typeof activity.type !== 'string') break;
            dispatch({ type: 'ADD_ACTIVITY', payload: activity });
            break;
          }

          case 'result': {
            const result = streamEvent.data as Partial<ResearchResult>;
            if (!result || typeof result !== 'object') break;
            dispatch({ type: 'UPDATE_RESULTS', payload: result });
            break;
          }

          case 'complete':
            dispatch({ type: 'SET_STATUS', payload: 'complete' });
            eventSource.close();
            break;

          case 'error': {
            const errorData = streamEvent.data as { error?: string };
            dispatch({
              type: 'SET_ERROR',
              payload: typeof errorData?.error === 'string' ? errorData.error : 'Research failed',
            });
            eventSource.close();
            break;
          }

          case 'questions': {
            const questions = streamEvent.data;
            if (!Array.isArray(questions)) break;
            dispatch({
              type: 'ADD_CLARIFYING_QUESTIONS',
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              payload: questions as any,
            });
            break;
          }

          default:
            console.warn('[stream] Unknown stream event type:', streamEvent.type);
        }
      } catch (error) {
        console.error('[stream] Error parsing stream event:', error);
      }
    };

    // Handle connection errors
    eventSource.onerror = (error) => {
      console.error('EventSource error:', error);

      // Only set error state if we're not already complete
      if (eventSource.readyState === EventSource.CLOSED) {
        dispatch({
          type: 'SET_ERROR',
          payload: 'Connection to research stream lost',
        });
      }

      eventSource.close();
    };

    // Cleanup on unmount
    return () => {
      if (eventSource.readyState !== EventSource.CLOSED) {
        eventSource.close();
      }
    };
  }, [sessionId, enabled, dispatch]);

  // Function to manually close the stream
  const closeStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };

  return { closeStream };
}
