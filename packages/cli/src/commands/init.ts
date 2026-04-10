/**
 * `brain init` — Initialize or refresh the project knowledge index
 *
 * This command:
 *  1. Discovers all JS/TS files in the project
 *  2. Builds a lightweight file index (path + hash + size)
 *  3. Identifies key files (entry points, auth, API, config)
 *  4. Calls Claude to generate summaries of key files (knowledge chunks)
 *  5. Saves everything to .brainsield/session.json
 *
 * All subsequent commands (scan, fix, chat) read this session for richer context.
 * Re-running `brain init` only re-summarizes files that have changed (hash diff).
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { discoverProject } from '../agents/discovery.js';
import { initSession, loadSession } from '../core/session.js';
import { getApiKey } from '../core/config.js';

const SEP = chalk.hex('#27272A')('─'.repeat(56));

export const initCommand = new Command('init')
  .description('Initialize the project knowledge index for richer AI context')
  .option('-d, --dir <path>', 'Project directory', process.cwd())
  .option('--no-ai', 'Skip AI summarization (fast, index only)')
  .action(async (opts) => {
    const cwd: string = opts.dir ?? process.cwd();
    const useAi = opts.ai !== false;

    console.log();
    console.log(SEP);
    console.log(
      '  ' + chalk.hex('#7C3AED').bold('▐█▌  BrainShield Init') +
      chalk.hex('#3F3F46')('  ·  ') +
      chalk.hex('#6B7280')(useAi ? 'Building knowledge index' : 'Building file index (no AI)')
    );
    console.log(SEP);
    console.log();

    // ── Check API key if AI mode ─────────────────────────────────────────────
    if (useAi && !getApiKey()) {
      console.log(chalk.yellow('  ⚠  No API key found. Running in --no-ai mode.'));
      console.log(chalk.hex('#6B7280')('     Set your key: brain config --set-key <key>\n'));
    }

    const hasKey = !!getApiKey();
    const doAi   = useAi && hasKey;

    // ── Discover project ─────────────────────────────────────────────────────
    process.stdout.write(chalk.hex('#6B7280')('  ◉  Discovering files...'));
    const context = await discoverProject(cwd);
    process.stdout.write('\r' + ' '.repeat(40) + '\r');

    console.log(
      chalk.green('  ✓  ') +
      chalk.white(`${context.files.length} files`) +
      chalk.hex('#6B7280')(` · ${context.projectType}${context.framework ? ` (${context.framework})` : ''}`)
    );

    // ── Check existing session ───────────────────────────────────────────────
    const existing = loadSession(cwd);
    if (existing) {
      const stale = existing.fileIndex.filter((f) => {
        // We'll detect stale files during initSession — just report count
        return true;
      }).length;
      console.log(
        chalk.hex('#6B7280')(`  ·  Existing session found — refreshing`)
      );
    }

    // ── Build session ────────────────────────────────────────────────────────
    if (doAi) {
      console.log(chalk.hex('#6B7280')('  ◉  Identifying key files...'));
    }

    const session = await initSession({
      cwd,
      files:         context.files,
      packageJson:   context.packageJson,
      projectType:   context.projectType,
      framework:     context.framework,
      generateKnowledge: doAi,
      onProgress: (msg) => {
        process.stdout.write('\r' + ' '.repeat(50) + '\r');
        process.stdout.write(chalk.hex('#A78BFA')(`  ◉  ${msg}`));
      },
    });

    // Clear progress line
    process.stdout.write('\r' + ' '.repeat(60) + '\r');

    // ── Summary ──────────────────────────────────────────────────────────────
    console.log();
    console.log(SEP);

    const keyCount = session.fileIndex.filter((f) => f.isKey).length;
    console.log(chalk.green('  ✓  Session initialized'));
    console.log();
    console.log(
      chalk.hex('#6B7280')('     Project  ') +
      chalk.white(session.projectMeta.name)
    );
    console.log(
      chalk.hex('#6B7280')('     Type     ') +
      chalk.white(`${session.projectMeta.type}${session.projectMeta.framework ? ` · ${session.projectMeta.framework}` : ''}`)
    );
    console.log(
      chalk.hex('#6B7280')('     Files    ') +
      chalk.white(`${session.projectMeta.fileCount} total · ${keyCount} key files`)
    );

    if (session.knowledgeChunks.length > 0) {
      console.log(
        chalk.hex('#6B7280')('     Indexed  ') +
        chalk.white(`${session.knowledgeChunks.length} files summarized by AI`)
      );
    }

    console.log(
      chalk.hex('#6B7280')('     Saved    ') +
      chalk.hex('#3F3F46')('.brainsield/session.json')
    );
    console.log();

    if (!doAi) {
      console.log(
        chalk.hex('#6B7280')('  Tip: run ') +
        chalk.hex('#7C3AED')('brain init') +
        chalk.hex('#6B7280')(' with an API key for AI-powered knowledge indexing.')
      );
      console.log();
    }

    console.log(
      chalk.hex('#6B7280')('  Next: ') +
      chalk.hex('#7C3AED')('brain scan') +
      chalk.hex('#6B7280')(' to analyze your codebase')
    );
    console.log();
  });
