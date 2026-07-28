import { FormEvent, useState } from 'react';
import { Modal } from '../../../shared/components/Modal';
import type { Contrato } from '../../contratos/types';
import { createConta } from '../api';
import type { FormaPagamento } from '../types';

interface ContaFormProps {
  contratos: Contrato[];
  onCreated: () => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function ContaForm({ contratos, onCreated, showToast }: ContaFormProps) {
  const [successModal, setSuccessModal] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const mesRaw = String(form.get('mesReferencia')); // YYYY-MM
    const mesReferencia = mesRaw ? `${mesRaw}-01` : '';
    const fp = String(form.get('formaPagamento'));

    try {
      await createConta({
        contratoId: String(form.get('contratoId')),
        mesReferencia,
        dataVencimento: String(form.get('dataVencimento')),
        valor: Number(form.get('valor')),
        conta: String(form.get('conta')) as 'RECEITA' | 'DESPESA',
        descricao: String(form.get('descricao')),
        ...(fp ? { formaPagamento: fp as FormaPagamento } : {})
      });
      formElement.reset();
      setSuccessModal(true);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao criar conta.', 'error');
    }
  }

  async function closeModal() {
    setSuccessModal(false);
    await onCreated();
  }

  return (
    <>
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
          <label className="eyebrow" htmlFor="conta">Conta</label>
          <select id="conta" name="conta" required>
            <option value="RECEITA">Receita</option>
            <option value="DESPESA">Despesa</option>
          </select>
        </div>
        <div className="form-group">
          <label className="eyebrow" htmlFor="descricao">Descrição</label>
          <input id="descricao" name="descricao" placeholder="Ex: Aluguel, Internet, Condomínio" required />
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
          <label className="eyebrow" htmlFor="formaPagamento">Forma de Pagamento</label>
          <select id="formaPagamento" name="formaPagamento">
            <option value="">Não informado</option>
            <option value="PIX">PIX</option>
            <option value="CARTAO_CREDITO">Cartão de Crédito</option>
            <option value="A_VISTA">À Vista</option>
            <option value="BOLETO">Boleto</option>
          </select>
        </div>
        <button type="submit">Criar conta</button>
      </form>

      {successModal && (
        <Modal onClose={closeModal}>
          <span className="modal-success-icon">✓</span>
          <h3>Conta criada!</h3>
          <p>A conta foi adicionada com sucesso ao sistema.</p>
          <div className="modal-actions">
            <button className="confirm" type="button" onClick={closeModal}>Fechar</button>
          </div>
        </Modal>
      )}
    </>
  );
}
