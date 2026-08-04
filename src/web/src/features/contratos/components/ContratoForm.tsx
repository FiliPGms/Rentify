import { FormEvent, useState } from 'react';
import { Modal } from '../../../shared/components/Modal';
import type { Empreendimento } from '../../empreendimentos/types';
import { createContrato } from '../api';
import type { IndiceReajuste } from '../types';

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
        dataInicio: String(form.get('dataInicio')),
        dataFim: String(form.get('dataFim')),
        dataVencimentoPadrao: String(form.get('dataVencimentoPadrao')),
        multaAtraso: Number(form.get('multaAtraso')),
        jurosMensal: Number(form.get('jurosMensal')),
        indiceReajuste: String(form.get('indiceReajuste')) as IndiceReajuste
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

        <div className="form-group">
          <label className="eyebrow" htmlFor="empreendimentoId">Empreendimento</label>
          <select id="empreendimentoId" name="empreendimentoId" required>
            <option value="">Selecione empreendimento</option>
            {empreendimentos.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="eyebrow" htmlFor="nomeInquilino">Nome do inquilino</label>
          <input id="nomeInquilino" name="nomeInquilino" placeholder="Nome do inquilino" required />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="eyebrow" htmlFor="dataInicio">Data Início</label>
            <input id="dataInicio" name="dataInicio" type="date" required />
          </div>
          <div className="form-group">
            <label className="eyebrow" htmlFor="dataFim">Data Fim</label>
            <input id="dataFim" name="dataFim" type="date" required />
          </div>
        </div>

        <div className="form-group">
          <label className="eyebrow" htmlFor="dataVencimentoPadrao">
            Vencimento Padrão (Primeira Parcela)
          </label>
          <input id="dataVencimentoPadrao" name="dataVencimentoPadrao" type="date" required />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="eyebrow" htmlFor="multaAtraso">Multa de atraso (%)</label>
            <input
              id="multaAtraso"
              name="multaAtraso"
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="Ex: 2.00"
              required
            />
          </div>
          <div className="form-group">
            <label className="eyebrow" htmlFor="jurosMensal">Juros mensal (%)</label>
            <input
              id="jurosMensal"
              name="jurosMensal"
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="Ex: 1.00"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="eyebrow" htmlFor="indiceReajuste">Índice de reajuste</label>
          <select id="indiceReajuste" name="indiceReajuste" required>
            <option value="">Selecione o índice</option>
            <option value="IGPM">IGP-M</option>
            <option value="IPCA">IPCA</option>
            <option value="INPC">INPC</option>
          </select>
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
