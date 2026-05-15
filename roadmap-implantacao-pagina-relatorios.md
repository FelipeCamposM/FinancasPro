# Roadmap de implantacao da pagina de relatorios

Este roadmap foi criado com base em `spec-pagina-relatorios.md` para guiar a implementacao sem perder o que ja foi feito, o que esta em andamento e o que ainda falta.

## Como usar

- Marcar `[x]` somente quando a tarefa estiver implementada e verificada.
- Manter `[ ]` quando a tarefa ainda nao foi iniciada.
- Adicionar observacoes curtas em "Registro de progresso" quando uma etapa mudar de estado.
- Antes de marcar uma etapa de backend como concluida, validar build e contrato da API.
- Antes de marcar uma etapa de frontend como concluida, validar build e fluxo visual principal.

## Status geral

- [x] Diagnostico atual da pagina de relatorios concluido
- [x] V1 essencial implementada
- [ ] V1 essencial verificada
- [ ] V2 inteligente implementada
- [ ] V2 inteligente verificada
- [ ] V3 avancada implementada
- [ ] V3 avancada verificada

## Etapa 0 - Diagnostico e alinhamento

- [x] Ler a implementacao atual da pagina de relatorios no frontend.
- [x] Mapear endpoints de relatorio, dashboard e gastos ja existentes no backend.
- [x] Confirmar quais campos da spec ja existem no banco.
- [x] Confirmar quais campos da spec exigem migracao.
- [x] Confirmar se a renda mensal ja esta sendo calculada sem duplicidade.
- [x] Definir se a V1 usara endpoint existente ou um endpoint novo dedicado a relatorios.
- [x] Registrar decisoes tecnicas pendentes neste arquivo.

## Etapa 1 - Contrato de dados da V1

- [x] Definir schema de filtros aceitos pela API.
- [x] Implementar filtro por mes e ano.
- [x] Implementar filtro por categoria.
- [x] Implementar filtro por cartao.
- [x] Implementar filtro por forma de pagamento.
- [ ] Implementar filtro por tipo de gasto quando o campo existir. (V2 — campo nao existe no banco ainda)
- [x] Garantir isolamento por `user_id` em todas as consultas.
- [x] Garantir que receitas recorrentes e instancias mensais nao sejam contadas em dobro.
- [x] Padronizar resposta de sucesso no formato do projeto.
- [x] Padronizar resposta de erro no formato do projeto.

## Etapa 2 - KPIs principais da V1

- [x] Total gasto no mes.
- [x] Total de receitas no mes.
- [x] Saldo do mes.
- [x] Percentual da renda comprometida.
- [x] Media diaria de gastos.
- [x] Projecao de gasto ate o fim do mes.
- [x] Maior categoria do mes.
- [x] Maior gasto individual do mes.
- [x] Quantidade de transacoes.
- [x] Ticket medio.

## Etapa 3 - Graficos da V1

- [x] Gastos por categoria.
- [x] Evolucao diaria dos gastos.
- [x] Acumulado do mes (linha tracejada no grafico de evolucao diaria).
- [x] Distribuicao por forma de pagamento.
- [x] Ranking dos maiores gastos.
- [x] Estados de loading, vazio e erro para cada grafico.

## Etapa 4 - Tabelas da V1

- [x] Resumo por categoria.
- [x] Lista detalhada de gastos (50 mais recentes).
- [ ] Ordenacao por data, valor e categoria (colunas clicaveis — pendente).
- [x] Totalizadores coerentes com os KPIs.
- [x] Tratamento de lista vazia.
- [x] Responsividade em telas pequenas (colunas ocultas em mobile).

## Etapa 5 - Frontend da V1

- [x] Reorganizar a pagina seguindo a hierarquia da spec.
- [x] Criar ou ajustar barra de filtros.
- [x] Conectar filtros ao estado da pagina.
- [x] Conectar filtros a chamada da API.
- [x] Exibir KPIs principais em cards consistentes com o visual atual.
- [x] Exibir graficos principais.
- [x] Exibir tabelas principais.
- [ ] Validar acessibilidade basica de botoes, selects e tabelas.
- [x] Validar que textos nao quebram layout em mobile.

## Etapa 6 - Verificacao da V1

- [ ] Rodar build do backend.
- [ ] Rodar build do frontend.
- [ ] Testar relatorio de um mes com gastos e receitas.
- [ ] Testar relatorio de um mes sem gastos.
- [ ] Testar usuario sem dados.
- [ ] Testar filtros combinados.
- [ ] Conferir manualmente que totais batem com a lista detalhada.
- [ ] Conferir que dados de outro usuario nao aparecem.

## V2 - Indicadores inteligentes

- [ ] Comparacao com mes anterior.
- [ ] Variacao percentual contra mes anterior.
- [ ] Gastos fixos.
- [ ] Gastos variaveis.
- [ ] Gastos essenciais.
- [ ] Gastos nao essenciais.
- [ ] Gastos recorrentes.
- [ ] Gastos parcelados.
- [ ] Grafico fixos vs variaveis.
- [ ] Grafico essenciais vs nao essenciais.
- [ ] Tabela de recorrentes.
- [ ] Tabela de parcelamentos.
- [ ] Tabela de orcamento por categoria.
- [ ] Alertas automaticos de excesso por categoria.
- [ ] Alertas automaticos de gasto acima da media.
- [ ] Alertas automaticos de projecao acima da renda.
- [ ] Insights automaticos basicos.
- [ ] Verificacao completa da V2.

## V3 - Recursos avancados

- [ ] Exportacao em PDF.
- [ ] Exportacao em CSV.
- [ ] Comentario mensal do usuario.
- [ ] Metas por categoria.
- [ ] Tendencia de 3 a 6 meses.
- [ ] Subcategorias.
- [ ] Tags.
- [ ] Conta ou carteira quando o dado existir no modelo.
- [ ] Analise de economia potencial.
- [ ] Insights avancados de recorrencia e padroes.
- [ ] Verificacao completa da V3.

## Banco de dados e migracoes

- [ ] Confirmar se existe campo para gasto fixo ou variavel.
- [ ] Confirmar se existe campo para gasto essencial ou nao essencial.
- [ ] Confirmar se existe campo para conta ou carteira.
- [ ] Confirmar se existe estrutura de orcamento por categoria.
- [ ] Confirmar se existe estrutura de metas.
- [ ] Confirmar se existe estrutura de tags.
- [ ] Confirmar se existe estrutura de subcategorias.
- [ ] Criar migracoes apenas quando necessario.
- [ ] Garantir que migracoes sejam aditivas e nao apaguem dados.
- [ ] Revisar SQL antes de rodar em ambiente de producao.

## Decisoes pendentes

| Decisao | Status | Observacao |
| --- | --- | --- |
| Endpoint dedicado para relatorios ou reaproveitamento de endpoints atuais | Decidido | Novo endpoint GET /api/relatorios/mensal criado |
| Campos novos para V2/V3 | Pendente | Depende do modelo atual do banco |
| Biblioteca de graficos a usar | Decidido | recharts v2 (ja instalado) |
| Escopo exato da primeira entrega | Concluido | V1 essencial implementada |

## Registro de progresso

| Data | Etapa | Status | Observacao |
| --- | --- | --- | --- |
| 2026-05-14 | Criacao do roadmap | Concluido | Roadmap inicial criado a partir da spec |
| 2026-05-14 | Etapas 0-5 (V1) | Concluido | Novo endpoint GET /api/relatorios/mensal, EvolucaoDiariaChart, MensalTab reescrito com filtros + KPIs + tabelas. Backend e frontend compilam sem erros. |

## Checklist final antes de considerar pronto

- [ ] Backend compila sem erros.
- [ ] Frontend compila sem erros.
- [ ] Pagina carrega com dados reais.
- [ ] Pagina carrega sem dados.
- [ ] Filtros atualizam KPIs, graficos e tabelas.
- [ ] Totais dos KPIs batem com as tabelas.
- [ ] Nao ha duplicidade em receitas recorrentes.
- [ ] Nao ha vazamento de dados entre usuarios.
- [ ] Layout esta funcional em desktop.
- [ ] Layout esta funcional em mobile.
- [ ] Roadmap foi atualizado com o que ficou concluido.
