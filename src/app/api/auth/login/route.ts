import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { login } from "@/lib/auth/login";
import { AppError } from "@/lib/errors";
import { createSession } from "@/lib/auth/session";
import { checkLoginRateLimit, getClientIP, getUserAgent, recordLoginAttempt, clearFailedAttempts } from "@/lib/auth/rate-limit";

// Login input validation schema (linient on local dev)
export const loginSchema = z.object({
  identifier: process.env.NODE_ENV === "production" ? z.string()
    .min(1, { message: "Email or Username is required." })               
    .refine((value) => { 
        // Check if it's a valid email
        const emailResult = z.email().safeParse(value);
        if (emailResult.success) return true;
        
        // If not email, check if it's a valid username (3+ chars, alphanumeric + underscores)
        const usernameRegex = /^[a-zA-Z0-9_]{3,}$/;
        return usernameRegex.test(value);
    }, {
        message: "Please enter a valid email address or username (3+ characters, letters, numbers, and underscores only)."
    })
    : z.string().min(1, { message: "Email or Username is required." }),
  password: z.string()
    .min(1, { message: "Password is required." }),
});

// could throw Zod Login Schema related, TOO_MANY_REQUESTS, INVALID_CREDENTIALS, INTERNAL_SERVER_ERROR
export async function POST(request: NextRequest) {
  // console.log('[LOGIN] Login attempt received.');

  // Extract metadata for login rate limiting
  const ip = getClientIP(request);
  const userAgent = getUserAgent(request);
  // console.log('[LOGIN] Client IP:', ip, ' | User-Agent:', userAgent);

  // Validate and safe parse input
  const { credentials } = await request.json();
  const parsed = loginSchema.safeParse(credentials);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid Input", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { identifier, password } = parsed.data;

  try {
      // Check rate limit
      await checkLoginRateLimit(ip, identifier);

      // Login user/admin and generate response to be returned after setting cookie
      const user = await login(identifier, password);

      // Clear failed attempts and record successful login
      await clearFailedAttempts(ip, identifier);
      await recordLoginAttempt(ip, userAgent, identifier, true);

      const res = NextResponse.json({ user }, { status: 200 });

      const sessionType = user.system_role

      const sessionSetResponse = await createSession(user.id, sessionType, res);
      
      console.log('[LOGIN] Logged in successfully');
      console.log(sessionSetResponse)
      return sessionSetResponse;
  } catch (error) {
      if (error instanceof AppError) {
            // Record failed login attempt if not due to rate limit (which is handled in checkLoginRateLimit)
            if (error.code !== 'TOO_MANY_REQUESTS') {
              await recordLoginAttempt(ip, userAgent, identifier, false, error.message);
            } else {
              console.warn(`[LOGIN] Failed too many login attempts for Identifier: ${identifier}`);
            }
            return NextResponse.json(
                { error: error.message },
                { status: error.statusCode }
            );
        }

    console.error('[LOGIN]', error);
    await recordLoginAttempt(ip, userAgent, identifier, false, 'Internal Server Error');
    return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
    );
  }
}   