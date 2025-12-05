/**
 * Logger profesional para reemplazar console.log/error
 * En producción, puede integrarse con servicios como Sentry, LogRocket, etc.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: Error;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(context && { context }),
      ...(error && { error: { name: error.name, message: error.message, stack: error.stack } }),
    };
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): void {
    const entry = this.formatMessage(level, message, context, error);

    if (!this.isDevelopment && level === 'debug') {
      return; // No loggear debug en producción
    }

    switch (level) {
      case 'debug':
        console.debug(`[DEBUG] ${message}`, context || '');
        break;
      case 'info':
        console.info(`[INFO] ${message}`, context || '');
        break;
      case 'warn':
        console.warn(`[WARN] ${message}`, context || '');
        break;
      case 'error':
        console.error(`[ERROR] ${message}`, error || context || '');
        // En producción, aquí se enviaría a un servicio de logging
        break;
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log('error', message, context, error);
  }
}

export const logger = new Logger();

