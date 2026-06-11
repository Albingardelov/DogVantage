// ex-v2-flow.jsx — the chosen design (Variant 2) as a complete session flow:
// ring card per exercise → auto-advance → celebratory log form → saved.

function V2Flow() {
  const exs = DV.EXERCISES;
  const [idx, setIdx] = React.useState(0);
  const [phase, setPhase] = React.useState('train'); // 'train' | 'log'
  const [toast, setToast] = React.useState(false);

  const next = () => {
    if (idx + 1 >= exs.length) setPhase('log');
    else setIdx((i) => i + 1);
  };

  if (phase === 'log') {
    return <V2LogForm />;
  }

  const ex = exs[idx];
  return (
    <div style={{ minHeight: '100%', background: 'var(--color-bg)', paddingTop: 54 }}>
      {/* header */}
      <div style={{ padding: '10px 18px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Ph name="paw-print" weight="fill" size={19} color="var(--color-primary)" />
          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)', whiteSpace: 'nowrap' }}>Dagens pass</span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', background: 'var(--color-green-50)', borderRadius: 999, padding: '4px 11px' }}>
          Övning {idx + 1} / {exs.length}
        </span>
      </div>

      {/* overall progress */}
      <div style={{ display: 'flex', gap: 5, padding: '12px 18px 4px' }}>
        {exs.map((e, i) => (
          <div key={e.id} style={{ flex: 1, height: 5, borderRadius: 999, background: i < idx ? 'var(--color-primary)' : i === idx ? 'var(--color-green-100)' : 'var(--color-bg-alt)', transition: 'background 250ms' }} />
        ))}
      </div>

      {/* current exercise ring card */}
      <div style={{ padding: '12px 18px 24px' }}>
        <V2Card key={ex.id} ex={ex} onGuide={() => setToast(true)} onNext={next} isLast={idx + 1 >= exs.length} />
      </div>

      {toast && (
        <div onClick={() => setToast(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(28,25,23,0.4)', zIndex: 30, display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', background: 'var(--color-surface)', borderRadius: '16px 16px 0 0', padding: '20px 18px 40px' }}>
            <div style={{ width: 36, height: 4, borderRadius: 999, background: 'var(--color-border)', margin: '0 auto 16px' }} />
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--color-text)' }}>Guide: {ex.label}</h3>
            <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>Steg-för-steg, vanliga misstag och tips skulle visas här. (Demo)</p>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { V2Flow });
