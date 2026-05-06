# FinançasPro UI Kit

Interactive click-through prototype of the FinançasPro web app.

## Screens included

| Screen | Route key | Description |
|---|---|---|
| **Dashboard** | `dashboard` | KPIs, strategic summary, budget bar, area chart, category breakdown |
| **Gastos** | `gastos` | Expense list with filter bar, context cards, paginated table |
| **Renda** | `renda` | Income list with type badges and summary cards |
| **Cartões** | `cartoes` | Credit card visual component grid with brand logos |
| **Assinaturas** | `assinaturas` | Recurring subscription cards with active/inactive toggle |

## How to use

Open `index.html` in a browser. Click sidebar items to navigate between screens. All data is mocked — no backend required.

## File structure

```
ui_kits/financaspro/
├── index.html        ← Main prototype (all screens, app shell)
├── Components.jsx    ← Shared tokens, icons, Badge, Btn, StatCard, MiniAreaChart
└── Sidebar.jsx       ← AppSidebar navigation component
```

## Component inventory

- `Icons` — Inline SVG icon set (Lucide-style stroke icons)
- `Badge` — Color-coded pill badges (blue, rose, amber, violet, slate, green)
- `Btn` — Button with variants: default, destructive, secondary, outline, ghost, rose, violet, blue_tint
- `StatCard` — KPI card with icon, value, description, tone
- `SectionHeader` — Page header with title, description, action slot
- `MiniAreaChart` — Pure-SVG sparkline area chart
- `AppSidebar` — Left sidebar with nav items and active state
- `Topbar` — Top header with search bar and user dropdown

## Design tokens used

All tokens from `../../colors_and_type.css` — see that file for the full system.
Key: `C.blue`, `C.rose4`, `C.violet3`, `C.amber3`, glass surfaces, `fmtBRL()` for currency formatting.
