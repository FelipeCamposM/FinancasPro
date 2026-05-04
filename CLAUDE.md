# Gerenciar Gastos — CLAUDE.md

## Stack

- **Frontend**: Next.js 14 App Router — `localhost:3000`
- **Backend**: Express + TypeScript — `localhost:3001/api`
- **Banco**: PostgreSQL 16 via Docker — `localhost:5433`
- **Docs API**: `localhost:3001/api/docs` (Swagger)
- **Health**: `localhost:3001/api/healthz`
- **pgAdmin**: `localhost:5050`

## Estrutura do monorepo

```
/
├── backend/
│   ├── database/migrations/   # SQL versionado (00N_descricao.sql)
│   ├── src/schemas/           # Zod schemas
│   ├── src/controllers/       # regras de negócio + SQL
│   ├── src/routes/            # rotas + swagger JSDoc
│   ├── src/middlewares/       # auth, validate, paginate, errorHandler
│   └── src/app.ts             # registro de rotas
├── frontend/
│   ├── src/app/(app)/         # área autenticada (App Router)
│   ├── src/components/ui/     # shadcn
│   ├── src/components/dashboard/ # blocos de interface
│   └── src/lib/api.ts         # cliente HTTP padrão
├── docs/
└── docker-compose.yml
```

## Auth

- JWT Bearer, expiração 7 dias
- Frontend: cookie `gg_token` + interceptor que injeta `Authorization`
- **Sempre filtrar por `user_id`** em SELECT/UPDATE/DELETE

## Modelo de dados

Entidades: `users`, `categorias`, `cartoes`, `gastos`, `parcelas`, `renda`, `assinaturas`

- UUID em entidades principais expostas; SERIAL em auxiliares
- Tudo segregado por `user_id`
- `gastos` podem gerar `parcelas`
- `assinaturas` podem gerar `gastos`
- `categorias` classificam `gastos` e `renda`

## Convenções de código

### Backend
- Arquivos: `kebab-case`
- Controllers: `camelCase` (ex: `listGastos`)
- Schemas Zod: sufixo `Schema`
- Tipos inferidos: `PascalCase`
- SQL: `snake_case`, placeholders `$N` (nunca concatenar)

### Frontend
- Componentes: `PascalCase`
- Hooks: prefixo `use`
- Dados via `src/lib/api.ts`
- Forms: `react-hook-form` + `zodResolver`
- Toast: `sonner`

## Contratos de resposta

| Tipo | Estrutura | Status |
|---|---|---|
| Lista simples | `{ data: [] }` | 200 |
| Item único | `{ data: {} }` | 200 |
| Paginada | `{ data, pagination }` | 200 |
| Create | corpo criado | 201 |
| Delete | sem body | 204 |

## Regras obrigatórias de segurança

1. Filtrar por `user_id` em todo SELECT/UPDATE/DELETE
2. SQL parametrizado com `$N` — sem concatenação
3. Nunca retornar `password_hash`
4. Validar entrada com Zod
5. Validar UUID em params

## Migrations

- Nome: `00N_descricao.sql`
- Idempotentes: `IF EXISTS` / `IF NOT EXISTS`
- Nunca editar migration já executada — criar nova

## Novo recurso — checklist

**Backend:**
1. Schema em `src/schemas/`
2. Controller em `src/controllers/`
3. Rota em `src/routes/`
4. Registrar em `src/app.ts`

**Frontend:**
1. Página em `src/app/(app)/rota/page.tsx`
2. Componentes compartilhados em `src/components/`
3. HTTP via `src/lib/api.ts`

## Inicialização local

```bash
# 1. Banco
docker compose up -d

# 2. Backend
cd backend && npm install && npm run migrate && npm run dev

# 3. Frontend (outro terminal)
cd frontend && npm install && npm run dev
```

## Skills disponíveis

| Skill | Uso |
|---|---|
| `project-architecture-reference` | arquitetura, fluxo, contratos |
| `project-code-conventions` | nomenclatura, segurança, respostas |
| `project-engineering-patterns` | templates CRUD, SQL, frontend |
| `project-structure-guide` | onde criar cada artefato |
| `project-agent-prompts-playbook` | prompts prontos para agente |
| `project-commands-runbook` | comandos de ambiente |
| `frontend-visual-system-fluid-glass` | design system fluid glass |
