// FinançasPro UI Kit — App Sidebar Component

const { useState } = React;

function AppSidebar({ activeRoute, onNavigate }) {
  const navItems = [
    { href: 'dashboard',    Icon: Icons.Dashboard,   label: 'Dashboard'   },
    { href: 'gastos',       Icon: Icons.TrendDown,   label: 'Gastos'      },
    { href: 'renda',        Icon: Icons.TrendUp,     label: 'Renda'       },
    { href: 'cartoes',      Icon: Icons.CreditCard,  label: 'Cartões'     },
    { href: 'assinaturas',  Icon: Icons.Repeat,      label: 'Assinaturas' },
  ];

  const sidebarStyles = {
    sidebar: {
      width: 220,
      minHeight: '100vh',
      background: C.sidebar,
      borderRight: `1px solid hsl(217 30% 18%)`,
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    },
    header: {
      padding: '14px 16px',
      borderBottom: '1px solid hsl(217 30% 18%)',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    },
    logoMark: {
      width: 32, height: 32,
      background: C.blue,
      borderRadius: 8,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    },
    appName: { fontSize: 13, fontWeight: 600, color: C.fg, lineHeight: 1.3 },
    appSub:  { fontSize: 10, color: 'rgba(255,255,255,0.40)' },
    navLabel: { fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.28)', padding: '14px 16px 6px' },
    navItem: (active) => ({
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 12px', margin: '1px 8px',
      borderRadius: 8, fontSize: 13, cursor: 'pointer',
      color: active ? C.blue : 'rgba(255,255,255,0.60)',
      background: active ? 'rgba(59,130,246,0.18)' : 'transparent',
      transition: 'all 150ms',
      userSelect: 'none',
    }),
    footer: {
      marginTop: 'auto',
      padding: '10px 16px',
      borderTop: '1px solid hsl(217 30% 18%)',
      fontSize: 10,
      color: 'rgba(255,255,255,0.22)',
    },
  };

  return (
    <div style={sidebarStyles.sidebar}>
      <div style={sidebarStyles.header}>
        <div style={sidebarStyles.logoMark}>
          <Icons.CreditCard size={16} color="white" />
        </div>
        <div>
          <div style={sidebarStyles.appName}>FinançasPro</div>
          <div style={sidebarStyles.appSub}>Controle financeiro</div>
        </div>
      </div>

      <div style={sidebarStyles.navLabel}>Navegação</div>

      {navItems.map(({ href, Icon, label }) => {
        const active = activeRoute === href;
        return (
          <div
            key={href}
            style={sidebarStyles.navItem(active)}
            onClick={() => onNavigate(href)}
            onMouseEnter={e => {
              if (!active) { e.currentTarget.style.background = 'hsl(222 37% 16%)'; e.currentTarget.style.color = C.fg; }
            }}
            onMouseLeave={e => {
              if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.60)'; }
            }}
          >
            <Icon size={16} color="currentColor" />
            <span>{label}</span>
          </div>
        );
      })}

      <div style={sidebarStyles.footer}>FinançasPro © 2025</div>
    </div>
  );
}

Object.assign(window, { AppSidebar });
