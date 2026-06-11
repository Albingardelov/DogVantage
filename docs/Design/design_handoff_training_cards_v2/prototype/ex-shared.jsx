// ex-shared.jsx — shared model + building blocks for the DogVantage
// training-card redesign explorations. Exported to window for the variant files.

// ── Inline-SVG icon set (self-contained; mirrors the Phosphor glyphs used) ─────
// Robust replacement for the icon font: no external dependency, always renders.
function Ph({ name, weight = 'regular', size = 20, color, style = {} }) {
  const sw = weight === 'bold' ? 2.6 : 2.1;
  const fill = weight === 'fill';
  const S = { fill: 'none', stroke: 'currentColor', strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const F = { fill: 'currentColor' };
  const icons = {
    check: <path d="M4.5 12.5l5 5 10-11" {...S} />,
    x: <g {...S}><path d="M6 6l12 12" /><path d="M18 6L6 18" /></g>,
    'caret-right': <path d="M9 5l7 7-7 7" {...S} />,
    'arrows-clockwise': <g {...S}><path d="M20 12a8 8 0 1 1-2.3-5.6" /><path d="M20 3.5V7h-3.5" /></g>,
    target: <g><circle cx="12" cy="12" r="8.2" {...S} /><circle cx="12" cy="12" r="3.6" {...S} /><circle cx="12" cy="12" r="1.4" {...F} /></g>,
    'paw-print': <g {...F}><ellipse cx="6.5" cy="10" rx="2.2" ry="2.7" /><ellipse cx="11" cy="7.2" rx="2.3" ry="2.9" /><ellipse cx="15.8" cy="8.4" rx="2.2" ry="2.7" /><path d="M11 12.5c3 0 5 2 5 4.3 0 1.7-1.6 2.7-3.4 2.4-1-.2-1.7-.2-2.7 0C8 19.5 6.4 18.5 6.4 16.8 6.4 14.5 8.2 12.5 11 12.5z" /></g>,
    dog: <g {...F}><ellipse cx="6.5" cy="10" rx="2.2" ry="2.7" /><ellipse cx="11" cy="7.2" rx="2.3" ry="2.9" /><ellipse cx="15.8" cy="8.4" rx="2.2" ry="2.7" /><path d="M11 12.5c3 0 5 2 5 4.3 0 1.7-1.6 2.7-3.4 2.4-1-.2-1.7-.2-2.7 0C8 19.5 6.4 18.5 6.4 16.8 6.4 14.5 8.2 12.5 11 12.5z" /></g>,
    eye: <g><path d="M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12z" {...S} /><circle cx="12" cy="12" r="3" {...(fill ? F : S)} /></g>,
    'flag-banner': <g><path d="M5 21V4" {...S} /><path d="M5 4.5h13l-3 4 3 4H5" {...(fill ? F : S)} /></g>,
    'flag-checkered': <g><path d="M5 21V4" {...S} /><path d="M5 4.5h13l-3 4 3 4H5" {...(fill ? F : S)} /></g>,
    smiley: <g><circle cx="12" cy="12" r="9" {...S} /><circle cx="8.8" cy="10" r="1.2" {...F} /><circle cx="15.2" cy="10" r="1.2" {...F} /><path d="M8 14.5c1 1.4 2.4 2 4 2s3-.6 4-2" {...S} /></g>,
    'smiley-meh': <g><circle cx="12" cy="12" r="9" {...S} /><circle cx="8.8" cy="10" r="1.2" {...F} /><circle cx="15.2" cy="10" r="1.2" {...F} /><path d="M8.5 15h7" {...S} /></g>,
    'smiley-sad': <g><circle cx="12" cy="12" r="9" {...S} /><circle cx="8.8" cy="10" r="1.2" {...F} /><circle cx="15.2" cy="10" r="1.2" {...F} /><path d="M8 16c1-1.4 2.4-2 4-2s3 .6 4 2" {...S} /></g>,
    medal: <g><path d="M7.5 2.5l4.5 7 4.5-7" {...S} /><circle cx="12" cy="15" r="7.3" {...(fill ? F : S)} />{fill ? <path d="M12 11.2l1.25 2.55 2.8.4-2.03 1.98.48 2.8L12 15.6l-2.5 1.32.48-2.8L7.95 12.15l2.8-.4z" fill="#fff" /> : <circle cx="12" cy="15" r="2.4" {...S} />}</g>,
    fire: <path d="M12 2c.6 3.2 3.8 4.2 3.8 8.2A4 4 0 0 1 8 11c0-1.3 .6-2.3 1.3-3-.1 1.3 .7 2.2 1.5 2.3-1-2.4 .2-5.6 1.2-8.3z" {...(fill ? F : { ...S })} />,
    lightning: <path d="M13 2L4 14h6l-1 8 9-12h-6z" {...(fill ? F : S)} />,
    confetti: <g {...S}><path d="M3 21l6-2" /><path d="M9 19l-4-9 9 4z" /><circle cx="17" cy="5" r="1" {...F} /><circle cx="20" cy="10" r="1" {...F} /><circle cx="14" cy="3" r="1" {...F} /></g>,
    'check-circle': fill
      ? <g><circle cx="12" cy="12" r="9.5" {...F} /><path d="M8 12.3l2.7 2.7L16 9.3" fill="none" stroke="#fff" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></g>
      : <g {...S}><circle cx="12" cy="12" r="9" /><path d="M8 12.3l2.7 2.7L16 9.3" /></g>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"
      style={{ display: 'inline-flex', flexShrink: 0, color, ...style }}>
      {icons[name] || icons['check']}
    </svg>
  );
}

// ── Demo training data (a realistic "Dagens pass") ────────────────────────────
const EXERCISES = [
  { id: 'sit',     label: 'Sitt med kvarstannande', desc: 'Belöna i sittande — släpp innan hunden reser sig.', reps: 5, icon: 'dog',         levels: ['1 sek', '3 sek', '5 sek + distraktion'] },
  { id: 'contact', label: 'Frivillig kontakt',       desc: 'Markera när hunden själv söker din blick.',         reps: 4, icon: 'eye',         levels: ['Hemma', 'Trädgård', 'På promenad'] },
  { id: 'recall',  label: 'Inkallning',              desc: 'Glad ton, spring bakåt, belöna högt.',               reps: 3, icon: 'flag-banner', levels: ['2 meter', '5 meter', 'Med distraktion'] },
];

const LATENCY = [
  { id: 'lt1s',  label: '<1s',   tone: 'fast' },
  { id: '1to3s', label: '1–3s',  tone: 'mid'  },
  { id: 'gt3s',  label: '>3s',   tone: 'slow' },
];

// ── Per-exercise logging state hook — the UNIFIED model ───────────────────────
// One action ("logRep") records success|miss AND advances the rep counter, so
// there is a single, explainable mechanism instead of dots + pills doing the
// same thing. Captures everything: results[], latency, criterion level.
function useExerciseLog(ex) {
  const [results, setResults] = React.useState([]);   // ('success'|'miss')[]
  const [latency, setLatency] = React.useState(null);  // latency id
  const [level, setLevel] = React.useState(0);         // criterion ladder idx
  const done = results.length;
  const success = results.filter((r) => r === 'success').length;
  const miss = done - success;
  const rate = done > 0 ? Math.round((success / done) * 100) : null;
  const complete = done >= ex.reps;
  const logRep = (kind) => setResults((r) => (r.length >= ex.reps ? r : [...r, kind]));
  const undo = () => setResults((r) => r.slice(0, -1));
  const reset = () => { setResults([]); setLatency(null); };
  return { results, done, success, miss, rate, complete, latency, setLatency, level, setLevel, logRep, undo, reset };
}

// ── A small "guide" chip used in every variant ────────────────────────────────
function GuideChip({ onClick, dark }) {
  return (
    <button type="button" onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 9px 4px 11px',
      borderRadius: 999, border: `1px solid ${dark ? 'rgba(255,255,255,0.25)' : 'var(--color-green-100)'}`,
      background: dark ? 'rgba(255,255,255,0.1)' : 'var(--color-green-50)',
      color: dark ? '#fff' : 'var(--color-primary)', fontSize: 11, fontWeight: 700,
      letterSpacing: '0.04em', textTransform: 'uppercase', cursor: 'pointer', flexShrink: 0,
    }}>
      Guide <Ph name="caret-right" weight="bold" size={12} />
    </button>
  );
}

// ── Confetti burst (used by celebratory variants) ─────────────────────────────
function Burst({ show, palette }) {
  if (!show) return null;
  const cols = palette || ['#2d6a4f', '#52b788', '#f4a261', '#fbbf24'];
  const bits = Array.from({ length: 14 }, (_, i) => {
    const ang = (i / 14) * Math.PI * 2;
    const dist = 46 + (i % 3) * 16;
    return { x: Math.cos(ang) * dist, y: Math.sin(ang) * dist, c: cols[i % cols.length], d: (i % 5) * 30 };
  });
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }}>
      {bits.map((b, i) => (
        <span key={i} style={{
          position: 'absolute', top: '50%', left: '50%', width: 7, height: 7, borderRadius: 2,
          background: b.c, animation: `dv-burst 700ms ${b.d}ms cubic-bezier(.2,.7,.3,1) forwards`,
          ['--bx']: `${b.x}px`, ['--by']: `${b.y}px`,
        }} />
      ))}
    </div>
  );
}

// ── Shared form controls (used by every log form) ────────────────────────────
function Stepper({ label, hint, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{label}</span>
          {hint && <span style={{ display: 'block', fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>{hint}</span>}
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', flexShrink: 0 }}>{value}/5</span>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {[1, 2, 3, 4, 5].map((n) => {
          const on = n <= value;
          return (
            <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${label} ${n} av 5`} style={{
              flex: 1, height: 30, borderRadius: 9, cursor: 'pointer', border: 'none',
              background: on ? 'var(--color-primary)' : 'var(--color-bg-alt)', transition: 'background 150ms ease',
            }} />
          );
        })}
      </div>
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      {children}
    </div>
  );
}

window.DV = { Ph, EXERCISES, LATENCY, useExerciseLog, GuideChip, Burst };
Object.assign(window, { Ph, GuideChip, Burst, Stepper, Section });
