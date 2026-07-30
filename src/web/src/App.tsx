import { useEffect, useState } from 'react';
import { hasToken, onUnauthorized } from './lib/http';
import type { Theme } from './lib/types';
import { AuthScreen } from './features/auth/components/AuthScreen';
import { LandingPage } from './features/landing/components/LandingPage';
import { Shell } from './Shell';

export function App() {
  const [authenticated, setAuthenticated] = useState(hasToken());
  const [view, setView] = useState<'landing' | 'auth'>('landing');
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'light';
  });

  useEffect(() => {
    onUnauthorized(() => {
      setAuthenticated(false);
      setView('auth');
    });
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  if (!authenticated) {
    if (view === 'landing') {
      return <LandingPage onGetStarted={() => setView('auth')} theme={theme} onToggleTheme={toggleTheme} />;
    }
    return (
      <AuthScreen
        onAuthenticated={() => setAuthenticated(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        onBackToLanding={() => setView('landing')}
      />
    );
  }

  return <Shell onLogout={() => setAuthenticated(false)} theme={theme} onToggleTheme={toggleTheme} />;
}
