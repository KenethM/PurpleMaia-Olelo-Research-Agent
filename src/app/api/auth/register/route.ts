import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/kysely/client";
import { createSession } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";

const registerSchema = z.object({
  email: z.email({ message: "Please enter a valid email address" }),
  username: z.string()
    .min(3, { message: "Username must be at least 3 characters long" })
    .regex(/^[a-zA-Z0-9_]+$/, { message: "Username can only contain letters, numbers, and underscores" }),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters long" }),
  organizationId: z.string().optional() // Organization is optional
});

export async function POST(request: NextRequest) {

  try {
    const body = await request.json();

    // Validate credential inputs
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { email, username, password, organizationId } = parsed.data;

    // Check if email already exists
    const existingEmail = await db
      .selectFrom('users')
      .select('id')
      .where('email', '=', email)
      .executeTakeFirst();

    if (existingEmail) {
      throw new Error('EXISTING_EMAIL');
    }

    // Check if username already exists
    const existingUsername = await db
      .selectFrom('users')  
      .select('id')
      .where('username', '=', username)
      .executeTakeFirst();

    if (existingUsername) {
      throw new Error('EXISTING_USERNAME');
    }

    // If organization is provided, verify it exists
    if (organizationId) {
      const org = await db
        .selectFrom('orgs')
        .select('id')
        .where('id', '=', organizationId)
        .executeTakeFirst();

      if (!org) {
        throw new Error('ORGANIZATION_NOT_FOUND');
      }
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const newUser = await db
      .insertInto('users')
      .values({
        email,
        username,
        password_hash: passwordHash,
      })
      .returning(['id', 'email', 'username', 'system_role', 'created_at'])
      .executeTakeFirst();

    if (!newUser) {
      throw new Error('Failed to create user');
    }

    // If organization is provided, create member record
    if (organizationId) {
      await db
        .insertInto('members')
        .values({
          user_id: newUser.id,
          org_id: organizationId,
          user_role: 'member', // Default role for new members
        })
        .execute();
    }

    // Create session and return response
    const res = NextResponse.json({ 
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        system_role: newUser.system_role,
        created_at: newUser.created_at,
        role: organizationId ? 'member' : null
      }
    }, { status: 201 });
    
    const sessionSetResponse = await createSession(newUser.id, 'user', res);
    
    return sessionSetResponse;

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    switch (message) {
        case 'EXISTING_USERNAME':
            return NextResponse.json(
                { error: 'Username already taken' }, 
                { status: 409 }
            );
        case 'EXISTING_EMAIL':
            return NextResponse.json(
                { error: 'Email already taken' }, 
                { status: 409 }
            );                
        case 'ORGANIZATION_NOT_FOUND':
            return NextResponse.json(
                { error: 'Associated organization not found' }, 
                { status: 404 }
            );            
        default:
            console.error('[REGISTER]', error);
            return NextResponse.json(
                { error: 'Internal Server Error' }, 
                { status: 500 }
            );
    }
  }
}
