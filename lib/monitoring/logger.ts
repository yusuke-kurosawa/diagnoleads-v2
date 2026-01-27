/**
 * Structured Logging Utility
 *
 * Provides consistent logging across the application with support for
 * structured logging in production (JSON format) and human-readable
 * output in development.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Minimum log level based on environment
const MIN_LOG_LEVEL: LogLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

/**
 * Check if a log level should be output
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LOG_LEVEL];
}

/**
 * Format log entry for output
 */
function formatLogEntry(entry: LogEntry): string {
  if (process.env.NODE_ENV === 'production') {
    // JSON format for production (better for log aggregation)
    return JSON.stringify(entry);
  }

  // Human-readable format for development
  const { timestamp, level, message, context, error } = entry;
  const levelColor = {
    debug: '\x1b[36m', // cyan
    info: '\x1b[32m', // green
    warn: '\x1b[33m', // yellow
    error: '\x1b[31m', // red
  }[level];
  const reset = '\x1b[0m';

  let output = `${levelColor}[${level.toUpperCase()}]${reset} ${timestamp} - ${message}`;

  if (context && Object.keys(context).length > 0) {
    output += `\n  Context: ${JSON.stringify(context, null, 2)}`;
  }

  if (error) {
    output += `\n  Error: ${error.name}: ${error.message}`;
    if (error.stack) {
      output += `\n  Stack: ${error.stack}`;
    }
  }

  return output;
}

/**
 * Create a log entry and output it
 */
function log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
  };

  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  const output = formatLogEntry(entry);

  switch (level) {
    case 'debug':
    case 'info':
      console.log(output);
      break;
    case 'warn':
      console.warn(output);
      break;
    case 'error':
      console.error(output);
      break;
  }
}

/**
 * Logger instance with methods for each log level
 */
export const logger = {
  debug(message: string, context?: LogContext): void {
    log('debug', message, context);
  },

  info(message: string, context?: LogContext): void {
    log('info', message, context);
  },

  warn(message: string, context?: LogContext, error?: Error): void {
    log('warn', message, context, error);
  },

  error(message: string, error?: Error, context?: LogContext): void {
    log('error', message, context, error);
  },

  /**
   * Log an API request
   */
  apiRequest(method: string, path: string, context?: LogContext): void {
    log('info', `API ${method} ${path}`, {
      ...context,
      type: 'api_request',
    });
  },

  /**
   * Log an API response
   */
  apiResponse(
    method: string,
    path: string,
    statusCode: number,
    durationMs: number,
    context?: LogContext
  ): void {
    const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    log(level, `API ${method} ${path} - ${statusCode} (${durationMs}ms)`, {
      ...context,
      type: 'api_response',
      statusCode,
      durationMs,
    });
  },

  /**
   * Log a database query
   */
  dbQuery(query: string, durationMs: number, context?: LogContext): void {
    log('debug', `DB Query (${durationMs}ms)`, {
      ...context,
      type: 'db_query',
      query: query.substring(0, 200), // Truncate long queries
      durationMs,
    });
  },

  /**
   * Log a webhook delivery
   */
  webhookDelivery(webhookId: string, success: boolean, context?: LogContext): void {
    const level: LogLevel = success ? 'info' : 'warn';
    log(level, `Webhook delivery ${success ? 'succeeded' : 'failed'}`, {
      ...context,
      type: 'webhook_delivery',
      webhookId,
      success,
    });
  },

  /**
   * Log an authentication event
   */
  authEvent(
    event: 'login' | 'logout' | 'signup' | 'password_reset',
    userId?: string,
    context?: LogContext
  ): void {
    log('info', `Auth: ${event}`, {
      ...context,
      type: 'auth_event',
      event,
      userId,
    });
  },
};

export default logger;
