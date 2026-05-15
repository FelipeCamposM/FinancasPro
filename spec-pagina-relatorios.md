# Especificação — Página de Relatório Mensal de Gastos

## 1. Objetivo da página

A página de **Relatório Mensal de Gastos** deve permitir que o usuário entenda seu comportamento financeiro em um determinado mês.

Ela deve responder perguntas como:

```text
Quanto gastei neste mês?
Em quais categorias gastei mais?
Gastei mais ou menos que no mês anterior?
Estou dentro do meu orçamento?
Quais foram meus maiores gastos?
Como meus gastos evoluíram ao longo do mês?
Quais gastos são fixos, variáveis, essenciais ou não essenciais?
O que posso melhorar no próximo mês?
```

A página não deve ser apenas uma listagem de gastos. Ela precisa apresentar **resumo financeiro, KPIs, gráficos, tabelas, alertas e insights automáticos**.

---

## 2. Filtros principais

No topo da página, deve existir uma área de filtros para permitir que o usuário personalize a análise.

### 2.1 Mês e ano

Filtro obrigatório.

Exemplo:

```text
Maio de 2026
```

Permite selecionar o mês analisado no relatório.

---

### 2.2 Conta ou carteira

Usado quando o usuário possui mais de uma origem de dinheiro.

Exemplos:

```text
Todas as contas
Nubank
Inter
Carteira manual
Dinheiro físico
Mercado Pago
```

---

### 2.3 Cartão

Filtro útil quando o sistema possui controle de cartão de crédito.

Exemplos:

```text
Todos os cartões
Nubank Crédito
Inter Crédito
XP Crédito
```

---

### 2.4 Tipo de gasto

Permite separar os gastos por natureza.

Exemplos:

```text
Todos
Fixo
Variável
Essencial
Não essencial
Assinatura
Parcelado
Recorrente
```

---

### 2.5 Categoria

Permite analisar uma categoria específica.

Exemplos:

```text
Todas
Alimentação
Transporte
Moradia
Lazer
Saúde
Educação
Compras
Assinaturas
```

---

### 2.6 Forma de pagamento

Permite visualizar os gastos por meio de pagamento.

Exemplos:

```text
Pix
Débito
Crédito
Dinheiro
Boleto
Transferência
```

---

## 3. KPIs principais

Os KPIs devem aparecer logo abaixo dos filtros, em formato de cards.

---

### 3.1 Total gasto no mês

Mostra a soma de todos os gastos no mês selecionado.

Exemplo:

```text
Total gasto
R$ 3.280,45
```

Também pode apresentar comparação com o mês anterior:

```text
+12% em relação ao mês anterior
```

#### Fórmula

```text
total_gasto = soma(valor_gasto)
```

---

### 3.2 Total de receitas no mês

Mostra a soma de todas as receitas do mês.

Exemplo:

```text
Receitas
R$ 5.000,00
```

#### Fórmula

```text
total_receitas = soma(valor_receita)
```

---

### 3.3 Saldo do mês

Mostra o resultado financeiro do mês.

Exemplo:

```text
Saldo
R$ 1.719,55
```

#### Fórmula

```text
saldo = total_receitas - total_gasto
```

---

### 3.4 Percentual da renda comprometida

Mostra quanto da renda foi consumido pelos gastos.

Exemplo:

```text
65,6% da renda comprometida
```

#### Fórmula

```text
percentual_comprometido = total_gasto / total_receitas * 100
```

---

### 3.5 Média diária de gastos

Mostra quanto o usuário está gastando por dia.

Exemplo:

```text
Média diária
R$ 109,35
```

#### Fórmula para mês fechado

```text
media_diaria = total_gasto / total_dias_do_mes
```

#### Fórmula para mês em andamento

```text
media_diaria = total_gasto / dias_passados_no_mes
```

---

### 3.6 Projeção de gasto até o fim do mês

Mostra uma estimativa de quanto o usuário deve gastar até o fim do mês, caso mantenha o mesmo ritmo.

Exemplo:

```text
Projeção para o mês
R$ 4.120,00
```

#### Fórmula

```text
projecao_mensal = media_diaria * total_dias_do_mes
```

---

### 3.7 Maior categoria de gasto

Mostra a categoria com maior valor gasto no mês.

Exemplo:

```text
Maior categoria
Alimentação — R$ 920,00
```

Também pode mostrar a porcentagem em relação ao total:

```text
28% dos gastos do mês
```

---

### 3.8 Maior gasto individual

Mostra a maior despesa registrada no mês.

Exemplo:

```text
Maior gasto
Supermercado — R$ 486,90
```

---

### 3.9 Quantidade de transações

Mostra quantos gastos foram registrados no mês.

Exemplo:

```text
Transações
84 gastos registrados
```

---

### 3.10 Ticket médio por gasto

Mostra o valor médio de cada despesa.

Exemplo:

```text
Ticket médio
R$ 39,05
```

#### Fórmula

```text
ticket_medio = total_gasto / quantidade_transacoes
```

---

## 4. KPIs secundários

Além dos KPIs principais, a página pode exibir indicadores complementares.

---

### 4.1 Gastos fixos

Mostra a soma dos gastos previsíveis ou recorrentes.

Exemplo:

```text
Gastos fixos
R$ 1.450,00
```

Exemplos de gastos fixos:

```text
Aluguel
Internet
Academia
Assinaturas
Plano de celular
Seguro
```

---

### 4.2 Gastos variáveis

Mostra a soma dos gastos que mudam mês a mês.

Exemplo:

```text
Gastos variáveis
R$ 1.830,45
```

Exemplos de gastos variáveis:

```text
Mercado
Restaurante
Combustível
Lazer
Compras
Farmácia
```

---

### 4.3 Gastos essenciais

Mostra quanto foi gasto com necessidades.

Exemplo:

```text
Essenciais
R$ 2.100,00
```

Exemplos:

```text
Moradia
Alimentação básica
Transporte
Saúde
Educação
Contas
```

---

### 4.4 Gastos não essenciais

Mostra quanto foi gasto com itens opcionais ou reduzíveis.

Exemplo:

```text
Não essenciais
R$ 1.180,45
```

Exemplos:

```text
Delivery
Streaming
Jogos
Compras por impulso
Lazer
Restaurantes
```

---

### 4.5 Gastos recorrentes

Mostra a soma dos gastos que se repetem mensalmente.

Exemplo:

```text
Recorrentes
R$ 420,00
```

Exemplos:

```text
Netflix
Spotify
Google One
Academia
iCloud
Cursos
```

---

### 4.6 Gastos parcelados

Mostra quanto do mês está comprometido com parcelas.

Exemplo:

```text
Parcelados
R$ 680,00
```

Indicadores úteis:

```text
Total de parcelas pagas no mês
Parcelas futuras comprometidas
Quantidade de compras parceladas ativas
```

---

## 5. Gráficos recomendados

Os gráficos devem responder perguntas específicas. Eles não devem ser usados apenas por estética.

---

## 5.1 Gráfico de gastos por categoria

### Tipo recomendado

```text
Bar chart horizontal
ou
Donut chart
```

A barra horizontal é geralmente melhor para comparar valores.

### O que mostra

Mostra quanto foi gasto em cada categoria no mês.

Exemplo:

```text
Alimentação — R$ 920,00
Transporte — R$ 480,00
Moradia — R$ 1.100,00
Lazer — R$ 350,00
Saúde — R$ 180,00
```

### Dados necessários

```text
categoria_id
nome_categoria
valor_total
percentual_do_total
quantidade_transacoes
```

### Interações úteis

Ao clicar em uma categoria:

```text
Filtrar tabela de gastos pela categoria
Mostrar detalhes daquela categoria
Mostrar comparação com mês anterior
```

---

## 5.2 Gráfico de evolução diária dos gastos

### Tipo recomendado

```text
Line chart
ou
Area chart
```

### O que mostra

Mostra quanto o usuário gastou em cada dia do mês.

Exemplo:

```text
01/05 — R$ 80,00
02/05 — R$ 120,00
03/05 — R$ 0,00
04/05 — R$ 350,00
```

### Por que é importante

Ajuda a identificar picos de gasto.

Exemplo:

```text
Dia 10 teve um pico de R$ 680,00 por causa de compras no cartão.
```

### Dados necessários

```text
data
valor_total_do_dia
quantidade_transacoes
```

### Variação recomendada

Adicionar duas linhas no gráfico:

```text
Gasto diário
Média diária ideal
```

Exemplo:

```text
Meta mensal: R$ 3.000
Mês com 30 dias
Média ideal: R$ 100/dia
```

---

## 5.3 Gráfico de gasto acumulado no mês

### Tipo recomendado

```text
Line chart
```

### O que mostra

Mostra o crescimento acumulado dos gastos ao longo do mês.

Exemplo:

```text
Dia 1: R$ 80
Dia 2: R$ 200
Dia 3: R$ 200
Dia 4: R$ 550
```

### Por que é útil

O gasto diário mostra picos.

O gasto acumulado mostra se o usuário está caminhando para estourar o orçamento.

### Linhas úteis

```text
Gasto acumulado real
Orçamento acumulado esperado
```

Exemplo:

```text
No dia 15, o esperado era ter gasto até R$ 1.500.
O usuário já gastou R$ 2.100.
```

---

## 5.4 Gráfico de comparação com mês anterior

### Tipo recomendado

```text
Bar chart
```

### O que mostra

Compara os gastos por categoria entre o mês atual e o mês anterior.

Exemplo:

| Categoria | Abril | Maio |
|---|---:|---:|
| Alimentação | R$ 760 | R$ 920 |
| Transporte | R$ 520 | R$ 480 |
| Lazer | R$ 300 | R$ 350 |

### Dados necessários

```text
categoria
valor_mes_atual
valor_mes_anterior
diferenca_absoluta
diferenca_percentual
```

### Insight gerado

```text
Alimentação aumentou R$ 160 em relação ao mês anterior.
```

---

## 5.5 Gráfico de forma de pagamento

### Tipo recomendado

```text
Donut chart
ou
Bar chart
```

### O que mostra

Distribuição dos gastos por forma de pagamento.

Exemplo:

```text
Crédito — R$ 1.800
Pix — R$ 900
Débito — R$ 400
Dinheiro — R$ 180
```

### Por que é útil

Ajuda a entender se o usuário depende muito do cartão de crédito.

---

## 5.6 Gráfico de gastos fixos vs variáveis

### Tipo recomendado

```text
Donut chart
```

### O que mostra

Compara gastos fixos e variáveis.

Exemplo:

```text
Fixos: R$ 1.450
Variáveis: R$ 1.830
```

### Por que é útil

Mostra se o usuário tem pouco espaço para cortar gastos ou se o problema está nos gastos variáveis.

---

## 5.7 Gráfico de essenciais vs não essenciais

### Tipo recomendado

```text
Donut chart
ou
Barra empilhada
```

### O que mostra

Compara gastos necessários com gastos opcionais.

Exemplo:

```text
Essenciais: R$ 2.100
Não essenciais: R$ 1.180
```

### Por que é útil

Ajuda a gerar recomendações de redução de gastos.

---

## 5.8 Ranking de maiores gastos

### Tipo recomendado

```text
Tabela
ou
Lista ordenada
```

Exemplo:

```text
1. Aluguel — R$ 1.200
2. Supermercado — R$ 486,90
3. Parcela celular — R$ 320,00
4. Restaurante — R$ 210,00
5. Combustível — R$ 180,00
```

---

# 6. Tabelas da página

As tabelas são importantes para permitir que o usuário investigue os dados com mais profundidade.

---

## 6.1 Tabela de resumo por categoria

Essa é uma das tabelas mais importantes da página.

### Colunas recomendadas

| Coluna | Explicação |
|---|---|
| Categoria | Nome da categoria |
| Total gasto | Soma dos gastos da categoria |
| % do total | Quanto essa categoria representa do total mensal |
| Nº de transações | Quantas compras/gastos ocorreram nessa categoria |
| Ticket médio | Média por transação |
| Maior gasto | Maior despesa dentro da categoria |
| Comparação mês anterior | Aumento ou redução em relação ao mês anterior |
| Orçamento | Limite definido para a categoria |
| Status | Dentro do limite, atenção ou estourado |

### Exemplo

| Categoria | Total | % | Transações | Média | Mês anterior | Orçamento | Status |
|---|---:|---:|---:|---:|---:|---:|---|
| Alimentação | R$ 920 | 28% | 26 | R$ 35,38 | +12% | R$ 800 | Estourado |
| Transporte | R$ 480 | 14% | 14 | R$ 34,28 | -8% | R$ 600 | OK |
| Lazer | R$ 350 | 10% | 9 | R$ 38,88 | +5% | R$ 300 | Atenção |

---

## 6.2 Tabela de gastos detalhados

Tabela completa com todas as transações do mês.

### Colunas recomendadas

| Coluna | Explicação |
|---|---|
| Data | Data do gasto |
| Descrição | Nome ou descrição da despesa |
| Categoria | Categoria vinculada |
| Subcategoria | Classificação mais específica |
| Valor | Valor do gasto |
| Forma de pagamento | Pix, crédito, débito, dinheiro etc. |
| Conta/Carteira | De onde saiu o dinheiro |
| Cartão | Cartão usado, se houver |
| Tipo | Fixo, variável, recorrente ou parcelado |
| Parcela | Exemplo: 2/6 |
| Essencialidade | Essencial ou não essencial |
| Observação | Campo livre |
| Tags | Exemplo: viagem, trabalho, faculdade |
| Status | Pago, pendente ou previsto |
| Ações | Ver, editar ou excluir |

### Exemplo

| Data | Descrição | Categoria | Valor | Pagamento | Tipo | Parcela | Status |
|---|---|---|---:|---|---|---|---|
| 03/05 | Supermercado | Alimentação | R$ 486,90 | Crédito | Variável | - | Pago |
| 05/05 | Netflix | Assinaturas | R$ 39,90 | Crédito | Recorrente | - | Pago |
| 08/05 | Celular | Compras | R$ 320,00 | Crédito | Parcelado | 2/10 | Pago |

---

## 6.3 Tabela de gastos recorrentes

Usada para assinaturas, mensalidades e contas fixas.

### Colunas recomendadas

| Coluna | Explicação |
|---|---|
| Nome | Nome do gasto recorrente |
| Categoria | Categoria associada |
| Valor | Valor mensal |
| Dia de cobrança | Dia esperado da cobrança |
| Forma de pagamento | Crédito, Pix, boleto etc. |
| Status no mês | Pago, pendente ou atrasado |
| Próxima cobrança | Data prevista |
| Ativo | Sim ou não |

### Exemplo

| Nome | Categoria | Valor | Dia | Pagamento | Status |
|---|---|---:|---:|---|---|
| Spotify | Assinaturas | R$ 21,90 | 10 | Crédito | Pago |
| Internet | Moradia | R$ 99,90 | 15 | Pix | Pendente |
| Academia | Saúde | R$ 120,00 | 5 | Crédito | Pago |

---

## 6.4 Tabela de parcelamentos

Essencial para sistemas que controlam cartão de crédito.

### Colunas recomendadas

| Coluna | Explicação |
|---|---|
| Compra | Nome da compra |
| Categoria | Categoria da despesa |
| Valor total | Valor original da compra |
| Valor da parcela | Valor mensal |
| Parcela atual | Exemplo: 3/10 |
| Parcelas restantes | Quantas ainda faltam |
| Cartão | Cartão usado |
| Data da compra | Quando foi feita |
| Fatura atual | Se entra no mês atual |
| Total futuro comprometido | Quanto ainda falta pagar |

### Exemplo

| Compra | Valor total | Parcela | Atual | Restantes | Cartão |
|---|---:|---:|---|---:|---|
| Celular | R$ 3.200 | R$ 320 | 2/10 | 8 | Nubank |
| Curso | R$ 600 | R$ 100 | 4/6 | 2 | Inter |

---

## 6.5 Tabela de orçamento por categoria

Usada quando o sistema possui metas ou limites mensais por categoria.

### Colunas recomendadas

| Coluna | Explicação |
|---|---|
| Categoria | Categoria orçada |
| Orçamento mensal | Limite definido |
| Gasto atual | Quanto já foi gasto |
| Restante | Quanto ainda pode gastar |
| Uso % | Percentual consumido |
| Projeção | Estimativa até o fim do mês |
| Status | OK, atenção ou estourado |

### Exemplo

| Categoria | Orçamento | Gasto | Restante | Uso | Status |
|---|---:|---:|---:|---:|---|
| Alimentação | R$ 800 | R$ 920 | -R$ 120 | 115% | Estourado |
| Transporte | R$ 600 | R$ 480 | R$ 120 | 80% | Atenção |
| Lazer | R$ 300 | R$ 180 | R$ 120 | 60% | OK |

---

# 7. Insights automáticos

A página pode gerar mensagens automáticas com base nos dados do mês.

## Exemplos de insights

```text
Você gastou 12% a mais do que no mês anterior.
```

```text
Alimentação foi sua maior categoria de gasto, representando 28% do total.
```

```text
Se mantiver esse ritmo, você deve fechar o mês em aproximadamente R$ 4.120,00.
```

```text
Seus gastos não essenciais representam 36% do total do mês.
```

```text
Você ultrapassou o orçamento de Alimentação em R$ 120,00.
```

```text
Seu maior gasto individual foi Supermercado, no valor de R$ 486,90.
```

---

# 8. Alertas importantes

A página pode exibir alertas ou badges para situações relevantes.

---

## 8.1 Orçamento estourado

```text
Você ultrapassou o orçamento de Alimentação em R$ 120,00.
```

---

## 8.2 Projeção acima do limite

```text
Sua projeção de gastos está 18% acima do orçamento mensal.
```

---

## 8.3 Gasto incomum

```text
Você teve um gasto 3x maior que sua média na categoria Lazer.
```

---

## 8.4 Muitas pequenas compras

```text
Você fez 22 compras abaixo de R$ 30, totalizando R$ 410.
```

---

## 8.5 Aumento relevante em categoria

```text
Transporte aumentou 35% em relação ao mês anterior.
```

---

## 8.6 Assinaturas ou recorrências

```text
Você possui 5 gastos recorrentes ativos em Assinaturas.
```

---

# 9. Organização visual sugerida

A estrutura geral da página pode ser:

```text
Título: Relatório Mensal
Subtítulo: Acompanhe seus gastos, categorias e evolução no mês

Filtros
↓
Cards de KPIs principais
↓
Gráfico de evolução mensal + gráfico de categorias
↓
Seção de orçamento e alertas
↓
Comparação com mês anterior
↓
Tabelas detalhadas
↓
Insights automáticos
```

---

## 9.1 Layout do topo

```text
[Relatório Mensal de Gastos]                    [Exportar PDF] [Exportar CSV]

[Mês] [Conta] [Cartão] [Categoria] [Tipo] [Forma de pagamento]
```

---

## 9.2 Layout dos cards principais

```text
[Total gasto]        [Receitas]          [Saldo]
R$ 3.280,45          R$ 5.000,00         R$ 1.719,55

[% da renda]         [Média diária]      [Projeção]
65,6%                R$ 109,35           R$ 4.120,00
```

---

## 9.3 Layout dos gráficos principais

```text
[Evolução diária dos gastos]        [Gastos por categoria]
```

---

## 9.4 Layout do bloco de análise

```text
[Orçamento por categoria]           [Fixos vs Variáveis]
[Essenciais vs Não essenciais]      [Forma de pagamento]
```

---

## 9.5 Layout das tabelas

```text
[Resumo por categoria]
[Gastos detalhados]
[Recorrentes]
[Parcelamentos]
```

---

# 10. Fórmulas dos KPIs

## 10.1 Total gasto

```text
total_gasto = soma(valor_gasto)
```

---

## 10.2 Total de receitas

```text
total_receitas = soma(valor_receita)
```

---

## 10.3 Saldo do mês

```text
saldo = total_receitas - total_gasto
```

---

## 10.4 Percentual da renda comprometida

```text
percentual_comprometido = total_gasto / total_receitas * 100
```

---

## 10.5 Média diária

```text
media_diaria = total_gasto / dias_passados_no_mes
```

---

## 10.6 Projeção mensal

```text
projecao_mensal = media_diaria * total_dias_do_mes
```

---

## 10.7 Ticket médio

```text
ticket_medio = total_gasto / quantidade_transacoes
```

---

## 10.8 Percentual por categoria

```text
percentual_categoria = gasto_categoria / total_gasto * 100
```

---

## 10.9 Variação em relação ao mês anterior

```text
variacao_percentual = (valor_mes_atual - valor_mes_anterior) / valor_mes_anterior * 100
```

---

## 10.10 Restante do orçamento

```text
restante = orcamento_categoria - gasto_categoria
```

---

## 10.11 Uso do orçamento

```text
uso_orcamento = gasto_categoria / orcamento_categoria * 100
```

---

# 11. Campos necessários no banco de dados

Para que essa página funcione bem, cada gasto deve possuir uma estrutura parecida com esta:

```ts
type Expense = {
  id: string;
  userId: string;

  description: string;
  amount: number;
  date: Date;

  categoryId: string;
  subcategoryId?: string;

  accountId?: string;
  cardId?: string;

  paymentMethod: "pix" | "debit" | "credit" | "cash" | "bank_slip" | "transfer";

  expenseType: "fixed" | "variable";
  essentialType: "essential" | "non_essential";

  isRecurring: boolean;
  recurringId?: string;

  isInstallment: boolean;
  installmentId?: string;
  installmentNumber?: number;
  installmentTotal?: number;

  status: "paid" | "pending" | "scheduled";

  notes?: string;
  tags?: string[];

  createdAt: Date;
  updatedAt: Date;
};
```

---

# 12. Estrutura de categorias recomendada

A aplicação pode ter categorias principais e subcategorias.

## 12.1 Alimentação

```text
Mercado
Restaurante
Delivery
Lanches
```

## 12.2 Moradia

```text
Aluguel
Energia
Água
Internet
Condomínio
```

## 12.3 Transporte

```text
Combustível
Uber
Ônibus
Manutenção
Estacionamento
```

## 12.4 Saúde

```text
Farmácia
Consulta
Academia
Plano de saúde
```

## 12.5 Lazer

```text
Cinema
Bar
Viagem
Eventos
```

## 12.6 Compras

```text
Roupas
Eletrônicos
Casa
Presentes
```

## 12.7 Educação

```text
Faculdade
Cursos
Livros
Ferramentas
```

## 12.8 Assinaturas

```text
Streaming
Software
Armazenamento
Serviços digitais
```

---

# 13. Exportações úteis

A página deve permitir exportar os dados.

## 13.1 Exportações recomendadas

```text
PDF do relatório mensal
CSV dos gastos
Excel dos gastos
Imagem dos gráficos
```

---

## 13.2 Conteúdo recomendado para o PDF

```text
Resumo do mês
KPIs principais
Gráficos
Tabela por categoria
Principais insights
```

---

## 13.3 Conteúdo recomendado para CSV ou Excel

```text
Tabela completa de gastos
Resumo por categoria
Parcelamentos
Recorrentes
```

---

# 14. Funcionalidades extras

## 14.1 Comparação entre meses

Permitir comparar:

```text
Maio vs Abril
Maio de 2026 vs Maio de 2025
Últimos 3 meses
Últimos 6 meses
Últimos 12 meses
```

---

## 14.2 Tendência por categoria

Mostrar se uma categoria está:

```text
Subindo
Caindo
Estável
```

Exemplo:

```text
Alimentação subiu nos últimos 3 meses.
```

---

## 14.3 Metas de redução

Permitir criar metas como:

```text
Reduzir delivery em 20% no próximo mês.
```

---

## 14.4 Comentário mensal

Permitir que o usuário escreva uma observação sobre o mês.

Exemplo:

```text
Neste mês viajei, por isso os gastos com lazer e transporte aumentaram.
```

Esse comentário ajuda quando o usuário consultar relatórios antigos.

---

# 15. Status visuais recomendados

## 15.1 Status de orçamento

```text
0% a 70% usado: OK
71% a 90% usado: Atenção
91% a 100% usado: Quase no limite
Acima de 100%: Estourado
```

---

## 15.2 Status de variação mensal

```text
Aumento leve: até 10%
Aumento moderado: 10% a 25%
Aumento alto: acima de 25%
Redução: valor negativo
```

---

# 16. Página ideal resumida

A versão mais completa da página deve conter:

```text
1. Filtros
2. Cards de KPIs
3. Gráfico de evolução diária
4. Gráfico de gasto acumulado
5. Gráfico por categoria
6. Gráfico fixo vs variável
7. Gráfico essencial vs não essencial
8. Comparação com mês anterior
9. Tabela resumo por categoria
10. Tabela completa de transações
11. Tabela de recorrentes
12. Tabela de parcelamentos
13. Alertas e insights automáticos
14. Exportação PDF/CSV
```

---

# 17. Priorização por versão

## 17.1 Versão 1 — essencial

```text
Filtros por mês
Total gasto
Receitas
Saldo
% da renda comprometida
Gráfico por categoria
Gráfico de evolução diária
Tabela de gastos detalhados
Tabela resumo por categoria
```

---

## 17.2 Versão 2 — mais inteligente

```text
Comparação com mês anterior
Projeção mensal
Orçamento por categoria
Alertas
Gastos fixos vs variáveis
Essenciais vs não essenciais
```

---

## 17.3 Versão 3 — avançada

```text
Parcelamentos
Recorrentes
Insights automáticos
Exportação PDF
Análise de tendência
Metas de redução
Comparação anual
```

---

# 18. Hierarquia final recomendada

```text
Relatório Mensal
├── Filtros
├── Resumo financeiro
│   ├── Total gasto
│   ├── Receita
│   ├── Saldo
│   ├── % da renda comprometida
│   ├── Média diária
│   └── Projeção mensal
├── Análise visual
│   ├── Evolução diária
│   ├── Gasto acumulado
│   ├── Gastos por categoria
│   └── Forma de pagamento
├── Controle
│   ├── Orçamento por categoria
│   ├── Fixos vs variáveis
│   └── Essenciais vs não essenciais
├── Detalhamento
│   ├── Resumo por categoria
│   ├── Gastos detalhados
│   ├── Recorrentes
│   └── Parcelamentos
└── Insights
    ├── Alertas
    ├── Comparações
    └── Recomendações
```

---

# 19. Conclusão

A página de **Relatório Mensal de Gastos** deve funcionar como uma central de análise financeira mensal.

Ela deve permitir que o usuário:

```text
Entenda seus gastos
Compare com meses anteriores
Identifique categorias problemáticas
Veja se está dentro do orçamento
Analise gastos fixos, variáveis, essenciais e não essenciais
Acompanhe parcelamentos e recorrências
Receba alertas e insights automáticos
Exporte os dados do mês
```

Com essa estrutura, a página deixa de ser apenas uma lista de despesas e passa a ser uma ferramenta real de tomada de decisão financeira.
