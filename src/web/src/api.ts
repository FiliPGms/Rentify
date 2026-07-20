const API_BASE = '/api/v1';

type ApiResponse<T> = {
  success: boolean;
  data: T;
  meta?: unknown;
  error?: { message: string };
};

export type Empreendimento = {
  id: string;
  nome: string;
  endereco: string;
  valorPadrao: string;
};

export type Contrato = {
  id: string;
  nomeInquilino: string;
  dataVencimentoPadrao: string;
  status: 'ATIVO' | 'INATIVO';
  empreendimento: { id: string; nome: string; valorPadrao: string };
};

export type Conta = {
  id: string;
  mesReferencia: string;
  dataVencimento: string;
  dataPagamento: string | null;
  valor: string;
  status: 'PENDENTE' | 'PAGO' | 'EM_ATRASO';
  tipo: 'ALUGUEL' | 'CAUCAO';
  contrato: {
    id: string;
    nomeInquilino: string;
    empreendimento: { id: string; nome: string };
  };
};

export type DashboardResumo = {
  faturamentoTotal: number;
  pendenteTotal: number;
  atrasadoTotal: number;
  porEmpreendimento: Array<{ empreendimentoId: string; nome: string; recebido: number }>;
};

let token = localStorage.getItem('lendario_token') ?? '';

export function setToken(nextToken: string) {
  token = nextToken;
  localStorage.setItem('lendario_token', nextToken);
}

export function clearToken() {
  token = '';
  localStorage.removeItem('lendario_token');
}

let unauthorizedListener: (() => void) | null = null;

export function onUnauthorized(callback: () => void) {
  unauthorizedListener = callback;
}

export function hasToken() {
  return Boolean(token) && token !== 'undefined' && token !== 'null';
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
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
    if (unauthorizedListener) {
      unauthorizedListener();
    }
  }

  // Parse JSON safely to handle proxy errors or empty responses
  let json: ApiResponse<T> | null = null;
  const text = await response.text();
  if (text) {
    try {
      json = JSON.parse(text) as ApiResponse<T>;
    } catch {
      // response is not valid JSON
    }
  }

  if (!response.ok || !json || !json.success) {
    throw new Error(json?.error?.message ?? `Erro de conexão com o servidor (HTTP ${response.status}).`);
  }

  return json.data;
}

export const api = {
  login: (payload: { email: string; senha: string }) =>
    request<{ token: string; user: { nome: string; email: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  register: (payload: { nome: string; email: string; senha: string }) =>
    request<{ token: string; user: { nome: string; email: string } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  dashboard: () => request<DashboardResumo>('/dashboard/resumo'),
  empreendimentos: () => request<Empreendimento[]>('/empreendimentos'),
  createEmpreendimento: (payload: { nome: string; endereco: string; valorPadrao: number }) =>
    request<Empreendimento>('/empreendimentos', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  contratos: () => request<Contrato[]>('/contratos'),
  createContrato: (payload: {
    empreendimentoId: string;
    nomeInquilino: string;
    dataVencimentoPadrao: string;
    status: 'ATIVO' | 'INATIVO';
  }) =>
    request<Contrato>('/contratos', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  contas: (filters: { status?: string; empreendimentoId?: string; tipo?: string }) => {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.empreendimentoId) params.set('empreendimentoId', filters.empreendimentoId);
    if (filters.tipo) params.set('tipo', filters.tipo);
    return request<Conta[]>(`/contas?${params.toString()}`);
  },
  createConta: (payload: {
    contratoId: string;
    mesReferencia: string;
    dataVencimento: string;
    valor: number;
    tipo: 'ALUGUEL' | 'CAUCAO';
  }) =>
    request<Conta>('/contas', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  pagarConta: (id: string, dataPagamento?: string) =>
    request<Conta>(`/contas/${id}/pagamento`, {
      method: 'PATCH',
      body: JSON.stringify(dataPagamento ? { dataPagamento } : {})
    }),
  despagarConta: (id: string) =>
    request<Conta>(`/contas/${id}/pagamento`, {
      method: 'DELETE'
    }),
  exportContasUrl: (filters: { status?: string; empreendimentoId?: string; tipo?: string }) => {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.empreendimentoId) params.set('empreendimentoId', filters.empreendimentoId);
    if (filters.tipo) params.set('tipo', filters.tipo);
    return `${API_BASE}/contas/export?${params.toString()}`;
  },
  authHeader: (): Record<string, string> => (token ? { Authorization: `Bearer ${token}` } : {})
};
