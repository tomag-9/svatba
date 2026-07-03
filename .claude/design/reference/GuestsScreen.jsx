// GuestsScreen.jsx — grouped by family, avatar initials, icon toggles for dinner/party.
function initials(name) { return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase(); }
function avatarTone(group) {
  if (group === 'Angelika') return { background: 'var(--accent-tint)', color: 'var(--accent)' };
  if (group === 'Tomáš') return { background: 'var(--good-tint)', color: 'var(--good)' };
  return { background: 'var(--warn-tint)', color: 'var(--warn)' };
}

function GuestsScreen() {
  const { guests } = window.WEDDING_MOCK;
  const groups = ['Angelika', 'Tomáš', 'Party'];
  return (
    <div>
      <AppHeader eyebrow="Hostia" title="Kto príde" sub={null} />
      <div style={{ padding: '10px 18px 90px' }}>
        {groups.map((group) => {
          const rows = guests.filter((g) => g.familyGroup === group);
          if (!rows.length) return null;
          return (
            <div key={group} style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{group}</div>
              <div style={{ display: 'grid', gap: 8 }}>
                {rows.map((g) => (
                  <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 16, background: 'rgba(255,255,255,0.62)', border: '1px solid rgba(88,61,39,0.08)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12.5, ...avatarTone(group) }}>{initials(g.name)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{g.name}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <div title="Obed" style={{ width: 26, height: 26, borderRadius: 8, display: 'grid', placeItems: 'center', background: g.dinner ? 'var(--good-tint)' : 'rgba(88,61,39,0.06)' }}><Icon name="utensils" size={13} color={g.dinner ? 'var(--good)' : 'var(--muted)'} /></div>
                      <div title="Párty" style={{ width: 26, height: 26, borderRadius: 8, display: 'grid', placeItems: 'center', background: g.party ? 'var(--good-tint)' : 'rgba(88,61,39,0.06)' }}><Icon name="disc-3" size={13} color={g.party ? 'var(--good)' : 'var(--muted)'} /></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

window.GuestsScreen = GuestsScreen;
