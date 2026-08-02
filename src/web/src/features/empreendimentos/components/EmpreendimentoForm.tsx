import { FormEvent, useState } from 'react';
import { Modal } from '../../../shared/components/Modal';
import { EnderecoForm } from '../../enderecos/components/EnderecoForm';
import { createEmpreendimento } from '../api';
import type { TipoEmpreendimento, EmpreendimentoStatus } from '../types';

interface EmpreendimentoFormProps {
  onCreated: () => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export function EmpreendimentoForm({ onCreated, showToast }: EmpreendimentoFormProps) {
  const [successModal, setSuccessModal] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    const numero = String(form.get('numero') ?? '').trim();

    try {
      await createEmpreendimento({
        nome: String(form.get('nome')),
        tipo: String(form.get('tipo')) as TipoEmpreendimento,
        statusImovel: String(form.get('statusImovel')) as EmpreendimentoStatus,
        inscricaoIptu: String(form.get('inscricaoIptu') ?? '').trim() || undefined,
        valorPadrao: Number(form.get('valorPadrao')),
        endereco: {
          cep: String(form.get('cep')),
          rua: String(form.get('rua')),
          numero: numero || undefined,
          bairro: String(form.get('bairro')),
          cidade: String(form.get('cidade')),
          estado: String(form.get('estado'))
        }
      });
      formElement.reset();
      setSuccessModal(true);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao cadastrar empreendimento.', 'error');
    }
  }

  async function closeModal() {
    setSuccessModal(false);
    await onCreated();
  }

  return (
    <>
      <form className="panel form-stack" onSubmit={submit}>
        <h2>Novo empreendimento</h2>

        <div className="form-group">
          <label className="eyebrow" htmlFor="nome">Nome</label>
          <input id="nome" name="nome" placeholder="Ex: Residencial Sol" required />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="eyebrow" htmlFor="tipo">Tipo</label>
            <select id="tipo" name="tipo" required>
              <option value="">Selecione o tipo</option>
              <option value="CASA">Casa</option>
              <option value="APARTAMENTO">Apartamento</option>
              <option value="COMERCIAL">Comercial</option>
              <option value="OUTRO">Outro</option>
            </select>
          </div>

          <div className="form-group">
            <label className="eyebrow" htmlFor="statusImovel">Status</label>
            <select id="statusImovel" name="statusImovel" defaultValue="DISPONIVEL">
              <option value="DISPONIVEL">Disponível</option>
              <option value="ALUGADO">Alugado</option>
              <option value="MANUTENCAO">Em Manutenção</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="eyebrow" htmlFor="valorPadrao">Valor padrão (R$)</label>
            <input
              id="valorPadrao"
              name="valorPadrao"
              placeholder="Ex: 1500.00"
              type="number"
              step="0.01"
              min="0"
              required
            />
          </div>

          <div className="form-group">
            <label className="eyebrow" htmlFor="inscricaoIptu">
              Inscrição IPTU <span className="muted" style={{ fontSize: '0.75rem' }}>(opcional)</span>
            </label>
            <input
              id="inscricaoIptu"
              name="inscricaoIptu"
              placeholder="Ex: 123.456.789-0"
              maxLength={30}
            />
          </div>
        </div>

        <EnderecoForm />

        <button type="submit">Cadastrar empreendimento</button>
      </form>

      {successModal && (
        <Modal onClose={closeModal}>
          <span className="modal-success-icon">✓</span>
          <h3>Empreendimento cadastrado!</h3>
          <p>O empreendimento foi adicionado com sucesso.</p>
          <div className="modal-actions">
            <button className="confirm" type="button" onClick={closeModal}>Fechar</button>
          </div>
        </Modal>
      )}
    </>
  );
}
