import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.stubEnv('EXPO_PUBLIC_API_URL', 'http://store.test:3000');

const { ApiError, apiRequest, setAccessTokenRefresher } = await import(
  './api-client'
);

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('apiRequest access-token refresh', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    setAccessTokenRefresher(null);
  });

  it('retries a protected request once with the rotated access token', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse(401, { message: 'Expired' }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    const refresh = vi.fn().mockResolvedValue('new-access-token');
    setAccessTokenRefresher(refresh);

    await expect(
      apiRequest<{ ok: boolean }>('/orders', { token: 'expired-token' }),
    ).resolves.toEqual({ ok: true });

    expect(refresh).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[1]?.headers).toMatchObject({
      Authorization: 'Bearer new-access-token',
    });
  });

  it('does not refresh login or refresh requests without an access token', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(
        jsonResponse(401, { message: 'Unauthorized' }),
      ),
    );
    const refresh = vi.fn().mockResolvedValue('new-access-token');
    setAccessTokenRefresher(refresh);

    await expect(
      apiRequest('/auth/login', {
        method: 'POST',
        body: { email: 'x@example.com', password: 'bad-password' },
        refreshOnUnauthorized: false,
      }),
    ).rejects.toBeInstanceOf(ApiError);
    expect(refresh).not.toHaveBeenCalled();
  });
});
