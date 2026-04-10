import { Command } from 'commander';
import React from 'react';
import { render } from 'ink';
import { ChatUI } from '../ui/ChatUI.js';
import { askClaudeChat, type ChatMessage } from '../core/claude.js';
import { discoverProject } from '../agents/discovery.js';
import {
  getOrInitSession,
  appendMessage,
  saveSession,
  buildProjectContext,
  loadSession,
} from '../core/session.js';

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are BrainShield, an expert AI security assistant specialized in JavaScript and TypeScript codebases.
You help developers understand security vulnerabilities, review code for security issues, explain fixes, and answer security questions.
Be concise, practical, and developer-friendly. Focus on actionable advice.
When asked about code, analyze it for security issues: XSS, injection, hardcoded secrets, authentication issues, insecure dependencies, etc.
Remember context from earlier in the conversation — if the user refers to "that vulnerability" or "the file we discussed", use the conversation history.`;

// ─── Command ──────────────────────────────────────────────────────────────────

export const chatCommand = new Command('chat')
  .aliases(['c'])
  .description('Start an interactive security chat with BrainShield')
  .option('-d, --dir <path>', 'Project directory for context', process.cwd())
  .option('--clear', 'Clear conversation history before starting')
  .action(async (opts) => {
    const cwd: string = opts.dir ?? process.cwd();

    // ── Load or init session ─────────────────────────────────────────────────
    let session = loadSession(cwd);

    if (!session) {
      try {
        const context = await discoverProject(cwd);
        session = await getOrInitSession(
          cwd,
          context.files,
          context.packageJson,
          context.projectType,
          context.framework,
        );
      } catch {
        // session is optional — chat still works without it
      }
    }

    // ── Clear history if requested ───────────────────────────────────────────
    if (opts.clear && session) {
      session = { ...session, conversationHistory: [] };
      saveSession(session, cwd);
    }

    // ── Build system prompt with project context ─────────────────────────────
    const projectCtx  = session ? buildProjectContext(session) : '';
    const fullSystem  = projectCtx
      ? `${SYSTEM_PROMPT}\n\n${projectCtx}`
      : SYSTEM_PROMPT;

    // ── Message handler — real multi-turn ────────────────────────────────────
    const handleMessage = async (userMessage: string): Promise<string> => {
      // Always reload session to get the latest persisted history
      const current = loadSession(cwd) ?? session;

      // Build the messages array from session history + new user message
      // This is what gets sent to Claude as a proper conversation
      const history: ChatMessage[] = (current?.conversationHistory ?? [])
        .slice(-20) // last 20 messages = 10 turns — keeps context window manageable
        .map((m) => ({ role: m.role, content: m.content }));

      const messages: ChatMessage[] = [
        ...history,
        { role: 'user', content: userMessage },
      ];

      const reply = await askClaudeChat(messages, fullSystem);

      // Persist both sides of the exchange to session
      if (current) {
        const updated = appendMessage(
          appendMessage(current, 'user', userMessage),
          'assistant',
          reply,
        );
        saveSession(updated, cwd);
      }

      return reply;
    };

    // ── Initial greeting ─────────────────────────────────────────────────────
    const meta         = session?.projectMeta;
    const historyCount = session?.conversationHistory.length ?? 0;

    const greeting = meta
      ? `Hello! I'm BrainShield, your AI security assistant.\n\nI have context on your ${meta.type} project "${meta.name}" (${meta.fileCount} files${meta.framework ? `, ${meta.framework}` : ''}).\n\nAsk me anything about your codebase security, or paste code to review.`
      : `Hello! I'm BrainShield, your AI security assistant.\n\nAsk me anything about your codebase security, or paste code you want me to review.`;

    const initialMsg = historyCount > 0
      ? `${greeting}\n\n(Resuming — ${historyCount} messages in memory. Use --clear to start fresh.)`
      : greeting;

    render(<ChatUI onMessage={handleMessage} initialMessage={initialMsg} />);
  });
