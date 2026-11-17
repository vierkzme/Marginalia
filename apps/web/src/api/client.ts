const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

let authToken: string | null = localStorage.getItem('criv_auth_token');
const GET_CACHE_TTL_MS = 15_000;
const responseCache = new Map<string, { expiresAt: number; value: unknown }>();
const inflightGets = new Map<string, Promise<unknown>>();
let cacheEpoch = 0;

export function clearApiCache(): void {
  cacheEpoch += 1;
  responseCache.clear();
  inflightGets.clear();
}

export interface ReaderPreferences {
  fontSize: 'sm' | 'base' | 'lg' | 'xl';
  readingTheme: 'light' | 'sepia' | 'dark';
}

const READER_PREFS_KEY = 'marginalia_reader_prefs';

export function getReaderPreferences(): ReaderPreferences {
  try {
    const raw = localStorage.getItem(READER_PREFS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        fontSize: ['sm', 'base', 'lg', 'xl'].includes(parsed.fontSize) ? parsed.fontSize : 'lg',
        readingTheme: ['light', 'sepia', 'dark'].includes(parsed.readingTheme) ? parsed.readingTheme : 'light',
      };
    }
  } catch {
    // Ignore parse error
  }
  return { fontSize: 'lg', readingTheme: 'light' };
}

export function setReaderPreferences(prefs: ReaderPreferences): void {
  localStorage.setItem(READER_PREFS_KEY, JSON.stringify(prefs));
}

export function setAuthToken(token: string | null) {
  if (authToken !== token) {
    clearApiCache();
  }
  authToken = token;
  if (token) {
    localStorage.setItem('criv_auth_token', token);
  } else {
    localStorage.removeItem('criv_auth_token');
  }
}

export function getAuthToken(): string | null {
  return authToken || localStorage.getItem('criv_auth_token');
}

function normalizeApiResponse<T>(json: any): T {
  let result: any = { success: true, data: json };
  if (json && typeof json === 'object' && json.data !== undefined) {
    if (typeof json.data === 'object' && json.data !== null && !Array.isArray(json.data)) {
      result = { success: true, ...json, data: json.data, ...json.data };
    } else {
      result = { success: true, ...json, data: json.data };
    }
  }
  return result as T;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const method = (options.method || 'GET').toUpperCase();
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const cacheKey = `${token || 'anon'}:${url}`;

  if (method === 'GET' && !options.signal) {
    const cached = responseCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as T;
    }

    const existingRequest = inflightGets.get(cacheKey);
    if (existingRequest) {
      return existingRequest as Promise<T>;
    }
  } else if (method !== 'GET') {
    clearApiCache();
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const requestEpoch = cacheEpoch;
  const executeFetch = async (): Promise<T> => {
    const response = await fetch(url, {
      ...options,
      method,
      headers,
    });

    const json = await response.json().catch(() => ({}));
    if (!response.ok || json.success === false) {
      if (response.status === 401 && !endpoint.includes('/auth/login')) {
        setAuthToken(null);
      }
      const errorMsg = json.error?.message || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    const result = normalizeApiResponse<T>(json);
    if (method === 'GET' && !options.signal && requestEpoch === cacheEpoch) {
      responseCache.set(cacheKey, {
        expiresAt: Date.now() + GET_CACHE_TTL_MS,
        value: result,
      });
    }
    return result;
  };

  if (method === 'GET' && !options.signal) {
    const pending = executeFetch().finally(() => {
      if (inflightGets.get(cacheKey) === pending) {
        inflightGets.delete(cacheKey);
      }
    });
    inflightGets.set(cacheKey, pending);
    return pending;
  }

  return executeFetch();
}

export const api = {
  auth: {
    login: (credentials: { email: string; password: string }) =>
      apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (data: {
      email: string;
      password: string;
      fullName: string;
      dailyReviewGoal?: number;
    }) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    demoLogin: () => apiRequest('/auth/demo', { method: 'POST' }),
    me: () => apiRequest('/auth/me'),
    updateProfile: (payload: {
      fullName?: string;
      dailyReviewGoal?: number;
      newPassword?: string;
    }) => apiRequest('/auth/me', { method: 'PUT', body: JSON.stringify(payload) }),
  },
  articles: {
    list: () => apiRequest('/articles'),
    import: (payload: FormData | Record<string, any>) => {
      if (payload instanceof FormData) {
        return apiRequest('/articles/import', { method: 'POST', body: payload });
      }
      return apiRequest('/articles/import', { method: 'POST', body: JSON.stringify(payload) });
    },
    getReaderView: (articleId: string) => apiRequest(`/articles/${articleId}/reader-view`),
    updateProgress: (
      articleId: string,
      payload: { progressPct?: number; isCompleted?: boolean }
    ) =>
      apiRequest(`/articles/${articleId}/progress`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
  },
  vocab: {
    previewSelection: (payload: {
      articleId?: string;
      sentenceId?: string;
      paragraphText: string;
      selectedText: string;
      selectionStartInSentence?: number;
      selectionEndInSentence?: number;
    }) => apiRequest('/vocab/preview-selection', { method: 'POST', body: JSON.stringify(payload) }),
    mine: (payload: Record<string, any>) =>
      apiRequest('/vocab/mine', { method: 'POST', body: JSON.stringify(payload) }),
    listVault: (params?: { tag?: string; stage?: string; q?: string }) => {
      const search = new URLSearchParams();
      if (params?.tag) search.set('tag', params.tag);
      if (params?.stage) search.set('stage', params.stage);
      if (params?.q) search.set('q', params.q);
      const query = search.toString() ? `?${search.toString()}` : '';
      return apiRequest(`/vocab${query}`);
    },
  },
  reviews: {
    getDue: () => apiRequest('/reviews/due'),
    grade: (
      vocabId: string,
      payload: { button: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY'; responseTimeMs?: number }
    ) => apiRequest(`/reviews/${vocabId}/grade`, { method: 'POST', body: JSON.stringify(payload) }),
  },
  analytics: {
    getDashboard: () => apiRequest('/analytics/dashboard'),
  },
};
