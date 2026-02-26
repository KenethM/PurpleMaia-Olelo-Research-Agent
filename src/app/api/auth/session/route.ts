import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth/session';
import { AppError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
      const user = await validateSession(request);
      console.log('[SESSION] Session validated successfully for account:', user.id.slice(0, 6));
      return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json(
            { error: error.message }, 
            { status: error.statusCode }
        );
      }
      console.log('[SESSION]', error)
      return NextResponse.json(
          { error: 'Internal Server Error' }, 
          { status: 500 }
      );
  }  
}