# Plataforma Gerenciar Gastos - Resumo e Lotes de Prompts para Stitch

## 1) Resumo rapido da plataforma

Gerenciar Gastos e uma plataforma full-stack de controle financeiro pessoal.

Objetivo principal:

- centralizar renda, gastos, cartoes, parcelas e assinaturas
- dar visao clara de saldo e composicao de custos
- facilitar decisoes financeiras no dia a dia

Publico:

- usuario final autenticado
- foco em produtividade e leitura rapida de dados financeiros

## 2) Stack e arquitetura

- Frontend: Next.js 14 (App Router), Tailwind, Recharts
- Backend: Node.js + Express + TypeScript + pg
- Banco: PostgreSQL 16 (Docker)
- Auth: JWT Bearer
- API docs: Swagger

Fluxo macro:

- frontend consome API REST
- backend aplica middlewares de auth/validacao/paginacao
- controllers executam SQL parametrizado
- dados segregados por user_id

## 3) Modulos principais ja existentes

Area publica:

- Login
- Cadastro

Area autenticada:

- Dashboard
- Gastos
- Renda
- Cartoes
- Assinaturas
- Perfil

Entidades de negocio:

- users
- categorias
- cartoes
- gastos
- parcelas
- renda
- assinaturas

## 4) Linguagem visual atual

- dark-first (azul + preto)
- superfices glass suave
- foco em contraste para dados
- animacoes curtas (entrada com stagger)
- estados de loading, empty, error padronizados

## 5) Qualidade informacional atual

- dashboard com KPIs e camada estrategica
- paginas CRUD com cards de resumo contextual
- filtros e tabela com leitura rapida
- feedback visual de acao/estado (loading, vazio, erro)

## 6) Como usar os prompts no Stitch

Recomendacoes de uso:

- cole um prompt por vez
- sempre mantenha a diretriz visual (dark blue/black + glass)
- peca variante desktop e mobile no mesmo prompt
- peca estados: default, loading, empty, error

Frase base para anexar em todo prompt:
"Nao gere codigo. Crie apenas especificacao visual high-fidelity com hierarquia, espacamento, tipografia, estados e componentes reutilizaveis."

---

## LOTE 1 - Fundacao de UX (shell, navegacao, auth)

### Prompt 1.1 - Shell autenticado

Crie um layout base para app financeiro SaaS com sidebar esquerda fixa e area principal scrollavel.
Contexto: plataforma de controle financeiro pessoal com modulos Dashboard, Gastos, Renda, Cartoes, Assinaturas e Perfil.
Direcao visual: dark-first azul/preto, superficies glass suaves, bordas finas e contraste alto.
Entregue:

- versao desktop e mobile
- estado de item ativo na navegacao
- topo da pagina com titulo, descricao curta e area de acoes
- area de conteudo com grid responsivo
- tokens visuais consistentes (raio, sombra, blur, espacamento)
- guideline de comportamento responsivo

### Prompt 1.2 - Login

Crie tela de login para app financeiro com foco em clareza e confianca.
Campos: email, senha, lembrar-me, recuperar senha, CTA entrar, CTA ir para cadastro.
Direcao visual: mesma identidade dark blue/black + glass.
Entregue:

- hierarquia visual forte para CTA primario
- estados: default, loading, erro de credenciais
- microcopy objetiva e orientada a acao
- versao mobile otimizada

### Prompt 1.3 - Cadastro

Crie tela de cadastro com UX simples e sem friccao.
Campos: nome, email, senha, confirmar senha, aceite de termos.
Entregue:

- estado de validacao por campo
- estado de sucesso com proximo passo (ir para dashboard)
- variacao mobile

---

## LOTE 2 - Dashboard mais relevante

### Prompt 2.1 - Dashboard executivo

Crie dashboard financeiro com foco em tomada de decisao rapida.
Blocos obrigatorios:

- KPIs principais: saldo atual, renda total, gastos total, parcelas pendentes
- insights estrategicos: taxa de poupanca, categoria dominante, variacao de renda vs mes anterior, gasto medio diario
- area de graficos: tendencia renda x gastos (6 meses), gastos por categoria, gastos por forma de pagamento
- tabela resumo por categoria
  Entregue:
- layout desktop/mobile
- hierarquia clara do que e mais importante
- regras de destaque (positivo x negativo)
- estados: loading, vazio, erro

### Prompt 2.2 - Variantes de KPI card

Crie 4 variantes de card KPI para contexto financeiro:

- positivo
- alerta
- negativo
- neutro
  Cada variante deve incluir icone, label, valor, descricao curta e comportamento hover/focus.

---

## LOTE 3 - Pagina de Gastos polida

### Prompt 3.1 - Gastos (listagem + filtros)

Crie tela de gestao de gastos com alta densidade de informacao e leitura rapida.
Blocos:

- header com CTA Novo Gasto
- cards de resumo do periodo (gastos, renda, saldo)
- cards de contexto da consulta (qtd exibida, valor exibido, ticket medio, pendencias)
- painel de filtros (busca, status, categoria, modalidade, pagamento, periodo)
- tabela com colunas: descricao, data, categoria, pagamento, status, valor, acoes
- paginacao
  Entregue:
- UX de filtros muito clara
- chips de filtros ativos
- estados de linha/acao (hover/focus)
- estados: loading, vazio, erro

### Prompt 3.2 - Dialog de criar/editar gasto

Crie modal de formulario para gasto com suporte a:

- tipo pagamento a vista/parcelado
- categoria
- forma de pagamento
- status
- observacoes
  Entregue:
- validacoes visuais
- mensagens de erro por campo
- CTA primaria e secundaria

---

## LOTE 4 - Pagina de Renda polida

### Prompt 4.1 - Renda (listagem + filtros)

Crie tela de renda alinhada ao mesmo padrao da tela de gastos.
Blocos:

- header com CTA Nova Renda
- cards de resumo do periodo
- cards de contexto da consulta (qtd exibida, valor exibido, media por lancamento, recorrentes)
- filtros por tipo, busca e periodo
- tabela com colunas: descricao, origem, tipo, recorrencia, mes ref, recebimento, valor, acoes
- paginacao
  Entregue:
- consistencia visual com Gastos
- linguagem de badges para tipo/recorrencia
- estados: loading, vazio, erro

### Prompt 4.2 - Dialog de criar/editar renda

Crie modal de renda com campos: descricao, valor, tipo, origem, data recebimento, recorrencia e frequencia.
Inclua variacao de UX para renda recorrente (campos condicionais).

---

## LOTE 5 - Pagina de Cartoes

### Prompt 5.1 - Listagem de cartoes

Crie tela de cartoes com visual de cartao fisico + painel gerencial.
Blocos:

- header com CTA Novo Cartao
- cards-resumo: ativos, inativos, limite consolidado
- grid de cartoes com info principal e acoes editar/excluir
- badge de status ativo/inativo
  Entregue:
- foco em legibilidade dos dados do cartao
- variacao mobile em cards empilhados
- estados: loading, vazio, erro

### Prompt 5.2 - Modal de cartao

Crie modal para cadastrar/editar cartao com campos:

- apelido
- banco
- bandeira
- tipo
- ultimos 4 digitos
- limite
- dia fechamento
- dia vencimento
- cor do cartao
- status ativo

---

## LOTE 6 - Pagina de Assinaturas

### Prompt 6.1 - Assinaturas (gestao recorrente)

Crie tela de assinaturas com leitura gerencial e operacao rapida.
Blocos:

- header com CTA Nova Assinatura e toggle Mostrar Inativas
- cards-resumo: ativas, inativas, custo anual estimado
- grid de assinaturas com valor mensal, dia cobranca, forma de pagamento, categoria e status
- acoes: editar, cancelar, reativar
  Entregue:
- destaque para custo total mensal/anual
- estado claro para assinatura cancelada
- estados: loading, vazio, erro

### Prompt 6.2 - Dialogs de confirmacao

Crie dois dialogs de confirmacao:

- cancelar assinatura
- reativar assinatura
  Com copy clara de impacto da acao, botao destrutivo e alternativa segura.

---

## LOTE 7 - Perfil e configuracoes

### Prompt 7.1 - Perfil do usuario

Crie tela de perfil com secoes:

- dados pessoais
- seguranca (troca de senha)
- preferencias de exibicao
- notificacoes
  Inclua CTA salvar alteracoes e feedback de sucesso/erro.

### Prompt 7.2 - Preferencias financeiras

Crie subsecao de preferencias com:

- moeda
- formato de data
- dia de fechamento de mes financeiro
- metas de poupanca

---

## LOTE 8 - Design system e componentes transversais

### Prompt 8.1 - Biblioteca visual

Crie especificacao de design system para o produto contendo:

- cores semanticas
- tipografia
- espacos
- elevacao
- bordas
- blur
- estados de foco
- comportamento de hover/active/disabled

### Prompt 8.2 - Estados padronizados

Crie padrao unico para estados de tela:

- loading
- empty
- error
- sucesso
  Com guidelines de copy curta e acao recomendada.

### Prompt 8.3 - Data table financeira

Crie componente de tabela financeira reutilizavel com:

- cabecalho fixo
- ordenacao visual
- estado de linha focada
- colunas numericas com alinhamento tabular
- menu de acoes por linha

---

## 7) Prompt mestre detalhado (copiar e colar no Stitch)

Use este prompt para remover ambiguidades sobre quantidade de telas, nomes e componentes obrigatorios:

Voce e um product designer senior. Quero gerar exatamente [N] telas para a plataforma Gerenciar Gastos.

Contexto do produto:

- App financeiro pessoal (renda, gastos, cartoes, assinaturas, dashboard)
- Visual dark-first azul/preto com glass sutil
- Prioridade de UX: tomada de decisao rapida, leitura objetiva e consistencia

Escopo fechado deste pedido:

- Quantidade de telas a gerar: [N]
- Telas obrigatorias (na ordem):

1. [Tela 1 - nome exato]
2. [Tela 2 - nome exato]
3. [Tela 3 - nome exato]

Componentes obrigatorios por tela:

- [Tela 1]

1. [Componente 1]
2. [Componente 2]
3. [Componente 3]

- [Tela 2]

1. [Componente 1]
2. [Componente 2]
3. [Componente 3]

- [Tela 3]

1. [Componente 1]
2. [Componente 2]
3. [Componente 3]

Requisitos de saida (obrigatorios):

1. Entregar as [N] telas completas em desktop e mobile
2. Para cada tela, incluir estados: default, loading, empty, error
3. Definir hierarquia visual e prioridade da informacao
4. Definir comportamento de hover, focus e active para componentes interativos
5. Definir microcopy curta e orientada a acao
6. Reaproveitar componentes para manter consistencia (cards, filtros, tabela, modal, badges)
7. Nao gerar codigo, apenas especificacao visual high-fidelity

Formato de resposta obrigatorio:

1. Confirmacao da quantidade de telas
2. Lista final das telas geradas
3. Especificacao tela a tela (componentes + hierarquia + estados)
4. Checklist de consistencia entre telas

---

## 8) Prompt pronto por lote (super especifico)

### Lote 1 - Fundacao UX (3 telas)

Gere exatamente 3 telas: Shell autenticado, Login e Cadastro.

Componentes por tela:

- Shell autenticado

1. Sidebar com navegacao e item ativo
2. Topbar com titulo, descricao e area de acoes
3. Grid de conteudo responsivo

- Login

1. Card de autenticacao com campos email/senha
2. Acoes lembrar-me e recuperar senha
3. CTA primario entrar e CTA secundario cadastro

- Cadastro

1. Formulario nome/email/senha/confirmar senha
2. Checkbox de aceite de termos
3. CTA criar conta e feedback de sucesso

### Lote 2 - Dashboard (2 telas)

Gere exatamente 2 telas: Dashboard executivo e Variantes de KPI.

Componentes por tela:

- Dashboard executivo

1. Cards KPI (saldo, renda, gastos, parcelas pendentes)
2. Cards de insight (taxa poupanca, categoria dominante, variacao renda, gasto medio diario)
3. Bloco de graficos (renda vs gastos, categoria, forma pagamento)
4. Tabela de detalhamento por categoria

- Variantes de KPI

1. Card positivo
2. Card alerta
3. Card negativo
4. Card neutro

### Lote 3 - Gastos (2 telas)

Gere exatamente 2 telas: Listagem de Gastos e Modal de Gasto.

Componentes por tela:

- Listagem de Gastos

1. Header com CTA novo gasto
2. Cards resumo do periodo
3. Cards contexto da consulta (qtd, valor, ticket medio, pendencias)
4. Painel de filtros com chips ativos
5. Tabela com acoes por linha
6. Paginacao

- Modal de Gasto

1. Campos principais de gasto
2. Bloco condicional para parcelamento
3. Acoes salvar/cancelar com validacao visual

### Lote 4 - Renda (2 telas)

Gere exatamente 2 telas: Listagem de Renda e Modal de Renda.

Componentes por tela:

- Listagem de Renda

1. Header com CTA nova renda
2. Cards resumo do periodo
3. Cards contexto da consulta (qtd, valor, media, recorrentes)
4. Filtros por tipo/busca/periodo
5. Tabela com badges de tipo e recorrencia
6. Paginacao

- Modal de Renda

1. Campos principais da renda
2. Bloco de recorrencia e frequencia
3. CTA salvar/cancelar com mensagens de erro por campo

### Lote 5 - Cartoes (2 telas)

Gere exatamente 2 telas: Listagem de Cartoes e Modal de Cartao.

Componentes por tela:

- Listagem de Cartoes

1. Header com CTA novo cartao
2. Cards resumo (ativos, inativos, limite consolidado)
3. Grid de cartoes com estado ativo/inativo
4. Acoes editar/excluir

- Modal de Cartao

1. Dados do cartao (apelido, banco, bandeira, tipo)
2. Dados financeiros (limite, fechamento, vencimento)
3. Cor/status e CTA salvar

### Lote 6 - Assinaturas (2 telas)

Gere exatamente 2 telas: Listagem de Assinaturas e Dialogs de Confirmacao.

Componentes por tela:

- Listagem de Assinaturas

1. Header com CTA nova assinatura e toggle mostrar inativas
2. Cards resumo (ativas, inativas, custo anual)
3. Grid de assinaturas com status e detalhes
4. Acoes editar/cancelar/reativar

- Dialogs de Confirmacao

1. Dialog cancelar assinatura
2. Dialog reativar assinatura
3. CTA destrutivo e CTA seguro

### Lote 7 - Perfil (2 telas)

Gere exatamente 2 telas: Perfil e Preferencias Financeiras.

Componentes por tela:

- Perfil

1. Dados pessoais
2. Seguranca (troca senha)
3. Preferencias de exibicao
4. Notificacoes
5. CTA salvar

- Preferencias Financeiras

1. Moeda
2. Formato de data
3. Fechamento do mes financeiro
4. Meta de poupanca

### Lote 8 - Design System (3 telas)

Gere exatamente 3 telas: Biblioteca Visual, Estados Padronizados e Data Table Financeira.

Componentes por tela:

- Biblioteca Visual

1. Cores semanticas
2. Tipografia e espacamento
3. Elevacao, bordas, blur
4. Estados interativos

- Estados Padronizados

1. Loading
2. Empty
3. Error
4. Sucesso

- Data Table Financeira

1. Cabecalho fixo
2. Ordenacao visual
3. Estado de foco por linha
4. Colunas numericas tabulares
5. Menu de acoes por linha
