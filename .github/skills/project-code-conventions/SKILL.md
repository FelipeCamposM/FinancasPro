---
name: project-code-conventions
description: "Use when: implementar codigo seguindo padroes do projeto; aplicar convencoes de nomenclatura, respostas API, seguranca SQL/JWT, migrations e padroes frontend/backend."
---

# Project Code Conventions

## Objetivo

Garantir consistencia tecnica e reduzir regressao ao implementar mudancas.

## Quando usar

- criar novos recursos backend/frontend
- refatorar codigo existente
- revisar pull request
- padronizar respostas e validacoes

## Convencoes principais

Backend:

- arquivos em kebab-case
- controllers em camelCase (ex: listGastos)
- schemas Zod com sufixo Schema
- tipos inferidos em PascalCase
- SQL em snake_case

Frontend:

- componentes em PascalCase
- hooks com prefixo use
- paginas em estrutura App Router

## Regras obrigatorias de seguranca

1. sempre filtrar por user_id em SELECT/UPDATE/DELETE
2. sempre usar SQL parametrizado com $N
3. nunca retornar password_hash
4. sempre validar entrada com Zod
5. validar UUID em params

## Contratos de resposta

- lista simples: { data: [] }
- item unico: { data: {} }
- paginada: { data, pagination }
- create: status 201
- delete: status 204 sem body

## Migrations

- nome: 00N_descricao.sql
- idempotencia com IF EXISTS/IF NOT EXISTS
- nao editar migration executada; criar nova

## Checklist de conclusao

- nomenclatura valida
- validacao e seguranca aplicadas
- contrato de resposta mantido
- migration padronizada quando necessario

## Saida esperada

Ao usar esta skill, produzir:

- alteracoes aderentes aos padroes do projeto
- observacoes de violacoes encontradas e correcoes aplicadas

## Prompt de exemplo

"Use a skill project-code-conventions para revisar meu endpoint novo e corrigir tudo que fugir do padrao do projeto."
