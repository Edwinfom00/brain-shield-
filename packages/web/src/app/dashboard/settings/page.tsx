import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/sign-in');

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
        <p className="text-zinc-400 text-sm">Manage your account and preferences.</p>
      </div>

      <div className="max-w-lg space-y-4">
        {/* Profile */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-zinc-300 mb-4">Profile</h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-zinc-500 mb-1">Name</p>
              <p className="text-sm text-white">{session.user.name}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1">Email</p>
              <p className="text-sm text-white">{session.user.email}</p>
            </div>
          </div>
        </div>

        {/* CLI config */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-zinc-300 mb-2">CLI Configuration</h2>
          <p className="text-xs text-zinc-500 mb-4">
            Use these values to connect the CLI to your dashboard.
          </p>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-zinc-500 mb-1">Your User ID</p>
              <code className="text-xs text-violet-300 font-mono bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-lg block">
                {session.user.id}
              </code>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1">Setup command</p>
              <code className="text-xs text-violet-300 font-mono bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-lg block leading-relaxed">
                brain config --set-user {session.user.id}<br />
                brain config --set-email {session.user.email}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
