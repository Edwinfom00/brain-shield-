import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import fg from 'fast-glob';
import { loadIgnorePatterns } from '../core/ignore.js';
import type { ScanContext, ProjectType } from './types.js';

const JS_PATTERNS = [
  '**/*.ts',
  '**/*.tsx',
  '**/*.js',
  '**/*.jsx',
  '**/*.mjs',
  '**/*.cjs',
];

export async function discoverProject(cwd: string): Promise<ScanContext> {
  const ignore = loadIgnorePatterns(cwd);

  // Gather all JS/TS files
  const files = await fg(JS_PATTERNS, {
    cwd,
    ignore,
    absolute: true,
    followSymbolicLinks: false,
    dot: true,
  });

  // Read package.json for project type detection
  const pkgPath = join(cwd, 'package.json');
  let packageJson: Record<string, unknown> | undefined;
  if (existsSync(pkgPath)) {
    try {
      packageJson = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    } catch {
      // ignore malformed package.json
    }
  }

  const projectType = detectProjectType(cwd, packageJson);
  const framework = detectFramework(packageJson);

  return { cwd, files, projectType, packageJson, framework };
}

function detectProjectType(
  cwd: string,
  pkg?: Record<string, unknown>
): ProjectType {
  if (!pkg) return 'unknown';

  const deps = {
    ...(pkg.dependencies as Record<string, string> | undefined),
    ...(pkg.devDependencies as Record<string, string> | undefined),
  };

  if ('next' in deps) return 'nextjs';
  if ('vite' in deps || '@vitejs/plugin-react' in deps) return 'vite';
  if ('express' in deps || 'fastify' in deps || 'hono' in deps) return 'express';

  if (existsSync(join(cwd, 'tsconfig.json'))) return 'typescript';

  return 'javascript';
}

function detectFramework(pkg?: Record<string, unknown>): string | undefined {
  if (!pkg) return undefined;

  const deps = {
    ...(pkg.dependencies as Record<string, string> | undefined),
    ...(pkg.devDependencies as Record<string, string> | undefined),
  };

  const frameworks: Record<string, string> = {
    next: 'Next.js',
    vite: 'Vite',
    express: 'Express',
    fastify: 'Fastify',
    hono: 'Hono',
    react: 'React',
    vue: 'Vue',
    svelte: 'Svelte',
    nuxt: 'Nuxt',
    remix: 'Remix',
    astro: 'Astro',
  };

  for (const [dep, name] of Object.entries(frameworks)) {
    if (dep in deps) return name;
  }

  return undefined;
}
