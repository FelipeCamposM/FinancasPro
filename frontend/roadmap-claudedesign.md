# FinançasPro — Design System Implementation Roadmap

Source: `frontend/FinançasPro Design System/`
Spec: `README.md` + `colors_and_type.css` + `ui_kits/financaspro/`

---

## Phase 1 — Tokens & Foundations
_globals.css · tailwind.config.js · layout.tsx_

- [x] Revert `globals.css` para paleta exata do DS (222 47%, 217 91%, etc.)
- [x] Adicionar CSS vars de module accent (`--module-gastos`, `--module-renda`, `--module-cartoes`, `--module-assinaturas`, `--module-parcelas`)
- [x] Adicionar CSS vars de status (`--status-pending`, `--status-paid`, `--status-cancelled`)
- [x] Adicionar token `--success` / `--success-foreground`
- [x] Configurar fontes: Bebas Neue (display) + Inter (body) em `layout.tsx`
- [x] `font-display` utility class em `globals.css`
- [x] `tailwind.config.js`: fontFamily display/body + success color + module colors
- [x] Typography utilities: `.ds-label`, `.ds-numeric`, glass surface exato do DS

---

## Phase 2 — Shared UI Components
_stat-card.tsx · section-header.tsx · AppSidebar.tsx · SummaryCard.tsx · badge.tsx_

- [x] `StatCard`: valor usa `font-display` (Bebas Neue), label usa tracking-[0.12em]
- [x] `SectionHeader`: título usa `font-display`, aceita `titleColor` prop
- [x] `AppSidebar`: ícones com cor de módulo por rota (rose/Gastos, blue/Renda, blue-300/Cartões, violet/Assinaturas)
- [x] `AppSidebar`: active state com borda lateral colorida + bg tintado
- [x] `SummaryCard`: redesenhado para padrão DS glass (toned icon pill, glass bg)
- [x] `Badge`: variantes DS — blue/rose/amber/violet/green/slate + pending/paid/cancelled aliases
- [ ] `Button` (shadcn): sombra glow em primary (`0 8px 24px rgba(37,99,235,0.28)`) e destructive
- [ ] `Card` (shadcn): verificar bg/border para que use variáveis DS

---

## Phase 3 — Dashboard Page
_src/app/dashboard/page.tsx_

- [x] StatCards com font-display nos valores (via Phase 2)
- [x] Section labels já com `tracking-[0.14em]` uppercase `text-white/45` ✓
- [x] Strategic insight cards com module accent (blue/rose/violet/amber) ✓
- [x] Budget bar com cores corretas (rose/amber/blue) ✓
- [x] Table rows: `hover:bg-white/[0.04]` ✓
- [ ] Valores financeiros: garantir `tabular-nums` em toda tabela de categorias ✓
- [ ] Card chart headers: icon pill com módulo correto ✓
- [ ] Testar visual completo com dados reais

---

## Phase 4 — Gastos Page (accent: rose-400)
_src/app/(app)/gastos/page.tsx · GastoDialog.tsx_

- [x] Status badges: `variant="pending/paid/cancelled"` DS
- [x] `getStatusIcon`: cores alinhadas ao DS (amber/blue/rose, sem yellow/red)
- [x] `GastoDialog` header: ícone `text-rose-400` ✓
- [x] Ícones de editar/excluir: `hover:text-blue-400/hover:text-rose-400` ✓
- [x] Table rows: `hover:bg-white/[0.04]` ✓
- [ ] `SectionHeader` title: `text-rose-400` (checar se já aplicado)
- [ ] Filtros ativos: border+bg na cor do accent ao filtrar

---

## Phase 5 — Renda Page (accent: blue-400)
_src/app/(app)/renda/page.tsx · RendaDialog.tsx_

- [x] `SectionHeader` title: `text-blue-400`
- [x] Tipo de renda badges: `variant` DS (blue/violet/green/amber/slate)
- [x] Recorrente badge: `variant="violet"`; Instância: `variant="blue"`
- [x] `RendaDialog` header: ícone `text-blue-400` ✓
- [x] Table rows: `hover:bg-white/[0.04]` ✓

---

## Phase 6 — Cartões Page (accent: blue-300)
_src/app/(app)/cartoes/page.tsx · CartaoDialog.tsx_

- [x] `SectionHeader` title: `text-blue-300`
- [x] Visual card component: `rounded-2xl`, cor do usuário como bg, texto auto-contraste ✓
- [x] Brand logo SVGs referenciados em `BANDEIRA_LOGOS`
- [x] Cards grid: `sm:grid-cols-2 lg:grid-cols-3` ✓
- [x] Hover: `hover:-translate-y-1` nos cards visuais ✓
- [x] Delete button: DS style `rose` em vez de `bg-destructive`
- [x] `CartaoDialog` header: ícone `CreditCard text-blue-300`

---

## Phase 7 — Assinaturas Page (accent: violet-400)
_src/app/(app)/assinaturas/page.tsx_

- [x] `SectionHeader` title: `text-violet-400`
- [x] Cards de assinatura: `border-violet-400/30 bg-violet-500/10` ✓
- [x] Badge status: `variant="violet"` ativa; `variant="slate"` cancelada
- [x] Botão "Nova Assinatura": violet tint ✓
- [x] Botão Editar: violet; Cancelar: rose; Reativar: blue ✓

---

## Phase 8 — Formulários & Inputs
_GastoDialog · RendaDialog · CartaoDialog · ui/input · ui/select · ui/textarea_

- [x] Inputs: `.ui-control` class — `border-white/15 bg-white/[0.08] placeholder:text-white/35` ✓
- [x] Focus ring: `ring-blue-400/60 border-blue-300/40` ✓
- [x] Select: mesmo estilo dos inputs ✓
- [x] Textarea: mesmo estilo ✓
- [ ] Labels de campo: 10px uppercase tracking + text-white/55 (verificar dialogs)
- [ ] Botões do dialog: primary com glow, ghost outline para cancelar

---

## Phase 9 — Perfil Page
_src/app/(app)/perfil/page.tsx_

- [x] Header: DS style (`font-display`, glass surface)
- [x] Avatar section: `rounded-full`, fallback com iniciais em `bg-primary` ✓
- [x] Form fields: usa `Input` component com `.ui-control` ✓
- [ ] Danger zone: `border-rose-400/30 bg-rose-500/10`

---

## Phase 10 — Polish & Microcopy
_global_

- [x] Empty states: `PageDataState` component com ícone + título + descrição ✓
- [x] Error states: "Não foi possível carregar..." ✓
- [x] Paginação: "Página X de Y" format ✓
- [x] Scrollbar: `width:5px`, `bg-white/10`, `border-radius:3px` ✓
- [x] Reduced motion: `@media prefers-reduced-motion` desativa stagger ✓
- [ ] Nenhum emoji em copy de UI (revisar)

---

## Legenda
- `[x]` = concluído
- `[ ]` = pendente/verificar
