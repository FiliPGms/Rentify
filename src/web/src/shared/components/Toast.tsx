import type { Toast } from '../../lib/types';

interface ToastContainerProps {
  toast: Toast | null;
}

export function ToastContainer({ toast }: ToastContainerProps) {
  if (!toast) return null;
  return (
    <div className="toast-container">
      <div key={toast.id} className={`toast ${toast.type}`}>
        <span className="toast-icon">{toast.type === 'success' ? '✓' : '✕'}</span>
        <span>{toast.message}</span>
      </div>
    </div>
  );
}
