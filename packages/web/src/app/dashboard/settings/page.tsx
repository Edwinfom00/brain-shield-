import type { Metadata } from 'next';
import { UserProfile } from '@clerk/nextjs';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
        <p className="text-zinc-400 text-sm">Manage your account and preferences.</p>
      </div>
      <UserProfile
        appearance={{
          elements: {
            rootBox: 'w-full',
            card: 'bg-zinc-900 border border-zinc-800 shadow-xl rounded-2xl',
            headerTitle: 'text-white',
            headerSubtitle: 'text-zinc-400',
            profileSectionTitle: 'text-zinc-300',
            profileSectionTitleText: 'text-zinc-300',
            formFieldLabel: 'text-zinc-300',
            formFieldInput: 'bg-zinc-800 border-zinc-700 text-white',
            formButtonPrimary: 'bg-violet-600 hover:bg-violet-500',
            navbarButton: 'text-zinc-400 hover:text-white',
            navbarButtonIcon: 'text-zinc-400',
          },
        }}
      />
    </div>
  );
}
