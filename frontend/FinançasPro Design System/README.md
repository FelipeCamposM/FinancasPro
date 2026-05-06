# FinançasPro Design System

**Source:** GitHub repository [`FelipeCamposM/FinancasPro`](https://github.com/FelipeCamposM/FinancasPro)

## Product Overview

**FinançasPro** (internally "Gerenciar Gastos") is a **full-stack personal finance management web app** built for Brazilian users. It helps individuals centralize their income, expenses, credit cards, installments, and subscriptions — with a clean dashboard for fast financial decision-making.

### Product Modules

| Module | Route | Purpose |
|---|---|---|
| **Dashboard** | `/dashboard` | KPIs, charts, budget bar, strategic insights |
| **Gastos** | `/gastos` | Expense tracking — one-time and installment |
| **Renda** | `/renda` | Income entry management |
| **Cartões** | `/cartoes` | Credit/debit card management with visual card UI |
| **Assinaturas** | `/assinaturas` | Recurring subscription tracking |
| **Perfil** | `/perfil` | User settings and preferences |

### Stack
- **Frontend:** Next.js 14 (App Router) · Tailwind CSS · shadcn/ui · Radix UI · Recharts
- **Backend:** Node.js · Express · TypeScript · PostgreSQL 16
- **Auth:** JWT Bearer Token (cookie `gg_token`)
- **Icons:** Lucide React (stroke-based, 16–20px)
- **Charts:** Recharts (AreaChart, PieChart, BarChart)

---

## CONTENT FUNDAMENTALS

### Language & Tone
- **Language:** Portuguese (Brazilian) — `pt-BR` throughout. All UI copy is in Portuguese. Dates formatted as `dd/MM/yyyy`. Currency formatted as `R$ 1.234,56`.
- **Voice:** Direct, practical, task-oriented. No fluff. Short, imperative CTAs.
- **Perspective:** Second-person ("Suas finanças", "Seu perfil") — talks *to* the user.
- **Casing:** Sentence case for all headings, labels, and descriptions. Section labels use `UPPERCASE` tracking-wide (10px, `tracking-[0.14em]`) for visual hierarchy.
- **Emoji:** **Never used** in UI copy. No emoji anywhere in the application.
- **Numbers:** Always tabular (`font-variant-numeric: tabular-nums`) for financial values.
- **Currency:** Always `R$` prefix, BRL format: `R$ 1.234,56`.

### Copy Examples
- CTAs: "Novo Gasto", "Nova Renda", "Novo Cartão", "Nova assinatura" (not "Adicionar novo item")
- Page descriptions: "23 registros", "Cobranças recorrentes mensais", "Controle financeiro"
- Empty states: "Nenhum gasto encontrado" + short instruction
- Error states: "Não foi possível carregar os gastos" + "Verifique sua conexão e tente novamente"
- Confirmations: "Tem certeza que deseja excluir…? Esta ação não pode ser desfeita."
- Section sub-labels: "O que mais importa no mês selecionado", "Sinais rápidos para orientar suas decisões"

### Microcopy Patterns
- Filter labels: short uppercase, e.g. `CATEGORIA`, `STATUS`, `PAGAMENTO`
- Status badges: `Pendente`, `Pago`, `Cancelado` (sentence case)
- Pagination: `Página 2 de 10`
- Counts in descriptions: `3 cartões`, `1 registro`, `23 registros` (pluralization handled)

---

## VISUAL FOUNDATIONS

### Color System
**Dark-first.** The entire app is dark mode only — no light mode toggle.

| Role | Value | Usage |
|---|---|---|
| Body background | `hsl(222 47% 5%)` | Page bg |
| Elevated bg | `hsl(222 47% 7%)` | Main content area |
| Card bg | `hsl(223 39% 12%)` | Cards, popovers |
| Secondary bg | `hsl(222 34% 17%)` | Secondary elements |
| Muted bg | `hsl(215 28% 17%)` | Muted areas |
| Input bg | `hsl(221 30% 20%)` | Form inputs |
| Sidebar bg | `hsl(222 45% 10%)` | Sidebar surface |
| Primary (Blue) | `hsl(217 91% 60%)` | CTAs, active states, renda |
| Destructive (Rose) | `hsl(0 84% 60%)` | Delete, errors, gastos |
| Border | `hsl(217 32% 26%)` | Component borders |

**Module accent colors** (for per-section theming):
- Gastos → `rose-400` / `rose-500`
- Renda → `blue-400` / `blue-500`
- Cartões → `blue-300` / `blue-400`
- Assinaturas → `violet-400` / `violet-500`
- Parcelas pendentes → `amber-400` / `amber-500`

### Typography
- **Font stack:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` (system stack; no custom font loaded)
- **Design system substitute:** Geist (see `colors_and_type.css`)
- **Monospace:** Used for card numbers (`font-mono tracking-widest`) and code blocks
- **Key sizes:** 10px (labels), 11–12px (small descriptions), 13px (body), 15px (base), 18–20px (values), 24px (large KPIs)
- **Key weights:** 400 (body), 500 (medium emphasis), 600 (semibold — labels, nav), 700 (bold — KPI values, headings)
- **Letter spacing:** Section sub-labels use `tracking-[0.14em]` uppercase; nav labels use `tracking-wider`

### Backgrounds & Surfaces
- **No images or illustrations** in the core app — pure dark surfaces
- **Glass morphism** is the primary surface pattern:
  - Soft: `backdrop-filter: blur(18px)` + `bg: linear-gradient(165deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))`
  - Strong: `blur(20px)` + `rgba(255,255,255,0.14) → 0.05`
  - All glass surfaces have a `1px solid rgba(255,255,255,0.14)` border
- **Module-tinted cards:** Each section uses a subtle tinted glass card: `bg-rose-500/10 border-rose-400/30` for Gastos, `bg-violet-500/10 border-violet-400/30` for Assinaturas, etc.

### Spacing & Layout
- **Sidebar:** Fixed left sidebar (`AppSidebar`), collapsible
- **Content:** Full-width scrollable main area with `space-y-6` section rhythm (`24px` gaps)
- **Card padding:** `p-4` (16px) to `p-5` (20px)
- **Grid:** `grid-cols-1 → md:grid-cols-2 → xl:grid-cols-4` for KPI grids
- **Card grids:** `sm:grid-cols-2 lg:grid-cols-3` for entity cards

### Border Radius
- Base (shadcn `--radius`): `0.6rem` (~9.6px)
- Glass / card: `0.9rem` (~14.4px)
- Large cards (credit card visual): `rounded-2xl` (16px)
- Stat icon containers: `rounded-xl` (12px)
- Badges: `rounded-full` (pill)
- Avatar: `rounded-full`

### Shadows & Elevation
- Soft card: `0 10px 26px rgba(2, 6, 23, 0.26)`
- Strong card / modal: `0 16px 40px rgba(2, 6, 23, 0.42)`
- Primary button glow: `0 8px 24px rgba(37, 99, 235, 0.28)`
- Destructive button glow: `0 8px 24px rgba(244, 63, 94, 0.28)`
- `ring-1 ring-white/10` is added on important cards for subtle outline

### Animations
- **Entrance:** `ui-fade-up` keyframe — `opacity: 0, translateY(10px)` → normal; `duration: 220ms`; easing: `cubic-bezier(0.22, 1, 0.36, 1)` (spring-like)
- **Stagger grid:** 48ms step between children (cards, stat items)
- **Stagger rows:** 36ms step (table rows, list items)
- **Hover transitions:** `duration-200` on most interactive elements
- **Card hover:** `hover:-translate-y-0.5` (credit card: `hover:-translate-y-1`)
- **Button press:** `active:scale-[0.99]`
- **Reduced motion:** All stagger animations disabled when `prefers-reduced-motion: reduce`

### Hover & Interaction States
- **Ghost buttons:** `hover:bg-white/[0.10]` — subtle white overlay
- **Module-colored icon buttons:** e.g., pencil `hover:text-blue-400 hover:bg-blue-500/10`, trash `hover:text-rose-400 hover:bg-rose-500/10`
- **Navigation items:** `hover:bg-sidebar-accent` → `data-[active=true]:bg-sidebar-primary/20 text-sidebar-primary`
- **Table rows:** `hover:bg-white/[0.04]`
- **Filter selects:** Change border and bg color to match filter's accent color when active
- **Focus ring:** `focus-visible:ring-2 focus-visible:ring-blue-400/60`

### Cards
- Background: `bg-white/[0.06] to bg-white/[0.08]` + `backdrop-blur-xl`
- Border: `border-white/15` (default) or module-tinted `border-rose-400/30` etc.
- Rounding: `rounded-xl` to `rounded-2xl`
- No heavy drop shadows — prefer backdrop blur + subtle border

### Icons
- **Library:** Lucide React (`lucide-react`) — stroke-weight icons, 16×16 to 20×20px
- **Size convention:** `h-4 w-4` (16px) for UI icons; `h-5 w-5` for stat card icons; `h-3.5 w-3.5` for inline/badge icons
- **Color:** Always colored to match the module accent (`text-rose-400`, `text-blue-400`, etc.) or `text-muted-foreground` for neutral
- **Wrapped icons:** Stat card icons sit inside a colored pill: `rounded-xl p-2.5 bg-{color}-500/10`

### Transparency & Blur
- Used extensively for the "fluid glass" look
- Sidebar: `bg-white/[0.05] backdrop-blur-xl`
- Topbar: `bg-white/[0.05] backdrop-blur-xl shadow-md ring-1 ring-white/5`
- Filter panels: `bg-white/[0.08] backdrop-blur-xl`
- Modals/dialogs: card-colored with backdrop blur

### Imagery
- **Credit card visuals:** Unique! Uses user-defined `color` (hex) as card background, with SVG brand logos (`/brand_cardlogos/`). Text color auto-calculated for contrast (dark/light detection). Logo inversion filter applied for dark cards: `filter: brightness(0) invert(1)`.
- **No decorative images** in the general UI
- **No gradients as backgrounds** (only glass tints)

---

## ICONOGRAPHY

### Primary Icon Library
**Lucide React** (`lucide-react` v0.577.0) — the sole icon library. All icons are stroke-based SVGs, rendered inline as React components.

### Usage Rules
- Size: `h-4 w-4` (16px) standard; `h-5 w-5` for stat cards; `h-3.5 w-3.5` for badges/inline
- Always colored contextually — never raw black/white unless forced by contrast
- Module-specific icon usage:
  - Dashboard: `LayoutDashboard`
  - Gastos: `TrendingDown`
  - Renda: `TrendingUp`
  - Cartões: `CreditCard`
  - Assinaturas: `Repeat`
  - Wallet: used as the app logo mark in sidebar + login
  - Status: `Clock` (pending), `CircleCheck` (paid), `CircleX` (cancelled)
  - Payment methods: `Banknote` (cash), `CreditCard` (credit), `Wallet` (debit), `QrCode` (Pix), `ArrowLeftRight` (transfer)
  - Categories: `Utensils`, `Car`, `HeartPulse`, `BookOpen`, `Gamepad2`, `Home`, `Shirt`, `Laptop`, `Smartphone`, `PawPrint`, `Plane`, `Sparkles`, `ShoppingCart`, `Pill`, `Package`

### Brand Card Logos
SVG files in `assets/brand_cardlogos/` — used on the credit card visual component:
- `visa.svg`, `mastercard.svg`, `elo.svg`, `amex.svg`, `hipercard.svg`, `alelo.svg`, `paypal.svg`

### Brand Logos
SVG files in `assets/brand_logos/`:
- `github.svg` — used as example in subscription cards
- `netflix.svg` — used as example in subscription cards

### No Emoji
Emoji are never used in the application interface.

---

## FILE INDEX

```
/
├── README.md                    ← This file. Product context + design guidelines.
├── SKILL.md                     ← Agent skill manifest
├── colors_and_type.css          ← CSS custom properties: all color, type, spacing tokens
│
├── assets/
│   ├── brand_cardlogos/         ← SVG card brand logos (visa, mastercard, elo, amex…)
│   └── brand_logos/             ← SVG brand logos (github, netflix — used in subscriptions)
│
├── preview/                     ← Design system card previews (registered in Design System tab)
│   ├── colors-base.html
│   ├── colors-semantic.html
│   ├── colors-modules.html
│   ├── type-scale.html
│   ├── type-specimens.html
│   ├── spacing-radius.html
│   ├── spacing-shadows.html
│   ├── components-buttons.html
│   ├── components-badges.html
│   ├── components-cards.html
│   ├── components-stat-cards.html
│   ├── components-table.html
│   ├── components-inputs.html
│   └── brand-card-logos.html
│
└── ui_kits/
    └── financaspro/
        ├── README.md            ← UI kit overview
        ├── index.html           ← Interactive app prototype (Dashboard + nav)
        ├── Components.jsx       ← Shared UI components
        ├── Sidebar.jsx          ← App sidebar component
        └── Dashboard.jsx        ← Dashboard screen
```
