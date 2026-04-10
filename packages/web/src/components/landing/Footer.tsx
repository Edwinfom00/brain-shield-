import { Shield } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 py-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-white">BrainShield</span>
          <span className="text-zinc-600 text-sm">by Edwin Fom</span>
        </div>

        <div className="flex items-center gap-6 text-sm text-zinc-500">
          <Link href="/docs" className="hover:text-zinc-300 transition-colors">Docs</Link>
          <Link href="/changelog" className="hover:text-zinc-300 transition-colors">Changelog</Link>
          <a href="https://github.com/Edwinfom00/brain-shield" target="_blank" rel="noopener" className="hover:text-zinc-300 transition-colors">GitHub</a>
          <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy</Link>
        </div>

        <p className="text-zinc-600 text-xs">
          © {new Date().getFullYear()} BrainShield. MIT License.
        </p>
      </div>
    </footer>
  );
}
