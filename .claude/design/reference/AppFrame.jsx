// AppFrame.jsx — shared chrome for the mobile app: header, bottom icon nav, FAB, tag & category icon.
function AppTag({ children, tone = 'default' }) {
  const tones = {
    default: { background: 'var(--accent-tint)', color: 'var(--accent)' },
    good: { background: 'var(--good-tint)', color: 'var(--good)' },
    warn: { background: 'var(--warn-tint)', color: 'var(--warn)' },
  };
  return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', ...tones[tone] }}>{children}</span>;
}

function AppHeader({ eyebrow, title, sub }) {
  return (
    <div style={{ padding: '18px 18px 6px' }}>
      <p style={{ margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--accent)', fontSize: 11, fontWeight: 800 }}>{eyebrow}</p>
      <h1 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: '1.9rem', lineHeight: 1.05, letterSpacing: '-0.02em', color: 'var(--text)' }}>{title}</h1>
      {sub && <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: '0.92rem', lineHeight: 1.45 }}>{sub}</p>}
    </div>
  );
}

function CategoryIcon({ category, size = 34 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 12, background: 'var(--accent-tint)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
      <Icon name={window.categoryIcon(category)} size={size * 0.5} color="var(--accent)" />
    </div>
  );
}

function BottomNav({ active, onNavigate }) {
  return (
    <nav style={{
      position: 'sticky', bottom: 10, left: 0, right: 0, margin: '0 12px', zIndex: 40,
      display: 'flex', justifyContent: 'space-between', padding: '8px 6px',
      borderRadius: 22, background: 'rgba(255,250,244,0.96)', backdropFilter: 'blur(18px)',
      border: '1px solid var(--card-border)', boxShadow: 'var(--shadow)',
    }}>
      {window.NAV_ITEMS.map((item) => {
        const isActive = active === item.id;
        return (
          <a key={item.id} href="#" onClick={(e) => { e.preventDefault(); onNavigate(item.id); }} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 2px',
            textDecoration: 'none', color: isActive ? 'var(--accent)' : 'var(--muted)',
          }}>
            <div style={{ width: 34, height: 26, borderRadius: 13, display: 'grid', placeItems: 'center', background: isActive ? 'var(--accent-tint)' : 'transparent' }}>
              <Icon name={item.icon} size={18} color={isActive ? 'var(--accent)' : 'var(--muted)'} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 700 }}>{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
}

function QuickAddFab({ onClick }) {
  return (
    <button onClick={onClick} aria-label="Pridať" style={{
      position: 'absolute', right: 16, bottom: 90, width: 52, height: 52, borderRadius: '50%',
      border: 0, background: 'var(--gradient-accent)', boxShadow: 'var(--shadow)',
      display: 'grid', placeItems: 'center', cursor: 'pointer', zIndex: 41,
    }}>
      <Icon name="plus" size={24} color="#fff" />
    </button>
  );
}

Object.assign(window, { AppTag, AppHeader, CategoryIcon, BottomNav, QuickAddFab });
