/**
 * Simple Logger utility for ticket-service
 */
export class Logger {
  static info(message: string, data?: any, context?: string): void {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    console.log(`${timestamp} INFO ${contextStr} ${message}`, data ? JSON.stringify(data) : '');
  }

  static error(message: string, error?: any, context?: string): void {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    console.error(`${timestamp} ERROR ${contextStr} ${message}`, error || '');
  }

  static warn(message: string, data?: any, context?: string): void {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    console.warn(`${timestamp} WARN ${contextStr} ${message}`, data ? JSON.stringify(data) : '');
  }

  static debug(message: string, data?: any, context?: string): void {
    if (process.env.NODE_ENV !== 'production') {
      const timestamp = new Date().toISOString();
      const contextStr = context ? `[${context}]` : '';
      console.debug(`${timestamp} DEBUG ${contextStr} ${message}`, data ? JSON.stringify(data) : '');
    }
  }
}
