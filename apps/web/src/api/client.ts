const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

let authToken: string | null = localStorage.getItem('criv_auth_token');

export function setAuthToken(token: string | null) {
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

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
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

  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok || json.success === false) {
    const errorMsg = json.error?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  // Ensure returned object satisfies both envelope structure ({ success: true, data })
  // and direct unwrap consumers
  let result: any = { success: true, data: json };
  if (json && typeof json === 'object') {
    if (json.data !== undefined) {
      if (typeof json.data === 'object' && json.data !== null && !Array.isArray(json.data)) {
        result = { success: true, ...json, data: json.data, ...json.data };
      } else {
        result = { success: true, ...json, data: json.data };
      }
    }
  }

  return result as T;
}

export const api = {
  auth: {
    login: (credentials: { email: string; password: string }) =>
      apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (data: { email: string; password: string; fullName: string }) =>
      apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    me: () => apiRequest('/auth/me'),
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
    grade: (vocabId: string, payload: { button: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY'; responseTimeMs?: number }) =>
      apiRequest(`/reviews/${vocabId}/grade`, { method: 'POST', body: JSON.stringify(payload) }),
  },
  analytics: {
    getDashboard: () => apiRequest('/analytics/dashboard'),
  },
};
