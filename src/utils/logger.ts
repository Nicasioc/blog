type LogLevel = 'error' | 'warn' | 'info' | 'debug'

type LogContext = Record<string, unknown>

const log = (level: LogLevel, message: string, context?: LogContext): void => {
  if (process.env.NODE_ENV === 'test') return

  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  }

  console[level === 'debug' ? 'log' : level](JSON.stringify(entry))
}

export const logger = {
  error: (message: string, context?: LogContext) => log('error', message, context),
  warn: (message: string, context?: LogContext) => log('warn', message, context),
  info: (message: string, context?: LogContext) => log('info', message, context),
  debug: (message: string, context?: LogContext) => log('debug', message, context),
}
