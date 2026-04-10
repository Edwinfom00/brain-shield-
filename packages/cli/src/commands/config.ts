import { Command } from 'commander';
import chalk from 'chalk';
import { config } from '../core/config.js';

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

    // ── Show config ──────────────────────────────────────────────────────────
    printHeader('Configuration');

    const apiKey = config.get('anthropicApiKey');
    const model  = config.get('model');
    const cost   = config.get('maxCostPerScan');

    const keyDisplay = apiKey
      ? chalk.green('●  ') + chalk.white('sk-ant-***' + apiKey.slice(-4))
      : chalk.red('●  ') + chalk.red('Not set');

    console.log(`  ${chalk.hex('#6B7280')('API Key  ')}  ${keyDisplay}`);
    console.log(`  ${chalk.hex('#6B7280')('Model    ')}  ${chalk.white(model)}`);
    console.log(`  ${chalk.hex('#6B7280')('Max Cost ')}  ${chalk.white(`$${cost}`)} per scan`);
    console.log(`  ${chalk.hex('#6B7280')('Config   ')}  ${chalk.hex('#3F3F46')(config.path)}`);
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
