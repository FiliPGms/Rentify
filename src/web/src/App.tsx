import { FormEvent, useEffect, useState } from 'react';
import {
  api,
  clearToken,
  Conta,
  Contrato,
  DashboardResumo,
  Empreendimento,
  hasToken,
  onUnauthorized,
  setToken
} from './api';

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function App() {
  const [authenticated, setAuthenticated] = useState(hasToken());

  useEffect(() => {
    onUnauthorized(() => {
      setAuthenticated(false);
    });
  }, []);

  if (!authenticated) {
    return <AuthScreen onAuthenticated={() => setAuthenticated(true)} />;
  }

  return <Shell onLogout={() => setAuthenticated(false)} />;
}

function AuthScreen({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      const result =
        mode === 'login'
          ? await api.login({
              email: String(form.get('email')),
              senha: String(form.get('senha'))
            })
          : await api.register({
              nome: String(form.get('nome')),
              email: String(form.get('email')),
              senha: String(form.get('senha'))
            });
      setToken(result.token);
      onAuthenticated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha na autenticacao.');
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">Rentify</p>
        <h1>Controle suas parcelas de aluguel sem planilhas paralelas.</h1>
        <p className="muted">
          Cadastre seus empreendimentos, acompanhe vencimentos e gere recorrência mensal ao marcar
          contas pagas.
        </p>
      </section>
      <form className="panel auth-form" onSubmit={submit}>
        <h2>{mode === 'login' ? 'Entrar' : 'Criar conta'}</h2>
        {mode === 'register' && <input name="nome" placeholder="Nome" required />}
        <input name="email" type="email" placeholder="Email" required />
        <input name="senha" type="password" placeholder="Senha" minLength={8} required />
        {error && <p className="error">{error}</p>}
        <button type="submit">{mode === 'login' ? 'Acessar painel' : 'Cadastrar'}</button>
        <button
          className="ghost"
          type="button"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login' ? 'Criar novo usuario' : 'Ja tenho acesso'}
        </button>
      </form>
    </main>
  );
}

function Shell({ onLogout }: { onLogout: () => void }) {
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [contas, setContas] = useState<Conta[]>([]);
  const [dashboard, setDashboard] = useState<DashboardResumo | null>(null);
  const [status, setStatus] = useState('');
  const [empreendimentoId, setEmpreendimentoId] = useState('');
  const [error, setError] = useState('');

  async function load() {
    setError('');
    try {
      const [nextEmpreendimentos, nextContratos, nextContas, nextDashboard] = await Promise.all([
        api.empreendimentos(),
        api.contratos(),
        api.contas({ status, empreendimentoId }),
        api.dashboard()
      ]);
      setEmpreendimentos(nextEmpreendimentos);
      setContratos(nextContratos);
      setContas(nextContas);
      setDashboard(nextDashboard);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar dados.');
    }
  }

  useEffect(() => {
    void load();
  }, [status, empreendimentoId]);

  function logout() {
    clearToken();
    onLogout();
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Rentify</p>
          <h1>Painel de recebíveis</h1>
        </div>
        <button className="ghost" onClick={logout}>
          Sair
        </button>
      </header>

      {error && <p className="error">{error}</p>}

      <Dashboard dashboard={dashboard} />

      <section className="grid-two">
        <EmpreendimentoForm onCreated={load} />
        <ContratoForm empreendimentos={empreendimentos} onCreated={load} />
      </section>

      <ContaForm contratos={contratos} onCreated={load} />

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Operacao</p>
            <h2>Grid de contas</h2>
          </div>
          <button
            onClick={async () => {
              try {
                const response = await fetch(api.exportContasUrl({ status, empreendimentoId }), {
                  headers: api.authHeader()
                });
                if (!response.ok) {
                  if (response.status === 401) {
                    clearToken();
                    onLogout();
                    return;
                  }
                  const errorJson = await response.json().catch(() => null);
                  const msg = errorJson?.error?.message ?? `Erro ao exportar (HTTP ${response.status}).`;
                  alert(msg);
                  return;
                }
                const arrayBuffer = await response.arrayBuffer();
                const blob = new Blob([arrayBuffer], {
                  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                });
                const href = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = href;
                link.download = 'contas.xlsx';
                link.click();
                URL.revokeObjectURL(href);
              } catch {
                alert('Falha ao exportar o arquivo Excel.');
              }
            }}
          >
            Exportar Excel
          </button>
        </div>
        <div className="filters">
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Todos os status</option>
            <option value="PENDENTE">Pendente</option>
            <option value="PAGO">Pago</option>
            <option value="EM_ATRASO">Em atraso</option>
          </select>
          <select value={empreendimentoId} onChange={(event) => setEmpreendimentoId(event.target.value)}>
            <option value="">Todos empreendimentos</option>
            {empreendimentos.map((empreendimento) => (
              <option key={empreendimento.id} value={empreendimento.id}>
                {empreendimento.nome}
              </option>
            ))}
          </select>
        </div>
        <ContaTable contas={contas} onPaid={load} />
      </section>
    </main>
  );
}

function Dashboard({ dashboard }: { dashboard: DashboardResumo | null }) {
  const max = Math.max(...(dashboard?.porEmpreendimento.map((item) => item.recebido) ?? [1]), 1);

  return (
    <section className="dashboard">
      <Metric label="Recebido" value={money.format(dashboard?.faturamentoTotal ?? 0)} />
      <Metric label="Pendente" value={money.format(dashboard?.pendenteTotal ?? 0)} />
      <Metric label="Em atraso" value={money.format(dashboard?.atrasadoTotal ?? 0)} tone="danger" />
      <div className="panel chart">
        <p className="eyebrow">Rendimento por empreendimento</p>
        {(dashboard?.porEmpreendimento ?? []).map((item) => (
          <div className="bar-row" key={item.empreendimentoId}>
            <span>{item.nome}</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${(item.recebido / max) * 100}%` }} />
            </div>
            <strong>{money.format(item.recebido)}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: 'danger' }) {
  return (
    <article className={`panel metric ${tone ?? ''}`}>
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}

function EmpreendimentoForm({ onCreated }: { onCreated: () => Promise<void> }) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api.createEmpreendimento({
      nome: String(form.get('nome')),
      endereco: String(form.get('endereco')),
      valorPadrao: Number(form.get('valorPadrao'))
    });
    event.currentTarget.reset();
    await onCreated();
  }

  return (
    <form className="panel form-stack" onSubmit={submit}>
      <h2>Novo empreendimento</h2>
      <input name="nome" placeholder="Nome" required />
      <input name="endereco" placeholder="Endereco" required />
      <input name="valorPadrao" placeholder="Valor padrao" type="number" step="0.01" min="0" required />
      <button type="submit">Cadastrar empreendimento</button>
    </form>
  );
}

function ContratoForm({
  empreendimentos,
  onCreated
}: {
  empreendimentos: Empreendimento[];
  onCreated: () => Promise<void>;
}) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api.createContrato({
      empreendimentoId: String(form.get('empreendimentoId')),
      nomeInquilino: String(form.get('nomeInquilino')),
      dataVencimentoPadrao: String(form.get('dataVencimentoPadrao')),
      status: 'ATIVO'
    });
    event.currentTarget.reset();
    await onCreated();
  }

  return (
    <form className="panel form-stack" onSubmit={submit}>
      <h2>Novo contrato</h2>
      <select name="empreendimentoId" required>
        <option value="">Selecione empreendimento</option>
        {empreendimentos.map((item) => (
          <option key={item.id} value={item.id}>
            {item.nome}
          </option>
        ))}
      </select>
      <input name="nomeInquilino" placeholder="Nome do inquilino" required />
      <div className="form-group">
        <label className="eyebrow" htmlFor="dataVencimentoPadrao">Vencimento Padrão (Primeira Parcela)</label>
        <input id="dataVencimentoPadrao" name="dataVencimentoPadrao" type="date" required />
      </div>
      <button type="submit">Cadastrar contrato</button>
    </form>
  );
}

function ContaForm({ contratos, onCreated }: { contratos: Contrato[]; onCreated: () => Promise<void> }) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const mesRaw = String(form.get('mesReferencia')); // YYYY-MM
    const mesReferencia = mesRaw ? `${mesRaw}-01` : '';

    await api.createConta({
      contratoId: String(form.get('contratoId')),
      mesReferencia,
      dataVencimento: String(form.get('dataVencimento')),
      valor: Number(form.get('valor'))
    });
    event.currentTarget.reset();
    await onCreated();
  }

  return (
    <form className="panel inline-form" onSubmit={submit}>
      <h2>Nova conta</h2>
      <div className="form-group">
        <label className="eyebrow" htmlFor="contratoId">Contrato</label>
        <select id="contratoId" name="contratoId" required>
          <option value="">Selecione o contrato</option>
          {contratos.map((contrato) => (
            <option key={contrato.id} value={contrato.id}>
              {contrato.nomeInquilino} - {contrato.empreendimento.nome}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label className="eyebrow" htmlFor="mesReferencia">Mês de Referência</label>
        <input id="mesReferencia" name="mesReferencia" type="month" required />
      </div>
      <div className="form-group">
        <label className="eyebrow" htmlFor="dataVencimento">Data de Vencimento</label>
        <input id="dataVencimento" name="dataVencimento" type="date" required />
      </div>
      <div className="form-group">
        <label className="eyebrow" htmlFor="valor">Valor</label>
        <input id="valor" name="valor" type="number" min="0" step="0.01" placeholder="Valor (R$)" required />
      </div>
      <button type="submit">Criar conta</button>
    </form>
  );
}

function ContaTable({ contas, onPaid }: { contas: Conta[]; onPaid: () => Promise<void> }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Empreendimento</th>
            <th>Inquilino</th>
            <th>Mes</th>
            <th>Vencimento</th>
            <th>Valor</th>
            <th>Status</th>
            <th>Acoes</th>
          </tr>
        </thead>
        <tbody>
          {contas.map((conta) => (
            <tr key={conta.id}>
              <td>{conta.contrato.empreendimento.nome}</td>
              <td>{conta.contrato.nomeInquilino}</td>
              <td>{new Date(conta.mesReferencia).toLocaleDateString('pt-BR', { timeZone: 'UTC', month: '2-digit', year: 'numeric' })}</td>
              <td>{new Date(conta.dataVencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
              <td>{money.format(Number(conta.valor))}</td>
              <td>
                <span className={`badge ${conta.status.toLowerCase()}`}>{conta.status}</span>
              </td>
              <td>
                {conta.status !== 'PAGO' && (
                  <button
                    className="compact"
                    onClick={async () => {
                      await api.pagarConta(conta.id);
                      await onPaid();
                    }}
                  >
                    Marcar paga
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
