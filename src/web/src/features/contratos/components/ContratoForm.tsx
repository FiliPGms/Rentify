import { FormEvent, useState } from 'react';
import { Modal } from '../../../shared/components/Modal';
import type { Empreendimento } from '../../empreendimentos/types';
import { createContrato } from '../api';

interface ContratoFormProps {
  empreendimentos: Empreendimento[];
  onCreated: () => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function ContratoForm({ empreendimentos, onCreated, showToast }: ContratoFormProps) {
  const [successModal, setSuccessModal] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await createContrato({
        empreendimentoId: String(form.get('empreendimentoId')),
        nomeInquilino: String(form.get('nomeInquilino')),
        dataVencimentoPadrao: String(form.get('dataVencimentoPadrao')),
        status: 'ATIVO'
      });
      formElement.reset();
      setSuccessModal(true);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao cadastrar contrato.', 'error');
    }
  }

  async function closeModal() {
    setSuccessModal(false);
    await onCreated();
  }

  return (
    <>
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
          <label className="eyebrow" htmlFor="dataVencimentoPadrao">
            Vencimento Padrão (Primeira Parcela)
          </label>
          <input id="dataVencimentoPadrao" name="dataVencimentoPadrao" type="date" required />
        </div>
        <button type="submit">Cadastrar contrato</button>
      </form>

      {successModal && (
        <Modal onClose={closeModal}>
          <span className="modal-success-icon">✓</span>
          <h3>Contrato cadastrado!</h3>
          <p>O contrato foi adicionado com sucesso.</p>
          <div className="modal-actions">
            <button className="confirm" type="button" onClick={closeModal}>Fechar</button>
          </div>
        </Modal>
      )}
    </>
  );
}
