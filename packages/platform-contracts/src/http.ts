export interface RequestOptions {
  signal?: AbortSignal;
  correlationId?: string;
  timeoutMs?: number;
}

export interface PlatformHttpClient {
  get<TResponse>(path: string, options?: RequestOptions): Promise<TResponse>;
  post<TRequest, TResponse>(path: string, body: TRequest, options?: RequestOptions): Promise<TResponse>;
}

/** Standard error mapping so remotes never branch on raw fetch/axios errors. */
export type PlatformHttpErrorCategory =
  | 'timeout'
  | 'network'
  | 'unauthorised'
  | 'forbidden'
  | 'not_found'
  | 'validation'
  | 'server'
  | 'unknown';

export class PlatformHttpError extends Error {
  readonly category: PlatformHttpErrorCategory;
  readonly status?: number;
  readonly correlationId?: string;

  constructor(message: string, category: PlatformHttpErrorCategory, status?: number, correlationId?: string) {
    super(message);
    this.name = 'PlatformHttpError';
    this.category = category;
    this.status = status;
    this.correlationId = correlationId;
  }
}
