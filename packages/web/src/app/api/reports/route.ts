/**
 * POST /api/reports  — CLI pushes a scan report after brain scan
 * GET  /api/reports  — Dashboard fetches paginated scan list
 *
 * Auth:
 *  POST → Bearer token (BRAINSIELD_API_TOKEN) + userId in body
 *  GET  → Clerk session (dashboard user)
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// ─── Zod schema for incoming CLI report ──────────────────────────────────────

const VulnerabilitySchema = z.object({
  id:          z.string(),
  title:       z.string(),
  description: z.string(),
  severity:    z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']),
  category:    z.string(),
  file:        z.string(),
  line:        z.number().optional(),
  snippet:     z.string().optional(),
  fix:         z.string().optional(),
  cwe:         z.string().optional(),
  owasp:       z.string().optional(),
  autoFixable: z.boolean(),
});

const ScanReportSchema = z.object({
  id:           z.string(),
  userId:       z.string(),           // Clerk user ID
  userEmail:    z.string().email(),
  timestamp:    z.string(),
  cwd:          z.string(),
  projectType:  z.string(),
  framework:    z.string().optional(),
  score:        z.number().int().min(0).max(100),
  vulnerabilities: z.array(VulnerabilitySchema),
  duration:     z.number().int(),
  filesScanned: z.number().int(),
});

// ─── POST — receive report from CLI ──────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Verify CLI token
  const authHeader = req.headers.get('authorization');
  const token      = authHeader?.replace('Bearer ', '');
  const expected   = process.env.BRAINSIELD_API_TOKEN;

  if (!expected || token !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = ScanReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid report schema', details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const report = parsed.data;
  const vulns  = report.vulnerabilities;

  // Upsert user (create if first scan)
  await prisma.user.upsert({
    where:  { id: report.userId },
    update: { email: report.userEmail },
    create: { id: report.userId, email: report.userEmail },
  });

  // Derive project name from cwd
  const projectName = report.cwd.split('/').pop() ?? report.cwd.split('\\').pop() ?? 'unknown';

  // Count by severity
  const criticalCount = vulns.filter((v) => v.severity === 'CRITICAL').length;
  const highCount     = vulns.filter((v) => v.severity === 'HIGH').length;
  const mediumCount   = vulns.filter((v) => v.severity === 'MEDIUM').length;
  const lowCount      = vulns.filter((v) => v.severity === 'LOW').length;

  // Upsert scan (idempotent — CLI may retry)
  const scan = await prisma.scan.upsert({
    where:  { id: report.id },
    update: {},
    create: {
      id:           report.id,
      userId:       report.userId,
      projectName,
      projectType:  report.projectType,
      framework:    report.framework,
      cwd:          report.cwd,
      filesScanned: report.filesScanned,
      duration:     report.duration,
      score:        report.score,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      scannedAt:    new Date(report.timestamp),
    },
  });

  // Insert findings (skip if already exist)
  const existingIds = new Set(
    (await prisma.finding.findMany({ where: { scanId: scan.id }, select: { id: true } }))
      .map((f) => f.id)
  );

  const newFindings = vulns.filter((v) => !existingIds.has(v.id));

  if (newFindings.length > 0) {
    await prisma.finding.createMany({
      data: newFindings.map((v) => ({
        id:          v.id,
        scanId:      scan.id,
        title:       v.title,
        description: v.description,
        severity:    v.severity,
        category:    v.category,
        file:        v.file,
        line:        v.line,
        snippet:     v.snippet,
        fix:         v.fix,
        cwe:         v.cwe,
        owasp:       v.owasp,
        autoFixable: v.autoFixable,
      })),
    });
  }

  return NextResponse.json({ ok: true, scanId: scan.id }, { status: 201 });
}

// ─── GET — dashboard scan list ────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page  = Math.max(1, parseInt(searchParams.get('page')  ?? '1'));
  const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '20'));
  const skip  = (page - 1) * limit;

  const userId = session.user.id;

  const [scans, total] = await Promise.all([
    prisma.scan.findMany({
      where:   { userId },
      orderBy: { scannedAt: 'desc' },
      skip,
      take:    limit,
      select: {
        id:           true,
        projectName:  true,
        projectType:  true,
        framework:    true,
        score:        true,
        filesScanned: true,
        duration:     true,
        criticalCount:true,
        highCount:    true,
        mediumCount:  true,
        lowCount:     true,
        scannedAt:    true,
      },
    }),
    prisma.scan.count({ where: { userId } }),
  ]);

  // Aggregate stats
  const stats = await prisma.scan.aggregate({
    where: { userId },
    _avg:  { score: true },
    _sum:  { criticalCount: true },
    _count:{ id: true },
  });

  const cleanScans = await prisma.scan.count({
    where: { userId, criticalCount: 0, highCount: 0, mediumCount: 0, lowCount: 0 },
  });

  return NextResponse.json({
    scans,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    stats: {
      totalScans:    stats._count.id,
      avgScore:      Math.round(stats._avg.score ?? 0),
      criticalFound: stats._sum.criticalCount ?? 0,
      cleanScans,
    },
  });
}
