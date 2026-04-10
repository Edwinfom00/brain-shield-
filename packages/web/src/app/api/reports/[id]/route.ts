/**
 * GET /api/reports/[id] — Full scan detail with all findings
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const scan = await prisma.scan.findUnique({
    where: { id },
    include: { findings: { orderBy: [{ severity: 'asc' }, { file: 'asc' }] } },
  });

  if (!scan) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (scan.userId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  return NextResponse.json(scan);
}
