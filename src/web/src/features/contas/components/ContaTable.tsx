import { useState } from 'react';
import { money } from '../../../lib/formatters';
import { formatDate, formatMonth, todayISO } from '../../../lib/formatters';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';
import { Modal } from '../../../shared/components/Modal';
import {
  atualizarDescricao,
  atualizarFormaPagamento,
  deletarConta,
  despagarConta,
  pagarConta
} from '../api';
import type { Conta } from '../types';

interface ContaTableProps {
  contas: Conta[];
  onPaid: () => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

export function ContaTable({ contas, onPaid, showToast }: ContaTableProps) {
  const [payingContaId, setPayingContaId] = useState<string | null>(null);
  const [unpayingContaId, setUnpayingContaId] = useState<string | null>(null);
  const [deletingContaId, setDeletingContaId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const defaultDate = todayISO();
  const [dateValue, setDateValue] = useState(defaultDate);

  async function confirmPayment() {
    if (!payingContaId) return;
    if (!dateValue) { showToast('Informe a data do pagamento.', 'error'); return; }
    try {
      await pagarConta(payingContaId, dateValue);
      setPayingContaId(null);
      showToast('Conta marcada como paga com sucesso!');
      await onPaid();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao registrar pagamento.', 'error');
    }
  }

  async function confirmUnpayment() {
    if (!unpayingContaId) return;
    try {
      await despagarConta(unpayingContaId);
      setUnpayingContaId(null);
      showToast('Pagamento desmarcado com sucesso.');
      await onPaid();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao desmarcar pagamento.', 'error');
    }
  }

  async function confirmDeletion() {
    if (!deletingContaId) return;
    try {
      await deletarConta(deletingContaId);
      setDeletingContaId(null);
      showToast('Conta deletada com sucesso.');
      await onPaid();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao deletar conta.', 'error');
    }
  }

  async function saveDescricao(contaId: string) {
    if (!editValue.trim()) { showToast('Descrição não pode ficar vazia.', 'error'); return; }
    try {
      await atualizarDescricao(contaId, editValue.trim());
      setEditingId(null);
      showToast('Descrição atualizada.');
      await onPaid();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao atualizar descrição.', 'error');
    }
  }

  async function saveFormaPagamento(contaId: string, valor: string) {
    try {
      await atualizarFormaPagamento(contaId, valor || null);
      showToast('Forma de pagamento atualizada.');
      await onPaid();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao atualizar forma de pagamento.', 'error');
    }
  }

  return (
    <>
      {/* Modal: Marcar como pago */}
      {payingContaId && (
        <Modal onClose={() => setPayingContaId(null)}>
          <h3>Confirmar Pagamento</h3>
          <p>Informe a data em que o pagamento foi recebido.</p>
          <input
            type="date"
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
            max={defaultDate}
            autoFocus
          />
          <div className="modal-actions">
            <button className="ghost" type="button" onClick={() => setPayingContaId(null)}>Cancelar</button>
            <button className="confirm" type="button" onClick={confirmPayment}>Confirmar</button>
          </div>
        </Modal>
      )}

      {/* Modal: Desmarcar pagamento */}
      {unpayingContaId && (
        <ConfirmModal
          title="Desmarcar Pagamento"
          description="Você deseja desmarcar essa conta como paga? O status voltará para Pendente."
          confirmLabel="Confirmar"
          danger
          onConfirm={confirmUnpayment}
          onClose={() => setUnpayingContaId(null)}
        />
      )}

      {/* Modal: Deletar conta */}
      {deletingContaId && (
        <ConfirmModal
          title="Deletar Conta"
          description="Você deseja deletar essa conta permanentemente? Esta ação não pode ser desfeita."
          confirmLabel="Deletar"
          danger
          onConfirm={confirmDeletion}
          onClose={() => setDeletingContaId(null)}
        />
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Empreendimento</th>
              <th>Inquilino</th>
              <th>Conta</th>
              <th>Descrição</th>
              <th>Forma Pgto</th>
              <th>Mês</th>
              <th>Vencimento</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {contas.map((c) => (
              <tr key={c.id}>
                <td>{c.contrato.empreendimento.nome}</td>
                <td>{c.contrato.nomeInquilino}</td>
                <td>
                  <span className={`badge ${c.conta.toLowerCase()}`}>{c.conta}</span>
                </td>
                <td>
                  {editingId === c.id ? (
                    <input
                      className="inline-edit"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => saveDescricao(c.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveDescricao(c.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                    />
                  ) : (
                    <span
                      className="editable-cell"
                      title="Clique para editar"
                      onClick={() => { setEditingId(c.id); setEditValue(c.descricao); }}
                    >
                      {c.descricao}
                    </span>
                  )}
                </td>
                <td>
                  <select
                    className="inline-select"
                    value={c.formaPagamento ?? ''}
                    onChange={(e) => saveFormaPagamento(c.id, e.target.value)}
                    title="Clique para alterar"
                  >
                    <option value="">—</option>
                    <option value="PIX">PIX</option>
                    <option value="CARTAO_CREDITO">Cartão</option>
                    <option value="A_VISTA">À Vista</option>
                    <option value="BOLETO">Boleto</option>
                  </select>
                </td>
                <td>{formatMonth(c.mesReferencia)}</td>
                <td>{formatDate(c.dataVencimento)}</td>
                <td>{money.format(Number(c.valor))}</td>
                <td>
                  <span className={`badge ${c.status.toLowerCase()}`}>{c.status}</span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', whiteSpace: 'nowrap' }}>
                    {c.status !== 'PAGO' && (
                      <button
                        className="compact"
                        onClick={() => { setDateValue(defaultDate); setPayingContaId(c.id); }}
                      >
                        Marcar paga
                      </button>
                    )}
                    {c.status === 'PAGO' && (
                      <button
                        className="compact ghost"
                        style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                        onClick={() => setUnpayingContaId(c.id)}
                      >
                        Desmarcar
                      </button>
                    )}
                    <button
                      className="compact ghost"
                      style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                      onClick={() => setDeletingContaId(c.id)}
                      title="Deletar conta"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
