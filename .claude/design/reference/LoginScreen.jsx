// LoginScreen.jsx — shared-password gate, single-column mobile layout.
function LoginScreen({ onLogin }) {
  const [password, setPassword] = React.useState('');
  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 24, gap: 20 }}>
      <div style={{ textAlign: 'center' }}>
        <img src="../assets/rings-mark.svg" style={{ width: 56, height: 56, marginBottom: 14 }} alt="" />
        <p style={{ margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--accent)', fontSize: 11, fontWeight: 800 }}>Svadobný plánovač</p>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: '2rem', color: 'var(--text)' }}>Svadba bez chaosu.</h1>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); onLogin(); }} style={{
        display: 'grid', gap: 12, padding: 20, borderRadius: 22, background: 'var(--card)',
        border: '1px solid var(--card-border)', boxShadow: 'var(--shadow)',
      }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)' }}>Heslo</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Zadaj prístupové heslo" style={{
            padding: '13px 14px', borderRadius: 14, border: '1px solid rgba(88,61,39,0.18)', background: 'rgba(255,255,255,0.85)', fontSize: 16, outline: 'none',
          }} />
        </label>
        <button type="submit" style={{
          padding: '13px 14px', borderRadius: 999, border: 0, background: 'var(--gradient-accent)', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer',
        }}>Vstúpiť</button>
      </form>
    </div>
  );
}

window.LoginScreen = LoginScreen;
