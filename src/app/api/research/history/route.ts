import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/research/history
 *
 * Fetch user's research history
 *
 * TODO: Query database for user's past research sessions
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Get user ID from session
    // TODO: Query database for user's research sessions

    // Mock data for now
    const sessions = [
      {
        id: 'session_1',
        userId: 'user_1',
        query: "What were traditional methods for preserving fish in ancient Hawaii?",
        status: 'complete',
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
        completedAt: new Date(Date.now() - 86400000).toISOString(),
        results: {
          summary: 'Traditional Hawaiian fish preservation methods included salt curing, sun drying, and smoking techniques that were adapted to the tropical climate...',
          sources: [
            {
              id: 'src1',
              title: 'Ka Hoku o ka Pakipika, 1862',
              publication: 'Hawaiian Language Newspaper',
              date: '1862',
              type: 'newspaper',
            },
          ],
          findings: [
            {
              id: 'f1',
              title: 'Salt Curing Methods',
              content: 'Salt from evaporated seawater was used extensively...',
              sources: ['src1'],
              confidence: 'high',
            },
          ],
        },
        activityStream: [],
      },
      {
        id: 'session_2',
        userId: 'user_1',
        query: "Tell me about traditional 'awa cultivation practices",
        status: 'complete',
        createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        updatedAt: new Date(Date.now() - 172800000).toISOString(),
        completedAt: new Date(Date.now() - 172800000).toISOString(),
        results: {
          summary: "'Awa (kava) was cultivated in carefully tended patches with specific soil and water requirements...",
          sources: [
            {
              id: 'src2',
              title: 'Ke Alakai o Hawaii, 1925',
              publication: 'Hawaiian Language Newspaper',
              date: '1925',
              type: 'newspaper',
            },
          ],
          findings: [
            {
              id: 'f2',
              title: 'Cultivation Techniques',
              content: "Traditional 'awa cultivation required specific soil conditions and careful water management...",
              sources: ['src2'],
              confidence: 'high',
            },
          ],
        },
        activityStream: [],
      },
    ];

    return NextResponse.json({ sessions });

  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch research history' },
      { status: 500 }
    );
  }
}
