/**
 * BrainShield Fix Engine
 * ──────────────────────
 * Replaces the naive "7-line context + string.replace" approach with a
 * proper fix workflow:
 *
 *  1. Read the FULL file content
 *  2. Send the full file + vulnerability details to Claude
 *  3. Claude returns the COMPLETE fixed file (not just a snippet)
 *  4. Validate the result is non-empty and different from original
 *  5. Compute a clean unified diff for display
 *  6. Write atomically (write to .tmp, then rename)
 *
 * Why full file?
 *  - Claude needs imports, types, surrounding functions to generate correct fixes
 *  - Avoids broken imports, missing variables, wrong indentation
 *  - Enables multi-location fixes in one pass (e.g. add import + fix usage)
 *
 * File size limit: files > MAX_FILE_BYTES are chunked — only the relevant
 * function/block is sent with broader context (top 60 lines + surrounding block).
 */

import { readFileSync, renameSync, writeFileSync } from 'fs';
import { join } from 'path';
import { askClaudeStructured } from './claude.js';
import { z } from 'zod';
import type { Vulnerability } from '../agents/types.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_FULL_FILE_BYTES = 40_000;   // ~1000 lines — send full file below this
const MAX_CHUNK_LINES     = 120;      // lines of context for large files

// ─── Zod schema for Claude's structured response ─────────────────────────────

const FixResponseSchema = z.object({
  fixedFile: z.string().min(1),
  explanation: z.string(),
  linesChanged: z.array(z.number()).optional(),
  confidence: z.enum(['high', 'medium', 'low']),
  warnings: z.array(z.string()).optional(),
});

type FixResponse = z.infer<typeof FixResponseSchema>;

// ─── Diff computation ─────────────────────────────────────────────────────────

export interface DiffLine {
  type: 'context' | 'added' | 'removed';
  lineNo: number;
  content: string;
}

export interface FileDiff {
  file: string;
  hunks: DiffLine[][];
  linesAdded: number;
  linesRemoved: number;
}

export function computeDiff(original: string, fixed: string, file: string): FileDiff {
  const origLines  = original.split('\n');
  const fixedLines = fixed.split('\n');
  const maxLen     = Math.max(origLines.length, fixedLines.length);

  const allLines: DiffLine[] = [];
  let linesAdded   = 0;
  let linesRemoved = 0;

  for (let i = 0; i < maxLen; i++) {
    const o = origLines[i];
    const f = fixedLines[i];

    if (o === f) {
      if (o !== undefined) allLines.push({ type: 'context', lineNo: i + 1, content: o });
    } else {
      if (o !== undefined) { allLines.push({ type: 'removed', lineNo: i + 1, content: o }); linesRemoved++; }
      if (f !== undefined) { allLines.push({ type: 'added',   lineNo: i + 1, content: f }); linesAdded++; }
    }
  }

  // Group into hunks (consecutive changed lines + 3 lines context around each)
  const changedIdxs = allLines
    .map((l, i) => (l.type !== 'context' ? i : -1))
    .filter((i) => i >= 0);

  if (changedIdxs.length === 0) {
    return { file, hunks: [], linesAdded: 0, linesRemoved: 0 };
  }

  const CONTEXT = 3;
  const hunks: DiffLine[][] = [];
  let hunk: DiffLine[] = [];
  let lastIncluded = -1;

  for (const idx of changedIdxs) {
    const start = Math.max(0, idx - CONTEXT);
    const end   = Math.min(allLines.length - 1, idx + CONTEXT);

    if (hunk.length > 0 && start > lastIncluded + 1) {
      hunks.push(hunk);
      hunk = [];
    }

    for (let i = Math.max(start, lastIncluded + 1); i <= end; i++) {
      hunk.push(allLines[i]!);
      lastIncluded = i;
    }
  }
  if (hunk.length > 0) hunks.push(hunk);

  return { file, hunks, linesAdded, linesRemoved };
}

// ─── Build prompt ─────────────────────────────────────────────────────────────

function buildFixPrompt(
  vuln: Vulnerability,
  fileContent: string,
  filePath: string,
  isChunked: boolean,
  projectContext: string,
): string {
  const vulnBlock = [
    `ID: ${vuln.id}`,
    `Title: ${vuln.title}`,
    `Severity: ${vuln.severity}`,
    `Category: ${vuln.category}`,
    `CWE: ${vuln.cwe ?? 'N/A'}`,
    `OWASP: ${vuln.owasp ?? 'N/A'}`,
    `Line: ${vuln.line ?? 'unknown'}`,
    `Description: ${vuln.description}`,
    `Fix guidance: ${vuln.fix ?? 'Apply security best practices'}`,
  ].join('\n');

  const fileBlock = isChunked
    ? `// NOTE: This is a relevant excerpt from ${filePath} (file too large to send in full)\n${fileContent}`
    : fileContent;

  return `You are a security engineer fixing a vulnerability in a JavaScript/TypeScript codebase.

## Vulnerability
${vulnBlock}

## File: ${filePath}
\`\`\`typescript
${fileBlock}
\`\`\`
${projectContext ? `\n## Project Context\n${projectContext}\n` : ''}
## Instructions
1. Fix ONLY the specific vulnerability described above
2. Do NOT refactor unrelated code
3. Preserve all existing imports, exports, types, and logic
4. If a new import is needed, add it at the top with existing imports
5. Return the COMPLETE fixed file content — not just the changed lines
6. If the fix requires changes in multiple places in this file, apply all of them

Respond with JSON only:
{
  "fixedFile": "<complete fixed file content as a string>",
  "explanation": "<1-2 sentences explaining what was changed and why>",
  "linesChanged": [<array of line numbers that were modified>],
  "confidence": "high" | "medium" | "low",
  "warnings": ["<any caveats or things the developer should know>"]
}`;
}

// ─── Extract relevant chunk for large files ───────────────────────────────────

function extractChunk(content: string, vuln: Vulnerability): string {
  const lines   = content.split('\n');
  const lineIdx = (vuln.line ?? 1) - 1;

  // Always include top of file (imports, module-level declarations)
  const topLines = lines.slice(0, Math.min(60, lineIdx - MAX_CHUNK_LINES / 2));

  // Include surrounding context around the vulnerability
  const ctxStart = Math.max(60, lineIdx - MAX_CHUNK_LINES / 2);
  const ctxEnd   = Math.min(lines.length, lineIdx + MAX_CHUNK_LINES / 2);
  const ctxLines = lines.slice(ctxStart, ctxEnd);

  const parts: string[] = [];
  if (topLines.length > 0) {
    parts.push(topLines.join('\n'));
    if (ctxStart > topLines.length) {
      parts.push(`\n// ... (${ctxStart - topLines.length} lines omitted) ...\n`);
    }
  }
  parts.push(ctxLines.join('\n'));

  return parts.join('\n');
}

// ─── Atomic write ─────────────────────────────────────────────────────────────

function atomicWrite(filePath: string, content: string): void {
  const tmp = filePath + '.brainsield.tmp';
  writeFileSync(tmp, content, 'utf-8');
  renameSync(tmp, filePath);
}

// ─── Main fix function ────────────────────────────────────────────────────────

export interface FixResult {
  success: boolean;
  diff?: FileDiff;
  explanation?: string;
  confidence?: 'high' | 'medium' | 'low';
  warnings?: string[];
  error?: string;
  skipped?: boolean;
  skipReason?: string;
}

export async function fixVulnerability(
  vuln: Vulnerability,
  cwd: string,
  projectContext: string,
  dryRun = false,
): Promise<FixResult> {
  const filePath = join(cwd, vuln.file);

  // ── Read file ──────────────────────────────────────────────────────────────
  let originalContent: string;
  try {
    originalContent = readFileSync(filePath, 'utf-8');
  } catch (err) {
    return { success: false, error: `Cannot read file: ${err instanceof Error ? err.message : String(err)}` };
  }

  if (!originalContent.trim()) {
    return { success: false, skipped: true, skipReason: 'File is empty' };
  }

  // ── Determine if we need to chunk ──────────────────────────────────────────
  const isLarge   = Buffer.byteLength(originalContent, 'utf-8') > MAX_FULL_FILE_BYTES;
  const fileContent = isLarge ? extractChunk(originalContent, vuln) : originalContent;

  // ── Build prompt and call Claude ───────────────────────────────────────────
  const prompt = buildFixPrompt(vuln, fileContent, vuln.file, isLarge, projectContext);

  let response: FixResponse;
  try {
    response = await askClaudeStructured(
      prompt,
      'You are a security code fixer. Return valid JSON only. The fixedFile field must contain the complete file content.',
      FixResponseSchema,
    );
  } catch (err) {
    return { success: false, error: `Claude API error: ${err instanceof Error ? err.message : String(err)}` };
  }

  // ── Validate response ──────────────────────────────────────────────────────
  const fixedContent = response.fixedFile.trim();

  if (!fixedContent) {
    return { success: false, error: 'Claude returned empty fix' };
  }

  if (fixedContent === originalContent.trim()) {
    return {
      success: false,
      skipped: true,
      skipReason: 'Fix produced no changes — vulnerability may require manual intervention',
      explanation: response.explanation,
      warnings: response.warnings,
    };
  }

  // For chunked files, we can't replace the full file — mark as manual
  if (isLarge) {
    return {
      success: false,
      skipped: true,
      skipReason: `File is too large (>${MAX_FULL_FILE_BYTES / 1000}KB) for automatic fix. Apply manually.`,
      explanation: response.explanation,
      warnings: [
        ...(response.warnings ?? []),
        `Suggested fix:\n${fixedContent.slice(0, 500)}...`,
      ],
    };
  }

  // ── Compute diff ───────────────────────────────────────────────────────────
  const diff = computeDiff(originalContent, fixedContent, vuln.file);

  if (diff.linesAdded === 0 && diff.linesRemoved === 0) {
    return {
      success: false,
      skipped: true,
      skipReason: 'No effective changes detected in diff',
    };
  }

  // ── Apply fix (unless dry-run) ─────────────────────────────────────────────
  if (!dryRun) {
    try {
      atomicWrite(filePath, fixedContent);
    } catch (err) {
      return { success: false, error: `Write failed: ${err instanceof Error ? err.message : String(err)}` };
    }
  }

  return {
    success: true,
    diff,
    explanation: response.explanation,
    confidence: response.confidence,
    warnings: response.warnings,
  };
}
