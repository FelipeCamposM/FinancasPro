---
name: project-architecture-reference
description: "Use when: entender a arquitetura do projeto gerenciar gastos; mapear fluxo frontend-backend-banco; consultar stack, auth JWT, modelo de dados e decisoes arquiteturais antes de implementar."
---

# Project Architecture Reference

## Objetivo

Fornecer contexto arquitetural rapido para planejar implementacoes sem quebrar contratos entre frontend, backend e banco.

## Quando usar

- iniciar features novas
- revisar impacto tecnico de mudancas
- validar onde implementar cada parte (frontend, backend, banco)
- confirmar fluxo de autenticacao e rotas principais

## Resumo da arquitetura

- frontend: Next.js 14 App Router em localhost:3000
- backend: Express + TypeScript em localhost:3001/api
- banco: PostgreSQL 16 via Docker em localhost:5433
- docs API: /api/docs
- health: /api/healthz

## Fluxo de request (backend)

1. rota Express recebe request
2. middlewares (authenticate, paginate, validate)
3. controller executa query com pool do pg
4. resposta de sucesso ou encaminhamento de erro para errorHandler

## Contratos importantes

- autenticacao por JWT Bearer (expiracao de 7 dias)
- frontend usa cookie gg_token e interceptor para Authorization
- listas paginadas devem seguir estrutura data + pagination

## Modelo de dados (dominio)

Entidades centrais:

- users
- categorias
- cartoes
- gastos
- parcelas
- renda
- assinaturas

Relacoes-chave:

- tudo e segregado por user_id
- gastos podem gerar parcelas
- assinaturas podem gerar gastos
- categorias classificam gastos e renda

## Decisoes arquiteturais relevantes

- UUID em entidades principais expostas
- SERIAL em entidades auxiliares
- validacao com Zod separada do controller
- SQL parametrizado com $N (sem concatenacao)
- pool de conexoes para eficiencia

## Checklist de uso

- validar camada correta da mudanca
- confirmar se ha impacto em autenticacao
- validar se exige migration
- validar contrato de resposta da API

## Saida esperada

Ao usar esta skill, produzir:

- resumo do impacto arquitetural
- plano de alteracoes por camada
- riscos e mitigacoes principais

## Prompt de exemplo

"Use a skill project-architecture-reference e me diga o impacto de adicionar recorrencia semanal em assinaturas e dashboard."
