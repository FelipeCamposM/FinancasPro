// Tipos globais do domínio da aplicação

export type UserLevel = "admin" | "premium" | "free";
export type FormaPagamento =
  | "dinheiro"
  | "cartao_credito"
  | "cartao_debito"
  | "pix"
  | "transferencia"
  | "outro";
export type TipoPagamento = "a_vista" | "parcelado";
export type Frequencia =
  | "diario"
  | "semanal"
  | "quinzenal"
  | "mensal"
  | "bimestral"
  | "trimestral"
  | "semestral"
  | "anual";
export type StatusGasto = "pendente" | "pago" | "cancelado";
export type StatusParcela = "pendente" | "pago" | "vencido" | "cancelado";
export type TipoCategoria = "gasto" | "renda";
export type TipoRenda =
  | "salario"
  | "freelance"
  | "investimento"
  | "aluguel"
  | "bonus"
  | "outro";
export type Bandeira =
  | "visa"
  | "mastercard"
  | "elo"
  | "amex"
  | "hipercard"
  | "discover"
  | "outro";
export type TipoCartao = "credito" | "debito" | "credito_debito";

// -------------------------------------------------------
// Entidades do banco
// -------------------------------------------------------

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  avatar: string | null;
  user_level: UserLevel;
  created_at: Date;
  updated_at: Date;
}

export interface Categoria {
  id: number;
  user_id: string | null;
  nome: string;
  cor: string | null;
  icone: string | null;
  tipo: TipoCategoria;
  created_at: Date;
}

export interface Cartao {
  id: string;
  user_id: string;
  apelido: string;
  nome_no_cartao: string;
  ultimos_4_digitos: string;
  bandeira: Bandeira;
  tipo: TipoCartao;
  cor: string;
  banco: string;
  limite: number | null;
  dia_fechamento: number | null;
  dia_vencimento: number | null;
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Gasto {
  id: string;
  user_id: string;
  descricao: string;
  valor_total: number;
  categoria_id: number | null;
  forma_pagamento: FormaPagamento;
  cartao_id: string | null;
  tipo_pagamento: TipoPagamento;
  quantidade_parcelas: number;
  recorrente: boolean;
  frequencia_recorrencia: Frequencia | null;
  data_fim_recorrencia: Date | null;
  data_gasto: Date;
  observacoes: string | null;
  status: StatusGasto;
  gasto_origem_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Parcela {
  id: number;
  gasto_id: string;
  numero_parcela: number;
  valor_parcela: number;
  data_vencimento: Date;
  data_pagamento: Date | null;
  status: StatusParcela;
  created_at: Date;
  updated_at: Date;
}

export interface Renda {
  id: string;
  user_id: string;
  descricao: string;
  valor: number;
  tipo: TipoRenda;
  origem: string;
  categoria_id: number | null;
  mes_referencia: Date;
  data_recebimento: Date;
  recorrente: boolean;
  frequencia_recorrencia: Frequencia | null;
  data_fim_recorrencia: Date | null;
  renda_origem_id: string | null;
  observacoes: string | null;
  created_at: Date;
  updated_at: Date;
  // campo computado retornado pela listagem
  lancada_neste_mes?: boolean;
}

// -------------------------------------------------------
// Payload JWT
// -------------------------------------------------------

export interface JwtPayload {
  userId: string;
  email: string;
  userLevel: UserLevel;
}

// -------------------------------------------------------
// Extensão do Express para req.user e req.pagination
// -------------------------------------------------------

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      pagination?: {
        page: number;
        limit: number;
        offset: number;
      };
    }
  }
}

// -------------------------------------------------------
// Formato padrão de resposta paginada
// -------------------------------------------------------

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
