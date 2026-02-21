'use client';

import { LoginForm } from '../../../components/auth/LoginForm';
import { SystemRole } from '@/types/db';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginPageContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') as SystemRole | null;
  const loginType = type === 'sysadmin' ? 'sysadmin' : 'user';

  const isSysAdminLogin = loginType === 'sysadmin';
  const isUserLogin = loginType === 'user';

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <div className="w-full max-w-md">
        <LoginForm loginType={loginType} />

        <div className="mt-8 p-6 bg-zinc-100 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-zinc-900">
            Test Accounts
          </h3>
          <div className="space-y-4 text-sm">
              {isSysAdminLogin && (
                <div className="bg-white p-4 rounded">
                  <p className="font-semibold text-zinc-900 mb-2">
                    System Admin
                  </p>

                  <p className="text-zinc-600">
                    Use the sysadmin account you created on app setup or create a new one using the sysadmin script
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">
                    Run: <code className="bg-zinc-200 px-1 rounded">pnpm init:sysadmin</code>
                  </p>
                </div>
              )}

              {isUserLogin && (
                <>
                  <div className="bg-white p-4 rounded">
                    <p className="font-semibold text-zinc-900 mb-2">
                      Organization Admin (UserRole: org_admin)
                    </p>
                    <p className="mt-2 text-zinc-600">
                      Email: <code className="bg-zinc-200 px-1 rounded">alice.johnson@example.com</code>
                    </p>
                    <p className="text-zinc-600">
                      Username: <code className="bg-zinc-200 px-1 rounded">ajohnson</code>
                    </p>
                    <p className="text-zinc-600">
                      Password: <code className="bg-zinc-200 px-1 rounded">password123!</code>
                    </p>
                    <p className="mt-2 text-xs text-zinc-500">
                      From seed script: <code className="bg-zinc-200 px-1 rounded">pnpm init:seed</code>
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded">
                    <p className="font-semibold text-zinc-900 mb-2">
                      Organization Member (UserRole: member)
                    </p>
                    <p className="text-zinc-600">
                      Email: <code className="bg-zinc-200 px-1 rounded">jane.smith@example.com</code>
                    </p>
                    <p className="text-zinc-600">
                      Username: <code className="bg-zinc-200 px-1 rounded">jsmith</code>
                    </p>
                    <p className="text-zinc-600">
                      Password: <code className="bg-zinc-200 px-1 rounded">password123!</code>
                    </p>
                    <p className="mt-2 text-xs text-zinc-500">
                      From seed script: <code className="bg-zinc-200 px-1 rounded">pnpm init:seed</code>
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded">
                    <p className="font-semibold text-zinc-900 mb-2">
                      Public User (UserRole: guest)
                    </p>
                    <p className="text-zinc-600">
                      Email: <code className="bg-zinc-200 px-1 rounded">john.doe@example.com</code>
                    </p>
                    <p className="text-zinc-600">
                      Username: <code className="bg-zinc-200 px-1 rounded">jdoe</code>
                    </p>
                    <p className="text-zinc-600">
                      Password: <code className="bg-zinc-200 px-1 rounded">password123!</code>
                    </p>
                    <p className="mt-2 text-xs text-zinc-500">
                      From seed script: <code className="bg-zinc-200 px-1 rounded">pnpm init:seed</code>
                    </p>
                  </div>
                </>
              )}

            
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="text-zinc-600">Loading...</div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
