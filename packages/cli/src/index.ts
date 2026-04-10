#!/usr/bin/env node
import { program } from 'commander';
import { brainCommand } from './commands/brain.js';
import { chatCommand } from './commands/chat.js';
import { fixCommand } from './commands/fix.js';
import { reportCommand } from './commands/report.js';
import { configCommand } from './commands/config.js';
import { initCommand } from './commands/init.js';
import { printBanner } from './ui/banner.js';
import { version } from './version.js';

const isMachineOutput =
  process.argv.includes('--json') ||
  process.argv.includes('--version') ||
  process.argv.includes('-V');

if (!isMachineOutput) {
  printBanner();
}

program
  .name('brain')
  .description('BrainShield — AI-powered security analysis for your codebase')
  .version(version, '-V, --version');

program.addCommand(brainCommand);
program.addCommand(chatCommand);
program.addCommand(fixCommand);
program.addCommand(reportCommand);
program.addCommand(configCommand);
program.addCommand(initCommand);

// `brain` alone → scan (with auto session init)
program.action(async () => {
  await brainCommand.parseAsync([], { from: 'user' });
});

program.parseAsync(process.argv).catch((err: unknown) => {
  console.error((err as Error).message);
  process.exit(1);
});
