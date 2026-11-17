import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiRequest, clearApiCache, setAuthToken } from '../client';

describe('API Client GET Caching & In-Flight Deduplication', () => {
  beforeEach(() => {
    clearApiCache();
    setAuthToken('token-user-a');
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('deduplicates concurrent GET requests and caches response within TTL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: [{ id: 'a1' }] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const [first, second] = await Promise.all([
      apiRequest('/articles'),
      apiRequest('/articles'),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first.data).toEqual([{ id: 'a1' }]);
    expect(second.data).toEqual([{ id: 'a1' }]);

    const third = await apiRequest('/articles');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(third.data).toEqual([{ id: 'a1' }]);
  });

  it('invalidates GET cache after a mutating POST request', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { count: 1 } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ success: true, data: { ok: true } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { count: 2 } }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const beforeMutation = await apiRequest('/reviews/due');
    expect(beforeMutation.data).toEqual({ count: 1 });

    await apiRequest('/reviews/1/grade', {
      method: 'POST',
      body: JSON.stringify({ button: 'GOOD' }),
    });

    const afterMutation = await apiRequest('/reviews/due');
    expect(afterMutation.data).toEqual({ count: 2 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('clears cache when auth token changes', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { user: 'A' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { user: 'B' } }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const resA = await apiRequest('/auth/me');
    expect(resA.data).toEqual({ user: 'A' });

    setAuthToken('token-user-b');
    const resB = await apiRequest('/auth/me');
    expect(resB.data).toEqual({ user: 'B' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
