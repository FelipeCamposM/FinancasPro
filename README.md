# Gerenciar Gastos

Aplicação full-stack para controle financeiro pessoal.

| Camada       | Tecnologia                                       |
| ------------ | ------------------------------------------------ |
| Backend      | Node.js · Express · TypeScript · pg (PostgreSQL) |
| Frontend     | Next.js 14 · Tailwind CSS · Recharts             |
| Banco        | PostgreSQL 16 via Docker                         |
| Autenticação | JWT Bearer Token                                 |
| Docs API     | Swagger UI (OpenAPI 3.0)                         |

---

## Estrutura

```
.
├── backend/      # API REST (porta 3001)
├── frontend/     # Dashboard Next.js (porta 3000)
├── docker-compose.yml
└── .env.example
```

---

## Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Node.js 20+
- npm 10+

---

## 1. Suba o banco de dados

```bash
# Na raiz do projeto
cp .env.example .env          # configure as variáveis se necessário
docker compose up -d          # PostgreSQL na porta 5433, pgAdmin na 5050
```

Acesse o pgAdmin em http://localhost:5050  
Login: `admin@admin.com` / `admin123`

---

## 2. Backend

```bash
cd backend
cp .env.example .env          # ajuste DATABASE_URL e JWT_SECRET
npm install
npm run migrate               # roda as migrations SQL
npm run dev                   # servidor em http://localhost:3001
```

**Scripts disponíveis:**

| Script            | Descrição                      |
| ----------------- | ------------------------------ |
| `npm run dev`     | Desenvolvimento com hot-reload |
| `npm run build`   | Compila TypeScript             |
| `npm start`       | Inicia a versão compilada      |
| `npm run migrate` | Aplica as migrations no banco  |

**Endpoints principais:**

| Método | Rota                                  | Descrição                        |
| ------ | ------------------------------------- | -------------------------------- |
| POST   | `/api/auth/register`                  | Cadastro                         |
| POST   | `/api/auth/login`                     | Login → retorna JWT              |
| GET    | `/api/auth/me`                        | Dados do usuário logado          |
| GET    | `/api/gastos?page=1&limit=10`         | Listar gastos (paginado)         |
| POST   | `/api/gastos`                         | Criar gasto (gera parcelas auto) |
| GET    | `/api/gastos/:id/parcelas`            | Parcelas de um gasto             |
| GET    | `/api/parcelas?status=pendente`       | Minhas parcelas                  |
| PATCH  | `/api/parcelas/:id`                   | Atualizar status de parcela      |
| GET    | `/api/renda`                          | Listar entradas de renda         |
| GET    | `/api/cartoes`                        | Listar cartões                   |
| GET    | `/api/categorias`                     | Listar categorias (globais+suas) |
| GET    | `/api/dashboard/summary?mes=2025-06`  | Resumo financeiro do mês         |
| GET    | `/api/dashboard/renda-vs-gastos`      | Gráfico renda × gastos           |
| GET    | `/api/dashboard/gastos-por-categoria` | Pizza de gastos por categoria    |
| GET    | `/api/docs`                           | **Swagger UI interativa**        |
| GET    | `/api/docs-json`                      | JSON do spec OpenAPI             |

---

## 3. Frontend

```bash
cd frontend
cp .env.example .env.local    # ou edite NEXT_PUBLIC_API_URL
npm install
npm run dev                   # abre em http://localhost:3000
```

**Páginas:**

| Rota         | Descrição                     |
| ------------ | ----------------------------- |
| `/login`     | Login                         |
| `/register`  | Cadastro                      |
| `/dashboard` | Dashboard com gráficos        |
| `/docs`      | Documentação da API (Swagger) |

---

## Paginação

Todos os endpoints de listagem aceitam:

```
?page=1&limit=10
```

Resposta padrão:

```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

---

## Autenticação

Após o login, inclua o token em toda requisição:

```
Authorization: Bearer <token>
```

---

## Banco de dados — schema

```
users
  └── categorias (opcionalmente vinculadas ao user)
  └── cartoes
  └── gastos
        └── parcelas  (geradas automaticamente ao criar gasto parcelado)
  └── renda
```

**ENUMs criados:**

- `user_level_enum`: `free | premium | admin`
- `forma_pagamento_enum`: `dinheiro | cartao_credito | cartao_debito | pix | transferencia | outro`
- `tipo_pagamento_enum`: `a_vista | parcelado`
- `frequencia_enum`: `diario | semanal | quinzenal | mensal | bimestral | trimestral | semestral | anual`
- `status_gasto_enum`: `pendente | pago | cancelado`
- `status_parcela_enum`: `pendente | pago | vencido | cancelado`
- `tipo_categoria_enum`: `gasto | renda`
- `tipo_renda_enum`: `salario | freelance | investimento | aluguel | bonus | outro`
- `bandeira_enum`: `visa | mastercard | elo | amex | hipercard | discover | outro`
- `tipo_cartao_enum`: `credito | debito | credito_debito`
