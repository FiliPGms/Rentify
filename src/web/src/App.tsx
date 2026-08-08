import { useEffect, useRef, useState } from 'react';
import { hasToken, onUnauthorized, refreshAccessToken } from './lib/http';
import type { Theme, Toast } from './lib/types';
import { ToastContainer } from './shared/components/Toast';
import { AuthScreen } from './features/auth/components/AuthScreen';
import { LandingPage } from './features/landing/components/LandingPage';
import { Shell } from './Shell';

export function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'landing' | 'auth'>('landing');
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'light';
  });

  // Toast global para mensagens de sessão expirada
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type, id: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }

  useEffect(() => {
    onUnauthorized((message) => {
      setAuthenticated(false);
      setView('auth');
      if (message) showToast(message, 'error');
    });

    // Tenta restaurar a sessão via refresh token (cookie HTTPOnly)
    refreshAccessToken().then((ok) => {
      if (ok) setAuthenticated(true);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  // Enquanto tenta restaurar a sessão, não mostra nada (evita flash de login)
  if (loading) {
    return null;
  }

  if (!authenticated) {
    if (view === 'landing') {
      return (
        <>
          <LandingPage onGetStarted={() => setView('auth')} theme={theme} onToggleTheme={toggleTheme} />
          <ToastContainer toast={toast} />
        </>
      );
    }
    return (
      <>
        <AuthScreen
          onAuthenticated={() => setAuthenticated(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
          onBackToLanding={() => setView('landing')}
        />
        <ToastContainer toast={toast} />
      </>
    );
  }

  return (
    <>
      <Shell onLogout={() => { setAuthenticated(false); setView('landing'); }} theme={theme} onToggleTheme={toggleTheme} />
      <ToastContainer toast={toast} />
    </>
  );
}
