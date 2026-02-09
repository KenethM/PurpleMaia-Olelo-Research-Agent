import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/research/clarify
 *
 * Submit answers to clarifying questions and continue research
 *
 * TODO: Pass answers to research agent and continue processing
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, answers } = body;

    if (!sessionId || !answers) {
      return NextResponse.json(
        { error: 'Session ID and answers are required' },
        { status: 400 }
      );
    }

    // TODO: Store answers in database
    // TODO: Continue research with clarified parameters
    console.log('Received answers for session:', sessionId, answers);

    return NextResponse.json({
      status: 'researching',
      message: 'Research continuing with your preferences',
    });

  } catch (error) {
    console.error('Error submitting answers:', error);
    return NextResponse.json(
      { error: 'Failed to submit answers' },
      { status: 500 }
    );
  }
}
