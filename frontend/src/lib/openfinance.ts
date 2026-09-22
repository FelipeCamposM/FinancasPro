import { api } from "@/lib/api";

// ── tipos ────────────────────────────────────────────────────────────────────

export type OfDestino = "gasto" | "renda" | "ignorado" | "a_classificar";
export type OfTipo = "debito" | "credito";
export type OfStatusAssinatura = "sugerida" | "confirmada" | "ignorada";

export interface OfConexao {
  id: string;
  item_id: string;
  apelido: string | null;
  last_sync_at: string | null;
  created_at: string;
}

export interface OfConta {
  id: string;
  nome: string;
  apelido: string | null;
  cor: string | null;
  subtipo: string | null;
  numero: string | null;
  saldo: string | null;
  moeda: string;
  last_sync_at: string | null;
}

export interface OfCartao {
  id: string;
  nome: string;
  apelido: string | null;
  cor: string | null;
  bandeira: string;
  ultimos_4_digitos: string | null;
  limite: string | null;
  limite_usado: string | null;
  limite_disponivel: string | null;
  // Competência exibida e a fatura dela. NÃO é o limite usado: a fatura sai da
  // soma das transações do mês da fatura (billForecastDate da Pluggy).
  competencia: string | null;
  fatura_atual: string | null;
  encargos: string | null;
  estornos: string | null;
  lancamentos: number;
  dia_vencimento: number | null;
  dia_fechamento: number | null;
  dia_vencimento_manual: number | null;
  dia_fechamento_manual: number | null;
  dia_vencimento_efetivo: number | null;
  dia_fechamento_efetivo: number | null;
  last_sync_at: string | null;
}

export interface OfFatura {
  competencia: string;
  fatura: string;
  encargos: string;
  estornos: string;
  lancamentos: number;
  total_com_encargos: string;
}

export interface OfCompetencia {
  competencia: string;
  total: string;
  encargos: string;
  lancamentos: number;
  // Parcelas que ainda vao cair nesse mes e que o banco nao lancou.
  total_projetado: string;
  lancamentos_projetados: number;
}

export interface OfGastoProjetado {
  descricao: string;
  valor: string;
  competencia: string;
  numero_parcela: number;
  total_parcelas: number;
  purchase_date: string;
  categoria_nome: string | null;
  categoria_cor: string | null;
  categoria_icone: string | null;
  cartao_nome: string | null;
  cartao_apelido: string | null;
}

export interface OfParcelamentoItem {
  descricao: string;
  purchase_date: string;
  total_parcelas: number;
  parcelas_lancadas: number;
  parcelas_restantes: number;
  valor_total: string;
  falta_pagar: string | null;
  valor_parcela: string;
  proxima_competencia: string | null;
  ultima_competencia: string;
  cartao_apelido: string | null;
  cartao_nome: string | null;
  categoria_nome: string | null;
  categoria_cor: string | null;
  parcelas: {
    numero_parcela: number;
    competencia: string;
    valor: string;
    projecao: boolean;
  }[];
}

export interface OfParcelamentos {
  itens: OfParcelamentoItem[];
  em_andamento: number;
  comprometido_mensal: number;
  falta_pagar: number;
}

export interface OfTransacao {
  id: string;
  descricao: string;
  valor: string;
  tipo: OfTipo;
  data: string;
  destino: OfDestino;
  status: "pendente" | "confirmada";
  categoria_id: number | null;
  categoria_nome: string | null;
  categoria_cor: string | null;
  categoria_pluggy: string | null;
  merchant_nome: string | null;
  cartao_nome: string | null;
  cartao_apelido: string | null;
  conta_nome: string | null;
  conta_apelido: string | null;
}

export interface OfGasto {
  id: string;
  of_transacao_id: string;
  descricao: string;
  valor: string;
  data_gasto: string;
  competencia: string | null;
  encargo: boolean;
  numero_parcela: number | null;
  total_parcelas: number | null;
  observacoes: string | null;
  categoria_id: number | null;
  categoria_nome: string | null;
  categoria_cor: string | null;
  categoria_icone: string | null;
  cartao_nome: string | null;
  cartao_apelido: string | null;
  assinatura_nome: string | null;
}

export interface OfRenda {
  id: string;
  descricao: string;
  valor: string;
  data_renda: string;
  categoria_nome: string | null;
  categoria_cor: string | null;
  conta_nome: string | null;
  conta_apelido: string | null;
}

export interface OfAssinatura {
  id: string;
  nome: string;
  padrao_descricao: string;
  valor_medio: string;
  valor_ultimo: string | null;
  dia_cobranca: number | null;
  status: OfStatusAssinatura;
  ocorrencias: number;
  ultima_cobranca: string | null;
  categoria_id: number | null;
  categoria_nome: string | null;
  categoria_cor: string | null;
  cartao_nome: string | null;
  cartao_apelido: string | null;
}

export interface OfPrevisaoItem {
  id: string;
  nome: string;
  valor_previsto: string;
  valor_medio: string;
  data_prevista: string;
  categoria_nome: string | null;
  categoria_cor: string | null;
  cartao_apelido: string | null;
  cartao_nome: string | null;
}

export interface OfDashboard {
  encargos_total: number;
  contas: OfConta[];
  cartoes: OfCartao[];
  saldo_total: number;
  fatura_total: number;
  gastos_mes: number;
  renda_mes: number;
  por_categoria: {
    categoria: string;
    cor: string;
    total: string;
    lancamentos: number;
  }[];
  serie_mensal: { mes: string; entradas: string; saidas: string }[];
  assinaturas: {
    confirmadas: number;
    total_mensal: string;
    sugestoes: number;
  };
  a_classificar: number;
}

export interface OfRelatorios {
  por_mes_categoria: {
    mes: string;
    categoria: string;
    cor: string;
    total: string;
  }[];
  ranking_estabelecimentos: {
    estabelecimento: string;
    total: string;
    vezes: number;
    ultima: string;
  }[];
  fluxo_caixa: {
    mes: string;
    entradas: string;
    saidas: string;
    resultado: string;
    acumulado: string;
  }[];
}

export interface Paginacao {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface OfSyncResultado {
  contas: number;
  transacoes_novas: number;
  transacoes_atualizadas: number;
  gastos_materializados: number;
  assinaturas_sugeridas: number;
}

// ── chamadas ─────────────────────────────────────────────────────────────────

const OF = "/openfinance";

export const ofApi = {
  conexoes: () =>
    api.get<{ data: OfConexao[] }>("/pluggy/items").then((r) => r.data.data),
  criarConexao: (item_id: string, apelido?: string) =>
    api.post<OfConexao>("/pluggy/items", { item_id, apelido }),
  removerConexao: (id: string) => api.delete(`/pluggy/items/${id}`),

  sync: () =>
    api.post<{ data: OfSyncResultado }>(`${OF}/sync`).then((r) => r.data.data),

  dashboard: () =>
    api.get<{ data: OfDashboard }>(`${OF}/dashboard`).then((r) => r.data.data),

  relatorios: (params: { de?: string; ate?: string }) =>
    api
      .get<{ data: OfRelatorios }>(`${OF}/relatorios`, { params })
      .then((r) => r.data.data),

  contas: () =>
    api.get<{ data: OfConta[] }>(`${OF}/contas`).then((r) => r.data.data),
  cartoes: (competencia?: string) =>
    api
      .get<{ data: OfCartao[] }>(`${OF}/cartoes`, {
        params: competencia ? { competencia } : undefined,
      })
      .then((r) => r.data.data),
  faturas: (cartaoId: string) =>
    api
      .get<{ data: OfFatura[] }>(`${OF}/cartoes/${cartaoId}/faturas`)
      .then((r) => r.data.data),
  parcelamentos: () =>
    api
      .get<{ data: OfParcelamentos }>(`${OF}/parcelamentos`)
      .then((r) => r.data.data),
  competencias: () =>
    api
      .get<{ data: OfCompetencia[] }>(`${OF}/competencias`)
      .then((r) => r.data.data),
  atualizarConta: (id: string, body: { apelido?: string; cor?: string }) =>
    api.patch(`${OF}/contas/${id}`, body),
  atualizarCartao: (
    id: string,
    body: {
      apelido?: string;
      cor?: string;
      dia_fechamento_manual?: number;
      dia_vencimento_manual?: number;
    },
  ) => api.patch(`${OF}/cartoes/${id}`, body),

  transacoes: (params: Record<string, string | number | undefined>) =>
    api
      .get<{ data: OfTransacao[]; pagination: Paginacao }>(`${OF}/transacoes`, {
        params,
      })
      .then((r) => r.data),

  classificar: (
    itens: { id: string; destino: OfDestino; categoria_id?: number }[],
  ) => api.post(`${OF}/transacoes/classificar`, { itens }),

  gastos: (params: Record<string, string | number | undefined>) =>
    api
      .get<{
        data: OfGasto[];
        pagination: Paginacao;
        soma: number;
        soma_encargos: number;
        soma_sem_encargos: number;
        soma_cartao: number;
        soma_conta: number;
        projetados: OfGastoProjetado[];
        soma_projetada: number;
      }>(`${OF}/gastos`, { params })
      .then((r) => r.data),

  atualizarGasto: (
    id: string,
    body: { categoria_id?: number; observacoes?: string },
  ) => api.patch(`${OF}/gastos/${id}`, body),

  renda: (params: Record<string, string | number | undefined>) =>
    api
      .get<{ data: OfRenda[]; pagination: Paginacao; soma: number }>(
        `${OF}/renda`,
        { params },
      )
      .then((r) => r.data),

  assinaturas: (status?: OfStatusAssinatura) =>
    api
      .get<{ data: OfAssinatura[] }>(`${OF}/assinaturas`, {
        params: status ? { status } : undefined,
      })
      .then((r) => r.data.data),

  previsao: () =>
    api
      .get<{ data: { itens: OfPrevisaoItem[]; total: number } }>(
        `${OF}/assinaturas/previsao`,
      )
      .then((r) => r.data.data),

  atualizarAssinatura: (
    id: string,
    body: {
      status?: OfStatusAssinatura;
      nome?: string;
      categoria_id?: number;
      dia_cobranca?: number;
    },
  ) => api.patch(`${OF}/assinaturas/${id}`, body),

  removerAssinatura: (id: string) => api.delete(`${OF}/assinaturas/${id}`),
};

// ── formatação ───────────────────────────────────────────────────────────────

export const brl = (valor: string | number | null | undefined): string =>
  Number(valor ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

/**
 * Datas vêm do Postgres como 'YYYY-MM-DD' ou ISO. Cortar antes de montar o
 * Date evita o deslocamento de fuso que faz dia 1 virar dia 30 do mês anterior.
 */
export const dataBr = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
};

export const mesBr = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const [ano, mes] = iso.slice(0, 10).split("-");
  const nomes = [
    "jan", "fev", "mar", "abr", "mai", "jun",
    "jul", "ago", "set", "out", "nov", "dez",
  ];
  return `${nomes[Number(mes) - 1]}/${ano.slice(2)}`;
};

export const DESTINO_LABEL: Record<OfDestino, string> = {
  gasto: "Gasto",
  renda: "Renda",
  ignorado: "Ignorado",
  a_classificar: "A classificar",
};
