import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Crown,
  Database,
  LayoutGrid,
  Palette,
  Smartphone,
  Tag,
  Wallet,
} from "lucide-react";

/**
 * Seções da tela de Configurações.
 *
 * Fonte única: a própria página monta a navegação a partir daqui e a busca do
 * topo (command palette) deriva os atalhos automaticamente. Uma seção nova
 * aparece nos dois lugares só de ser adicionada nesta lista.
 */
export interface SecaoConfiguracao {
  id: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  /** Termos extras que devem encontrar a seção na busca. */
  keywords: string[];
}

export const SECOES_CONFIGURACOES: SecaoConfiguracao[] = [
  {
    id: "plano",
    icon: Crown,
    label: "Plano",
    desc: "Assinatura Premium",
    keywords: ["assinatura", "premium", "pagamento", "cobranca", "cancelar"],
  },
  {
    id: "categorias",
    icon: Tag,
    label: "Categorias",
    desc: "Tags para gastos e rendas",
    keywords: ["tags", "tipos", "gasto", "renda", "cores", "emoji", "teto", "limite"],
  },
  {
    id: "lancamentos",
    icon: Wallet,
    label: "Lançamentos",
    desc: "Padrões de novo gasto",
    keywords: [
      "padrao",
      "forma de pagamento",
      "cartao padrao",
      "categoria padrao",
      "assinatura",
      "recorrente",
    ],
  },
  {
    id: "telas",
    icon: LayoutGrid,
    label: "Telas",
    desc: "Navegação e listas",
    keywords: [
      "pagina inicial",
      "itens por pagina",
      "ordenacao",
      "periodo",
      "privacidade",
      "ocultar valores",
    ],
  },
  {
    id: "alertas",
    icon: Bell,
    label: "Alertas",
    desc: "Limites e notificações",
    keywords: [
      "notificacao",
      "limite",
      "percentual",
      "fatura",
      "vencimento",
      "sino",
      "silenciar",
    ],
  },
  {
    id: "aparencia",
    icon: Palette,
    label: "Aparência",
    desc: "Fundo da aplicação",
    keywords: ["tema", "fundo", "background", "visual", "efeito", "animacao"],
  },
  {
    id: "dados",
    icon: Database,
    label: "Dados",
    desc: "Exportar e apagar",
    keywords: ["exportar", "csv", "backup", "apagar", "excluir", "limpar"],
  },
  {
    id: "iphone",
    icon: Smartphone,
    label: "Atalho iPhone",
    desc: "Integração iOS",
    keywords: [
      "atalho",
      "atalhos",
      "ios",
      "apple",
      "iphone",
      "siri",
      "voz",
      "shortcut",
      "api",
      "key",
      "icloud",
    ],
  },
];

/** Rota da seção, no formato que a página de configurações entende. */
export const rotaSecao = (id: string) => `/configuracoes?secao=${id}`;
