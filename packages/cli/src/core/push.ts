/**
 * Push a scan report to the BrainShield web dashboard.
 *
 * Requires:
 *  - BRAINSIELD_API_URL  (default: https://brainsield.dev)
 *  - BRAINSIELD_API_TOKEN (set via `brain config --set-token <token>`)
 *  - BRAINSIELD_USER_ID  (Clerk user ID — set via `brain config --set-user <id>`)
 *  - BRAINSIELD_USER_EMAIL
 */

import { config } from './config.js';
import type { ScanReport } from '../agents/types.js';

export interface PushResult {
  ok:     boolean;
  scanId?: string;
  error?: string;
}

export async function pushReport(report: ScanReport): Promise<PushResult> {
  const apiUrl   = config.get('apiUrl');
  const token    = config.get('apiToken');
  const userId   = config.get('userId');
  const email    = config.get('userEmail');

  if (!token || !userId || !email) {
    return {
      ok:    false,
      error: 'Not configured. Run: brain config --set-token <token> --set-user <userId> --set-email <email>',
    };
  }

  const endpoint = `${apiUrl}/api/reports`;

  const body = {
    ...report,
    userId,
    userEmail: email,
  };

  try {
    const res = await fetch(endpoint, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, error: `Server returned ${res.status}: ${text.slice(0, 200)}` };
    }

    const data = await res.json() as { scanId?: string };
    return { ok: true, scanId: data.scanId };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
