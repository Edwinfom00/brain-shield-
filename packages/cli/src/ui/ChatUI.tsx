import React, { useState } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import TextInput from 'ink-text-input';
import { Avatar } from './Avatar.js';
import { Header } from './Header.js';
import { theme } from './theme.js';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatUIProps {
  onMessage: (message: string) => Promise<string>;
  initialMessage?: string;
}

export function ChatUI({ onMessage, initialMessage }: ChatUIProps) {
  const { exit } = useApp();
  const [messages, setMessages] = useState<Message[]>(
    initialMessage
      ? [{ role: 'assistant', content: initialMessage }]
      : []
  );
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);

  useInput((inputChar, key) => {
    if (key.escape || (key.ctrl && inputChar === 'c')) {
      exit();
    }
  });

  const handleSubmit = async (value: string) => {
    if (!value.trim() || thinking) return;
    const userMessage = value.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setThinking(true);

    try {
      const response = await onMessage(userMessage);
      setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  // Show last 6 messages to keep the terminal clean
  const visibleMessages = messages.slice(-6);

  return (
    <Box flexDirection="column" height={process.stdout.rows - 2}>
      <Header />

      <Box flexDirection="row" gap={2} flexGrow={1}>
        {/* Avatar sidebar */}
        <Box flexDirection="column" width={16}>
          <Avatar thinking={thinking} speaking={!thinking && messages.length > 0} />
          <Box marginTop={1} flexDirection="column" alignItems="center">
            <Text color={thinking ? theme.warning : theme.success} bold>
              {thinking ? '● thinking' : '● ready'}
            </Text>
          </Box>
        </Box>

        {/* Chat messages */}
        <Box flexDirection="column" flexGrow={1} gap={1}>
          {visibleMessages.map((msg, i) => (
            <Box key={i} flexDirection="column">
              <Text
                color={msg.role === 'user' ? theme.info : theme.primary}
                bold
              >
                {msg.role === 'user' ? 'You' : '🛡 BrainShield'}
              </Text>
              <Text color={theme.white} wrap="wrap">
                {msg.content}
              </Text>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Input bar */}
      <Box
        borderStyle="round"
        borderColor={thinking ? theme.muted : theme.primary}
        paddingX={1}
        marginTop={1}
      >
        <Text color={theme.primary}>› </Text>
        <TextInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          placeholder={thinking ? 'Thinking...' : 'Ask about your codebase security...'}
        />
      </Box>
      <Text color={theme.muted}> ESC or Ctrl+C to exit</Text>
    </Box>
  );
}
