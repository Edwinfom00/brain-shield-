import { Command } from 'commander';
import React from 'react';
import { render } from 'ink';
import { ChatUI } from '../ui/ChatUI.js';
import { askClaude } from '../core/claude.js';
import { discoverProject } from '../agents/discovery.js';
import {
  getOrInitSession,
  appendMessage,
  saveSession,
  buildProjectContext,
  getConversationContext,
  loadSession,
} from '../core/session.js';

const SYSTEM_PROMPT = `You are BrainShield, an expert AI security assistant specialized in JavaScript and TypeScript codebases.
You help developers understand security vulnerabilities, review code for security issues, explain fixes, and answer security questions.
Be concise, practical, and developer-friendly. Focus on actionable advice.
When asked about code, analyze it for security issues: XSS, injection, hardcoded secrets, authentication issues, insecure dependencies, etc.`;

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

    // ── Build project context string ─────────────────────────────────────────
    const projectCtx = session ? buildProjectContext(session) : '';

    // ── Message handler ──────────────────────────────────────────────────────
    const handleMessage = async (message: string): Promise<string> => {
      // Reload session to get latest history (in case of concurrent writes)
      let current = loadSession(cwd) ?? session;

      // Build full system prompt with project context
      const fullSystem = [
        SYSTEM_PROMPT,
        projectCtx ? `\n\n${projectCtx}` : '',
      ].join('');

      // Build prompt with conversation history for continuity
      const history = current ? getConversationContext(current) : '';
      const fullPrompt = history
        ? `Previous conversation:\n${history}\n\nUser: ${message}`
        : message;

      const reply = await askClaude(fullPrompt, fullSystem);

      // Persist conversation to session
      if (current) {
        current = appendMessage(current, 'user', message);
        current = appendMessage(current, 'assistant', reply);
        saveSession(current, cwd);
      }

      return reply;
    };

    // ── Initial greeting ─────────────────────────────────────────────────────
    const meta = session?.projectMeta;
    const greeting = meta
      ? `Hello! I'm BrainShield, your AI security assistant.\n\nI have context on your ${meta.type} project "${meta.name}" (${meta.fileCount} files${meta.framework ? `, ${meta.framework}` : ''}).\n\nAsk me anything about your codebase security, or paste code to review.`
      : `Hello! I'm BrainShield, your AI security assistant.\n\nAsk me anything about your codebase security, or paste code you want me to review.`;

    const historyCount = session?.conversationHistory.length ?? 0;
    const initialMsg = historyCount > 0
      ? `${greeting}\n\n(Resuming conversation — ${historyCount} previous messages in memory. Use --clear to start fresh.)`
      : greeting;

    render(
      <ChatUI
        onMessage={handleMessage}
        initialMessage={initialMsg}
      />
    );
  });
