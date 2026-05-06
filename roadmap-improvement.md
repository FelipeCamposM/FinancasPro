# Roadmap de Melhorias - FinancasPro

> Atualizado em: 2026-05-06
> Marque itens concluidos trocando `[ ]` por `[x]`.

---

## UX / Visual

- [ ] Adicionar skeleton loaders em todas as tabelas e cards do dashboard
- [ ] Melhorar feedback visual de erros de formulario (highlight de campo + mensagem inline)
- [ ] Implementar modo escuro consistente em todos os componentes shadcn
- [ ] Refinar responsividade do sidebar em telas intermediarias (768-1024 px)
- [x] Propagar o padrao visual da pagina `/gastos` para headers, superficies glass, cards de resumo e containers de lista em `/renda`, `/cartoes` e `/assinaturas`.
- [x] Centralizar o hero header fluid glass no componente `SectionHeader` para manter consistencia entre paginas.

---

## Performance

- [ ] Adicionar cache de curta duracao (SWR/React Query) nas listagens de gastos e renda
- [ ] Paginar automaticamente listas com mais de 50 itens no frontend
- [ ] Lazy load dos componentes de graficos do dashboard (dynamic import)
- [ ] Indexar colunas `user_id` + `data` nas tabelas `gastos` e `renda` no banco

---

## Mobile

- [ ] Testar e corrigir layout das paginas `/gastos` e `/renda` em viewports < 375 px
- [ ] Converter acoes de tabela em bottom sheet no mobile
- [ ] Adicionar suporte a swipe para excluir itens em listas no mobile
- [ ] Garantir tamanho minimo de 44 px para todos os alvos de toque

---

## Funcionalidades

- [ ] Exportar relatorio mensal em CSV/PDF diretamente pelo dashboard
- [ ] Implementar notificacoes de alerta quando gastos ultrapassarem meta de categoria
- [ ] Adicionar visao de fluxo de caixa mensal com projecao dos proximos 3 meses
- [ ] Permitir recorrencia customizavel em assinaturas (semanal, quinzenal, anual)

---

## API / Integracoes Mobile

- [x] Criar API Key permanente por usuario com rota para consulta e rota para renovacao.
- [x] Adicionar endpoint `GET /api/categorias/iphone` para listas do iPhone vinculadas ao token do usuario.
- [x] Permitir autenticacao por JWT Bearer ou API Key nas rotas de `gastos`, incluindo `/gastos/atalho`.
- [x] Aplicar o mesmo padrao de autenticacao por JWT Bearer ou API Key nas rotas de `categorias`, `renda`, `cartoes`, `assinaturas`, `parcelas` e `dashboard`.
- [x] Manter rotas sensiveis de conta (`auth` e `users`) restritas ao fluxo de JWT.
- [ ] Documentar exemplos de uso do header `x-api-key` e `Authorization: ApiKey <token>` no README/API docs.

---

## Itens a adicionar

> Use o template abaixo para incluir novos itens em qualquer secao acima,
> ou crie uma nova secao seguindo o mesmo padrao.

```md
## Nome da Secao

- [ ] Descricao clara do que precisa ser feito
- [ ] Outra melhoria relacionada
```
