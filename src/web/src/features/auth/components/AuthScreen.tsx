import { useRef, useState } from 'react';
import { ToastContainer } from '../../../shared/components/Toast';
import { MoonIcon } from '../../../shared/components/icons/MoonIcon';
import { SunIcon } from '../../../shared/components/icons/SunIcon';
import type { Theme, Toast } from '../../../lib/types';
import { useAuth } from '../hooks/useAuth';

interface AuthScreenProps {
  onAuthenticated: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  onBackToLanding: () => void;
}

export function AuthScreen({ onAuthenticated, theme, onToggleTheme, onBackToLanding }: AuthScreenProps) {
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type, id: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }

  const { mode, error, toggleMode, submit } = useAuth({ onAuthenticated, showToast });

  return (
    <div className="auth-wrapper">
      <header className="auth-header">
        <div className="auth-logo" style={{ cursor: 'pointer' }} onClick={onBackToLanding}>
          Rentify
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            className="ghost theme-toggle"
            type="button"
            onClick={onToggleTheme}
            title={theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
            aria-label="Alternar tema"
          >
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>
          <button className="ghost compact" type="button" onClick={toggleMode}>
            {mode === 'login' ? 'Criar conta' : 'Entrar'}
          </button>
        </div>
      </header>

      <main className="auth-page">
        <section className="auth-hero">
          <p className="eyebrow">Cockpit de recebíveis</p>
          <h1>Controle suas parcelas de aluguel sem planilhas paralelas.</h1>
          <p className="muted">
            Cadastre seus empreendimentos, acompanhe vencimentos e gere recorrência mensal ao marcar contas pagas.
          </p>
        </section>
        <section className="auth-form-container">
          <form className="panel auth-form" onSubmit={submit}>
            <h2>{mode === 'login' ? 'Entrar' : 'Criar conta'}</h2>
            {mode === 'register' && <input name="nome" placeholder="Nome" required />}
            <input name="email" type="email" placeholder="Email" required />
            <input name="senha" type="password" placeholder="Senha" minLength={8} required />
            {error && <p className="error">{error}</p>}
            <button type="submit">{mode === 'login' ? 'Acessar painel' : 'Cadastrar'}</button>
          </form>
        </section>
      </main>

      <ToastContainer toast={toast} />
    </div>
  );
}
