import { FormEvent, useRef, useState } from 'react';
import { setToken } from '../../../lib/http';
import type { ToastType } from '../../../lib/types';
import { login, register } from '../api';

interface UseAuthOptions {
  onAuthenticated: () => void;
  showToast: (message: string, type?: ToastType) => void;
}

export function useAuth({ onAuthenticated, showToast }: UseAuthOptions) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  function toggleMode() {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
    setError('');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      const result =
        mode === 'login'
          ? await login({
              email: String(form.get('email')),
              senha: String(form.get('senha'))
            })
          : await register({
              nome: String(form.get('nome')),
              email: String(form.get('email')),
              senha: String(form.get('senha'))
            });
      setToken(result.token);
      showToast(mode === 'login' ? 'Login efetuado com sucesso!' : 'Cadastro realizado com sucesso!');
      setTimeout(() => onAuthenticated(), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha na autenticação.');
    }
  }

  return { mode, error, formRef, toggleMode, submit };
}
