type LogLevel = "INFO" | "WARN" | "ERROR";

interface LogEntry {
  readonly level: LogLevel;
  readonly message: string;
  readonly context?: string;
  readonly timestamp: string;
  readonly data?: unknown;
}

const formatEntry = (entry: LogEntry): string => {
  const base = `[${entry.timestamp}] [${entry.level}]${entry.context ? ` [${entry.context}]` : ""} ${entry.message}`;
  return entry.data !== undefined ? `${base} ${JSON.stringify(entry.data)}` : base;
};

const createEntry = (
  level: LogLevel,
  message: string,
  context?: string,
  data?: unknown,
): LogEntry => ({
  level,
  message,
  context,
  timestamp: new Date().toISOString(),
  data,
});

export const logger = {
  info(message: string, context?: string, data?: unknown): void {
    console.log(formatEntry(createEntry("INFO", message, context, data)));
  },

  warn(message: string, context?: string, data?: unknown): void {
    console.warn(formatEntry(createEntry("WARN", message, context, data)));
  },

  error(message: string, context?: string, data?: unknown): void {
    console.error(formatEntry(createEntry("ERROR", message, context, data)));
  },
} as const;
