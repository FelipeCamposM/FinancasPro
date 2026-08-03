/**
 * Conversão de planilha CSV → payloads de gasto.
 * Lógica pura (sem React) para poder ser testada isoladamente.
 */
import { parseCSV } from "./csv";

export interface Categoria {
  id: number;
  nome: string;
}
export interface Cartao {
  id: string;
  apelido: string;
  ultimos_4_digitos: string;
}

export interface GastoPayload {
  descricao: string;
  valor_total: number;
  data_gasto: string;
  categoria_id?: number;
  cartao_id?: string;
  forma_pagamento: string;
  tipo_pagamento: "a_vista" | "parcelado";
  quantidade_parcelas: number;
  observacoes?: string;
}

export type Campo =
  | "descricao"
  | "valor"
  | "data"
  | "categoria"
  | "forma"
  | "cartao"
  | "parcelas"
  | "observacoes";

export interface Linha {
  linha: number;
  bruto: Record<Campo, string>;
  payload?: GastoPayload;
  erros: string[];
  /** Marcada na revisão para virar assinatura recorrente em vez de gasto avulso. */
  assinatura?: boolean;
}

export const BRUTO_VAZIO: Record<Campo, string> = {
  descricao: "",
  valor: "",
  data: "",
  categoria: "",
  forma: "",
  cartao: "",
  parcelas: "",
  observacoes: "",
};

export const MAX_LINHAS = 500;

export const COLUNAS_MODELO = [
  "descricao",
  "valor",
  "data",
  "categoria",
  "forma_pagamento",
  "cartao",
  "parcelas",
  "observacoes",
];

// Faixa de acentos combinantes (U+0300–U+036F) — montada por código para não
// depender de caracteres invisíveis no fonte.
const DIACRITICOS = new RegExp(
  `[${String.fromCharCode(0x300)}-${String.fromCharCode(0x36f)}]`,
  "g",
);

const norm = (s: string) =>
  s.normalize("NFD").replace(DIACRITICOS, "").trim().toLowerCase();

const slug = (s: string) =>
  norm(s)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

const HEADER_MAP: Record<string, Campo> = {
  descricao: "descricao",
  descricao_gasto: "descricao",
  descricao_do_gasto: "descricao",
  titulo: "descricao",
  estabelecimento: "descricao",
  lancamento: "descricao",
  historico: "descricao",
  valor: "valor",
  valor_total: "valor",
  valor_parcela: "valor",
  valor_r: "valor",
  data: "data",
  data_gasto: "data",
  data_compra: "data",
  categoria: "categoria",
  forma_pagamento: "forma",
  forma_de_pagamento: "forma",
  forma: "forma",
  pagamento: "forma",
  meio_de_pagamento: "forma",
  cartao: "cartao",
  cartao_apelido: "cartao",
  parcelas: "parcelas",
  quantidade_parcelas: "parcelas",
  qtd_parcelas: "parcelas",
  observacoes: "observacoes",
  observacao: "observacoes",
  obs: "observacoes",
};

const FORMA_MAP: Record<string, string> = {
  dinheiro: "dinheiro",
  especie: "dinheiro",
  pix: "pix",
  transferencia: "transferencia",
  ted: "transferencia",
  doc: "transferencia",
  cartao_credito: "cartao_credito",
  cartao_de_credito: "cartao_credito",
  credito: "cartao_credito",
  cartao_debito: "cartao_debito",
  cartao_de_debito: "cartao_debito",
  debito: "cartao_debito",
  outro: "outro",
  outros: "outro",
};

/** "1.234,56" | "R$ 89,90" | "89.90" → number */
export function parseValor(raw: string): number | null {
  let t = raw.replace(/r\$/i, "").replace(/\s/g, "").trim();
  if (!t) return null;
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  const n = Number(t);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** "05/01/2026" | "2026-01-05" → "2026-01-05" (valida data real) */
export function parseData(raw: string): string | null {
  const t = raw.trim();
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
  const br = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(t);
  let a: string, m: string, d: string;
  if (iso) [, a, m, d] = iso;
  else if (br) [, d, m, a] = br;
  else return null;

  const mm = m.padStart(2, "0");
  const dd = d.padStart(2, "0");
  const dt = new Date(`${a}-${mm}-${dd}T12:00:00`);
  if (
    Number.isNaN(dt.getTime()) ||
    dt.getMonth() + 1 !== Number(mm) ||
    dt.getDate() !== Number(dd)
  ) {
    return null;
  }
  return `${a}-${mm}-${dd}`;
}

/**
 * Cria o validador de uma linha. Exposto para revalidar uma linha sozinha
 * quando o usuário edita algo na tela de revisão (ex: troca a categoria).
 */
export function criarMapeador(categorias: Categoria[], cartoes: Cartao[]) {
  const catPorNome = new Map(categorias.map((c) => [norm(c.nome), c.id]));
  const cartaoPorNome = new Map<string, string>();
  for (const c of cartoes) {
    cartaoPorNome.set(norm(c.apelido), c.id);
    if (c.ultimos_4_digitos) cartaoPorNome.set(c.ultimos_4_digitos, c.id);
  }

  return (bruto: Record<Campo, string>, numeroLinha: number): Linha => {
    const erros: string[] = [];

    const descricao = bruto.descricao;
    if (!descricao) erros.push("descrição vazia");
    else if (descricao.length > 255)
      erros.push("descrição acima de 255 caracteres");

    const valor = parseValor(bruto.valor);
    if (valor === null) erros.push(`valor inválido: "${bruto.valor}"`);

    const data = parseData(bruto.data);
    if (data === null) erros.push(`data inválida: "${bruto.data}"`);

    let categoria_id: number | undefined;
    if (bruto.categoria) {
      categoria_id = catPorNome.get(norm(bruto.categoria));
      if (!categoria_id)
        erros.push(`categoria não encontrada: "${bruto.categoria}"`);
    }

    const forma = bruto.forma ? FORMA_MAP[slug(bruto.forma)] : "dinheiro";
    if (!forma) erros.push(`forma de pagamento inválida: "${bruto.forma}"`);

    let cartao_id: string | undefined;
    if (bruto.cartao) {
      cartao_id = cartaoPorNome.get(norm(bruto.cartao));
      if (!cartao_id) erros.push(`cartão não encontrado: "${bruto.cartao}"`);
    }
    if ((forma === "cartao_credito" || forma === "cartao_debito") && !cartao_id) {
      erros.push("cartão é obrigatório para pagamento com cartão");
    }

    const parcelas = bruto.parcelas ? Number(bruto.parcelas) : 1;
    if (!Number.isInteger(parcelas) || parcelas < 1 || parcelas > 360) {
      erros.push(`parcelas inválidas: "${bruto.parcelas}"`);
    }

    if (bruto.observacoes.length > 1000) {
      erros.push("observações acima de 1000 caracteres");
    }

    return {
      linha: numeroLinha,
      bruto,
      erros,
      payload: erros.length
        ? undefined
        : {
            descricao,
            valor_total: valor!,
            data_gasto: data!,
            categoria_id,
            cartao_id,
            forma_pagamento: forma,
            tipo_pagamento: parcelas > 1 ? "parcelado" : "a_vista",
            quantidade_parcelas: parcelas,
            observacoes: bruto.observacoes || undefined,
          },
    };
  };
}

export function processarCSV(
  texto: string,
  categorias: Categoria[],
  cartoes: Cartao[],
): Linha[] {
  const linhas = parseCSV(texto);
  if (linhas.length < 2) {
    throw new Error("Sem dados — é preciso o cabeçalho e ao menos uma linha");
  }

  const cabecalho = linhas[0].map((h) => HEADER_MAP[slug(h)]);
  const faltando = (["descricao", "valor", "data"] as Campo[]).filter(
    (c) => !cabecalho.includes(c),
  );
  if (faltando.length) {
    throw new Error(
      `Coluna(s) não encontrada(s): ${faltando.join(", ")}. Cabeçalho lido: ${linhas[0]
        .map((h) => h.trim())
        .join(" | ")}`,
    );
  }

  const mapear = criarMapeador(categorias, cartoes);

  return linhas.slice(1).map((celulas, i) => {
    const bruto = { ...BRUTO_VAZIO };
    cabecalho.forEach((campo, col) => {
      if (campo) bruto[campo] = (celulas[col] ?? "").trim();
    });
    // +1 do cabeçalho, +1 porque planilha começa em 1
    return mapear(bruto, i + 2);
  });
}

/** Prompt pronto para o usuário colar em qualquer IA e gerar o CSV já no formato aceito. */
export function montarPromptIA(
  categorias: Categoria[],
  cartoes: Cartao[],
): string {
  const listaCategorias = categorias.length
    ? categorias.map((c) => `"${c.nome}"`).join(", ")
    : "(nenhuma cadastrada — deixe a coluna categoria vazia)";
  const listaCartoes = cartoes.length
    ? cartoes.map((c) => `"${c.apelido}"`).join(", ")
    : "(nenhum cadastrado — não use cartao_credito nem cartao_debito)";

  return `Você vai gerar um arquivo CSV de gastos para eu importar no meu app de finanças.

FORMATO DE SAÍDA
- Responda APENAS com o conteúdo do CSV, sem explicação, sem markdown, sem \`\`\`.
- Separador: ponto e vírgula (;)
- Primeira linha exatamente: ${COLUNAS_MODELO.join(";")}
- Máximo de ${MAX_LINHAS} linhas de dados.
- Se algum campo tiver ; ou aspas, coloque o campo entre aspas duplas.

COLUNAS
- descricao (obrigatório): texto até 255 caracteres. Ex: Supermercado
- valor (obrigatório): número positivo no formato brasileiro. Ex: 1.234,56 ou 89,90
- data (obrigatório): dd/mm/aaaa. Ex: 05/01/2026
- categoria (opcional): precisa ser EXATAMENTE um dos nomes da lista abaixo, ou vazio
- forma_pagamento (opcional, padrão dinheiro): dinheiro | pix | transferencia | cartao_credito | cartao_debito | outro
- cartao (condicional): precisa ser EXATAMENTE um dos apelidos da lista abaixo. Obrigatório quando forma_pagamento for cartao_credito ou cartao_debito. Vazio nas demais formas.
- parcelas (opcional, padrão 1): número inteiro de 1 a 360
- observacoes (opcional): texto até 1000 caracteres

CATEGORIAS VÁLIDAS (não invente outras)
${listaCategorias}

CARTÕES VÁLIDOS (não invente outros)
${listaCartoes}

REGRAS IMPORTANTES
- Quando parcelas for maior que 1, a coluna valor deve conter o VALOR DA PARCELA, não o valor total da compra. Ex: notebook de 4.800,00 em 12x → valor 400,00 e parcelas 12.
- A data de um parcelamento é a data da 1ª parcela; as demais são geradas automaticamente pelo sistema.
- Nunca invente categoria ou cartão fora das listas. Se não souber, deixe a coluna vazia (categoria) ou use pix/dinheiro (forma_pagamento).
- Não inclua linhas de total, subtotal, cabeçalho repetido ou comentários.
- Uma linha por gasto.

MEUS DADOS PARA CONVERTER
(cole aqui seus gastos — extrato, lista, print, fatura etc.)`;
}
