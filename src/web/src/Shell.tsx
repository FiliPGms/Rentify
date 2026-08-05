import { useEffect, useRef, useState } from 'react';
import { clearToken } from './lib/http';
import type { Theme, Toast } from './lib/types';
import { ToastContainer } from './shared/components/Toast';
import { MoonIcon } from './shared/components/icons/MoonIcon';
import { SunIcon } from './shared/components/icons/SunIcon';
import { getDashboard } from './features/dashboard/api';
import { Dashboard } from './features/dashboard/components/Dashboard';
import type { DashboardResumo } from './features/dashboard/types';
import { listEmpreendimentos, deletarEmpreendimento } from './features/empreendimentos/api';
import { EmpreendimentoForm } from './features/empreendimentos/components/EmpreendimentoForm';
import type { Empreendimento } from './features/empreendimentos/types';
import { listContratos } from './features/contratos/api';
import { ContratoForm } from './features/contratos/components/ContratoForm';
import { MeusContratos } from './features/contratos/components/MeusContratos';
import type { Contrato } from './features/contratos/types';
import { listContas, exportContasUrl, authHeader } from './features/contas/api';
import { ContaForm } from './features/contas/components/ContaForm';
import { ContaTable } from './features/contas/components/ContaTable';
import type { Conta } from './features/contas/types';

type ActiveTab = 'painel' | 'contratos';

interface ShellProps {
  onLogout: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}

export function Shell({ onLogout, theme, onToggleTheme }: ShellProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('painel');
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [contas, setContas] = useState<Conta[]>([]);
  const [dashboard, setDashboard] = useState<DashboardResumo | null>(null);

  // Filtros do grid de contas
  const [status, setStatus] = useState('');
  const [empreendimentoId, setEmpreendimentoId] = useState('');
  const [conta, setConta] = useState('');
  const [contaMes, setContaMes] = useState('');

  // Filtros do dashboard
  const [dashboardEmpreendimentoId, setDashboardEmpreendimentoId] = useState('');
  const [dashboardMes, setDashboardMes] = useState('');

  const [error, setError] = useState('');
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type, id: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }

  async function load() {
    setError('');
    try {
      const [nextEmpreendimentos, nextContratos, nextContas, nextDashboard] = await Promise.all([
        listEmpreendimentos(),
        listContratos(),
        listContas({ status, empreendimentoId, conta, mesReferencia: contaMes || undefined }),
        getDashboard(dashboardEmpreendimentoId, dashboardMes)
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
  }, [status, empreendimentoId, dashboardEmpreendimentoId, dashboardMes, conta, contaMes]);

  function logout() {
    clearToken();
    onLogout();
  }

  async function handleDeleteEmpreendimento(id: string) {
    try {
      await deletarEmpreendimento(id);
      showToast('Empreendimento deletado.');
      if (dashboardEmpreendimentoId === id) setDashboardEmpreendimentoId('');
      else await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao deletar empreendimento.', 'error');
    }
  }

  async function handleExportExcel() {
    try {
      const response = await fetch(exportContasUrl({ status, empreendimentoId, conta, mesReferencia: contaMes || undefined }), {
        headers: authHeader()
      });
      if (!response.ok) {
        if (response.status === 401) { clearToken(); onLogout(); return; }
        const errorJson = await response.json().catch(() => null) as { error?: { message?: string } } | null;
        showToast(errorJson?.error?.message ?? `Erro ao exportar (HTTP ${response.status}).`, 'error');
        return;
      }
      const blob = new Blob([await response.arrayBuffer()], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = 'contas.xlsx';
      link.click();
      URL.revokeObjectURL(href);
    } catch {
      showToast('Falha ao exportar o arquivo Excel.', 'error');
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Rentify</p>
          <h1>Painel de recebíveis</h1>
        </div>
        <nav className="landing-nav" style={{ marginTop: '0.5rem' }}>
          <a
            href="#painel"
            onClick={(e) => { e.preventDefault(); setActiveTab('painel'); }}
            style={{ color: activeTab === 'painel' ? 'var(--ink)' : undefined }}
          >
            Painel
          </a>
          <a
            href="#contratos"
            onClick={(e) => { e.preventDefault(); setActiveTab('contratos'); }}
            style={{ color: activeTab === 'contratos' ? 'var(--ink)' : undefined }}
          >
            Meus Contratos
          </a>
        </nav>
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
          <button className="ghost" onClick={logout}>Sair</button>
        </div>
      </header>
      {error && <p className="error">{error}</p>}

      {activeTab === 'painel' && (
        <>
          <Dashboard
            dashboard={dashboard}
            empreendimentos={empreendimentos}
            dashboardEmpreendimentoId={dashboardEmpreendimentoId}
            setDashboardEmpreendimentoId={setDashboardEmpreendimentoId}
            dashboardMes={dashboardMes}
            setDashboardMes={setDashboardMes}
            onDeleteEmpreendimento={handleDeleteEmpreendimento}
          />

          <section className="grid-two">
            <EmpreendimentoForm onCreated={load} showToast={showToast} />
            <ContratoForm empreendimentos={empreendimentos} onCreated={load} showToast={showToast} />
          </section>

          <ContaForm contratos={contratos} onCreated={load} showToast={showToast} />

          <section className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Operação</p>
                <h2>Grid de contas</h2>
              </div>
              <button onClick={handleExportExcel}>Exportar Excel</button>
            </div>
            <div className="filters">
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">Todos os status</option>
                <option value="PENDENTE">Pendente</option>
                <option value="PAGO">Pago</option>
                <option value="EM_ATRASO">Em atraso</option>
              </select>
              <select value={empreendimentoId} onChange={(e) => setEmpreendimentoId(e.target.value)}>
                <option value="">Todos empreendimentos</option>
                {empreendimentos.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.nome}</option>
                ))}
              </select>
              <select value={conta} onChange={(e) => setConta(e.target.value)}>
                <option value="">Todas as contas</option>
                <option value="RECEITA">Receita</option>
                <option value="DESPESA">Despesa</option>
              </select>
              <select value={contaMes} onChange={(e) => setContaMes(e.target.value)}>
                <option value="">Todos os meses</option>
                {(dashboard?.mesesDisponiveis ?? []).map((m) => {
                  const [y, mo] = m.split('-');
                  const label = new Date(Number(y), Number(mo) - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
                  return (
                    <option key={m} value={m}>
                      {label.charAt(0).toUpperCase() + label.slice(1)}
                    </option>
                  );
                })}
              </select>
            </div>
            <ContaTable contas={contas} onPaid={load} showToast={showToast} />
          </section>
        </>
      )}

      {activeTab === 'contratos' && (
        <MeusContratos showToast={showToast} />
      )}

      <ToastContainer toast={toast} />
    </main>
  );
}
