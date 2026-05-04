---
name: project-structure-guide
description: "Use when: localizar rapidamente arquivos no monorepo; decidir onde criar schemas, controllers, routes, pages e componentes; navegar pela estrutura backend/frontend sem perder padrao."
---

# Project Structure Guide

## Objetivo

Guiar a localizacao correta de arquivos e a criacao de novos artefatos no monorepo.

## Quando usar

- criar novo endpoint
- criar nova pagina no frontend
- adicionar migration
- entender organizacao de pastas

## Mapa essencial

Raiz:

- backend
- frontend
- docs
- docker-compose.yml

Backend:

- database/migrations: SQL versionado
- src/schemas: validacao Zod
- src/controllers: regras de negocio e SQL
- src/routes: rotas + swagger
- src/middlewares: auth, validate, pagination, error handler

Frontend:

- src/app: rotas App Router
- src/app/(app): area autenticada
- src/components/ui: componentes shadcn
- src/components/dashboard/nav: blocos de interface
- src/lib/api.ts: cliente HTTP padrao

## Regras de localizacao para novas features

Backend novo recurso:

1. schema em src/schemas
2. controller em src/controllers
3. rota em src/routes
4. registrar rota em src/app.ts

Frontend nova area:

1. pagina em src/app/(app)/rota/page.tsx
2. componentes compartilhados em src/components
3. chamadas HTTP via src/lib/api.ts

## Checklist de conclusao

- arquivos criados no local correto
- imports usando aliases padrao
- rota registrada quando aplicavel

## Saida esperada

Ao usar esta skill, produzir:

- plano de arquivos a criar/editar
- caminhos exatos por camada

## Prompt de exemplo

"Use a skill project-structure-guide para montar o plano de arquivos de uma feature nova de metas mensais."
