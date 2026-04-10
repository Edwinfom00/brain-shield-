import Conf from 'conf';

interface BrainShieldConfig {
  anthropicApiKey: string;
  model: string;
  maxTokensPerScan: number;
  maxCostPerScan: number;
}

const defaults: BrainShieldConfig = {
  anthropicApiKey: '',
  model: 'claude-opus-4-6',
  maxTokensPerScan: 100000,
  maxCostPerScan: 1.0,
};

export const config = new Conf<BrainShieldConfig>({
  projectName: 'brainsield',
  defaults,
  schema: {
    anthropicApiKey: { type: 'string' },
    model: { type: 'string' },
    maxTokensPerScan: { type: 'number' },
    maxCostPerScan: { type: 'number' },
  },
});

export function getApiKey(): string {
  return process.env.ANTHROPIC_API_KEY ?? config.get('anthropicApiKey');
}
