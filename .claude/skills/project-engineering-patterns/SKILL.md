---
name: project-engineering-patterns
description: "Use when: gerar codigo no padrao tecnico do projeto; criar controller CRUD, schema Zod, routes com swagger, formulario React Hook Form + Zod e queries SQL com paginacao segura."
---

# Project Engineering Patterns

## Objetivo

Aplicar receitas tecnicas reutilizaveis para acelerar implementacao com qualidade.

## Quando usar

- gerar novo CRUD backend
- criar schemas de validacao
- montar rotas swagger
- criar formularios frontend com validacao

## Padrao backend CRUD

1. schema create + update(partial) e tipos inferidos
2. controller com list/get/create/update/delete
3. list paginada com filters, values, idx e Promise.all
4. rotas com authenticate, paginate, validate
5. swagger JSDoc para rotas principais

## Padrao frontend

1. dados com api de src/lib/api.ts
2. loading/error locais
3. formulario com react-hook-form + zodResolver
4. feedback com toast do sonner

## Padrao SQL

- filtros dinamicos em arrays
- placeholders incrementais $N
- COUNT e SELECT em paralelo
- agregacoes com cast explicito

## Checklist de conclusao

- controller completo e seguro
- schema e tipos alinhados
- rota registrada e documentada
- frontend consumindo API padrao

## Saida esperada

Ao usar esta skill, produzir:

- implementacao pronta seguindo os templates do projeto
- resumo curto das decisoes aplicadas

## Prompt de exemplo

"Use a skill project-engineering-patterns para criar o recurso de metas com schema, controller, routes e tela de cadastro."
