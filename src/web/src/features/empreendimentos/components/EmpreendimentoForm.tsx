import { FormEvent, useState } from 'react';
import { Modal } from '../../../shared/components/Modal';
import { createEmpreendimento } from '../api';

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
    try {
      await createEmpreendimento({
        nome: String(form.get('nome')),
        endereco: String(form.get('endereco')),
        valorPadrao: Number(form.get('valorPadrao'))
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
        <input name="nome" placeholder="Nome" required />
        <input name="endereco" placeholder="Endereço" required />
        <input name="valorPadrao" placeholder="Valor padrão" type="number" step="0.01" min="0" required />
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
