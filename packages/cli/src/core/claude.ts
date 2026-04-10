import Anthropic from '@anthropic-ai/sdk';
import { Guardian, type PIIType, type SupportedModel } from '@edwinfom/ai-guard';
import { z } from 'zod';
import { getApiKey, config } from './config.js';

let _client: Anthropic | null = null;

export function getClient(): Anthropic {
  if (!_client) {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error(
        'No Anthropic API key found.\n' +
        'Run: brain config --set-key <your-key>\n' +
        'Or set ANTHROPIC_API_KEY environment variable.'
      );
    }
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildGuardianConfig(schema?: z.ZodType<any>) {
  const model = config.get('model');
  const maxCostUSD = config.get('maxCostPerScan');
  const maxTokens = config.get('maxTokensPerScan');

  return {
    pii: {
      targets: ['email', 'url'] as PIIType[],
      onInput: true as const,
      onOutput: false as const,
    },
    injection: {
      enabled: true as const,
      // Low sensitivity — source code naturally contains patterns
      // that look like injections (eval, exec, process calls, etc.)
      sensitivity: 'low' as const,
    },
    budget: {
      model: model as SupportedModel,
      maxTokens,
      maxCostUSD,
    },
    ...(schema
      ? {
          schema: {
            validator: schema,
            repair: 'retry' as const,
          },
        }
      : {}),
  };
}

export async function askClaude(
  prompt: string,
  systemPrompt: string,
  model?: string
): Promise<string> {
  const client = getClient();
  const selectedModel = model ?? config.get('model');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const guardian = new Guardian<any>(buildGuardianConfig());

  const result = await guardian.protect(
    async (safePrompt: string) => {
      return client.messages.create({
        model: selectedModel,
        max_tokens: 8096,
        system: systemPrompt,
        messages: [{ role: 'user', content: safePrompt }],
      });
    },
    prompt
  );

  return result.raw;
}

export async function askClaudeStructured<T>(
  prompt: string,
  systemPrompt: string,
  schema: z.ZodType<T>,
  model?: string
): Promise<T> {
  const client = getClient();
  const selectedModel = model ?? config.get('model');
  const guardian = new Guardian<T>(buildGuardianConfig(schema));

  const result = await guardian.protect(
    async (safePrompt: string) => {
      return client.messages.create({
        model: selectedModel,
        max_tokens: 8096,
        system:
          systemPrompt +
          '\n\nAlways respond with valid JSON only. No markdown, no explanation.',
        messages: [{ role: 'user', content: safePrompt }],
      });
    },
    prompt
  );

  return result.data as T;
}
