// FinançasPro UI Kit — Shared Components
// Loaded via <script type="text/babel" src="Components.jsx">

const { useState, useRef, useEffect } = React;

// ── Token helpers ─────────────────────────────────────────────
const C = {
  bg:        'hsl(222 47% 5%)',
  bgEl:      'hsl(222 47% 7%)',
  card:      'hsl(223 39% 12%)',
  sidebar:   'hsl(222 45% 10%)',
  secondary: 'hsl(222 34% 17%)',
  muted:     'hsl(215 28% 17%)',
  input:     'hsl(221 30% 20%)',
  border:    'hsl(217 32% 26%)',
  fg:        'hsl(210 40% 96%)',
  fgMuted:   'hsl(215 20% 70%)',
  fgDim:     'rgba(255,255,255,0.45)',
  blue:      'hsl(217 91% 60%)',
  blue4:     'hsl(213 94% 68%)',
  blue3:     'hsl(212 96% 78%)',
  rose4:     'hsl(351 95% 71%)',
  rose3:     'hsl(353 96% 80%)',
  amber4:    'hsl(38 92% 67%)',
  amber3:    'hsl(43 96% 76%)',
  violet4:   'hsl(263 78% 72%)',
  violet3:   'hsl(267 84% 81%)',
  green5:    'hsl(142 71% 45%)',
};

// ── Icon SVG primitives ────────────────────────────────────────
function Icon({ d, size=16, color='currentColor', strokeWidth=2, fill='none', viewBox='0 0 24 24', style={} }) {
  return (
    <svg width={size} height={size} viewBox={viewBox} fill={fill} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
      {Array.isArray(d) ? d.map((p,i) => <path key={i} d={p}/>) : <path d={d}/>}
    </svg>
  );
}

// Specific icons used throughout
const Icons = {
  Dashboard: ({size=16,color='currentColor'}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  TrendDown: ({size=16,color='currentColor'}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>,
  TrendUp:   ({size=16,color='currentColor'}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  CreditCard:({size=16,color='currentColor'}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  Repeat:    ({size=16,color='currentColor'}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>,
  Wallet:    ({size=16,color='currentColor'}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
  Clock:     ({size=16,color='currentColor'}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Plus:      ({size=16,color='currentColor'}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  ChevronLeft: ({size=16,color='currentColor'}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  ChevronRight: ({size=16,color='currentColor'}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  ChevronDown: ({size=14,color='currentColor'}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  Search:    ({size=16,color='currentColor'}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  User:      ({size=16,color='currentColor'}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  LogOut:    ({size=16,color='currentColor'}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Target:    ({size=16,color='currentColor'}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  Flame:     ({size=16,color='currentColor'}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>,
  BarChart:  ({size=16,color='currentColor'}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  Gauge:     ({size=16,color='currentColor'}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M13.73 21a10 10 0 1 1-3.46 0"/></svg>,
  PiggyBank: ({size=16,color='currentColor'}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.8 1.7-1.8 2-3h1v-4h-1c0-1-.5-1.5-1-2z"/><path d="M2 9v1a2 2 0 0 0 2 2h1"/><path d="M16 11h.01"/></svg>,
  Pencil:    ({size=14,color='currentColor'}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Trash:     ({size=14,color='currentColor'}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6m4-6v6"/></svg>,
  AlertTri:  ({size=16,color='currentColor'}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Wifi:      ({size=16,color='currentColor'}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>,
};

// ── Utility ────────────────────────────────────────────────────
function fmtBRL(v) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ── Badge ──────────────────────────────────────────────────────
function Badge({ children, color='blue', style:s={} }) {
  const palettes = {
    blue:   { bg:'rgba(59,130,246,0.12)',  border:'rgba(96,165,250,0.35)',  text:C.blue4 },
    rose:   { bg:'rgba(244,63,94,0.12)',   border:'rgba(251,113,133,0.35)', text:C.rose3 },
    amber:  { bg:'rgba(245,158,11,0.12)',  border:'rgba(251,191,36,0.35)',  text:C.amber3 },
    violet: { bg:'rgba(139,92,246,0.12)',  border:'rgba(167,139,250,0.35)', text:C.violet3 },
    slate:  { bg:'rgba(255,255,255,0.06)', border:'rgba(255,255,255,0.18)', text:'rgba(255,255,255,0.55)' },
    green:  { bg:'rgba(34,197,94,0.12)',   border:'rgba(74,222,128,0.35)',  text:'hsl(142 71% 65%)' },
  };
  const p = palettes[color] || palettes.slate;
  return (
    <span style={{
      display:'inline-flex',alignItems:'center',gap:4,
      borderRadius:9999,fontSize:10,fontWeight:600,
      padding:'2px 8px',border:`1px solid ${p.border}`,
      background:p.bg,color:p.text,...s
    }}>{children}</span>
  );
}

// ── Btn ────────────────────────────────────────────────────────
function Btn({ children, variant='default', size='md', onClick, style:s={}, disabled=false }) {
  const variants = {
    default:     { bg:'rgba(59,130,246,0.85)',  color:'#fff',                   border:'none',                           shadow:'0 8px 24px rgba(37,99,235,0.28)' },
    destructive: { bg:'rgba(244,63,94,0.85)',   color:'#fff',                   border:'none',                           shadow:'0 8px 24px rgba(244,63,94,0.28)' },
    secondary:   { bg:'rgba(59,130,246,0.15)',  color:C.blue3,                  border:'none',                           shadow:'none' },
    outline:     { bg:'rgba(255,255,255,0.04)', color:'rgba(255,255,255,0.85)', border:'1px solid rgba(255,255,255,0.18)', shadow:'none' },
    ghost:       { bg:'transparent',            color:'rgba(255,255,255,0.75)', border:'none',                           shadow:'none' },
    rose:        { bg:'rgba(244,63,94,0.20)',   color:C.rose3,                  border:'1px solid rgba(251,113,133,0.40)', shadow:'none' },
    violet:      { bg:'rgba(139,92,246,0.20)',  color:C.violet3,                border:'1px solid rgba(167,139,250,0.40)', shadow:'none' },
    blue_tint:   { bg:'rgba(59,130,246,0.20)',  color:C.blue3,                  border:'1px solid rgba(96,165,250,0.40)',  shadow:'none' },
  };
  const sizes = { sm:{height:32,padding:'0 12px',fontSize:12}, md:{height:40,padding:'0 16px',fontSize:13}, lg:{height:44,padding:'0 32px',fontSize:14} };
  const v = variants[variant] || variants.default;
  const sz = sizes[size] || sizes.md;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display:'inline-flex',alignItems:'center',gap:6,
      borderRadius:8,fontFamily:'inherit',fontWeight:500,cursor:disabled?'not-allowed':'pointer',
      transition:'all 200ms',border:v.border,background:v.bg,color:v.color,
      boxShadow:v.shadow,opacity:disabled?0.5:1,...sz,...s
    }}>{children}</button>
  );
}

// ── Stat Card ──────────────────────────────────────────────────
function StatCard({ label, value, description, icon, tone='blue', wide=false }) {
  const tones = {
    blue:   { value:C.blue4,   iconBg:'rgba(59,130,246,0.12)',  iconColor:C.blue4  },
    rose:   { value:C.rose4,   iconBg:'rgba(244,63,94,0.12)',   iconColor:C.rose4  },
    amber:  { value:C.amber4,  iconBg:'rgba(245,158,11,0.12)',  iconColor:C.amber4 },
    violet: { value:C.violet4, iconBg:'rgba(139,92,246,0.12)',  iconColor:C.violet4},
    slate:  { value:'rgba(255,255,255,0.85)', iconBg:'rgba(255,255,255,0.08)', iconColor:'rgba(255,255,255,0.5)' },
  };
  const t = tones[tone] || tones.blue;
  return (
    <div style={{
      background:`linear-gradient(165deg,rgba(255,255,255,0.09),rgba(255,255,255,0.03))`,
      border:'1px solid rgba(255,255,255,0.13)',
      borderRadius:14,padding:'18px 20px',
      backdropFilter:'blur(18px)',
      gridColumn: wide ? 'span 2' : 'span 1',
      transition:'transform 200ms',
    }}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12}}>
        <div style={{minWidth:0}}>
          <p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.12em',color:'rgba(255,255,255,0.40)',marginBottom:6}}>{label}</p>
          <p style={{fontSize: wide ? 28 : 22,fontWeight:700,fontVariantNumeric:'tabular-nums',color:t.value,lineHeight:1.1}}>{value}</p>
          {description && <p style={{fontSize:11,color:'rgba(255,255,255,0.45)',marginTop:4}}>{description}</p>}
        </div>
        <div style={{flexShrink:0,borderRadius:12,padding:10,background:t.iconBg,color:t.iconColor}}>{icon}</div>
      </div>
    </div>
  );
}

// ── Section Header ─────────────────────────────────────────────
function SectionHeader({ title, description, titleColor, actions }) {
  return (
    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:16,flexWrap:'wrap'}}>
      <div>
        <h1 style={{fontSize:22,fontWeight:700,color:titleColor||C.fg,lineHeight:1.2}}>{title}</h1>
        {description && <p style={{fontSize:12,color:'rgba(255,255,255,0.45)',marginTop:3}}>{description}</p>}
      </div>
      {actions && <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>{actions}</div>}
    </div>
  );
}

// ── Mini area chart (pure SVG, no recharts) ────────────────────
function MiniAreaChart({ data, color='#3b82f6', height=80 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data) * 0.8;
  const w = 260, h = height;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * h * 0.85 - h * 0.05;
    return `${x},${y}`;
  });
  const linePath = `M ${pts.join(' L ')}`;
  const areaPath = `M ${pts[0]} L ${pts.join(' L ')} L ${w},${h} L 0,${h} Z`;
  const gradId = `grad_${color.replace('#','')}`;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="95%" stopColor={color} stopOpacity="0.02"/>
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`}/>
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

// ── Export to window ───────────────────────────────────────────
Object.assign(window, { Icons, Badge, Btn, StatCard, SectionHeader, MiniAreaChart, fmtBRL, C });
