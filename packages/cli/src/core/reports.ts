import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { ScanReport } from '../agents/types.js';

const REPORTS_DIR = '.brainsield/reports';

export async function saveReport(report: ScanReport, cwd: string): Promise<string> {
  const reportsPath = join(cwd, REPORTS_DIR);
  if (!existsSync(reportsPath)) {
    mkdirSync(reportsPath, { recursive: true });
  }

  const filename = `scan-${report.id}.json`;
  const filePath = join(reportsPath, filename);
  writeFileSync(filePath, JSON.stringify(report, null, 2), 'utf-8');

  // Also write latest.json for easy access
  writeFileSync(join(reportsPath, 'latest.json'), JSON.stringify(report, null, 2), 'utf-8');

  return filePath;
}

export async function loadLatestReport(cwd: string): Promise<ScanReport | null> {
  const latestPath = join(cwd, REPORTS_DIR, 'latest.json');
  if (!existsSync(latestPath)) return null;

  try {
    const raw = readFileSync(latestPath, 'utf-8');
    return JSON.parse(raw) as ScanReport;
  } catch {
    return null;
  }
}

export async function listReports(cwd: string): Promise<string[]> {
  const reportsPath = join(cwd, REPORTS_DIR);
  if (!existsSync(reportsPath)) return [];

  return readdirSync(reportsPath)
    .filter((f) => f.startsWith('scan-') && f.endsWith('.json'))
    .sort()
    .reverse();
}
