import { createHttpClient } from '../index';
import { PlatformHttpError } from '@platform/contracts';

describe('platform-http contract', () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('resolves typed JSON on success and attaches a correlation header', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ hello: 'world' })
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const client = createHttpClient({ region: 'SG', baseUrl: 'https://api.example.sg' });
    const result = await client.get<{ hello: string }>('/ping');

    expect(result).toEqual({ hello: 'world' });
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)['X-Correlation-Id']).toBeDefined();
  });

  it('maps a non-ok response to a categorised PlatformHttpError', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 }) as unknown as typeof fetch;
    const client = createHttpClient({ region: 'SG', baseUrl: 'https://api.example.sg' });

    await expect(client.get('/missing')).rejects.toMatchObject({
      name: 'PlatformHttpError',
      category: 'not_found'
    });
  });

  it('never leaks the raw fetch/network error type to callers', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('network down')) as unknown as typeof fetch;
    const client = createHttpClient({ region: 'SG', baseUrl: 'https://api.example.sg' });

    await expect(client.get('/anything')).rejects.toBeInstanceOf(PlatformHttpError);
  });
});
