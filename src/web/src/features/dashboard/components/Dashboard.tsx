import { useState } from 'react';
import { money } from '../../../lib/formatters';
import { formatMonthLong } from '../../../lib/formatters';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';
import type { Empreendimento } from '../../empreendimentos/types';
import type { DashboardResumo } from '../types';
import { Metric } from './Metric';

interface DashboardProps {
  dashboard: DashboardResumo | null;
  empreendimentos: Empreendimento[];
  dashboardEmpreendimentoId: string;
  setDashboardEmpreendimentoId: (id: string) => void;
  dashboardMes: string;
  setDashboardMes: (mes: string) => void;
  onDeleteEmpreendimento: (id: string) => void;
}

export function Dashboard({
  dashboard,
  empreendimentos,
  dashboardEmpreendimentoId,
  setDashboardEmpreendimentoId,
  dashboardMes,
  setDashboardMes,
  onDeleteEmpreendimento
}: DashboardProps) {
  const max = Math.max(...(dashboard?.porEmpreendimento.map((item) => item.recebido) ?? [1]), 1);
  const [deletingEmpreendimentoId, setDeletingEmpreendimentoId] = useState<string | null>(null);

  return (
    <>
      <div className="section-head" style={{ marginBottom: '1rem' }}>
        <div>
          <h2>Resumo</h2>
        </div>
        <div className="filters">
          <select
            value={dashboardEmpreendimentoId}
            onChange={(e) => setDashboardEmpreendimentoId(e.target.value)}
          >
            <option value="">Todos empreendimentos</option>
            {empreendimentos.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.nome}
              </option>
            ))}
          </select>
          <select value={dashboardMes} onChange={(e) => setDashboardMes(e.target.value)}>
            <option value="">Todos os meses</option>
            {(dashboard?.mesesDisponiveis ?? []).map((mes) => (
              <option key={mes} value={mes}>
                {formatMonthLong(mes)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <section className="dashboard">
        <Metric label="Lucro Líquido" value={money.format(dashboard?.lucroLiquido ?? 0)} />
        <Metric label="Pendente" value={money.format(dashboard?.pendenteTotal ?? 0)} />
        <Metric label="Em atraso" value={money.format(dashboard?.atrasadoTotal ?? 0)} tone="danger" />
        <div className="panel chart">
          <p className="eyebrow">Lucro líquido por empreendimento</p>
          {(dashboard?.porEmpreendimento ?? []).map((item) => (
            <div className="bar-row" key={item.empreendimentoId}>
              <span>{item.nome}</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${(item.recebido / max) * 100}%` }} />
              </div>
              <strong>{money.format(item.recebido)}</strong>
              <button
                className="compact ghost"
                style={{ color: 'var(--danger)', borderColor: 'var(--danger)', marginLeft: '0.5rem' }}
                onClick={() => setDeletingEmpreendimentoId(item.empreendimentoId)}
                title="Deletar empreendimento"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </section>

      {deletingEmpreendimentoId && (
        <ConfirmModal
          title="Excluir Empreendimento"
          description="Tem certeza que deseja deletar este empreendimento? Isso apagará também todos os contratos e contas vinculadas."
          confirmLabel="Sim, excluir"
          danger
          onConfirm={() => {
            onDeleteEmpreendimento(deletingEmpreendimentoId);
            setDeletingEmpreendimentoId(null);
          }}
          onClose={() => setDeletingEmpreendimentoId(null)}
        />
      )}
    </>
  );
}
