import type { PlatformHttpClient, RequestOptions, RegionCode } from '@platform/contracts';
import { PlatformHttpError } from '@platform/contracts';

export interface CreateHttpClientOptions {
  region: RegionCode;
  baseUrl: string;
  getAuthToken?: () => string | undefined;
  defaultTimeoutMs?: number;
}

function correlationId(explicit?: string): string {
  return explicit ?? `corr-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Typed HTTP client factory. Region-aware base URL, correlation
 * headers, timeout + cancellation, and standard error mapping so callers only
 * ever see PlatformHttpError - never a raw fetch/axios exception.
 * No token is ever handed back to the caller.
 */
export function createHttpClient(options: CreateHttpClientOptions): PlatformHttpClient {
  const { baseUrl, getAuthToken, defaultTimeoutMs = 8000 } = options;

  async function request<TResponse>(
    method: 'GET' | 'POST',
    path: string,
    body: unknown,
    reqOptions?: RequestOptions
  ): Promise<TResponse> {
    const timeoutMs = reqOptions?.timeoutMs ?? defaultTimeoutMs;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const cid = correlationId(reqOptions?.correlationId);

    if (reqOptions?.signal) {
      reqOptions.signal.addEventListener('abort', () => controller.abort());
    }

    try {
      const token = getAuthToken?.();
      const response = await fetch(`${baseUrl}${path}`, {
        method,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-Id': cid,
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: body !== undefined ? JSON.stringify(body) : undefined
      });

      if (!response.ok) {
        throw new PlatformHttpError(
          `Request failed with status ${response.status}`,
          mapStatusToCategory(response.status),
          response.status,
          cid
        );
      }
      return (await response.json()) as TResponse;
    } catch (error) {
      if (error instanceof PlatformHttpError) throw error;
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new PlatformHttpError('Request timed out', 'timeout', undefined, cid);
      }
      throw new PlatformHttpError('Network error', 'network', undefined, cid);
    } finally {
      clearTimeout(timer);
    }
  }

  function mapStatusToCategory(status: number) {
    if (status === 401) return 'unauthorised' as const;
    if (status === 403) return 'forbidden' as const;
    if (status === 404) return 'not_found' as const;
    if (status === 422) return 'validation' as const;
    if (status >= 500) return 'server' as const;
    return 'unknown' as const;
  }

  return {
    get<TResponse>(path: string, reqOptions?: RequestOptions) {
      return request<TResponse>('GET', path, undefined, reqOptions);
    },
    post<TRequest, TResponse>(path: string, requestBody: TRequest, reqOptions?: RequestOptions) {
      return request<TResponse>('POST', path, requestBody, reqOptions);
    }
  };
}

export { PlatformHttpError } from '@platform/contracts';
export type { PlatformHttpClient, RequestOptions } from '@platform/contracts';
