import type { ActivityMessage, ResearchResult } from '@/types/research';

export interface ResearchStream {
  sendActivity(activity: ActivityMessage): void;
  sendResult(result: Partial<ResearchResult>): void;
  sendComplete(): void;
  sendError(error: string): void;
  getReadableStream(): ReadableStream;
  isClosed(): boolean;
}

/**
 * Creates an SSE stream for pushing research activity to the client.
 * Accepts an optional onCancel callback invoked when the client disconnects,
 * allowing the orchestrator to abort in-flight work.
 */
export function createResearchStream(onCancel?: () => void): ResearchStream {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController | null = null;
  let closed = false;

  const stream = new ReadableStream({
    start(c) {
      controller = c;
    },
    cancel() {
      closed = true;
      onCancel?.();
    },
  });

  function send(data: unknown) {
    if (!controller || closed) return;
    try {
      const message = `data: ${JSON.stringify(data)}\n\n`;
      controller.enqueue(encoder.encode(message));
    } catch {
      // Stream may have been closed by the client
      closed = true;
    }
  }

  function close() {
    if (closed) return;
    closed = true;
    try {
      controller?.close();
    } catch {
      // Already closed
    }
  }

  return {
    sendActivity(activity: ActivityMessage) {
      send({ type: 'activity', data: activity });
    },

    sendResult(result: Partial<ResearchResult>) {
      send({ type: 'result', data: result });
    },

    sendComplete() {
      send({ type: 'complete', data: {} });
      close();
    },

    sendError(error: string) {
      send({ type: 'error', data: { error } });
      close();
    },

    getReadableStream() {
      return stream;
    },

    isClosed() {
      return closed;
    },
  };
}
