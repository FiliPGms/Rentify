// Base URL do backend
const API_BASE = '/api/v1';

let token = '';

export function setToken(nextToken: string) {
  token = nextToken;
}

export function clearToken() {
  token = '';
}

export function hasToken() {
  return Boolean(token);
}

let unauthorizedListener: ((message?: string) => void) | null = null;

export function onUnauthorized(callback: (message?: string) => void) {
  unauthorizedListener = callback;
}

// ── Auth header (para fetches manuais como o export Excel) ───────────────────
export function authHeader(): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

export async function refreshAccessToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise;

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!res.ok) return false;

      const json = await res.json() as { success: boolean; data?: { token: string } };
      if (json.success && json.data?.token) {
        setToken(json.data.token);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}


type ApiResponse<T> = { success: true; data: T } | { success: false; error: { message: string } };

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const doFetch = () =>
    fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
      }
    });

  let response = await doFetch();

  // Se recebeu 401, tenta refresh uma vez antes de desistir
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Retry com o novo access token
      response = await doFetch();
    }

    if (response.status === 401) {
      clearToken();
      unauthorizedListener?.('Sua sessão expirou. Faça login novamente.');
      throw new Error('Sua sessão expirou. Faça login novamente.');
    }
  }

  // 204 No Content — operações de deleção não retornam corpo
  if (response.status === 204) {
    return { success: true } as unknown as T;
  }

  let json: ApiResponse<T> | null = null;
  const text = await response.text();
  if (text) {
    try {
      json = JSON.parse(text) as ApiResponse<T>;
    } catch {
      // response não é JSON válido
    }
  }

  if (!response.ok || !json || !json.success) {
    throw new Error(
      (json as { success: false; error: { message: string } } | null)?.error?.message ??
        `Erro de conexão com o servidor (HTTP ${response.status}).`
    );
  }

  return json.data;
}
