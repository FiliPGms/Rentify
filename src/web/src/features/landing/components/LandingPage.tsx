import React from 'react';
import type { Theme } from '../../../lib/types';
import { MoonIcon } from '../../../shared/components/icons/MoonIcon';
import { SunIcon } from '../../../shared/components/icons/SunIcon';

interface LandingPageProps {
  onGetStarted: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}

export function LandingPage({ onGetStarted, theme, onToggleTheme }: LandingPageProps) {
  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (!element) return;
    const targetPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    const duration = 800;
    let start: number | null = null;

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const progressPercentage = Math.min(progress / duration, 1);
      const ease =
        progressPercentage < 0.5
          ? 4 * progressPercentage ** 3
          : 1 - (-2 * progressPercentage + 2) ** 3 / 2;
      window.scrollTo(0, startPosition + distance * ease);
      if (progress < duration) window.requestAnimationFrame(step);
    };

    window.requestAnimationFrame(step);
  };

  return (
    <div className="landing-wrapper">
      <header className="landing-header">
        <div className="landing-logo">Rentify</div>
        <nav className="landing-nav">
          <a href="#features" onClick={(e) => handleScroll(e, 'features')}>Funcionalidades</a>
          <a href="#steps" onClick={(e) => handleScroll(e, 'steps')}>Como Funciona</a>
          <a href="#pricing" onClick={(e) => handleScroll(e, 'pricing')}>Planos</a>
          <a href="#faq" onClick={(e) => handleScroll(e, 'faq')}>Dúvidas</a>
        </nav>
        <div className="landing-actions">
          <button
            className="ghost theme-toggle"
            type="button"
            onClick={onToggleTheme}
            title={theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
            aria-label="Alternar tema"
          >
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>
          <button className="ghost compact" onClick={onGetStarted}>Entrar</button>
          <button className="compact" onClick={onGetStarted}>Acessar Painel</button>
        </div>
      </header>

      <main className="landing-main">
        {/* Hero */}
        <section className="landing-hero">
          <div className="landing-hero-content">
            <span className="landing-badge">⚡ NOVO: GESTÃO INTELIGENTE DE RECEBÍVEIS</span>
            <h1>Planilhas de aluguel no passado, controle no presente.</h1>
            <p className="muted">
              Esquecer controles paralelos é libertador. Cadastre seus imóveis, acompanhe vencimentos e gere a
              recorrência mensal de recebíveis automaticamente de forma limpa e rápida.
            </p>
            <div className="landing-hero-ctas">
              <button onClick={onGetStarted}>Começar Gratuitamente</button>
              <a href="#features" className="button ghost" onClick={(e) => handleScroll(e, 'features')}>
                Ver Funcionalidades
              </a>
            </div>
          </div>

          <div className="landing-hero-preview">
            <div className="mock-window">
              <div className="mock-header">
                <span className="dot dot-red"></span>
                <span className="dot dot-yellow"></span>
                <span className="dot dot-green"></span>
                <span className="mock-title">Rentify Cockpit</span>
              </div>
              <div className="mock-body">
                <div className="mock-metrics">
                  <div className="mock-metric success"><span>Recebido</span><strong>R$ 18.500,00</strong></div>
                  <div className="mock-metric danger"><span>Atrasado</span><strong>R$ 0,00</strong></div>
                </div>
                <div className="mock-table-wrap">
                  <table className="mock-table">
                    <thead>
                      <tr><th>Empreendimento</th><th>Inquilino</th><th>Vencimento</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      <tr><td>Ed. Comercial</td><td>Tay Carla</td><td>05/07/2026</td><td><span className="badge pago">PAGO</span></td></tr>
                      <tr><td>Residencial Sol</td><td>Joao Silva</td><td>10/08/2026</td><td><span className="badge pendente">PENDENTE</span></td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="landing-features">
          <p className="eyebrow">Funcionalidades</p>
          <h2>Foco na gestão de aluguéis</h2>
          <div className="landing-features-grid">
            <div className="feature-card"><div className="feature-icon">🔄</div><h3>Geração Automática</h3><p>Ao marcar um recebível como pago, a parcela do mês seguinte é gerada de forma automática.</p></div>
            <div className="feature-card"><div className="feature-icon">📅</div><h3>Rotina Diária de Atrasos</h3><p>O robô diário atualiza automaticamente o status de contas pendentes vencidas para atrasadas.</p></div>
            <div className="feature-card"><div className="feature-icon">📊</div><h3>Exportação Rápida</h3><p>Baixe relatórios completos em formato Excel (.xlsx) com um clique e com todos os filtros aplicados.</p></div>
          </div>
        </section>

        {/* Steps */}
        <section id="steps" className="landing-steps">
          <p className="eyebrow">Fluxo de Trabalho</p>
          <h2>Gestão de ponta a ponta em 3 passos simples</h2>
          <div className="landing-steps-container">
            <div className="step-item"><span className="step-number">01</span><h4>Cadastre o Imóvel &amp; Contrato</h4><p>Defina o valor base e a data padrão de vencimento das parcelas em segundos.</p></div>
            <div className="step-item"><span className="step-number">02</span><h4>Dê Baixa com 1 Clique</h4><p>Marque o aluguel do mês atual como pago informando a data real do recebimento.</p></div>
            <div className="step-item"><span className="step-number">03</span><h4>Automação faz o resto</h4><p>O sistema cria automaticamente a parcela do mês seguinte e atualiza atrasos todo dia.</p></div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="landing-pricing">
          <p className="eyebrow">Preço</p>
          <h2>Plano transparente, sem surpresas</h2>
          <div className="pricing-card">
            <span className="pricing-badge">START</span>
            <h3>Tudo que você precisa</h3>
            <div className="price"><strong>R$ 20,90</strong><span>/mês</span></div>
            <ul className="pricing-features">
              <li>✓ Imóveis e Empreendimentos ilimitados</li>
              <li>✓ Contratos e Inquilinos ilimitados</li>
              <li>✓ Exportações em Excel ilimitadas</li>
              <li>✓ Automações e Cron diários ativos</li>
              <li>✓ Suporte humanizado</li>
            </ul>
            <button className="pricing-button" onClick={onGetStarted}>Assinar e Começar Agora</button>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="landing-faq">
          <p className="eyebrow">Dúvidas frequentes</p>
          <h2>Tudo o que você precisa saber</h2>
          <div className="faq-grid">
            <details className="faq-item"><summary>Como funciona a recorrência automatizada?</summary><p>Assim que você marca uma conta do mês como PAGA, o Rentify verifica se o contrato associado ainda está ATIVO e, em caso positivo, cria de forma automática a parcela do próximo mês.</p></details>
            <details className="faq-item"><summary>Preciso cadastrar cartão de crédito para testar?</summary><p>Não! Você pode criar sua conta e experimentar a plataforma gratuitamente para gerenciar seus empreendimentos sem barreiras.</p></details>
            <details className="faq-item"><summary>O sistema avisa se um aluguel estiver atrasado?</summary><p>Sim. Uma rotina inteligente roda diariamente no servidor, verificando as contas vencidas e pendentes, alterando o status delas automaticamente para EM ATRASO.</p></details>
            <details className="faq-item"><summary>Consigo exportar meus relatórios?</summary><p>Com certeza. A ferramenta de exportação gera planilhas profissionais Excel (.xlsx) respeitando os mesmos filtros de status e empreendimento ativos no seu grid de gerenciamento.</p></details>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <p>Rentify © 2026. A maneira mais limpa de gerenciar seus aluguéis.</p>
      </footer>
    </div>
  );
}
