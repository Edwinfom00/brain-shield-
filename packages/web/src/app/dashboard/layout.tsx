import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';

export const metadata: Metadata = { title: 'Dashboard' };

const SCAN_LIMIT = 50;

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/sign-in');

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const scanCount = await prisma.scan.count({
    where: { userId: session.user.id, scannedAt: { gte: startOfMonth } },
  });

  return (
    <div className="flex min-h-screen bg-[#09090b]">
      <DashboardSidebar scanCount={scanCount} scanLimit={SCAN_LIMIT} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
