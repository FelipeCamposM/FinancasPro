// Checagem das regras de conversão Pluggy → Open Finance.
// Roda sem banco e sem rede: npm run check:openfinance
import assert from "assert";
import {
  decidirDestino,
  normalizar,
  dadosDoCartao,
  bandeiraDeCredito,
  competenciaDe,
  competenciaValida,
  somarMeses,
  corrigirParcelasSemFatura,
  ehEncargo,
  CATEGORIAS_IGNORADAS,
} from "./openfinance-regras";
import { PluggyAccount, PluggyTransaction } from "./pluggy-api";

const tx = (p: Partial<PluggyTransaction>): PluggyTransaction => ({
  id: "3f1c2b8e-0000-4000-8000-000000000001",
  description: "COMPRA",
  descriptionRaw: null,
  amount: -10,
  date: "2026-09-19T19:36:21.000Z",
  category: null,
  status: "POSTED",
  type: "DEBIT",
  accountId: "acc",
  merchant: null,
  operationType: "PAGAMENTO",
  creditCardMetadata: null,
  ...p,
});

const conta = (p: Partial<PluggyAccount>): PluggyAccount => ({
  id: "acc",
  type: "BANK",
  subtype: "CHECKING_ACCOUNT",
  name: "Banco Santander",
  marketingName: null,
  number: "00001053327-4",
  balance: 15.19,
  currencyCode: "BRL",
  creditData: null,
  ...p,
});

// ── destino ──────────────────────────────────────────────────────────────────

// Saída vira gasto direto; entrada espera o usuário classificar.
assert.strictEqual(decidirDestino(tx({ type: "DEBIT" })), "gasto");
assert.strictEqual(decidirDestino(tx({ type: "CREDIT" })), "a_classificar");

// Fatura e transferência entre contas próprias contariam o gasto duas vezes.
assert.strictEqual(
  decidirDestino(tx({ category: "Credit card payment" })),
  "ignorado",
);
assert.strictEqual(
  decidirDestino(tx({ description: "PAGAMENTO FATURA CARTAO" })),
  "ignorado",
);
// Ignorar vence até para entrada, senão estorno de fatura viraria renda.
assert.strictEqual(
  decidirDestino(tx({ type: "CREDIT", category: "Credit card payment" })),
  "ignorado",
);
assert.ok(CATEGORIAS_IGNORADAS.has("Credit card payment"));

// ── normalização ─────────────────────────────────────────────────────────────

// O sinal do amount é invertido entre conta e cartão: o valor sai positivo
// nos dois casos e quem define entrada/saída é o `tipo`.
assert.strictEqual(normalizar(tx({ amount: -86.05 })).valor, 86.05);
assert.strictEqual(normalizar(tx({ amount: 9.5 })).valor, 9.5);
assert.strictEqual(normalizar(tx({ type: "DEBIT" })).tipo, "debito");
assert.strictEqual(normalizar(tx({ type: "CREDIT" })).tipo, "credito");

assert.strictEqual(normalizar(tx({ status: "PENDING" })).status, "pendente");
assert.strictEqual(normalizar(tx({ status: "POSTED" })).status, "confirmada");

// Data em ISO vira DATE sem fuso.
assert.strictEqual(normalizar(tx({})).data, "2026-09-19");

// Descrição longa é truncada no limite da coluna.
assert.strictEqual(
  normalizar(tx({ description: "x".repeat(300) })).descricao.length,
  255,
);

// businessName é mais legível que name quando os dois vêm.
assert.strictEqual(
  normalizar(tx({ merchant: { name: "openai", businessName: "Open AI" } }))
    .merchantNome,
  "Open AI",
);
assert.strictEqual(normalizar(tx({ merchant: null })).merchantNome, null);

// ── cartão ───────────────────────────────────────────────────────────────────

const cartao = conta({
  type: "CREDIT",
  subtype: "CREDIT_CARD",
  name: "SANTANDER SX VISA             ",
  number: "2646",
  balance: 3194.77,
  creditData: {
    brand: "VISA",
    creditLimit: 10160,
    availableCreditLimit: 6965.23,
    balanceDueDate: "2026-09-10",
    balanceCloseDate: null,
  },
});

const d = dadosDoCartao(cartao);
// O nome vem da Pluggy com espaços à direita.
assert.strictEqual(d.nome, "SANTANDER SX VISA");
assert.strictEqual(d.bandeira, "visa");
assert.strictEqual(d.ultimos4, "2646");
assert.strictEqual(d.limite, 10160);
assert.strictEqual(d.limiteUsado, 3194.77);
assert.strictEqual(d.diaVencimento, 10);
// Sem balanceCloseDate o dia de fechamento fica nulo, não zero.
assert.strictEqual(d.diaFechamento, null);

// Bandeira desconhecida ou ausente cai em 'outro', que é valor válido do enum.
assert.strictEqual(bandeiraDeCredito(conta({ creditData: null })), "outro");
assert.strictEqual(
  bandeiraDeCredito(
    conta({
      creditData: {
        brand: "BANDEIRA NOVA",
        creditLimit: null,
        availableCreditLimit: null,
        balanceDueDate: null,
        balanceCloseDate: null,
      },
    }),
  ),
  "outro",
);

// ── competência da fatura ────────────────────────────────────────────────────

// A competência manda: compra de 28/08 que cai na fatura de setembro conta
// como setembro, não agosto.
assert.strictEqual(
  competenciaDe(
    tx({
      date: "2026-08-28T12:00:00.000Z",
      creditCardMetadata: { billForecastDate: "2026-09" },
    }),
  ),
  "2026-09-01",
);

// Sem billForecastDate (conta corrente) cai no mês da data.
assert.strictEqual(competenciaDe(tx({ creditCardMetadata: null })), "2026-09-01");
assert.strictEqual(
  competenciaDe(tx({ date: "2026-03-05T00:00:00.000Z", creditCardMetadata: null })),
  "2026-03-01",
);

// A Pluggy já devolveu '0001-01' como competência: ano inválido cai na data.
assert.strictEqual(
  competenciaDe(
    tx({
      date: "2026-08-14T00:00:00.000Z",
      creditCardMetadata: { billForecastDate: "0001-01" },
    }),
  ),
  "2026-08-01",
);
assert.strictEqual(
  competenciaDe(
    tx({ date: "2026-08-14T00:00:00.000Z", creditCardMetadata: { billForecastDate: "lixo" } }),
  ),
  "2026-08-01",
);

// ── encargos ─────────────────────────────────────────────────────────────────

// IOF sai do valor da fatura exibida, mas continua sendo gasto.
assert.ok(ehEncargo("IOF DESPESA NO EXTERIOR"));
assert.ok(ehEncargo("JUROS ROTATIVO"));
assert.ok(ehEncargo("ANUIDADE DIFERENCIADA"));
assert.ok(!ehEncargo("ButecoDoAllan"));
assert.ok(!ehEncargo("POSTO OURO NEGRO"));
// "TARIFAS" no plural não deve escapar da regra por causa do .
assert.ok(ehEncargo("TARIFA MENSAL PACOTE"));

assert.strictEqual(normalizar(tx({ description: "IOF DESPESA" })).encargo, true);
assert.strictEqual(normalizar(tx({ description: "MERCADO" })).encargo, false);

// -- parcelamento -------------------------------------------------------------

assert.strictEqual(somarMeses("2026-08-01", 2), "2026-10-01");
// Vira o ano corretamente.
assert.strictEqual(somarMeses("2026-11-01", 3), "2027-02-01");
assert.strictEqual(somarMeses("2026-01-01", -1), "2025-12-01");

assert.ok(competenciaValida("2026-09"));
// A Pluggy usa '0001-01' quando a fatura da parcela ainda nao existe.
assert.ok(!competenciaValida("0001-01"));
assert.ok(!competenciaValida(null));

const parcela = (
  n: number,
  bill: string | null,
  data: string,
): PluggyTransaction =>
  tx({
    id: `3f1c2b8e-0000-4000-8000-00000000000${n}`,
    description: "MP *LIDERLUBRIFIC",
    amount: 126.68,
    date: data,
    creditCardMetadata: {
      billForecastDate: bill,
      purchaseDate: "2026-08-14T17:02:22.000Z",
      installmentNumber: n,
      totalInstallments: 3,
    },
  });

// Caso real: a parcela 3/3 vem sem fatura e com a data da COMPRA, entao o
// fallback pelo mes da data a colocaria em agosto, ao lado da parcela 1/3.
const compra = [
  parcela(1, "2026-08", "2026-08-14T00:00:00.000Z"),
  parcela(2, "2026-09", "2026-09-02T00:00:00.000Z"),
  parcela(3, "0001-01", "2026-08-14T00:00:00.000Z"),
].map(normalizar);

assert.strictEqual(compra[2].competencia, "2026-08-01");
assert.strictEqual(compra[2].competenciaConfiavel, false);

assert.strictEqual(corrigirParcelasSemFatura(compra), 1);
// 3/3 pertence a outubro, uma competencia depois da 2/3.
assert.strictEqual(compra[2].competencia, "2026-10-01");
assert.strictEqual(compra[2].competenciaConfiavel, true);
// As parcelas que ja tinham fatura nao sao tocadas.
assert.strictEqual(compra[0].competencia, "2026-08-01");
assert.strictEqual(compra[1].competencia, "2026-09-01");

// A distancia e contada a partir da parcela irma, nunca do mes da compra: uma
// compra feita depois do fechamento ja cai na fatura seguinte (AIRBNB comprado
// em 30/06 tem a parcela 1/6 na fatura de julho).
const airbnb = [
  tx({
    id: "3f1c2b8e-0000-4000-8000-0000000000a1",
    description: "AIRBNB PAGAM*AIRB",
    amount: 69.64,
    date: "2026-07-01T00:00:00.000Z",
    creditCardMetadata: {
      billForecastDate: "2026-07",
      purchaseDate: "2026-06-30T00:00:00.000Z",
      installmentNumber: 1,
      totalInstallments: 6,
    },
  }),
  tx({
    id: "3f1c2b8e-0000-4000-8000-0000000000a2",
    description: "AIRBNB PAGAM*AIRB",
    amount: 69.64,
    date: "2026-06-30T00:00:00.000Z",
    creditCardMetadata: {
      billForecastDate: "0001-01",
      purchaseDate: "2026-06-30T00:00:00.000Z",
      installmentNumber: 6,
      totalInstallments: 6,
    },
  }),
].map(normalizar);

corrigirParcelasSemFatura(airbnb);
// 1/6 em julho => 6/6 em dezembro. Pelo mes da compra daria novembro.
assert.strictEqual(airbnb[1].competencia, "2026-12-01");

// Sem nenhuma parcela irma confiavel nao ha o que deduzir: mantem o palpite e
// continua marcado como nao confiavel, em vez de inventar uma competencia.
const sozinha = [parcela(3, "0001-01", "2026-08-14T00:00:00.000Z")].map(
  normalizar,
);
assert.strictEqual(corrigirParcelasSemFatura(sozinha), 0);
assert.strictEqual(sozinha[0].competenciaConfiavel, false);

// Os campos de parcelamento chegam normalizados.
assert.strictEqual(compra[0].numeroParcela, 1);
assert.strictEqual(compra[0].totalParcelas, 3);
assert.strictEqual(compra[0].purchaseDate, "2026-08-14");
assert.strictEqual(normalizar(tx({})).totalParcelas, null);

console.log("openfinance-regras: todas as checagens passaram");
