import { createHttpClient } from '@platform/http';

/**
 * Mock service-request API. Uses the shared @platform/http client for the
 * correlation/timeout/error-mapping contract, but points `fetch` at a stub
 * response instead of a real backend so the remote is runnable without a
 * server.
 */
if (typeof window !== 'undefined' && !(window as unknown as { __mockFetchInstalled?: boolean }).__mockFetchInstalled) {
  const realFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.includes('/service-requests') && init?.method === 'POST') {
      await new Promise((resolve) => setTimeout(resolve, 400));
      return new Response(JSON.stringify({ requestId: `req-${Date.now()}`, status: 'submitted' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return realFetch(input, init);
  };
  (window as unknown as { __mockFetchInstalled: boolean }).__mockFetchInstalled = true;
}

export const operationsHttpClient = createHttpClient({
  region: 'SG',
  baseUrl: '', // mock intercepts by path; a real deployment injects region.apiBaseUrl from RegionalConfiguration
  defaultTimeoutMs: 5000
});
