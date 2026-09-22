// Regras puras de conversão Pluggy → Open Finance. Sem banco e sem rede, para
// poderem ser checadas isoladamente (npm run check:openfinance).

import { PluggyAccount, PluggyTransaction } from "./pluggy-api";

export type Destino = "gasto" | "renda" | "ignorado" | "a_classificar";

// Pagamento de fatura aparece como saída na conta corrente enquanto as compras
// daquela fatura já entram pelo cartão. Importar os dois contaria o mesmo gasto
// duas vezes. Transferência entre contas próprias tem o mesmo problema.
export const CATEGORIAS_IGNORADAS = new Set([
  "Credit card payment",
  "Loans and financing",
  "Same person transfer",
  "Transfer between own accounts",
]);

// "PAGAMENTO FATURA", "PAGAMENTO DE FATURA", "PAGTO FATURA" — o "de" é opcional.
const PADRAO_FATURA = /\b(pagamento|pagto|pag)\s+(de\s+)?fatura\b/i;

/**
 * Saída vira gasto automaticamente; entrada espera decisão do usuário.
 * Fatura e transferência entre contas próprias não são nem uma coisa nem outra.
 */
export const decidirDestino = (t: PluggyTransaction): Destino => {
  if (t.category && CATEGORIAS_IGNORADAS.has(t.category)) return "ignorado";
  if (PADRAO_FATURA.test(t.description)) return "ignorado";
  return t.type === "DEBIT" ? "gasto" : "a_classificar";
};

export const bandeiraDeCredito = (conta: PluggyAccount): string => {
  const brand = (conta.creditData?.brand ?? "").toUpperCase();
  const conhecidas: Record<string, string> = {
    VISA: "visa",
    MASTERCARD: "mastercard",
    ELO: "elo",
    AMEX: "amex",
    "AMERICAN EXPRESS": "amex",
    HIPERCARD: "hipercard",
    DISCOVER: "discover",
  };
  return conhecidas[brand] ?? "outro";
};

const diaDe = (iso: string | null | undefined): number | null => {
  if (!iso) return null;
  const dia = Number(iso.slice(8, 10));
  return dia >= 1 && dia <= 31 ? dia : null;
};

export const dadosDoCartao = (conta: PluggyAccount) => ({
  nome: conta.name.trim().slice(0, 150),
  bandeira: bandeiraDeCredito(conta),
  // `number` do cartão já vem com os 4 últimos dígitos
  ultimos4: conta.number ? conta.number.replace(/\D/g, "").slice(-4) || null : null,
  limite: conta.creditData?.creditLimit ?? null,
  // `balance` do cartão é o limite usado total, não a fatura aberta.
  limiteUsado: conta.balance,
  diaVencimento: diaDe(conta.creditData?.balanceDueDate),
  diaFechamento: diaDe(conta.creditData?.balanceCloseDate),
});

export type TransacaoNormalizada = {
  pluggyTransactionId: string;
  descricao: string;
  descricaoRaw: string | null;
  // Sempre positivo: o sinal do amount é invertido entre conta corrente
  // (DEBIT negativo) e cartão (DEBIT positivo). Quem manda é o `type`.
  valor: number;
  tipo: "debito" | "credito";
  data: string;
  categoriaPluggy: string | null;
  merchantNome: string | null;
  status: "pendente" | "confirmada";
  destino: Destino;
  competencia: string;
  // false quando a Pluggy não informou a fatura e o valor é um palpite pelo
  // mês da data — corrigirParcelasSemFatura() tenta resolver.
  competenciaConfiavel: boolean;
  encargo: boolean;
  purchaseDate: string | null;
  numeroParcela: number | null;
  totalParcelas: number | null;
  billId: string | null;
  operationType: string | null;
};

export const normalizar = (t: PluggyTransaction): TransacaoNormalizada => ({
  pluggyTransactionId: t.id,
  descricao: t.description.trim().slice(0, 255),
  descricaoRaw: t.descriptionRaw,
  valor: Math.abs(t.amount),
  tipo: t.type === "DEBIT" ? "debito" : "credito",
  data: t.date.slice(0, 10),
  categoriaPluggy: t.category,
  merchantNome:
    (t.merchant?.businessName || t.merchant?.name || null)?.slice(0, 150) ??
    null,
  status: t.status === "POSTED" ? "confirmada" : "pendente",
  destino: decidirDestino(t),
  competencia: competenciaDe(t),
  competenciaConfiavel: competenciaValida(
    t.creditCardMetadata?.billForecastDate,
  ),
  encargo: ehEncargo(t.description),
  purchaseDate: t.creditCardMetadata?.purchaseDate?.slice(0, 10) ?? null,
  numeroParcela: t.creditCardMetadata?.installmentNumber ?? null,
  totalParcelas: t.creditCardMetadata?.totalInstallments ?? null,
  billId: t.creditCardMetadata?.billId ?? null,
  operationType: t.operationType ?? null,
});

// IOF, juros, multa e anuidade. Entram em of_gastos normalmente, mas são
// somados à parte para que a fatura exibida bata com a do app do banco.
const PADRAO_ENCARGO =
  /\b(iof|juros|multa|mora|anuidade|encargo|tarifa|taxa\s+de\s+atraso)\b/i;

export const ehEncargo = (descricao: string): boolean =>
  PADRAO_ENCARGO.test(descricao);

/**
 * Mês ao qual o lançamento pertence, como 'YYYY-MM-01'.
 *
 * No cartão é a competência da fatura que a Pluggy informa por transação —
 * uma compra de 28/08 pode cair na fatura de setembro. Quando ela vem vazia
 * ou inválida (já apareceu '0001-01'), cai no mês da data da compra.
 */
export const competenciaValida = (bill: string | null | undefined): boolean => {
  if (!bill || !/^\d{4}-\d{2}$/.test(bill)) return false;
  const ano = Number(bill.slice(0, 4));
  return ano >= 2000 && ano <= 2999;
};

export const competenciaDe = (t: PluggyTransaction): string => {
  const bill = t.creditCardMetadata?.billForecastDate;
  if (competenciaValida(bill)) return `${bill}-01`;
  return `${t.date.slice(0, 7)}-01`;
};

/** Soma meses a uma competência 'YYYY-MM-01'. */
export const somarMeses = (competencia: string, meses: number): string => {
  const ano = Number(competencia.slice(0, 4));
  const mes = Number(competencia.slice(5, 7)) - 1 + meses;
  const d = new Date(Date.UTC(ano, mes, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
};

/**
 * Corrige a competência das parcelas cuja fatura ainda não existe.
 *
 * A Pluggy devolve billForecastDate '0001-01' para a última parcela de uma
 * compra: a fatura dela não foi gerada ainda. O fallback pelo mês da data erra,
 * porque a data de uma parcela futura é a da compra — a parcela 3/3 de uma
 * compra de agosto apareceria em agosto, ao lado da parcela 1/3.
 *
 * Calcular "mês da compra + (N-1)" também erra: uma compra feita depois do
 * fechamento já cai na fatura seguinte (AIRBNB comprado em 30/06 tem a parcela
 * 1/6 na fatura de julho). Por isso a referência é uma parcela irmã da mesma
 * compra que tenha competência válida — a distância entre parcelas é sempre de
 * um mês.
 *
 * Muda o array no lugar e devolve quantas linhas foram corrigidas.
 */
export const corrigirParcelasSemFatura = (
  linhas: TransacaoNormalizada[],
): number => {
  const chave = (l: TransacaoNormalizada) =>
    `${l.descricao}|${l.purchaseDate}|${l.totalParcelas}`;

  // Uma referência por compra: qualquer parcela com competência confiável.
  const referencia = new Map<string, { competencia: string; parcela: number }>();
  for (const l of linhas) {
    if (!l.competenciaConfiavel || !l.purchaseDate || !l.numeroParcela) continue;
    if (!referencia.has(chave(l))) {
      referencia.set(chave(l), {
        competencia: l.competencia,
        parcela: l.numeroParcela,
      });
    }
  }

  let corrigidas = 0;
  for (const l of linhas) {
    if (l.competenciaConfiavel || !l.numeroParcela) continue;
    const ref = referencia.get(chave(l));
    if (!ref) continue;
    l.competencia = somarMeses(ref.competencia, l.numeroParcela - ref.parcela);
    l.competenciaConfiavel = true;
    corrigidas++;
  }
  return corrigidas;
};
