---
name: project-agent-prompts-playbook
description: "Use when: montar prompts efetivos para o modo agente no Copilot; criar pedidos para endpoint, migration, pagina frontend, filtros, campos novos, graficos e otimizacao SQL."
---

# Project Agent Prompts Playbook

## Objetivo

Fornecer templates de prompt prontos para tarefas recorrentes no projeto.

## Quando usar

- voce quer pedir implementacao rapida ao agente
- precisa manter padrao tecnico sem escrever prompt do zero
- deseja reduzir ambiguidades no pedido

## Como montar o prompt

1. comece com contexto de objetivo
2. informe caminhos e padroes obrigatorios
3. descreva campos/regras de negocio
4. finalize com criterios de aceite

## Templates prontos

### Novo endpoint REST

Use o template para pedir schema + controller + routes + registro em app.

### Nova migration

Use o template com nome sequencial, idempotencia e indexes.

### Nova pagina frontend

Use o template com App Router, api.ts, loading/error e formulario validado.

### Filtro em endpoint

Use o template com filters/values/idx e parametro swagger.

### Novo campo em tabela

Use o template migration + types + schema + controller.

### Grafico dashboard

Use o template com Recharts, props tipadas e responsividade.

### Query SQL lenta

Use o template de analise com indices, joins e paralelizacao.

## Checklist de conclusao

- prompt com objetivo claro
- padroes do projeto mencionados
- criterios de aceite objetivos

## Saida esperada

Ao usar esta skill, produzir:

- prompt final pronto para copiar e executar
- lista curta de variaveis que voce so precisa preencher

## Prompt de exemplo

"Use a skill project-agent-prompts-playbook e gere um prompt para criar endpoint de metas mensais com paginacao e filtros por periodo."
