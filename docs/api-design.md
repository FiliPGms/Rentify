# API Design - SaaS Lendario MVP

## Diretrizes Aplicadas

- Estilo: REST, escolhido pela compatibilidade, simplicidade operacional e facilidade de documentar com OpenAPI.
- Versionamento: URI em `/api/v1`, pois deixa a evolução explícita e simples para clientes web e integrações futuras.
- Autenticação: JWT Bearer com expiração curta e claims mínimos (`sub`, `email`).
- Respostas: envelope consistente `{ "success": true, "data": ... }` e erros `{ "success": false, "error": { "code", "message", "details", "requestId" } }`.
- Paginação: offset para grids administrativos do MVP (`page`, `pageSize`), com metadados no envelope.
- Rate limiting: token bucket em memória por IP e usuário quando autenticado. Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.
- Segurança: validação de entrada com Zod, autorização por proprietário, prevenção de mass assignment e erros sem detalhes internos.

## Rotas

Base URL: `/api/v1`

### Autenticação

`POST /auth/register`

Request:

```json
{ "nome": "Maria", "email": "maria@empresa.com", "senha": "senha-forte" }
```

Response `201`:

```json
{ "success": true, "data": { "token": "...", "user": { "id": "uuid", "nome": "Maria", "email": "maria@empresa.com" } } }
```

`POST /auth/login`

Request:

```json
{ "email": "maria@empresa.com", "senha": "senha-forte" }
```

### Empreendimentos

`GET /empreendimentos`

Response `200`: lista dos empreendimentos do usuário autenticado.

`POST /empreendimentos`

Request:

```json
{ "nome": "Residencial Norte", "endereco": "Rua A, 100", "valorPadrao": 1500 }
```

`PATCH /empreendimentos/:id`

Request parcial: `nome`, `endereco`, `valorPadrao`.

`DELETE /empreendimentos/:id`

Response `204`.

### Contratos

`GET /contratos?empreendimentoId=uuid&status=ATIVO`

`POST /contratos`

Request:

```json
{
  "empreendimentoId": "uuid",
  "nomeInquilino": "Joao Silva",
  "dataVencimentoPadrao": "2026-08-10",
  "status": "ATIVO"
}
```

`PATCH /contratos/:id`

`DELETE /contratos/:id`

### Contas

`GET /contas?status=PENDENTE&empreendimentoId=uuid&page=1&pageSize=20`

Response `200`:

```json
{
  "success": true,
  "data": [{ "id": "uuid", "mesReferencia": "2026-08-01", "valor": 1500 }],
  "meta": { "page": 1, "pageSize": 20, "total": 30, "totalPages": 2 }
}
```

`POST /contas`

Request:

```json
{
  "contratoId": "uuid",
  "mesReferencia": "2026-08-01",
  "dataVencimento": "2026-08-10",
  "valor": 1500
}
```

`PATCH /contas/:id/pagamento`

Request:

```json
{ "dataPagamento": "2026-08-09" }
```

Comportamento: em transação, marca a conta como `PAGO` e cria a próxima parcela `PENDENTE` se o contrato estiver `ATIVO` e ainda não houver conta para o próximo mês.

`GET /contas/export?status=PENDENTE&empreendimentoId=uuid`

Response: arquivo `.xlsx`.

### Dashboard

`GET /dashboard/resumo`

Response:

```json
{
  "success": true,
  "data": {
    "faturamentoTotal": 12300,
    "pendenteTotal": 4200,
    "atrasadoTotal": 1200,
    "porEmpreendimento": [{ "empreendimentoId": "uuid", "nome": "Residencial Norte", "recebido": 9000 }]
  }
}
```

## Jobs

- Job diário: atualiza contas `PENDENTE` com `data_vencimento < hoje` para `EM_ATRASO`.
- Também há endpoint interno reaproveitável no serviço para execução manual em manutenção, sem rota pública no MVP.

## Erros

- `400`: request malformado.
- `401`: token ausente ou inválido.
- `403`: recurso pertence a outro usuário.
- `404`: recurso inexistente.
- `409`: duplicidade lógica, como conta do mesmo contrato e mês.
- `422`: validação de domínio.
- `429`: limite excedido.
