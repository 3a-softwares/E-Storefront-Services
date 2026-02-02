/**
 * Use Case Interfaces and Base Types
 */

export interface UseCase<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
}

export interface UseCaseResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    field?: string;
  };
}

export class UseCaseError extends Error {
  constructor(message: string, public code: string, public field?: string) {
    super(message);
    this.name = 'UseCaseError';
  }
}
