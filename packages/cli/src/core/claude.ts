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

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ─── Guardian config ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildGuardianConfig(schema?: z.ZodType<any>) {
  const model      = config.get('model');
  const maxCostUSD = config.get('maxCostPerScan');
  const maxTokens  = config.get('maxTokensPerScan');

  return {
    pii: {
      targets: ['email', 'url'] as PIIType[],
      onInput:  true  as const,
      onOutput: false as const,
    },
    injection: {
      enabled:     true  as const,
      sensitivity: 'low' as const, // source code has eval/exec naturally
    },
    budget: {
      model: model as SupportedModel,
      maxTokens,
      maxCostUSD,
    },
    ...(schema ? { schema: { validator: schema, repair: 'retry' as const } } : {}),
  };
}

// ─── Single-turn (scan enrichment, fix generation, etc.) ─────────────────────

export async function askClaude(
  prompt: string,
  systemPrompt: string,
  model?: string,
): Promise<string> {
  const client        = getClient();
  const selectedModel = model ?? config.get('model');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const guardian = new Guardian<any>(buildGuardianConfig());

  const result = await guardian.protect(
    async (safePrompt: string) => {
      return client.messages.create({
        model:      selectedModel,
        max_tokens: 8096,
        system:     systemPrompt,
        messages:   [{ role: 'user', content: safePrompt }],
      });
    },
    prompt,
  );

  return result.raw;
}

// ─── Multi-turn chat (real conversation history) ──────────────────────────────
//
// Sends the full messages[] array to Claude — each turn is a separate message
// object, not a concatenated string. This is how Claude Code / real chat works.
//
// Guardian wraps only the latest user message for PII/injection checks.
// The history is passed through as-is (already sanitized on previous turns).

export async function askClaudeChat(
  messages: ChatMessage[],
  systemPrompt: string,
  model?: string,
): Promise<string> {
  const client        = getClient();
  const selectedModel = model ?? config.get('model');

  if (messages.length === 0) throw new Error('messages array cannot be empty');

  // Sanitize only the latest user message through Guardian
  const lastMsg = messages[messages.length - 1]!;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const guardian = new Guardian<any>(buildGuardianConfig());

  // We use guardian.protect just for the last message's content check,
  // then build the full messages array ourselves
  let sanitizedLastContent = lastMsg.content;
  try {
    await guardian.protect(
      async (safe: string) => {
        sanitizedLastContent = safe;
        // Return a dummy response — we don't use this result
        return { content: [{ type: 'text' as const, text: '' }] } as Anthropic.Message;
      },
      lastMsg.content,
    );
  } catch {
    // If guardian blocks it, propagate
    throw new Error('Message blocked by safety filter');
  }

  // Build the full messages array with sanitized last message
  const apiMessages: Anthropic.MessageParam[] = [
    ...messages.slice(0, -1).map((m) => ({
      role:    m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: sanitizedLastContent },
  ];

  const response = await client.messages.create({
    model:      selectedModel,
    max_tokens: 8096,
    system:     systemPrompt,
    messages:   apiMessages,
  });

  const block = response.content[0];
  if (!block || block.type !== 'text') throw new Error('Unexpected response format from Claude');
  return block.text;
}

// ─── Structured output (scan enrichment, fix engine) ─────────────────────────

export async function askClaudeStructured<T>(
  prompt: string,
  systemPrompt: string,
  schema: z.ZodType<T>,
  model?: string,
): Promise<T> {
  const client        = getClient();
  const selectedModel = model ?? config.get('model');
  const guardian      = new Guardian<T>(buildGuardianConfig(schema));

  const result = await guardian.protect(
    async (safePrompt: string) => {
      return client.messages.create({
        model:      selectedModel,
        max_tokens: 8096,
        system:     systemPrompt + '\n\nAlways respond with valid JSON only. No markdown, no explanation.',
        messages:   [{ role: 'user', content: safePrompt }],
      });
    },
    prompt,
  );

  return result.data as T;
}
