import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/research/initiate
 *
 * Initiates a new research session
 * Returns session ID and optionally clarifying questions
 *
 * TODO: Implement actual research agent initialization
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Generate a session ID (replace with actual DB insert)
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // TODO: Check if agent needs clarifying questions
    // For now, simulate asking clarifying questions for certain queries
    const needsClarification = query.toLowerCase().includes('traditional') ||
                                query.toLowerCase().includes('cultivation');

    if (needsClarification) {
      // Return clarifying questions
      return NextResponse.json({
        sessionId,
        clarifyingQuestions: [
          {
            id: 'q1',
            question: 'What time period are you most interested in?',
            type: 'choice',
            required: false,
            options: [
              { value: 'pre-contact', label: 'Pre-Contact (before 1778)' },
              { value: '1800s', label: '1800s' },
              { value: '1900s', label: '1900s' },
              { value: 'all', label: 'All periods' },
            ],
          },
          {
            id: 'q2',
            question: 'Are you interested in specific Hawaiian islands?',
            type: 'multi-choice',
            required: false,
            options: [
              { value: 'hawaii', label: 'Hawaiʻi (Big Island)' },
              { value: 'maui', label: 'Maui' },
              { value: 'oahu', label: 'Oʻahu' },
              { value: 'kauai', label: 'Kauaʻi' },
              { value: 'molokai', label: 'Molokaʻi' },
              { value: 'lanai', label: 'Lānaʻi' },
            ],
          },
        ],
      });
    }

    // No clarification needed, start research immediately
    return NextResponse.json({
      sessionId,
      status: 'researching',
    });

  } catch (error) {
    console.error('Error initiating research:', error);
    return NextResponse.json(
      { error: 'Failed to initiate research' },
      { status: 500 }
    );
  }
}
