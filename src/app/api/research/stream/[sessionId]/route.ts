import { NextRequest } from 'next/server';

/**
 * GET /api/research/stream/[sessionId]
 *
 * Server-Sent Events endpoint for streaming research activity
 *
 * TODO: Connect to actual research agent and stream real activity
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  // Set up SSE
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Helper to send SSE message
      const sendEvent = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      try {
        // TODO: Connect to actual research agent
        // For now, simulate research activity

        // Simulate thinking
        sendEvent({
          type: 'activity',
          data: {
            id: `act_${Date.now()}_1`,
            type: 'thinking',
            message: 'Analyzing your research question...',
            timestamp: new Date().toISOString(),
          },
        });
        await sleep(1500);

        // Simulate searching Papa Kilo
        sendEvent({
          type: 'activity',
          data: {
            id: `act_${Date.now()}_2`,
            type: 'searching',
            message: 'Searching Papa Kilo Database...',
            timestamp: new Date().toISOString(),
            metadata: { source: 'Papa Kilo Database' },
          },
        });
        await sleep(2000);

        // Simulate finding articles
        sendEvent({
          type: 'activity',
          data: {
            id: `act_${Date.now()}_3`,
            type: 'found',
            message: 'Found relevant articles in Hawaiian language newspapers',
            timestamp: new Date().toISOString(),
            metadata: { count: 12 },
          },
        });
        await sleep(1500);

        // Simulate reading
        sendEvent({
          type: 'activity',
          data: {
            id: `act_${Date.now()}_4`,
            type: 'reading',
            message: 'Reading articles from Ke Alakai o Hawaii, 1930',
            timestamp: new Date().toISOString(),
            metadata: { articleTitle: 'Ke Alakai o Hawaii, 1930' },
          },
        });
        await sleep(2000);

        // Simulate analyzing
        sendEvent({
          type: 'activity',
          data: {
            id: `act_${Date.now()}_5`,
            type: 'analyzing',
            message: 'Analyzing historical context and extracting key information...',
            timestamp: new Date().toISOString(),
          },
        });
        await sleep(2500);

        // Send progressive results
        sendEvent({
          type: 'result',
          data: {
            summary: 'Based on Hawaiian language newspapers and historical sources, traditional practices were deeply connected to the land and ancestral knowledge...',
            sources: [
              {
                id: 'src1',
                title: 'Ke Alakai o Hawaii, 1930',
                publication: 'Hawaiian Language Newspaper',
                date: '1930',
                type: 'newspaper',
                excerpt: 'Traditional knowledge passed down through generations...',
              },
            ],
            findings: [],
          },
        });
        await sleep(1500);

        // Complete research
        sendEvent({
          type: 'activity',
          data: {
            id: `act_${Date.now()}_6`,
            type: 'complete',
            message: 'Research complete! Compiling final results...',
            timestamp: new Date().toISOString(),
          },
        });
        await sleep(1000);

        // Send final complete results
        sendEvent({
          type: 'result',
          data: {
            summary:
              'Based on Hawaiian language newspapers and historical sources from the Papa Kilo Database, traditional Hawaiian practices were deeply rooted in ancestral knowledge and a profound connection to the land (ʻāina). The research reveals that these practices were not merely practical techniques, but represented a holistic worldview that integrated spiritual, environmental, and social dimensions. Historical accounts from the 1800s and early 1900s document the transmission of this knowledge through oral traditions, with kūpuna (elders) serving as the primary educators of younger generations.',
            sources: [
              {
                id: 'src1',
                title: 'Ka Nupepa Kuokoa - Traditional Knowledge Systems',
                publication: 'Ka Nupepa Kuokoa',
                date: 'June 15, 1867',
                type: 'newspaper',
                excerpt: 'The wisdom of our ancestors (ka ʻike o nā kūpuna) guides all aspects of our relationship with the land...',
              },
              {
                id: 'src2',
                title: 'Ke Alakai o Hawaii - Generational Learning',
                publication: 'Ke Alakai o Hawaii',
                date: 'March 3, 1930',
                type: 'newspaper',
                excerpt: 'Young ones learned by observing and participating alongside their elders in daily activities...',
              },
              {
                id: 'src3',
                title: 'Papa Kilo Database - Agricultural Practices',
                publication: 'Papa Kilo Oral History Collection',
                date: '1920-1940',
                type: 'papa-kilo',
                excerpt: 'Detailed accounts of traditional farming methods including crop rotation and moon phases...',
              },
            ],
            findings: [
              {
                id: 'finding1',
                title: 'Intergenerational Knowledge Transfer',
                content:
                  'Hawaiian traditional knowledge was primarily transmitted through oral tradition and hands-on learning. Kūpuna (elders) taught younger generations through direct participation in daily activities, storytelling, and mele (songs/chants). This approach ensured that practical skills were combined with deeper cultural and spiritual understanding.',
                sources: ['src1', 'src2'],
                confidence: 'high',
              },
              {
                id: 'finding2',
                title: 'Connection to ʻĀina (Land)',
                content:
                  'Traditional practices emphasized a reciprocal relationship with the land. This was not just about sustainable resource use, but reflected a worldview where land, people, and spiritual forces were interconnected. Practices were guided by natural cycles, moon phases, and careful observation of environmental signs.',
                sources: ['src1', 'src3'],
                confidence: 'high',
              },
              {
                id: 'finding3',
                title: 'Documentation in Hawaiian Language Media',
                content:
                  'Hawaiian language newspapers from the 1800s and early 1900s provide valuable written records of traditional practices. These publications served as a bridge between oral traditions and modern documentation, preserving knowledge during a period of significant cultural change.',
                sources: ['src1', 'src2'],
                confidence: 'medium',
              },
            ],
            relatedTopics: [
              'Traditional Hawaiian Agriculture',
              'Hawaiian Language Newspapers',
              'Oral Tradition and Moʻolelo',
              'Ahupuaʻa System',
              'Hawaiian Cultural Values',
            ],
          },
        });

        sendEvent({ type: 'complete', data: {} });
        controller.close();

      } catch (error) {
        console.error('Stream error:', error);
        sendEvent({
          type: 'error',
          data: { error: 'Research stream encountered an error' },
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
