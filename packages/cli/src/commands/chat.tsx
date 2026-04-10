import { Command } from 'commander';
import React from 'react';
import { render } from 'ink';
import { ChatUI } from '../ui/ChatUI.js';
import { askClaude } from '../core/claude.js';
import { discoverProject } from '../agents/discovery.js';

const SYSTEM_PROMPT = `You are BrainShield, an expert AI security assistant specialized in JavaScript and TypeScript codebases.
You help developers understand security vulnerabilities, review code for security issues, explain fixes, and answer security questions.
Be concise, practical, and developer-friendly. Focus on actionable advice.
When asked about code, analyze it for security issues: XSS, injection, hardcoded secrets, authentication issues, insecure dependencies, etc.`;

export const chatCommand = new Command('chat')
  .aliases(['c'])
  .description('Start an interactive security chat with BrainShield')
  .option('-d, --dir <path>', 'Project directory for context', process.cwd())
  .action(async (opts) => {
    const cwd: string = opts.dir ?? process.cwd();

    let context = '';
    try {
      const project = await discoverProject(cwd);
      context = `\nProject context: ${project.projectType} project${project.framework ? ` (${project.framework})` : ''}, ${project.files.length} files.`;
    } catch {
      // context is optional
    }

    const handleMessage = async (message: string): Promise<string> => {
      return askClaude(message, SYSTEM_PROMPT + context);
    };

    render(
      <ChatUI
        onMessage={handleMessage}
        initialMessage={`Hello! I'm BrainShield, your AI security assistant.${context}\n\nAsk me anything about your codebase security, or paste code you want me to review.`}
      />
    );
  });
