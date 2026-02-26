import { Errors } from "@/lib/errors";
import { db } from "@/db/kysely/client";
import { NextRequest } from "next/server";

/**
 * Extract client IP address from request headers
 * Checks common proxy headers in order of reliability
 */
export function getClientIP(request: NextRequest): string | null {
  
    // Cloudflare
    const cfConnectingIP = request.headers.get('cf-connecting-ip');
    if (cfConnectingIP) return cfConnectingIP;
  
    const xForwardedFor = request.headers.get('x-forwarded-for');
    if (xForwardedFor) {
        // x-forwarded-for can contain multiple IPs: "client, proxy1, proxy2"
        // The first one is the original client (only one proxy on this infrastructure)
        return xForwardedFor.split(',')[0].trim();
    }

    // Standard proxy header
    const xRealIP = request.headers.get('x-real-ip');
    if (xRealIP) return xRealIP;

    // Fallback (may not be available in serverless)
    return null;
}

/**
 * Retrieves the User-Agent header from the request.
 * @param request The incoming NextRequest.
 * @returns The User-Agent string if present, otherwise null.
 */
export function getUserAgent(request: NextRequest): string | null {
  return request.headers.get('user-agent');
}

/**
 * Records a login attempt in the database.
 * @param ip The IP address of the client (may be null).
 * @param userAgent The User-Agent string of the client (may be null).
 * @param identifier The user identifier (e.g., email or username) used for the login attempt.
 * @param success Whether the login attempt was successful.
 * @param error Optional error message if the attempt failed.
 */
export async function recordLoginAttempt(ip: string | null, userAgent: string | null, identifier: string, success: boolean, error?: string, ): Promise<void> {
    const result = await db.insertInto('login_attempts')
        .values({
            ip_address: ip,
            user_agent: userAgent,
            identifier: identifier,
            error_message: error,
            successful: success
        })
        .execute();

    if (!result[0].numInsertedOrUpdatedRows || result[0].numInsertedOrUpdatedRows === BigInt(0)) {
        console.error('[RateLimit] Failed to record login attempt for Identifier:', identifier);
    }
}

/**
 * Checks if the number of failed login attempts exceeds the allowed limit.
 * @param ip The client IP address (may be null).
 * @param identifier The user identifier (e.g., email or username).
 * @throws Error with code 'TOO_MANY_REQUESTS' if the limit is exceeded.
 */
export async function checkLoginRateLimit(ip: string | null, identifier: string): Promise<void> {
    const MAX_ATTEMPTS = 5;
    const WINDOW_MINUTES = 15;

    const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);

    const result = await db.selectFrom('login_attempts')
        .select(db.fn.count<number>('id').as('attemptCount'))
        .where('attempt_at', '>=', since)
        .where('successful', '=', false)
        .where((eb) => {
            const conditions = [eb('identifier', '=', identifier)];
            if (ip) {
                conditions.push(eb('ip_address', '=', ip));
            }
            return eb.or(conditions);
        })
        .executeTakeFirst();
    
    const attemptCount = result ? Number(result.attemptCount) : 0;
    const remainingAttempts = Math.max(0, MAX_ATTEMPTS - attemptCount);

    console.log(`[RateLimit] Login attempts in last ${WINDOW_MINUTES} minutes for Identifier (${identifier}): ${attemptCount}. Remaining: ${remainingAttempts}`);

    if (attemptCount >= MAX_ATTEMPTS) {
        throw Errors.TOO_MANY_REQUESTS;
    }
}

/**
 * Clears all failed login attempt records for a given IP and identifier.
 * @param ip The client IP address (may be null).
 * @param identifier The user identifier (e.g., email or username).
 */
export async function clearFailedAttempts(ip: string | null, identifier: string): Promise<void> {
    const result = await db.deleteFrom('login_attempts')
        .where('successful', '=', false)
        .where((eb) => {
            const conditions = [eb('identifier', '=', identifier)];
            if (ip) {
                conditions.push(eb('ip_address', '=', ip));
            }
            return eb.or(conditions);
        })
        .execute();

    console.log(`[RateLimit] Cleared failed login attempts for Identifier (${identifier}). Deleted rows: ${result.length}`);
}