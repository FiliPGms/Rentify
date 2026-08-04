import { useEffect, useState } from 'react';
import { listContratos, batchUpdateStatus } from '../api';
import type { Contrato, ContratoStatus } from '../types';
import { RescindirIcon } from './icons/RescindirIcon';
import { RenovarIcon } from './icons/RenovarIcon';
import styles from './MeusContratos.module.css';

interface MeusContratosProps {
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const STATUS_LABELS: Record<ContratoStatus, string> = {
  ATIVO: 'Ativo',
  FINALIZADO: 'Finalizado',
  RENOVADO: 'Renovado',
  RESCINDIDO: 'Rescindido'
};

const BADGE_CLASS: Record<ContratoStatus, string> = {
  ATIVO: styles.badgeAtivo,
  FINALIZADO: styles.badgeFinalizado,
  RENOVADO: styles.badgeRenovado,
  RESCINDIDO: styles.badgeRescindido
};

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

export function MeusContratos({ showToast }: MeusContratosProps) {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      const data = await listContratos();
      setContratos(data);
      setSelected(new Set());
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao carregar contratos.', 'error');
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllInGroup(ids: string[]) {
    setSelected((prev) => {
      const allSelected = ids.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  async function handleBatchAction(status: ContratoStatus) {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setLoading(true);
    try {
      await batchUpdateStatus(ids, status);
      const label = STATUS_LABELS[status].toLowerCase();
      showToast(`${ids.length} contrato(s) ${label}(s) com sucesso.`);
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao atualizar contratos.', 'error');
    } finally {
      setLoading(false);
    }
  }

  // Agrupar contratos por status
  const ativos = contratos.filter((c) => c.status === 'ATIVO');
  const finalizados = contratos.filter((c) => c.status === 'FINALIZADO');
  const outros = contratos.filter((c) => c.status === 'RENOVADO' || c.status === 'RESCINDIDO');

  const selectedAtivos = ativos.filter((c) => selected.has(c.id));
  const selectedFinalizados = finalizados.filter((c) => selected.has(c.id));

  function renderCard(contrato: Contrato) {
    const isSelected = selected.has(contrato.id);
    return (
      <div
        key={contrato.id}
        className={isSelected ? styles.cardSelected : styles.card}
      >
        <input
          type="checkbox"
          className={styles.cardCheckbox}
          checked={isSelected}
          onChange={() => toggleSelect(contrato.id)}
        />
        <div className={styles.cardBody}>
          <p className={styles.cardTitle}>
            {contrato.empreendimento.nome} — {contrato.nomeInquilino}
          </p>
          <div className={styles.cardMeta}>
            <span>Início: {formatDate(contrato.dataInicio)}</span>
            <span>Fim: {formatDate(contrato.dataFim)}</span>
            <span>Multa: {contrato.multaAtraso}%</span>
            <span>Juros: {contrato.jurosMensal}%/mês</span>
            <span>Reajuste: {contrato.indiceReajuste}</span>
          </div>
        </div>
        <span className={BADGE_CLASS[contrato.status]}>
          {STATUS_LABELS[contrato.status]}
        </span>
      </div>
    );
  }

  return (
    <>
      {/* ── Contratos Ativos ──────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <p className="eyebrow">Vigentes</p>
            <h2 className={styles.sectionTitle}>
              Contratos ativos
              <span className={styles.sectionCount}> ({ativos.length})</span>
            </h2>
          </div>
          <div className={styles.actionBar}>
            {ativos.length > 0 && (
              <button
                type="button"
                className="ghost compact"
                onClick={() => toggleAllInGroup(ativos.map((c) => c.id))}
              >
                {ativos.every((c) => selected.has(c.id)) ? 'Desmarcar todos' : 'Selecionar todos'}
              </button>
            )}
            <button
              type="button"
              className={styles.rescindirBtn}
              disabled={selectedAtivos.length === 0 || loading}
              onClick={() => handleBatchAction('RESCINDIDO')}
            >
              <RescindirIcon />
              Rescindir{selectedAtivos.length > 0 ? ` (${selectedAtivos.length})` : ''}
            </button>
          </div>
        </div>
        <div className={styles.contractList}>
          {ativos.length === 0 ? (
            <p className={styles.empty}>Nenhum contrato ativo.</p>
          ) : (
            ativos.map(renderCard)
          )}
        </div>
      </section>

      {/* ── Contratos Finalizados ─────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <p className="eyebrow">Encerrados</p>
            <h2 className={styles.sectionTitle}>
              Contratos finalizados
              <span className={styles.sectionCount}> ({finalizados.length})</span>
            </h2>
          </div>
          <div className={styles.actionBar}>
            {finalizados.length > 0 && (
              <button
                type="button"
                className="ghost compact"
                onClick={() => toggleAllInGroup(finalizados.map((c) => c.id))}
              >
                {finalizados.every((c) => selected.has(c.id)) ? 'Desmarcar todos' : 'Selecionar todos'}
              </button>
            )}
            <button
              type="button"
              className={styles.renovarBtn}
              disabled={selectedFinalizados.length === 0 || loading}
              onClick={() => handleBatchAction('RENOVADO')}
            >
              <RenovarIcon />
              Renovar{selectedFinalizados.length > 0 ? ` (${selectedFinalizados.length})` : ''}
            </button>
          </div>
        </div>
        <div className={styles.contractList}>
          {finalizados.length === 0 ? (
            <p className={styles.empty}>Nenhum contrato finalizado.</p>
          ) : (
            finalizados.map(renderCard)
          )}
        </div>
      </section>

      {/* ── Contratos Renovados / Rescindidos ─────────────────── */}
      {outros.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <div>
              <p className="eyebrow">Histórico</p>
              <h2 className={styles.sectionTitle}>
                Renovados e rescindidos
                <span className={styles.sectionCount}> ({outros.length})</span>
              </h2>
            </div>
          </div>
          <div className={styles.contractList}>
            {outros.map(renderCard)}
          </div>
        </section>
      )}
    </>
  );
}
