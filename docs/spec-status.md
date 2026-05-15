# Spec: Status de Gastos

## Regras de criação (auto-set no backend)

| `forma_pagamento`  | `status` inicial |
|--------------------|-----------------|
| `cartao_credito`   | `pendente`      |
| `dinheiro`         | `pago`          |
| `pix`              | `pago`          |
| `cartao_debito`    | `pago`          |
| `transferencia`    | `pago`          |
| `outro`            | `pago`          |

A regra é aplicada no `createGasto`. O `updateGasto` não sobrescreve — o usuário pode ajustar livremente após criação.

## Status possíveis (enum `status_gasto_enum`)

| Valor       | Significado                              |
|-------------|------------------------------------------|
| `pendente`  | Aguardando pagamento / fatura em aberto  |
| `pago`      | Quitado                                  |
| `cancelado` | Cancelado ou estornado                   |

## Fatura de crédito

**Período:** `(dia_fechamento anterior + 1 dia)` até `dia_fechamento` do mês de referência.

Exemplo: cartão com `dia_fechamento = 5`, fatura **Maio/2026**:
- Início: `06/04/2026`
- Fim: `05/05/2026`

**Itens que compõem a fatura:**
1. Gastos `tipo_pagamento = 'a_vista'` cujo `data_gasto` cai no período
2. Parcelas (`tabela parcelas`) cujo `data_vencimento` cai no período

**Pagar Fatura:** marca todos os itens `pendente` do período como `pago`.
- Gastos à vista: `UPDATE gastos SET status = 'pago'`
- Parcelas: `UPDATE parcelas SET status = 'pago', data_pagamento = NOW()`

## Endpoints

| Método | URL                                    | Ação                              |
|--------|----------------------------------------|-----------------------------------|
| GET    | `/cartoes/:id/faturas`                 | Lista meses com itens             |
| GET    | `/cartoes/:id/faturas/:mes`            | Detalhe da fatura (`:mes` YYYY-MM)|
| POST   | `/cartoes/:id/faturas/:mes/pagar`      | Marca todos pendentes como pago   |
