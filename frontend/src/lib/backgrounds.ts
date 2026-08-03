/**
 * Registro dos fundos animados disponíveis.
 *
 * Para adicionar um novo: coloque o componente em `src/components/` e registre
 * aqui + no `switch` de `BackgroundEfeito` (AppBackground.tsx). O carregamento é
 * dinâmico, então um fundo pesado só entra no bundle se o usuário escolher.
 */
export interface BackgroundOpcao {
  id: string;
  nome: string;
  descricao: string;
  /** Fundo do card enquanto o efeito carrega. */
  fallbackClass: string;
}

export const BACKGROUNDS: BackgroundOpcao[] = [
  {
    id: "padrao",
    nome: "Padrão",
    descricao: "Blobs suaves, sem custo de GPU",
    fallbackClass: "bg-neutral-950",
  },
  {
    id: "silk",
    nome: "Silk",
    descricao: "Ondas de seda em movimento lento",
    fallbackClass: "bg-[#1b1030]",
  },
  {
    id: "dotgrid",
    nome: "Dot Grid",
    descricao: "Grade de pontos que reage ao mouse",
    fallbackClass: "bg-neutral-950",
  },
  {
    id: "ferrofluid",
    nome: "Ferrofluid",
    descricao: "Fluido magnético escorrendo",
    fallbackClass: "bg-[#0b1020]",
  },
  {
    id: "floatinglines",
    nome: "Floating Lines",
    descricao: "Ondas de linhas que seguem o cursor",
    fallbackClass: "bg-[#050a18]",
  },
];
