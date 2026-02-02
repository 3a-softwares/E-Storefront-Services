/**
 * Simple Logger utility for ticket-service
 */
export class Logger {
  static info(message: string, data?: unknown, context?: string): void {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    // eslint-disable-next-line no-console
    console.log(
      `${timestamp} INFO ${contextStr} ${message}`,
      data ? Logger.safeStringify(data) : ''
    );
  }

  static error(message: string, error?: unknown, context?: string): void {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    // eslint-disable-next-line no-console
    console.error(
      `${timestamp} ERROR ${contextStr} ${message}`,
      error ? Logger.safeStringify(error) : ''
    );
  }

  static warn(message: string, data?: unknown, context?: string): void {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    // eslint-disable-next-line no-console
    console.warn(
      `${timestamp} WARN ${contextStr} ${message}`,
      data ? Logger.safeStringify(data) : ''
    );
  }

  static debug(message: string, data?: unknown, context?: string): void {
    if (process.env.NODE_ENV !== 'production') {
      const timestamp = new Date().toISOString();
      const contextStr = context ? `[${context}]` : '';
      // eslint-disable-next-line no-console
      console.debug(
        `${timestamp} DEBUG ${contextStr} ${message}`,
        data ? Logger.safeStringify(data) : ''
      );
    }
  }

  /**
   * Safely stringify unknown data for logging
   */
  private static safeStringify(data: unknown): string {
    try {
      return typeof data === 'string' ? data : JSON.stringify(data);
    } catch {
      return '[Unserializable]';
    }
  }
}
