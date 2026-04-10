import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const DEFAULT_IGNORE: string[] = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/out/**',
  '**/.cache/**',
  '**/coverage/**',
  '**/*.min.js',
  '**/*.min.ts',
  '**/package-lock.json',
  '**/yarn.lock',
  '**/pnpm-lock.yaml',
  '**/*.map',
  '**/*.d.ts',
];

export function loadIgnorePatterns(cwd: string): string[] {
  const patterns = [...DEFAULT_IGNORE];

  // Load .brainsieldignore if it exists
  const ignorePath = join(cwd, '.brainsieldignore');
  if (existsSync(ignorePath)) {
    const lines = readFileSync(ignorePath, 'utf-8')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'));
    patterns.push(...lines);
  }

  return patterns;
}
