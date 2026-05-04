# ROADMAP de Evolucao UI/UX

## Objetivo

Transformar a interface para um sistema visual consistente, moderno e mais usavel, com identidade azul/preto, foco em legibilidade, clareza de fluxo e produtividade no uso diario.

## Direcao Visual Base

- Paleta principal: azul + preto (dark-first).
- Contraste alto para dados financeiros e tabelas.
- Superficies em glass sutil (blur moderado, bordas finas, sombras suaves).
- Motion curta e funcional (160ms-220ms), sem excesso.
- Consistencia entre dashboard, telas de CRUD e autenticacao.

## Fase 0 - Fundacao (Semana 1)

- [x] Trocar tokens globais de cor para azul/preto.
- [x] Ajustar gradiente global da aplicacao para a nova identidade.
- [x] Migrar acentos visuais de verde para azul/ciano no frontend.
- [ ] Revisar contraste WCAG de textos, placeholders e estados de foco.

Entregaveis:

- Tema base pronto em `frontend/src/app/globals.css`.
- Primeiro passe de migracao de cores em componentes/paginas.

## Fase 1 - Layout System (Semana 1-2)

- [x] Criar composicoes base reutilizaveis: PageShell, SectionHeader, StatCard.
- [x] Padronizar espacamentos e grids em todas as paginas internas.
- [x] Definir escala unica de raio, sombra e blur para glass surfaces.
- [x] Normalizar estados hover/focus/active de botoes e inputs.

Entregaveis:

- Biblioteca visual minima em `frontend/src/components/ui`.
- Reducao de duplicacao de classes e melhoria de manutencao.

## Fase 2 - Fluxos Criticos (Semana 2)

- [x] Dashboard: hierarquia visual mais clara para KPIs e graficos.
- [x] Gastos: filtros mais evidentes, tabela com leitura rapida e acoes claras.
- [x] Renda: cards e dialogos com melhor feedback de status.
- [x] Cartoes/Assinaturas: formularios e listagens com padrao unificado.

Entregaveis:

- Quatro fluxos principais com UX consistente.
- Queda de friccao em tarefas recorrentes (cadastrar, filtrar, editar).

## Fase 3 - Acessibilidade e Microinteracoes (Semana 3)

- [x] Revisar navegacao por teclado em modais, selects e tabelas.
- [x] Garantir estados focus visiveis em todos os elementos interativos.
- [x] Adicionar animacoes de entrada com stagger curto em cards/listas.
- [x] Melhorar feedback de carregamento, vazio e erro.

Entregaveis:

- UX mais previsivel e inclusiva.
- Menos ambiguidade em estados de tela.

## Fase 4 - Performance Visual e Refino (Semana 3-4)

- [x] Dashboard: adicionar camada de insights estrategicos para decisao rapida.
- [x] Polir qualidade informacional com cards-resumo nas paginas principais.
- [ ] Medir impacto de blur e sombras em telas mais pesadas.
- [ ] Reduzir custo visual em dispositivos de menor desempenho.
- [ ] Revisar consistencia tipografica e densidade informacional.
- [ ] Ajustes finais orientados por QA visual.

Pendencias abertas para nao esquecer:

- [ ] Padronizar microcopy orientada a acao (titulos, descricoes e estados vazios) em todo o app.
- [ ] Revisar prioridades de informacao por tela com checklist de relevancia (top 3 decisoes por pagina).

Entregaveis:

- Interface refinada com boa performance percebida.
- Checklist visual final aprovado.

## Metricas de Sucesso

- Consistencia visual entre paginas principais >= 90% (checklist interno).
- Reducao de classes hardcoded de cor fora de tokens centrais.
- Melhor legibilidade em tabelas e formularios (validacao manual).
- Feedback positivo nas tarefas centrais: criar/editar/filtrar dados.

## Backlog Tecnico Recomendado

- Criar lint-regra para evitar novas classes de cor fora do padrao principal.
- Consolidar variaveis de cor em tokens semanticos por tipo de componente.
- Documentar guia rapido de UI no `docs/visual-style.md` com exemplos.
