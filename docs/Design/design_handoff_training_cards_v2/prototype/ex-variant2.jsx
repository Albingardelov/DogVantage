// ex-variant2.jsx — "Bold ring" — gamified, motivating.
// Deep-green gradient card (echoes the app header), a segmented progress ring,
// combo streaks, floating +1, and a celebratory completion burst.

function V2Ring({ ex, results, size = 152, stroke = 13 }) {
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const N = ex.reps;
  const seg = C / N - 6;
  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {Array.from({ length: N }, (_, i) => {
          const rr = results[i];
          const col = rr === 'success' ? '#52b788' : rr === 'miss' ? '#f4a261' : 'rgba(255,255,255,0.16)';
          return (
            <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth={stroke}
              strokeLinecap="round" strokeDasharray={`${seg} ${C - seg}`} strokeDashoffset={-i * (C / N)}
              style={{ transition: 'stroke 280ms ease' }} />
          );
        })}
      </g>
    </svg>
  );
}

function V2Card({ ex, onGuide, onNext, isLast }) {
  const log = DV.useExerciseLog(ex);
  const { done, success, rate, complete, results } = log;
  const [floats, setFloats] = React.useState([]);
  const combo = (() => { let c = 0; for (let i = results.length - 1; i >= 0; i--) { if (results[i] === 'success') c++; else break; } return c; })();

  const log2 = (kind) => {
    if (complete) return;
    log.logRep(kind);
    const id = Date.now() + Math.random();
    setFloats((f) => [...f, { id, kind }]);
    setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 850);
  };

  return (
    <div style={{
      position: 'relative', borderRadius: 22, overflow: 'hidden', color: '#fff',
      background: 'linear-gradient(160deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)',
      boxShadow: '0 10px 30px rgba(27,67,50,0.35)', padding: '18px 18px 20px',
    }}>
      <Burst show={complete} palette={['#52b788', '#f4a261', '#fbbf24', '#ffffff']} />
      {/* head */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, position: 'relative', zIndex: 2 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Ph name={ex.icon} weight="fill" size={18} color="#fff" />
            <span style={{ fontSize: 16, fontWeight: 700 }}>{ex.label}</span>
          </div>
          <button type="button" onClick={() => log.setLevel((l) => (l + 1) % ex.levels.length)} style={{
            marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 11px', cursor: 'pointer',
            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 999, color: '#fff',
          }}>
            <Ph name="target" size={13} />
            <span style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>{ex.levels[log.level]}</span>
            <Ph name="arrows-clockwise" size={12} style={{ opacity: 0.8 }} />
          </button>
        </div>
        <GuideChip onClick={onGuide} dark />
      </div>

      {/* ring */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '14px 0 4px', position: 'relative', zIndex: 2 }}>
        <div style={{ position: 'relative', width: 152, height: 152 }}>
          <V2Ring ex={ex} results={results} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {complete ? (
              <div style={{ animation: 'dv-pop 360ms cubic-bezier(.2,.8,.3,1.2)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Ph name="medal" weight="fill" size={34} color="#fbbf24" />
                <span style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>Klart!</span>
              </div>
            ) : (
              <React.Fragment>
                <span style={{ fontSize: 38, fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{done}<span style={{ fontSize: 20, opacity: 0.6 }}>/{ex.reps}</span></span>
                <span style={{ fontSize: 12, opacity: 0.8, marginTop: 3 }}>{rate !== null ? `${rate}% lyckade` : 'reps'}</span>
              </React.Fragment>
            )}
          </div>
          {/* floating +1 */}
          {floats.map((f) => (
            <span key={f.id} style={{
              position: 'absolute', top: 18, left: '50%', transform: 'translateX(-50%)',
              fontSize: 18, fontWeight: 800, color: f.kind === 'success' ? '#9ae6b4' : '#f4a261',
              animation: 'dv-float 850ms ease-out forwards', pointerEvents: 'none',
            }}>{f.kind === 'success' ? '+1' : 'miss'}</span>
          ))}
        </div>
      </div>

      {/* combo */}
      <div style={{ height: 22, display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 2 }}>
        {combo >= 2 && !complete && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 12px', borderRadius: 999,
            background: 'rgba(251,191,36,0.22)', border: '1px solid rgba(251,191,36,0.5)', color: '#fde68a',
            fontSize: 12, fontWeight: 800, animation: 'dv-pop 240ms ease',
          }}>
            <Ph name="fire" weight="fill" size={14} color="#fbbf24" /> {combo} i rad!
          </span>
        )}
      </div>

      {/* actions */}
      {!complete ? (
        <React.Fragment>
          <div style={{ display: 'flex', gap: 10, marginTop: 8, position: 'relative', zIndex: 2 }}>
            <button type="button" onClick={() => log2('success')} style={{
              flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '15px',
              borderRadius: 14, border: 'none', cursor: 'pointer', background: '#fff', color: 'var(--color-primary-dark)',
              fontSize: 16, fontWeight: 800,
            }}>
              <Ph name="check" weight="bold" size={19} /> Lyckad
            </button>
            <button type="button" onClick={() => log2('miss')} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '15px',
              borderRadius: 14, cursor: 'pointer', background: 'rgba(255,255,255,0.12)',
              border: '1.5px solid rgba(255,255,255,0.35)', color: '#fff', fontSize: 16, fontWeight: 700,
            }}>
              <Ph name="x" weight="bold" size={16} /> Miss
            </button>
          </div>
          {/* latency */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12, position: 'relative', zIndex: 2 }}>
            {DV.LATENCY.map((o) => {
              const on = log.latency === o.id;
              return (
                <button key={o.id} type="button" onClick={() => log.setLatency(o.id)} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '10px',
                  borderRadius: 11, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                  background: on ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.1)',
                  color: on ? 'var(--color-primary-dark)' : '#fff',
                  border: `1px solid ${on ? '#fff' : 'rgba(255,255,255,0.25)'}`,
                }}>
                  <Ph name="lightning" weight="fill" size={12} color={on ? 'var(--color-accent)' : '#fff'} /> {o.label}
                </button>
              );
            })}
          </div>
          <p style={{ margin: '10px 0 0', textAlign: 'center', fontSize: 11, opacity: 0.7, position: 'relative', zIndex: 2 }}>Svarstid efter signal</p>
        </React.Fragment>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8, position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px' }}>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{rate}%</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>lyckade</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px' }}>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{success}/{done}</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>reps satt</div>
            </div>
          </div>
          <button type="button" onClick={onNext} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px',
            borderRadius: 14, border: 'none', cursor: 'pointer', background: '#fff', color: 'var(--color-primary-dark)',
            fontSize: 15, fontWeight: 800,
          }}>
            {isLast ? 'Avsluta & logga pass' : 'Nästa övning'} <Ph name="caret-right" weight="bold" size={16} />
          </button>
          <button type="button" onClick={log.reset} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 600,
          }}>Ångra registrering</button>
        </div>
      )}
    </div>
  );
}

function V2Screen() {
  const [toast, setToast] = React.useState(false);
  const [idx, setIdx] = React.useState(0);
  const ex = DV.EXERCISES[idx];
  return (
    <div style={{ minHeight: '100%', background: 'var(--color-bg)', paddingTop: 54 }}>
      <div style={{ padding: '8px 16px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Ph name="paw-print" weight="fill" size={18} color="var(--color-primary)" />
          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)', whiteSpace: 'nowrap' }}>Dagens pass</span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', background: 'var(--color-green-50)', borderRadius: 999, padding: '4px 11px' }}>{idx + 1} / {DV.EXERCISES.length}</span>
      </div>
      <div style={{ padding: '4px 16px 20px' }}>
        <V2Card key={ex.id} ex={ex} onGuide={() => setToast(true)} />
        {/* upcoming chips */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14, overflowX: 'auto' }}>
          {DV.EXERCISES.map((e, i) => (
            <button key={e.id} type="button" onClick={() => setIdx(i)} style={{
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7, padding: '9px 13px', borderRadius: 12, cursor: 'pointer',
              background: i === idx ? 'var(--color-surface)' : 'var(--color-bg-alt)',
              border: `1.5px solid ${i === idx ? 'var(--color-primary)' : 'transparent'}`,
            }}>
              <Ph name={e.icon} weight={i === idx ? 'fill' : 'regular'} size={16} color="var(--color-primary)" />
              <span style={{ fontSize: 12, fontWeight: 600, color: i === idx ? 'var(--color-text)' : 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{e.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>
      {toast && (
        <div onClick={() => setToast(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(28,25,23,0.4)', zIndex: 30, display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', background: 'var(--color-surface)', borderRadius: '16px 16px 0 0', padding: '20px 18px 40px' }}>
            <div style={{ width: 36, height: 4, borderRadius: 999, background: 'var(--color-border)', margin: '0 auto 16px' }} />
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--color-text)' }}>Guide: så tränar du</h3>
            <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>Steg-för-steg, vanliga misstag och tips skulle visas här. (Demo)</p>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { V2Card, V2Screen });
