# Rentify - SaaS de Gestão de Recebíveis de Aluguel

O **Rentify** é um microSaaS desenvolvido para facilitar a gestão de contas e parcelas a receber de aluguéis de empreendimentos imobiliários, eliminando a necessidade de planilhas paralelas e complexas.

---

## 🚀 Tecnologias Utilizadas

### Backend

- **Core:** Node.js + Express + TypeScript
- **Banco de Dados & ORM:** MySQL + Prisma
- **Autenticação:** JWT (JSON Web Tokens) com Bearer Authentication
- **Validação de Dados:** Zod
- **Agendamento de Tarefas:** `node-cron`
- **Exportação:** `exceljs`

### Frontend

- **Core:** React + Vite + TypeScript
- **Estilização:** CSS nativo (Vanilla CSS) com design moderno e responsivo

---

## 📋 Funcionalidades Principais

- **Autenticação Segura:** Registro e login de usuários com criptografia de senhas (`bcryptjs`) e tokens JWT.
- **Gestão de Empreendimentos:** CRUD completo para cadastro dos imóveis e definição de valores padrão.
- **Gestão de Contratos:** CRUD de contratos de aluguel associados aos empreendimentos, definindo inquilinos e dias de vencimento.
- **Geração Inteligente de Parcelas:**
  - Ao marcar uma conta/parcela como **PAGA**, o sistema cria atomicamente a parcela pendente do mês seguinte (caso o contrato continue ativo).
- **Rotina Automática de Atrasos (Cron Job):** Uma tarefa diária atualiza automaticamente o status de contas pendentes vencidas para `EM_ATRASO`.
- **Filtros e Visualização:** Grid interativo de parcelas com filtros por status (`PENDENTE`, `PAGO`, `EM_ATRASO`) e por empreendimento.
- **Exportação de Dados:** Exportação personalizada em Excel (`.xlsx`) com os filtros aplicados na tela.
- **Dashboard Financeiro:** Métricas consolidadas (Valor Recebido, Pendente, Em Atraso) e gráfico de rendimento por empreendimento.

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
   PORT="3333"
   WEB_ORIGIN="http://localhost:5173"
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

```
├── prisma/                  # Schema e migrações do banco de dados (Prisma)
├── src/
│   ├── server/              # Código fonte do Backend
│   │   ├── config/          # Configurações de ambiente
│   │   ├── domain/          # Esquemas de validação (Zod)
│   │   ├── jobs/            # Tarefas agendadas (Cron jobs)
│   │   ├── lib/             # Instâncias e utilitários (Prisma, Dates)
│   │   ├── middleware/      # Middlewares (Auth, Error handler, Rate limit)
│   │   ├── routes/          # Rotas da API REST
│   │   └── services/        # Regras de negócio e lógica de serviço
│   │
│   └── web/                 # Código fonte do Frontend (React + Vite)
│       ├── index.html       # Arquivo HTML principal
│       ├── main.tsx         # Ponto de entrada do React
│       └── src/             # Componentes, estilos e cliente API
```
