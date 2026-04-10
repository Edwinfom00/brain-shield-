/**
 * BrainShield Session & Knowledge Index
 * ──────────────────────────────────────
 * Stored at: <project>/.brainsield/session.json
 *
 * Architecture:
 *  - projectMeta      → lightweight project descriptor (type, framework, deps, stats)
 *  - fileIndex        → path + size + hash per file (no content — fast to compute)
 *  - knowledgeChunks  → AI-generated summaries of key files (entry points, auth, API, config)
 *                       generated once, invalidated by hash change
 *  - lastScanId       → reference to latest scan report
 *  - conversationHistory → chat messages for persistent memory across sessions
 *
 * Design decisions:
 *  - We never store full file content in the session (too large, privacy risk)
 *  - knowledgeChunks are generated lazily and cached by file hash
 *  - conversationHistory is capped at MAX_HISTORY messages (sliding window)
 *  - All commands read session on startup → richer Claude context at no extra cost
 */

import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { basename, join, relative } from 'path';
import type { ProjectType } from '../agents/types.js';
import { askClaude } from './claude.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const SESSION_DIR  = '.brainsield';
const SESSION_FILE = '.brainsield/session.json';
const SESSION_VERSION = 2;
const MAX_HISTORY  = 40;   // messages kept in conversation history
const MAX_CHUNKS   = 20;   // max files to summarize in knowledge index
const CHUNK_MAX_BYTES = 8_000; // max bytes read per file for summarization

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FileEntry {
  path: string;       // relative to cwd
  hash: string;       // sha256 of content (first 16KB)
  size: number;       // bytes
  isKey: boolean;     // flagged as a key file (entry point, auth, api, config)
}

export interface KnowledgeChunk {
  path: string;       // relative to cwd
  hash: string;       // hash at time of summarization
  summary: string;    // AI-generated summary
  topics: string[];   // detected topics: ['auth', 'api', 'db', 'secrets', ...]
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  ts: number;
}

export interface ProjectMeta {
  name: string;
  type: ProjectType;
  framework?: string;
  dependencies: string[];   // top-level dep names only
  fileCount: number;
  totalBytes: number;
  entryPoints: string[];    // detected entry files
  hasTests: boolean;
  hasCi: boolean;
}

export interface Session {
  version: number;
  cwd: string;
  createdAt: string;
  updatedAt: string;
  projectMeta: ProjectMeta;
  fileIndex: FileEntry[];
  knowledgeChunks: KnowledgeChunk[];
  lastScanId: string | null;
  conversationHistory: ConversationMessage[];
}

// ─── File hashing ─────────────────────────────────────────────────────────────

function hashFile(filePath: string): string {
  try {
    // Only hash first 16KB for speed on large files
    const fd   = readFileSync(filePath);
    const buf  = fd.length > 16_384 ? fd.subarray(0, 16_384) : fd;
    return createHash('sha256').update(buf).digest('hex').slice(0, 16);
  } catch {
    return 'error';
  }
}

// ─── Key file detection ───────────────────────────────────────────────────────

const KEY_PATTERNS = [
  /index\.(ts|tsx|js|jsx)$/,
  /app\.(ts|tsx|js|jsx)$/,
  /server\.(ts|js)$/,
  /main\.(ts|js)$/,
  /auth/i,
  /middleware/i,
  /route[s]?\.(ts|js)$/,
  /api\//,
  /config\.(ts|js)$/,
  /env\.(ts|js)$/,
  /prisma|drizzle|mongoose/i,
  /layout\.(tsx|jsx)$/,
];

function isKeyFile(relPath: string): boolean {
  return KEY_PATTERNS.some((p) => p.test(relPath));
}

// ─── Project meta builder ─────────────────────────────────────────────────────

function buildProjectMeta(
  cwd: string,
  files: string[],
  packageJson: Record<string, unknown> | undefined,
  projectType: ProjectType,
  framework: string | undefined,
): ProjectMeta {
  const name = (packageJson?.name as string | undefined)
    ?? basename(cwd);

  const allDeps = Object.keys({
    ...(packageJson?.dependencies as Record<string, string> | undefined ?? {}),
    ...(packageJson?.devDependencies as Record<string, string> | undefined ?? {}),
  });

  const totalBytes = files.reduce((acc, f) => {
    try { return acc + statSync(f).size; } catch { return acc; }
  }, 0);

  const relFiles = files.map((f) => relative(cwd, f));

  const entryPoints = relFiles.filter((f) =>
    /^(src\/)?(index|main|app|server)\.(ts|tsx|js|jsx)$/.test(f)
  ).slice(0, 5);

  const hasTests = relFiles.some((f) => /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(f));
  const hasCi    = existsSync(join(cwd, '.github/workflows'))
    || existsSync(join(cwd, '.gitlab-ci.yml'))
    || existsSync(join(cwd, 'Jenkinsfile'));

  return {
    name,
    type: projectType,
    framework,
    dependencies: allDeps.slice(0, 60),
    fileCount: files.length,
    totalBytes,
    entryPoints,
    hasTests,
    hasCi,
  };
}

// ─── Knowledge chunk generation ───────────────────────────────────────────────

async function generateChunk(
  filePath: string,
  relPath: string,
  projectMeta: ProjectMeta,
): Promise<KnowledgeChunk> {
  const hash = hashFile(filePath);

  let content = '';
  try {
    const raw = readFileSync(filePath, 'utf-8');
    content = raw.length > CHUNK_MAX_BYTES
      ? raw.slice(0, CHUNK_MAX_BYTES) + '\n// [truncated]'
      : raw;
  } catch {
    return { path: relPath, hash, summary: 'Could not read file.', topics: [] };
  }

  const prompt = `Analyze this ${projectMeta.type} source file and provide a concise technical summary.

File: ${relPath}
Project: ${projectMeta.name} (${projectMeta.framework ?? projectMeta.type})

\`\`\`
${content}
\`\`\`

Respond with JSON only:
{
  "summary": "2-3 sentence technical description of what this file does",
  "topics": ["list", "of", "topics", "from: auth, api, db, secrets, config, routing, middleware, ui, utils, types, tests"]
}`;

  try {
    const raw = await askClaude(
      prompt,
      'You are a code analyst. Respond with valid JSON only, no markdown.',
    );
    const parsed = JSON.parse(raw.replace(/^```json?\n?/m, '').replace(/\n?```$/m, '').trim()) as {
      summary: string;
      topics: string[];
    };
    return { path: relPath, hash, summary: parsed.summary, topics: parsed.topics };
  } catch {
    // Fallback: basic summary without AI
    const lines = content.split('\n').slice(0, 5).join(' ');
    return {
      path: relPath,
      hash,
      summary: `File at ${relPath}. First lines: ${lines.slice(0, 200)}`,
      topics: [],
    };
  }
}

// ─── Session I/O ──────────────────────────────────────────────────────────────

function sessionPath(cwd: string): string {
  return join(cwd, SESSION_FILE);
}

export function loadSession(cwd: string): Session | null {
  const p = sessionPath(cwd);
  if (!existsSync(p)) return null;
  try {
    const raw = readFileSync(p, 'utf-8');
    const s   = JSON.parse(raw) as Session;
    if (s.version !== SESSION_VERSION) return null; // version mismatch → rebuild
    return s;
  } catch {
    return null;
  }
}

export function saveSession(session: Session, cwd: string): void {
  const dir = join(cwd, SESSION_DIR);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(
    sessionPath(cwd),
    JSON.stringify({ ...session, updatedAt: new Date().toISOString() }, null, 2),
    'utf-8',
  );
}

// ─── Conversation history ─────────────────────────────────────────────────────

export function appendMessage(
  session: Session,
  role: 'user' | 'assistant',
  content: string,
): Session {
  const history = [
    ...session.conversationHistory,
    { role, content, ts: Date.now() },
  ].slice(-MAX_HISTORY); // sliding window

  return { ...session, conversationHistory: history };
}

export function getConversationContext(session: Session): string {
  if (session.conversationHistory.length === 0) return '';
  const recent = session.conversationHistory.slice(-10);
  return recent
    .map((m) => `${m.role === 'user' ? 'User' : 'BrainShield'}: ${m.content}`)
    .join('\n');
}

// ─── Project context string (injected into Claude prompts) ───────────────────

export function buildProjectContext(session: Session): string {
  const { projectMeta: m, knowledgeChunks: chunks, lastScanId } = session;

  const lines: string[] = [
    `## Project Context`,
    `Name: ${m.name}`,
    `Type: ${m.type}${m.framework ? ` (${m.framework})` : ''}`,
    `Files: ${m.fileCount} JS/TS files`,
    `Dependencies: ${m.dependencies.slice(0, 20).join(', ')}`,
    `Entry points: ${m.entryPoints.join(', ') || 'none detected'}`,
    `Has tests: ${m.hasTests}  |  Has CI: ${m.hasCi}`,
  ];

  if (chunks.length > 0) {
    lines.push(`\n## Key File Summaries`);
    for (const c of chunks.slice(0, 12)) {
      lines.push(`\n### ${c.path}`);
      lines.push(c.summary);
      if (c.topics.length > 0) lines.push(`Topics: ${c.topics.join(', ')}`);
    }
  }

  if (lastScanId) {
    lines.push(`\n## Last Scan: ${lastScanId}`);
  }

  return lines.join('\n');
}

// ─── Main init / refresh ──────────────────────────────────────────────────────

export interface InitSessionOptions {
  cwd: string;
  files: string[];
  packageJson: Record<string, unknown> | undefined;
  projectType: ProjectType;
  framework: string | undefined;
  generateKnowledge?: boolean;   // call Claude to summarize key files
  onProgress?: (msg: string) => void;
}

export async function initSession(opts: InitSessionOptions): Promise<Session> {
  const {
    cwd, files, packageJson, projectType, framework,
    generateKnowledge = false,
    onProgress,
  } = opts;

  const existing = loadSession(cwd);

  // ── Build file index ───────────────────────────────────────────────────────
  const fileIndex: FileEntry[] = files.map((absPath) => {
    const relPath = relative(cwd, absPath);
    return {
      path: relPath,
      hash: hashFile(absPath),
      size: (() => { try { return statSync(absPath).size; } catch { return 0; } })(),
      isKey: isKeyFile(relPath),
    };
  });

  // ── Build project meta ─────────────────────────────────────────────────────
  const projectMeta = buildProjectMeta(cwd, files, packageJson, projectType, framework);

  // ── Determine which key files need (re)summarization ──────────────────────
  const keyFiles = fileIndex.filter((f) => f.isKey).slice(0, MAX_CHUNKS);

  let knowledgeChunks: KnowledgeChunk[] = existing?.knowledgeChunks ?? [];

  if (generateKnowledge && keyFiles.length > 0) {
    const existingMap = new Map(knowledgeChunks.map((c) => [c.path, c]));
    const toProcess   = keyFiles.filter((f) => {
      const cached = existingMap.get(f.path);
      return !cached || cached.hash !== f.hash; // missing or stale
    });

    if (toProcess.length > 0) {
      onProgress?.(`Indexing ${toProcess.length} key file${toProcess.length > 1 ? 's' : ''}...`);

      const newChunks = await Promise.all(
        toProcess.map((f) =>
          generateChunk(join(cwd, f.path), f.path, projectMeta)
        )
      );

      // Merge: keep cached chunks that are still valid, add new ones
      const merged = new Map(existingMap);
      for (const c of newChunks) merged.set(c.path, c);

      // Only keep chunks for files still in the index
      const validPaths = new Set(keyFiles.map((f) => f.path));
      knowledgeChunks = [...merged.values()].filter((c) => validPaths.has(c.path));
    }
  }

  const now = new Date().toISOString();

  const session: Session = {
    version:             SESSION_VERSION,
    cwd,
    createdAt:           existing?.createdAt ?? now,
    updatedAt:           now,
    projectMeta,
    fileIndex,
    knowledgeChunks,
    lastScanId:          existing?.lastScanId ?? null,
    conversationHistory: existing?.conversationHistory ?? [],
  };

  saveSession(session, cwd);
  return session;
}

// ─── Quick load or init (no AI, fast path) ────────────────────────────────────

export async function getOrInitSession(
  cwd: string,
  files: string[],
  packageJson: Record<string, unknown> | undefined,
  projectType: ProjectType,
  framework: string | undefined,
): Promise<Session> {
  return initSession({
    cwd, files, packageJson, projectType, framework,
    generateKnowledge: false, // fast — no Claude calls
  });
}
