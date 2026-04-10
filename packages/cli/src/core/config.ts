import Conf from 'conf';

interface BrainShieldConfig {
  anthropicApiKey: string;
  model: string;
  maxTokensPerScan: number;
  maxCostPerScan: number;
  writeMode: 'ask' | 'autopilot';
  // ── Dashboard push ────────────────────────────────────────────────────────
  apiUrl:    string;
  apiToken:  string;
  userId:    string;
  userEmail: string;
}

const defaults: BrainShieldConfig = {
  anthropicApiKey: '',
  model:           'claude-opus-4-5',
  maxTokensPerScan: 100000,
  maxCostPerScan:   1.0,
  writeMode:        'ask',
  apiUrl:           'https://brainsield.dev',
  apiToken:         '',
  userId:           '',
  userEmail:        '',
};

export const config = new Conf<BrainShieldConfig>({
  projectName: 'brainsield',
  defaults,
  schema: {
    anthropicApiKey:  { type: 'string' },
    model:            { type: 'string' },
    maxTokensPerScan: { type: 'number' },
    maxCostPerScan:   { type: 'number' },
    writeMode:        { type: 'string', enum: ['ask', 'autopilot'] },
    apiUrl:           { type: 'string' },
    apiToken:         { type: 'string' },
    userId:           { type: 'string' },
    userEmail:        { type: 'string' },
  },
});

export function getApiKey(): string {
  return process.env.ANTHROPIC_API_KEY ?? config.get('anthropicApiKey');
}

export function getWriteMode(): 'ask' | 'autopilot' {
  return config.get('writeMode');
}

export function isAutopilot(): boolean {
  return config.get('writeMode') === 'autopilot';
}

export function isPushConfigured(): boolean {
  return !!(config.get('apiToken') && config.get('userId') && config.get('userEmail'));
}
