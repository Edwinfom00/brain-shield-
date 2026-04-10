export const theme = {
  primary: '#7C3AED',    // violet
  success: '#10B981',    // green
  warning: '#F59E0B',    // amber
  danger: '#EF4444',     // red
  info: '#3B82F6',       // blue
  muted: '#6B7280',      // gray
  white: '#F9FAFB',

  severity: {
    CRITICAL: '#EF4444',
    HIGH: '#F97316',
    MEDIUM: '#F59E0B',
    LOW: '#3B82F6',
    INFO: '#6B7280',
  },
} as const;

export type SeverityLevel = keyof typeof theme.severity;
