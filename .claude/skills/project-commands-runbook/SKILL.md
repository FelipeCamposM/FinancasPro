---
name: project-commands-runbook
description: "Use when: executar o projeto localmente; subir docker, backend e frontend; rodar migrations, build, lint e comandos de diagnostico; seguir ordem correta de inicializacao."
---

# Project Commands Runbook

## Objetivo

Executar o projeto de forma previsivel, com ordem correta de inicializacao e comandos padrao para desenvolvimento.

## Quando usar

- setup inicial do ambiente
- reinicio de ambiente local
- execucao de migrations
- build e validacoes rapidas

## Passo a passo padrao

1. subir banco:

```bash
docker compose up -d
```

2. rodar migrations:

```bash
cd backend
npm install
npm run migrate
```

3. subir backend:

```bash
npm run dev
```

4. subir frontend em outro terminal:

```bash
cd ../frontend
npm install
npm run dev
```

## Endpoints locais

- frontend: http://localhost:3000
- api: http://localhost:3001/api
- swagger: http://localhost:3001/api/docs
- health: http://localhost:3001/api/healthz
- pgAdmin: http://localhost:5050

## Operacoes comuns

Backend:

```bash
npm run build
npm start
npm run migrate:build
npx tsc --noEmit
```

Frontend:

```bash
npm run build
npm start
npm run lint
npx tsc --noEmit
```

## Banco e docker

```bash
docker compose ps
docker compose logs -f postgres
docker compose restart postgres
docker compose down -v
```

## Checklist de conclusao

- postgres ativo
- migrations aplicadas
- backend respondendo healthz
- frontend carregando

## Saida esperada

Ao usar esta skill, produzir:

- sequencia de comandos exata para o objetivo solicitado
- pontos de verificacao apos cada etapa
- diagnostico basico se algum passo falhar

## Prompt de exemplo

"Use a skill project-commands-runbook e me passe os comandos para resetar ambiente local e subir tudo de novo."
