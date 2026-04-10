import { SignIn } from '@clerk/nextjs';
import { Shield } from 'lucide-react';
import Link from 'next/link';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/8 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl">BrainShield</span>
        </div>

        {/* Clerk sign-in */}
        <div className="flex justify-center">
          <SignIn
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'bg-zinc-900 border border-zinc-800 shadow-xl rounded-2xl',
                headerTitle: 'text-white',
                headerSubtitle: 'text-zinc-400',
                socialButtonsBlockButton: 'bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700',
                dividerLine: 'bg-zinc-700',
                dividerText: 'text-zinc-500',
                formFieldLabel: 'text-zinc-300',
                formFieldInput: 'bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-violet-500',
                formButtonPrimary: 'bg-violet-600 hover:bg-violet-500',
                footerActionText: 'text-zinc-400',
                footerActionLink: 'text-violet-400 hover:text-violet-300',
                identityPreviewText: 'text-zinc-300',
                identityPreviewEditButtonIcon: 'text-violet-400',
              },
            }}
          />
        </div>

        <p className="text-center text-zinc-600 text-xs mt-6">
          <Link href="/" className="hover:text-zinc-400 transition-colors">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
