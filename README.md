# Rentify - SaaS de Gestão de Recebíveis de Aluguel

O **Rentify** é um microSaaS desenvolvido para facilitar a gestão de contas e parcelas a receber de aluguéis de empreendimentos imobiliários, eliminando a necessidade de planilhas paralelas e complexas.

---

## 🚀 Tecnologias Utilizadas

### Backend

- **Core:** Node.js + Express + TypeScript
- **Banco de Dados & ORM:** MySQL + Prisma
- **Autenticação:** JWT (Access Token em memória + Refresh Token em Cookie HTTPOnly com rotação automática)
- **Validação de Dados:** Zod
- **Agendamento de Tarefas:** `node-cron`
- **Exportação:** `exceljs`
- **Segurança e Cookies:** `helmet`, `cors` e `cookie-parser`

### Frontend

- **Core:** React + Vite + TypeScript
- **Estilização:** CSS nativo (Vanilla CSS) / CSS Modules com design moderno e responsivo
- **Arquitetura:** Feature-based

---

## 📋 Funcionalidades Principais

- **Autenticação Segura e Transparente:** Login com criptografia (`bcryptjs`) implementando o padrão de segurança de Access Tokens de curta duração guardados apenas na memória da aplicação, combinados com Refresh Tokens de longa duração blindados em cookies HTTPOnly, com auto-renovação de sessão (token rotation) via interceptador HTTP.
- **Gestão de Empreendimentos:** CRUD completo para cadastro dos imóveis e definição de valores padrão.
- **Gestão de Contratos (Meus Contratos):** 
  - Criação de contratos de aluguel associados aos empreendimentos, controlando informações avançadas: Multa de atraso, Juros mensal, Índice de reajuste, Data de Início e Fim.
  - Painel de gerenciamento em massa dos status do contrato (`ATIVO`, `FINALIZADO`, `RENOVADO`, `RESCINDIDO`).
- **Geração Inteligente de Parcelas:**
  - Ao marcar uma conta/parcela como **PAGA**, o sistema cria atomicamente a parcela pendente do mês seguinte (caso o contrato continue ativo).
- **Rotina Automática de Atrasos (Cron Job):** Uma tarefa diária atualiza automaticamente o status de contas pendentes vencidas para `EM_ATRASO`.
- **Filtros e Visualização:** Grid interativo de parcelas com filtros avançados por Mês Referência, status (`PENDENTE`, `PAGO`, `EM_ATRASO`) e por empreendimento. A lógica de filtragem de data atua com tratamento especial do UTC limitando falhas de *boundary* nativas do banco MySQL.
- **Exportação de Dados:** Exportação personalizada em Excel (`.xlsx`) com os filtros exatos aplicados em tela.
- **Dashboard Financeiro:** Métricas consolidadas (Valor Recebido, Pendente, Em Atraso) e gráfico interativo de rendimento por empreendimento através de filtros de mês referência.

---

## 🛠️ Configuração e Instalação

### Pré-requisitos

- Node.js (versão 18 ou superior)
- Banco de dados MySQL ativo

### Passo a Passo

1. **Clonar o Repositório:**

   ```bash
   git clone https://github.com/seu-usuario/Rentify.git
   cd Rentify
   ```

2. **Instalar as Dependências:**

   ```bash
   npm install
   ```

3. **Configurar as Variáveis de Ambiente:**
   Crie um arquivo `.env` na raiz do projeto baseado no `.env.example`:

   ```env
   DATABASE_URL="mysql://usuario:senha@localhost:3306/nome_do_banco"
   JWT_SECRET="um-segredo-longo-e-seguro-para-geracao-do-jwt"
   JWT_EXPIRES_IN="15m"
   REFRESH_SECRET="um-segredo-diferente-e-seguro-para-refresh-token"
   REFRESH_EXPIRES_IN="7d"
   PORT="3333"
   WEB_ORIGIN="http://localhost:5173"
   # Usar NODE_ENV="production" em ambientes produtivos para ativar secure e SameSite nos cookies
   ```

   _Nota: Se a sua senha do banco possuir caracteres especiais (como `@`, `#`, `$` ou `/`), certifique-se de realizar o URL-encode deles na string do `DATABASE_URL` (por exemplo, `@` vira `%40`)._

4. **Executar as Migrations e Gerar o Prisma Client:**

   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

5. **Executar a Aplicação em Desenvolvimento:**

   ```bash
   npm run dev:full
   ```

   Isso iniciará simultaneamente o backend na porta `3333` e o frontend na porta `5173`.

6. **Gerar Build de Produção:**
   ```bash
   npm run build
   ```

---

## 📂 Estrutura do Projeto

```text
├── prisma/                  # Schema e migrações do banco de dados (Prisma)
├── src/
│   ├── server/              # Código fonte do Backend
│   │   ├── config/          # Configurações de ambiente
│   │   ├── domain/          # Esquemas de validação (Zod)
│   │   ├── jobs/            # Tarefas agendadas (Cron jobs)
│   │   ├── lib/             # Instâncias e utilitários (Prisma, Dates, Http Error)
│   │   ├── middleware/      # Middlewares (Auth com token, Error handler, Rate limit)
│   │   ├── routes/          # Rotas da API REST
│   │   └── services/        # Regras de negócio e lógica de serviço
│   │
│   └── web/                 # Código fonte do Frontend (React + Vite)
│       ├── index.html       # Arquivo HTML principal
│       ├── main.tsx         # Ponto de entrada do React
│       └── src/             # Componentes, estilos e cliente API (Arquitetura Feature-based)
```
