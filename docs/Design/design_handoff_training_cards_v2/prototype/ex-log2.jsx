// ex-log2.jsx — celebratory "Pass klart" log form matching Variant 2.

function V2LogForm() {
  const [rating, setRating] = React.useState('good');
  const [vals, setVals] = React.useState({ focus: 4, obed: 3, timing: 4, consist: 3, reading: 4 });
  const [next, setNext] = React.useState('harder');
  const [saved, setSaved] = React.useState(false);
  const set = (k) => (v) => setVals((s) => ({ ...s, [k]: v }));

  const ratings = [
    { value: 'good', label: 'Bra', icon: 'smiley', color: '#52b788' },
    { value: 'mixed', label: 'Blandat', icon: 'smiley-meh', color: '#f4a261' },
    { value: 'bad', label: 'Svårt', icon: 'smiley-sad', color: '#d62828' },
  ];

  if (saved) {
    return (
      <div style={{ height: '100%', minHeight: 760, background: 'linear-gradient(160deg, var(--color-primary-dark), var(--color-primary))', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, position: 'relative', color: '#fff', padding: '54px 24px' }}>
        <Burst show palette={['#52b788', '#f4a261', '#fbbf24', '#ffffff']} />
        <div style={{ width: 88, height: 88, borderRadius: 999, background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'dv-pop 380ms cubic-bezier(.2,.8,.3,1.2)' }}>
          <Ph name="medal" weight="fill" size={46} color="#fbbf24" />
        </div>
        <p style={{ fontSize: 20, fontWeight: 800 }}>Pass sparat!</p>
        <p style={{ fontSize: 13, opacity: 0.85, marginTop: -8 }}>5 dagar i rad 🔥</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100%', background: 'var(--color-bg)', paddingTop: 54 }}>
      {/* hero summary */}
      <div style={{ margin: '6px 16px 0', borderRadius: 20, padding: '18px', color: '#fff', background: 'linear-gradient(160deg, var(--color-primary-dark), var(--color-primary))', boxShadow: '0 8px 24px rgba(27,67,50,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Ph name="confetti" weight="fill" size={18} color="#fbbf24" />
          <span style={{ fontSize: 14, fontWeight: 700 }}>Pass klart — bra jobbat!</span>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          {[['82%', 'lyckade'], ['3', 'övningar'], ['12', 'reps']].map(([v, l]) => (
            <div key={l} style={{ flex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 4px' }}>
              <div style={{ fontSize: 22, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{v}</div>
              <div style={{ fontSize: 11, opacity: 0.85 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px 18px 16px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        <Section label="Hur kändes passet?">
          <div style={{ display: 'flex', gap: 10 }}>
            {ratings.map((r) => {
              const on = rating === r.value;
              return (
                <button key={r.value} type="button" onClick={() => setRating(r.value)} style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, padding: '16px 8px', cursor: 'pointer',
                  borderRadius: 16, background: on ? r.color : 'var(--color-bg-alt)', border: '2px solid transparent', transition: 'all 160ms ease',
                  transform: on ? 'translateY(-2px)' : 'none', boxShadow: on ? '0 6px 16px rgba(0,0,0,0.12)' : 'none',
                }}>
                  <Ph name={r.icon} weight="fill" size={32} color={on ? '#fff' : 'var(--color-text-muted)'} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: on ? '#fff' : 'var(--color-text-muted)' }}>{r.label}</span>
                </button>
              );
            })}
          </div>
        </Section>

        <Section label="Hundens prestation">
          <Stepper label="Fokus" value={vals.focus} onChange={set('focus')} />
          <Stepper label="Lydnad" value={vals.obed} onChange={set('obed')} />
        </Section>

        <Section label="Din insats som förare">
          <Stepper label="Timing" hint="Belönade du i rätt ögonblick?" value={vals.timing} onChange={set('timing')} />
          <Stepper label="Konsekvens" hint="Höll du samma krav hela passet?" value={vals.consist} onChange={set('consist')} />
          <Stepper label="Läsa hunden" hint="Märkte du när det började bli svårt?" value={vals.reading} onChange={set('reading')} />
        </Section>

        <Section label="Nästa pass">
          <div style={{ display: 'flex', gap: 8 }}>
            {[['same', 'Behåll nivå'], ['easier', 'Lättare'], ['harder', 'Kan höja']].map(([v, l]) => {
              const on = next === v;
              return (
                <button key={v} type="button" onClick={() => setNext((p) => (p === v ? null : v))} style={{
                  flex: 1, padding: '11px', borderRadius: 12, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                  border: `1.5px solid ${on ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: on ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: on ? '#fff' : 'var(--color-text-muted)',
                }}>{l}</button>
              );
            })}
          </div>
        </Section>

        <button type="button" onClick={() => setSaved(true)} style={{
          padding: 16, borderRadius: 14, border: 'none', cursor: 'pointer', background: 'var(--color-primary)',
          color: '#fff', fontSize: 16, fontWeight: 800, boxShadow: 'var(--shadow-primary)', marginBottom: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <Ph name="check-circle" weight="fill" size={20} /> Spara pass
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { V2LogForm });
