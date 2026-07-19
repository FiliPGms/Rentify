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

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"></circle>
    <line x1="12" y1="1" x2="12" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="23"></line>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
    <line x1="1" y1="12" x2="3" y2="12"></line>
    <line x1="21" y1="12" x2="23" y2="12"></line>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
  </svg>
);

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
  </svg>
);

export function App() {
  const [authenticated, setAuthenticated] = useState(hasToken());
  const [view, setView] = useState<'landing' | 'auth'>('landing');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    onUnauthorized(() => {
      setAuthenticated(false);
      setView('auth');
    });
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  if (!authenticated) {
    if (view === 'landing') {
      return (
        <LandingPage
          onGetStarted={() => setView('auth')}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      );
    }
    return (
      <AuthScreen
        onAuthenticated={() => setAuthenticated(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        onBackToLanding={() => setView('landing')}
      />
    );
  }

  return (
    <Shell
      onLogout={() => setAuthenticated(false)}
      theme={theme}
      onToggleTheme={toggleTheme}
    />
  );
}

function AuthScreen({
  onAuthenticated,
  theme,
  onToggleTheme,
  onBackToLanding
}: {
  onAuthenticated: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onBackToLanding: () => void;
}) {
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
    <div className="auth-wrapper">
      <header className="auth-header">
        <div className="auth-logo" style={{ cursor: 'pointer' }} onClick={onBackToLanding}>Rentify</div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            className="ghost theme-toggle"
            type="button"
            onClick={onToggleTheme}
            title={theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
            aria-label="Alternar tema"
          >
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>
          <button
            className="ghost compact"
            type="button"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'login' ? 'Criar conta' : 'Entrar'}
          </button>
        </div>
      </header>
      <main className="auth-page">
        <section className="auth-hero">
          <p className="eyebrow">Cockpit de recebíveis</p>
          <h1>Controle suas parcelas de aluguel sem planilhas paralelas.</h1>
          <p className="muted">
            Cadastre seus empreendimentos, acompanhe vencimentos e gere recorrência mensal ao marcar
            contas pagas.
          </p>
        </section>
        <section className="auth-form-container">
          <form className="panel auth-form" onSubmit={submit}>
            <h2>{mode === 'login' ? 'Entrar' : 'Criar conta'}</h2>
            {mode === 'register' && <input name="nome" placeholder="Nome" required />}
            <input name="email" type="email" placeholder="Email" required />
            <input name="senha" type="password" placeholder="Senha" minLength={8} required />
            {error && <p className="error">{error}</p>}
            <button type="submit">{mode === 'login' ? 'Acessar painel' : 'Cadastrar'}</button>
          </form>
        </section>
      </main>
    </div>
  );
}

function Shell({
  onLogout,
  theme,
  onToggleTheme
}: {
  onLogout: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}) {
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [contas, setContas] = useState<Conta[]>([]);
  const [dashboard, setDashboard] = useState<DashboardResumo | null>(null);
  const [status, setStatus] = useState('');
  const [empreendimentoId, setEmpreendimentoId] = useState('');
  const [tipo, setTipo] = useState('');
  const [error, setError] = useState('');

  async function load() {
    setError('');
    try {
      const [nextEmpreendimentos, nextContratos, nextContas, nextDashboard] = await Promise.all([
        api.empreendimentos(),
        api.contratos(),
        api.contas({ status, empreendimentoId, tipo }),
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
  }, [status, empreendimentoId, tipo]);

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
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            className="ghost theme-toggle"
            type="button"
            onClick={onToggleTheme}
            title={theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
            aria-label="Alternar tema"
          >
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>
          <button className="ghost" onClick={logout}>
            Sair
          </button>
        </div>
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
                const response = await fetch(api.exportContasUrl({ status, empreendimentoId, tipo }), {
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
          <select value={tipo} onChange={(event) => setTipo(event.target.value)}>
            <option value="">Todos os tipos</option>
            <option value="ALUGUEL">Aluguel</option>
            <option value="CAUCAO">Caução</option>
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
      valor: Number(form.get('valor')),
      tipo: String(form.get('tipo')) as 'ALUGUEL' | 'CAUCAO'
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
      <div className="form-group">
        <label className="eyebrow" htmlFor="tipo">Tipo</label>
        <select id="tipo" name="tipo" required>
          <option value="ALUGUEL">Aluguel</option>
          <option value="CAUCAO">Caução</option>
        </select>
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
            <th>Tipo</th>
            <th>Mes</th>
            <th>Vencimento</th>
            <th>Valor</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {contas.map((conta) => (
            <tr key={conta.id}>
              <td>{conta.contrato.empreendimento.nome}</td>
              <td>{conta.contrato.nomeInquilino}</td>
              <td>
                <span className={`badge ${conta.tipo.toLowerCase()}`}>
                  {conta.tipo === 'CAUCAO' ? 'CAUÇÃO' : conta.tipo}
                </span>
              </td>
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
                      const today = new Date();
                      const yyyy = today.getFullYear();
                      const mm = String(today.getMonth() + 1).padStart(2, '0');
                      const dd = String(today.getDate()).padStart(2, '0');
                      const defaultDate = `${yyyy}-${mm}-${dd}`;

                      const inputDate = prompt(
                        "Informe a data do pagamento (AAAA-MM-DD):",
                        defaultDate
                      );
                      if (inputDate === null) return; // Cancelou

                      if (!/^\d{4}-\d{2}-\d{2}$/.test(inputDate)) {
                        alert("Formato inválido. Use o formato AAAA-MM-DD (ex: 2026-07-05).");
                        return;
                      }

                      await api.pagarConta(conta.id, inputDate);
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

function LandingPage({
  onGetStarted,
  theme,
  onToggleTheme
}: {
  onGetStarted: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}) {
  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const targetPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const startPosition = window.pageYOffset;
      const distance = targetPosition - startPosition;
      const duration = 800; // ms for a premium feel
      let start: number | null = null;

      const step = (timestamp: number) => {
        if (!start) start = timestamp;
        const progress = timestamp - start;
        const progressPercentage = Math.min(progress / duration, 1);
        
        // Easing function (easeInOutCubic)
        const ease = progressPercentage < 0.5
          ? 4 * progressPercentage * progressPercentage * progressPercentage
          : 1 - Math.pow(-2 * progressPercentage + 2, 3) / 2;

        window.scrollTo(0, startPosition + distance * ease);

        if (progress < duration) {
          window.requestAnimationFrame(step);
        }
      };

      window.requestAnimationFrame(step);
    }
  };

  return (
    <div className="landing-wrapper">
      <header className="landing-header">
        <div className="landing-logo">Rentify</div>
        <nav className="landing-nav">
          <a href="#features" onClick={(e) => handleScroll(e, 'features')}>Funcionalidades</a>
          <a href="#steps" onClick={(e) => handleScroll(e, 'steps')}>Como Funciona</a>
          <a href="#pricing" onClick={(e) => handleScroll(e, 'pricing')}>Planos</a>
          <a href="#faq" onClick={(e) => handleScroll(e, 'faq')}>Dúvidas</a>
        </nav>
        <div className="landing-actions">
          <button
            className="ghost theme-toggle"
            type="button"
            onClick={onToggleTheme}
            title={theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
            aria-label="Alternar tema"
          >
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>
          <button className="ghost compact" onClick={onGetStarted}>Entrar</button>
          <button className="compact" onClick={onGetStarted}>Acessar Painel</button>
        </div>
      </header>

      <main className="landing-main">
        {/* Hero Section */}
        <section className="landing-hero">
          <div className="landing-hero-content">
            <span className="landing-badge">⚡ NOVO: GESTÃO INTELIGENTE DE RECEBÍVEIS</span>
            <h1>Planilhas de aluguel no passado, controle no presente.</h1>
            <p className="muted">
              Esquecer controles paralelos é libertador. Cadastre seus imóveis, acompanhe vencimentos e gere a recorrência mensal de recebíveis automaticamente de forma limpa e rápida.
            </p>
            <div className="landing-hero-ctas">
              <button onClick={onGetStarted}>Começar Gratuitamente</button>
              <a href="#features" className="button ghost" onClick={(e) => handleScroll(e, 'features')}>Ver Funcionalidades</a>
            </div>
          </div>

          <div className="landing-hero-preview">
            <div className="mock-window">
              <div className="mock-header">
                <span className="dot dot-red"></span>
                <span className="dot dot-yellow"></span>
                <span className="dot dot-green"></span>
                <span className="mock-title">Rentify Cockpit</span>
              </div>
              <div className="mock-body">
                <div className="mock-metrics">
                  <div className="mock-metric success">
                    <span>Recebido</span>
                    <strong>R$ 18.500,00</strong>
                  </div>
                  <div className="mock-metric danger">
                    <span>Atrasado</span>
                    <strong>R$ 0,00</strong>
                  </div>
                </div>
                <div className="mock-table-wrap">
                  <table className="mock-table">
                    <thead>
                      <tr>
                        <th>Empreendimento</th>
                        <th>Inquilino</th>
                        <th>Vencimento</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Ed. Comercial</td>
                        <td>Tay Carla</td>
                        <td>05/07/2026</td>
                        <td><span className="badge pago">PAGO</span></td>
                      </tr>
                      <tr>
                        <td>Residencial Sol</td>
                        <td>Joao Silva</td>
                        <td>10/08/2026</td>
                        <td><span className="badge pendente">PENDENTE</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="landing-features">
          <p className="eyebrow">Funcionalidades</p>
          <h2>Foco na gestão de aluguéis</h2>
          <div className="landing-features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔄</div>
              <h3>Geração Automática</h3>
              <p>Ao marcar um recebível como pago, a parcela do mês seguinte é gerada de forma automática.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <h3>Rotina Diária de Atrasos</h3>
              <p>O robô diário atualiza automaticamente o status de contas pendentes vencidas para atrasadas.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Exportação Rápida</h3>
              <p>Baixe relatórios completos em formato Excel (.xlsx) com um clique e com todos os filtros aplicados.</p>
            </div>
          </div>
        </section>

        {/* Steps Section */}
        <section id="steps" className="landing-steps">
          <p className="eyebrow">Fluxo de Trabalho</p>
          <h2>Gestão de ponta a ponta em 3 passos simples</h2>
          <div className="landing-steps-container">
            <div className="step-item">
              <span className="step-number">01</span>
              <h4>Cadastre o Imóvel & Contrato</h4>
              <p>Defina o valor base e a data padrão de vencimento das parcelas em segundos.</p>
            </div>
            <div className="step-item">
              <span className="step-number">02</span>
              <h4>Dê Baixa com 1 Clique</h4>
              <p>Marque o aluguel do mês atual como pago informando a data real do recebimento.</p>
            </div>
            <div className="step-item">
              <span className="step-number">03</span>
              <h4>Automação faz o resto</h4>
              <p>O sistema cria automaticamente a parcela do mês seguinte e atualiza atrasos todo dia.</p>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="landing-pricing">
          <p className="eyebrow">Preço</p>
          <h2>Plano transparente, sem surpresas</h2>
          <div className="pricing-card">
            <span className="pricing-badge">START</span>
            <h3>Tudo que você precisa</h3>
            <div className="price">
              <strong>R$ 20,90</strong>
              <span>/mês</span>
            </div>
            <ul className="pricing-features">
              <li>✓ Imóveis e Empreendimentos ilimitados</li>
              <li>✓ Contratos e Inquilinos ilimitados</li>
              <li>✓ Exportações em Excel ilimitadas</li>
              <li>✓ Automações e Cron diários ativos</li>
              <li>✓ Suporte humanizado</li>
            </ul>
            <button className="pricing-button" onClick={onGetStarted}>Assinar e Começar Agora</button>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="landing-faq">
          <p className="eyebrow">Dúvidas frequentes</p>
          <h2>Tudo o que você precisa saber</h2>
          <div className="faq-grid">
            <details className="faq-item">
              <summary>Como funciona a recorrência automatizada?</summary>
              <p>Assim que você marca uma conta do mês como PAGA, o Rentify verifica se o contrato associado ainda está ATIVO e, em caso positivo, cria de forma automática a parcela do próximo mês (com o mesmo valor e o dia correspondente ajustado para o mês seguinte).</p>
            </details>
            <details className="faq-item">
              <summary>Preciso cadastrar cartão de crédito para testar?</summary>
              <p>Não! Você pode criar sua conta e experimentar a plataforma gratuitamente para gerenciar seus empreendimentos sem barreiras.</p>
            </details>
            <details className="faq-item">
              <summary>O sistema avisa se um aluguel estiver atrasado?</summary>
              <p>Sim. Uma rotina inteligente roda diariamente no servidor, verificando as contas vencidas e pendentes, alterando o status delas automaticamente para EM ATRASO para facilitar sua cobrança.</p>
            </details>
            <details className="faq-item">
              <summary>Consigo exportar meus relatórios?</summary>
              <p>Com certeza. A ferramenta de exportação gera planilhas profissionais Excel (.xlsx) respeitando os mesmos filtros de status e empreendimento ativos no seu grid de gerenciamento.</p>
            </details>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <p>Rentify © 2026. A maneira mais limpa de gerenciar seus aluguéis.</p>
      </footer>
    </div>
  );
}

