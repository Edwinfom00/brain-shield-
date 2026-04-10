import { Command } from 'commander';
import chalk from 'chalk';
import { config, getWriteMode, isPushConfigured } from '../core/config.js';

const SEP = chalk.hex('#27272A')('─'.repeat(56));

function printHeader(title: string): void {
  console.log();
  console.log(SEP);
  console.log(
    '  ' + chalk.hex('#7C3AED').bold('▐█▌  BrainShield') +
    chalk.hex('#3F3F46')('  ·  ') +
    chalk.hex('#6B7280')(title)
  );
  console.log(SEP);
  console.log();
}

export const configCommand = new Command('config')
  .description('Configure BrainShield settings')
  .option('--set-key <key>',     'Set your Anthropic API key')
  .option('--set-model <model>', 'Set the Claude model to use')
  .option('--autopilot',         'Allow brain to write files without asking (opt-in)')
  .option('--supervised',        'Ask before every file write — default safe mode')
  .option('--set-token <token>', 'Set dashboard API token')
  .option('--set-user <id>',     'Set your Clerk user ID for dashboard push')
  .option('--set-email <email>', 'Set your email for dashboard push')
  .option('--set-url <url>',     'Set dashboard URL (default: https://brainsield.dev)')
  .option('--show',              'Show current configuration')
  .action((opts) => {

    // ── Set API key ──────────────────────────────────────────────────────────
    if (opts.setKey) {
      config.set('anthropicApiKey', opts.setKey);
      console.log();
      console.log(chalk.green('  ✓  API key saved.'));
      console.log(chalk.hex('#6B7280')(`     Stored at: ${config.path}`));
      console.log();
      return;
    }

    // ── Set model ────────────────────────────────────────────────────────────
    if (opts.setModel) {
      config.set('model', opts.setModel);
      console.log();
      console.log(chalk.green(`  ✓  Model set to ${chalk.white(opts.setModel)}`));
      console.log();
      return;
    }

    // ── Set write mode ───────────────────────────────────────────────────────
    if (opts.autopilot) {      config.set('writeMode', 'autopilot');
      console.log();
      console.log(SEP);
      console.log(
        '  ' + chalk.hex('#F97316').bold('⚡  Autopilot mode enabled') +
        chalk.hex('#6B7280')('  — brain will write files without asking')
      );
      console.log(SEP);
      console.log();
      console.log(chalk.hex('#6B7280')('  brain fix --critical  ') + chalk.hex('#6B7280')('will now apply fixes automatically'));
      console.log(chalk.hex('#6B7280')('  To revert: ') + chalk.hex('#7C3AED')('brain config --supervised'));
      console.log();
      return;
    }

    if (opts.supervised) {
      config.set('writeMode', 'ask');
      console.log();
      console.log(chalk.green('  ✓  Supervised mode enabled — brain will ask before every write.'));
      console.log();
      return;
    }

    // ── Dashboard config ─────────────────────────────────────────────────────
    if (opts.setToken) {
      config.set('apiToken', opts.setToken);
      console.log(chalk.green('\n  ✓  Dashboard token saved.\n'));
      return;
    }
    if (opts.setUser) {
      config.set('userId', opts.setUser);
      console.log(chalk.green('\n  ✓  User ID saved.\n'));
      return;
    }
    if (opts.setEmail) {
      config.set('userEmail', opts.setEmail);
      console.log(chalk.green('\n  ✓  Email saved.\n'));
      return;
    }
    if (opts.setUrl) {
      config.set('apiUrl', opts.setUrl);
      console.log(chalk.green(`\n  ✓  Dashboard URL set to ${opts.setUrl}\n`));
      return;
    }

    // ── Show config ──────────────────────────────────────────────────────────
    printHeader('Configuration');

    const apiKey    = config.get('anthropicApiKey');
    const model     = config.get('model');
    const cost      = config.get('maxCostPerScan');
    const writeMode = getWriteMode();

    const keyDisplay = apiKey
      ? chalk.green('●  ') + chalk.white('sk-ant-***' + apiKey.slice(-4))
      : chalk.red('●  ') + chalk.red('Not set');

    const writeModeDisplay = writeMode === 'autopilot'
      ? chalk.hex('#F97316').bold('autopilot') + chalk.hex('#6B7280')(' (writes without asking)')
      : chalk.green.bold('supervised') + chalk.hex('#6B7280')(' (asks before every write)');

    const pushStatus = isPushConfigured()
      ? chalk.green('●  configured')
      : chalk.hex('#6B7280')('●  not configured');

    console.log(`  ${chalk.hex('#6B7280')('API Key    ')}  ${keyDisplay}`);
    console.log(`  ${chalk.hex('#6B7280')('Model      ')}  ${chalk.white(model)}`);
    console.log(`  ${chalk.hex('#6B7280')('Max Cost   ')}  ${chalk.white(`$${cost}`)} per scan`);
    console.log(`  ${chalk.hex('#6B7280')('Write Mode ')}  ${writeModeDisplay}`);
    console.log(`  ${chalk.hex('#6B7280')('Dashboard  ')}  ${pushStatus}  ${chalk.hex('#3F3F46')(config.get('apiUrl'))}`);
    console.log(`  ${chalk.hex('#6B7280')('Config     ')}  ${chalk.hex('#3F3F46')(config.path)}`);
    console.log();

    if (!apiKey && !process.env.ANTHROPIC_API_KEY) {
      console.log(SEP);
      console.log(chalk.yellow('  ⚠  API key not configured'));
      console.log();
      console.log(
        '  ' + chalk.hex('#7C3AED')('brain config --set-key <your-key>') +
        chalk.hex('#6B7280')('   save key to config')
      );
      console.log(
        '  ' + chalk.hex('#7C3AED')('export ANTHROPIC_API_KEY=<key>   ') +
        chalk.hex('#6B7280')('   use env variable')
      );
      console.log();
    }
  });
