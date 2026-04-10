import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'BrainShield — AI Security CLI', template: '%s · BrainShield' },
  description: 'AI-powered security analysis for JavaScript & TypeScript codebases. Detect, analyze, and fix vulnerabilities automatically.',
  keywords: ['security', 'cli', 'ai', 'typescript', 'nextjs', 'vulnerability', 'scanner'],
  authors: [{ name: 'Edwin Fom' }],
  openGraph: {
    type: 'website',
    siteName: 'BrainShield',
    title: 'BrainShield — AI Security CLI',
    description: 'Detect, analyze, and fix security vulnerabilities with AI.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark" suppressHydrationWarning>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
