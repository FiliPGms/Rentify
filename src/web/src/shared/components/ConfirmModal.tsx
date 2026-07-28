import { Modal } from './Modal';

interface ConfirmModalProps {
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({
  title,
  description,
  confirmLabel = 'Confirmar',
  danger = false,
  onConfirm,
  onClose
}: ConfirmModalProps) {
  return (
    <Modal onClose={onClose}>
      <h3>{title}</h3>
      <p>{description}</p>
      <div className="modal-actions">
        <button className="ghost" type="button" onClick={onClose}>
          Cancelar
        </button>
        <button
          className="confirm"
          type="button"
          style={danger ? { background: 'var(--danger)' } : undefined}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
