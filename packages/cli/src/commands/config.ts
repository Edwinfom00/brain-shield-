import { Command } from 'commander';
import chalk from 'chalk';
import { config } from '../core/config.js';

export const configCommand = new Command('config')
  .description('Configure BrainShield settings')
  .option('--set-key <key>', 'Set your Anthropic API key')
  .option('--set-model <model>', 'Set the Claude model to use')
  .option('--show', 'Show current configuration')
  .action((opts) => {
    if (opts.setKey) {
      config.set('anthropicApiKey', opts.setKey);
      console.log(chalk.green('✓ API key saved.'));
      return;
    }

    if (opts.setModel) {
      config.set('model', opts.setModel);
      console.log(chalk.green(`✓ Model set to ${opts.setModel}`));
      return;
    }

    if (opts.show || Object.keys(opts).length === 0) {
      const apiKey = config.get('anthropicApiKey');
      console.log(chalk.cyan('\n🛡 BrainShield Configuration\n'));
      console.log(`  API Key:  ${apiKey ? chalk.green('***' + apiKey.slice(-4)) : chalk.red('Not set')}`);
      console.log(`  Model:    ${chalk.white(config.get('model'))}`);
      console.log(`  Max Cost: $${config.get('maxCostPerScan')} per scan`);
      console.log(`  Config:   ${config.path}\n`);

      if (!apiKey && !process.env.ANTHROPIC_API_KEY) {
        console.log(
          chalk.yellow('  ⚠ Set your API key with: brain config --set-key <your-key>')
        );
        console.log(
          chalk.yellow('  Or export ANTHROPIC_API_KEY=<your-key>\n')
        );
      }
    }
  });
