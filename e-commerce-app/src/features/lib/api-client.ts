interface RequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
  refreshOnUnauthorized?: boolean;
}

interface ApiErrorBody {
  message?: string | string[];
  error?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '');
type AccessTokenRefresher = (expiredToken: string) => Promise<string>;
let accessTokenRefresher: AccessTokenRefresher | null = null;

export function setAccessTokenRefresher(
  refresher: AccessTokenRefresher | null,
): void {
  accessTokenRefresher = refresher;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  if (!apiBaseUrl) {
    throw new Error(
      'API URL is not configured. Set EXPO_PUBLIC_API_URL in the app .env file.',
    );
  }

  let response = await sendRequest(path, options, apiBaseUrl);
  if (
    response.status === 401 &&
    options.token &&
    options.refreshOnUnauthorized !== false &&
    accessTokenRefresher
  ) {
    const refreshedToken = await accessTokenRefresher(options.token);
    response = await sendRequest(
      path,
      { ...options, token: refreshedToken, refreshOnUnauthorized: false },
      apiBaseUrl,
    );
  }

  return readResponse<T>(response);
}

async function sendRequest(
  path: string,
  options: RequestOptions,
  baseUrl: string,
): Promise<Response> {
  try {
    return await fetch(`${baseUrl}${path}`, {
      method: options.method ?? 'GET',
      headers: createHeaders(options),
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    throw new Error(
      `Could not connect to the store API at ${apiBaseUrl}. Check the server and EXPO_PUBLIC_API_URL.`,
    );
  }
}

async function readResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') ?? '';
  const data: unknown = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const body = isApiErrorBody(data) ? data : undefined;
    const message = Array.isArray(body?.message)
      ? body.message.join(', ')
      : body?.message ?? body?.error ?? `Request failed (${response.status})`;
    throw new ApiError(message, response.status);
  }

  return data as T;
}

function createHeaders(options: RequestOptions): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }
  return headers;
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return typeof value === 'object' && value !== null;
}