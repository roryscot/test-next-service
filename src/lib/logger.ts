// src/lib/logger.ts
// Simple, Next.js-compatible logger

interface LogContext {
  correlationId?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
  error?: string;
  stack?: string;
  [key: string]: unknown;
}

class Logger {
  private level: string;

  constructor() {
    this.level = process.env.LOG_LEVEL || "info";
  }

  private shouldLog(level: string): boolean {
    const levels = { error: 0, warn: 1, info: 2, debug: 3 };
    return levels[level as keyof typeof levels] <= levels[this.level as keyof typeof levels];
  }

  private formatMessage(level: string, context: LogContext, message: string): string {
    const timestamp = new Date().toISOString();
    const contextStr = Object.keys(context).length > 0 ? ` ${JSON.stringify(context)}` : "";
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  private log(level: string, context: LogContext, message: string): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, context, message);
    
    if (level === "error") {
      console.error(formattedMessage);
    } else if (level === "warn") {
      console.warn(formattedMessage);
    } else {
      console.log(formattedMessage);
    }
  }

  error(context: LogContext, message: string): void {
    this.log("error", context, message);
  }

  warn(context: LogContext, message: string): void {
    this.log("warn", context, message);
  }

  info(context: LogContext, message: string): void {
    this.log("info", context, message);
  }

  debug(context: LogContext, message: string): void {
    this.log("debug", context, message);
  }

  child(additionalContext: LogContext): Logger {
    const childLogger = new Logger();
    const originalLog = childLogger.log.bind(childLogger);
    
    childLogger.log = (level: string, context: LogContext, message: string) => {
      const mergedContext = { ...additionalContext, ...context };
      originalLog(level, mergedContext, message);
    };
    
    return childLogger;
  }
}

// Create logger instance
export const logger = new Logger();

// Request logger with correlation ID
export function createRequestLogger(correlationId: string) {
  return logger.child({ correlationId });
}

// Log levels for different scenarios
export const logLevels = {
  ERROR: "error",
  WARN: "warn",
  INFO: "info",
  DEBUG: "debug",
} as const;

// Structured logging helpers
export function logRequest(
  correlationId: string,
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  error?: Error
) {
  const requestLogger = createRequestLogger(correlationId);

  if (error) {
    requestLogger.error(
      {
        method,
        url,
        statusCode,
        duration,
        error: error.message,
        stack: error.stack,
      },
      "Request failed"
    );
  } else {
    requestLogger.info(
      {
        method,
        url,
        statusCode,
        duration,
      },
      "Request completed"
    );
  }
}

export function logError(
  correlationId: string,
  error: Error,
  context?: Record<string, unknown>
) {
  const requestLogger = createRequestLogger(correlationId);
  requestLogger.error(
    {
      error: error.message,
      stack: error.stack,
      ...context,
    },
    "Application error"
  );
}
