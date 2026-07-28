// Base URL do backend
const API_BASE = '/api/v1';

// ── Token management ─────────────────────────────────────────────────────────
let token = localStorage.getItem('lendario_token') ?? '';

export function setToken(nextToken: string) {
  token = nextToken;
  localStorage.setItem('lendario_token', nextToken);
}

export function clearToken() {
  token = '';
  localStorage.removeItem('lendario_token');
}

export function hasToken() {
  return Boolean(token) && token !== 'undefined' && token !== 'null';
}

// ── Unauthorized listener ─────────────────────────────────────────────────────
let unauthorizedListener: (() => void) | null = null;

export function onUnauthorized(callback: () => void) {
  unauthorizedListener = callback;
}

// ── Auth header (para fetches manuais como o export Excel) ───────────────────
export function authHeader(): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Response envelope ─────────────────────────────────────────────────────────
type ApiResponse<T> = { success: true; data: T } | { success: false; error: { message: string } };

// ── Core request function ─────────────────────────────────────────────────────
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  if (response.status === 401) {
    clearToken();
    unauthorizedListener?.();
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
