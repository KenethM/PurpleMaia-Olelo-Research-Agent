/**
 * Registration Page
 * 
 * Server component that fetches available organizations from the database
 * and passes them to the client-side RegisterForm component.
 */

import { db } from "@/db/kysely/client";
import { RegisterForm } from "../../../components/auth/RegisterForm";

/**
 * Fetch all organizations from the database
 * This runs on the server at request time
 */
async function getOrganizations() {
  try {
    const organizations = await db
      .selectFrom('orgs')
      .select(['id', 'name', 'slug'])
      .orderBy('name', 'asc')
      .execute();
    
    return organizations;
  } catch (error) {
    console.error('[Register] Failed to fetch organizations:', error);
    return [];
  }
}

export default async function RegisterPage() {
  // Fetch organizations on the server
  const organizations = await getOrganizations();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black p-4">
      <div className="w-full max-w-md">
        <RegisterForm organizations={organizations} />
      </div>
    </div>
  );
}