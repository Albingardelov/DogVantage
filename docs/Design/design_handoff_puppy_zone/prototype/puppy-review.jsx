// puppy-review.jsx — faithful recreation of the puppy-zone UI (as built) plus
// a brand-aligned proposal, for design review. Uses Ph from ex-shared.jsx.

// ============================================================================
// FAITHFUL REPRO — exact values from PuppyDayCard.module.css + ZoneCheckIn.tsx
// ============================================================================
const cur = {
  card: { background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  title: { fontWeight: 700, fontSize: 17, color: '#111' },
};

function CurBadge({ zone }) {
  const c = { green: '#22c55e', yellow: '#eab308', red: '#ef4444' }[zone];
  const label = { green: 'Grön dag', yellow: 'Gul dag', red: 'Röd dag' }[zone];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: 'rgba(0,0,0,0.06)', color: '#111' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: c }} /> {label}
    </span>
  );
}

function CurExerciseRow({ name, desc, done, reps }) {
  // condensed stand-in for the standard ExerciseRow (dense variant)
  return (
    <div style={{ display: 'flex', gap: 12, padding: '13px 0', borderBottom: '1px solid #e7e0d8' }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: '#f2ede5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Ph name="paw-print" size={18} color="#5c5752" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1c1917' }}>{name}</div>
        <div style={{ fontSize: 11, color: '#5c5752', marginTop: 2 }}>{desc}</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <button style={{ fontSize: 11, padding: '6px 10px', borderRadius: 999, border: '1px solid #e7e0d8', background: '#faf8f4', color: '#1c1917' }}>Lyckad</button>
          <button style={{ fontSize: 11, padding: '6px 10px', borderRadius: 999, border: '1px solid #e7e0d8', background: '#faf8f4', color: '#1c1917' }}>Miss</button>
          <span style={{ fontSize: 11, color: '#5c5752', alignSelf: 'center' }}>{done}/{reps}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 5, alignSelf: 'center' }}>
        {Array.from({ length: reps }, (_, i) => <span key={i} style={{ width: 13, height: 13, borderRadius: 999, background: i < done ? '#2d6a4f' : '#e7e0d8' }} />)}
      </div>
    </div>
  );
}

function CurProgress({ done, planned }) {
  const pct = planned ? (done / planned) * 100 : 0;
  return (
    <div style={{ margin: '4px 0 12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#5c5752', marginBottom: 6 }}>
        <span>Dagens reps</span><span>{done}/{planned}</span>
      </div>
      <div style={{ height: 8, borderRadius: 999, background: '#f2ede5', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: '#2d6a4f' }} />
      </div>
    </div>
  );
}

// State 1 — zone check-in
function CurCheckIn() {
  const zones = [
    { emoji: '🟢', label: 'Grön', desc: 'Reglerbar, tar kontakt, nyfiken', bd: '#22c55e', bg: '#f0fdf4' },
    { emoji: '🟡', label: 'Gul', desc: 'Lite stissig eller övertrött', bd: '#eab308', bg: '#fefce8' },
    { emoji: '🔴', label: 'Röd', desc: 'Kaos — svårt att reglera', bd: '#ef4444', bg: '#fef2f2' },
  ];
  return (
    <div style={{ ...cur.card, margin: '16px' }}>
      <p style={{ fontWeight: 700, fontSize: 18, margin: '0 0 16px', color: '#111' }}>Hur är Luna idag?</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {zones.map((z) => (
          <button key={z.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 12, border: `2px solid ${z.bd}`, background: z.bg, textAlign: 'left', width: '100%', cursor: 'pointer' }}>
            <span style={{ fontSize: 22 }}>{z.emoji}</span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>{z.label}</span>
              <span style={{ fontSize: 13, color: '#6b7280' }}>{z.desc}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function CurGreen() {
  return (
    <div style={{ ...cur.card, margin: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={cur.title}>Dagens pass</span><CurBadge zone="green" />
      </div>
      <CurProgress done={2} planned={11} />
      <div>
        <CurExerciseRow name="Sitt" desc="3 × kort pass" done={2} reps={3} />
        <CurExerciseRow name="Inkallning" desc="3 × kort pass" done={0} reps={4} />
        <CurExerciseRow name="Kontakt" desc="3 × kort pass" done={0} reps={4} />
      </div>
      <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '10px 14px', fontSize: 14, fontWeight: 500, width: '100%', color: '#111' }}>
          Fråga om dagens pass <Ph name="caret-right" size={14} color="#111" />
        </button>
      </div>
    </div>
  );
}

function CurYellow() {
  return (
    <div style={{ ...cur.card, margin: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={cur.title}>Dagens pass</span><CurBadge zone="yellow" />
      </div>
      <p style={{ fontSize: 14, color: '#92400e', background: '#fef3c7', borderRadius: 8, padding: '10px 14px', margin: '0 0 12px', lineHeight: 1.5 }}>
        Kort och enkelt idag — en enkel vinst är allt ni behöver.
      </p>
      <CurProgress done={0} planned={3} />
      <CurExerciseRow name="Nosework" desc="3 repetitioner — fokus på lugn och enkla vinster." done={0} reps={3} />
    </div>
  );
}

function CurRed() {
  const tips = [
    'Sniffpromenad utan krav — låt hunden styra tempo och riktning.',
    'Vila i bur eller på plats — ge hunden tid att varva ner.',
    'Fri lek på säker plats utan prestationskrav.',
  ];
  return (
    <div style={{ ...cur.card, margin: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
        <span style={{ fontWeight: 700, fontSize: 17, color: '#111' }}>Röd dag — bara återhämtning idag</span>
      </div>
      <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 16px' }}>Inga träningskrav. Låt hjärnan vila.</p>
      <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, listStyle: 'none', padding: 0, margin: 0 }}>
        {tips.map((t) => <li key={t} style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 14px', fontSize: 14, lineHeight: 1.5, color: '#111' }}>{t}</li>)}
      </ul>
    </div>
  );
}

// ============================================================================
// BRAND-ALIGNED PROPOSAL — DogVantage tokens, icon system, traffic-light kept
// ============================================================================
const T = { bg: '#faf8f4', bgAlt: '#f2ede5', surface: '#fff', primary: '#2d6a4f', primaryDark: '#1b4332', accent: '#f4a261', text: '#1c1917', muted: '#5c5752', border: '#e7e0d8', error: '#d62828', green50: '#edf8f2', green100: '#d8f0e5' };

function BrandCheckIn() {
  const zones = [
    { icon: 'smiley', label: 'Grön', desc: 'Reglerbar, tar kontakt, nyfiken', bd: T.primary, bg: T.green50, ic: T.primary },
    { icon: 'smiley-meh', label: 'Gul', desc: 'Lite stissig eller övertrött', bd: T.accent, bg: '#fdf1e6', ic: '#c8742f' },
    { icon: 'smiley-sad', label: 'Röd', desc: 'Kaos — svårt att reglera', bd: T.error, bg: '#fbeaea', ic: T.error },
  ];
  return (
    <div style={{ background: T.surface, borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgb(0 0 0 / 0.08)', margin: 16 }}>
      <p style={{ fontWeight: 700, fontSize: 18, margin: '0 0 4px', color: T.text }}>Hur är Luna idag?</p>
      <p style={{ fontSize: 13, color: T.muted, margin: '0 0 16px' }}>Vi anpassar passet efter dagsformen.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {zones.map((z) => (
          <button key={z.label} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px', borderRadius: 12, border: `1.5px solid ${z.bd}`, background: z.bg, textAlign: 'left', width: '100%', cursor: 'pointer' }}>
            <span style={{ width: 40, height: 40, borderRadius: 999, background: T.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <Ph name={z.icon} weight="fill" size={24} color={z.ic} />
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: T.text }}>{z.label}</span>
              <span style={{ fontSize: 13, color: T.muted }}>{z.desc}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function BrandBadge({ zone }) {
  const m = { green: [T.primary, 'Grön dag', T.green50, T.primary], yellow: [T.accent, 'Gul dag', '#fdf1e6', '#c8742f'], red: [T.error, 'Röd dag', '#fbeaea', T.error] }[zone];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '4px 11px', borderRadius: 999, background: m[2], color: m[3] }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: m[0] }} /> {m[1]}
    </span>
  );
}

function BrandGreen() {
  return (
    <div style={{ background: T.surface, borderRadius: 16, boxShadow: '0 2px 12px rgb(0 0 0 / 0.08)', margin: 16, overflow: 'hidden' }}>
      <div style={{ background: T.green50, borderBottom: `1px solid ${T.green100}`, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: T.primary }}>Dagens pass</span><BrandBadge zone="green" />
      </div>
      <div style={{ padding: 16 }}>
        <CurProgress done={2} planned={11} />
        <p style={{ fontSize: 12, color: T.muted, margin: '0 0 8px' }}>Övningskorten använder den nya "Bold ring"-designen.</p>
        <div style={{ borderRadius: 12, background: 'linear-gradient(160deg,#1b4332,#2d6a4f)', color: '#fff', padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Ph name="paw-print" weight="fill" size={20} color="#fff" />
          <span style={{ fontSize: 14, fontWeight: 700 }}>Sitt</span>
          <span style={{ marginLeft: 'auto', fontSize: 13, opacity: 0.85 }}>2/3</span>
        </div>
      </div>
    </div>
  );
}

function BrandYellow() {
  return (
    <div style={{ background: T.surface, borderRadius: 16, boxShadow: '0 2px 12px rgb(0 0 0 / 0.08)', margin: 16, overflow: 'hidden' }}>
      <div style={{ background: '#fdf1e6', borderBottom: '1px solid #f7e0cb', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: '#c8742f' }}>Dagens pass</span><BrandBadge zone="yellow" />
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: '#fdf1e6', border: '1px solid #f7e0cb', borderRadius: 12, padding: '12px 14px', marginBottom: 14 }}>
          <Ph name="smiley-meh" weight="fill" size={18} color="#c8742f" />
          <p style={{ fontSize: 13, color: '#9a5a22', margin: 0, lineHeight: 1.5 }}>Kort och enkelt idag — en enkel vinst är allt ni behöver.</p>
        </div>
        <div style={{ borderRadius: 12, background: 'linear-gradient(160deg,#1b4332,#2d6a4f)', color: '#fff', padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Ph name="paw-print" weight="fill" size={20} color="#fff" />
          <span style={{ fontSize: 14, fontWeight: 700 }}>Nosework</span>
          <span style={{ marginLeft: 'auto', fontSize: 13, opacity: 0.85 }}>0/3</span>
        </div>
      </div>
    </div>
  );
}

function BrandRed() {
  const tips = [
    ['wind', 'Sniffpromenad utan krav — låt hunden styra tempo och riktning.'],
    ['moon', 'Vila i bur eller på plats — ge hunden tid att varva ner.'],
    ['heart', 'Fri lek på säker plats utan prestationskrav.'],
  ];
  return (
    <div style={{ background: T.surface, borderRadius: 16, boxShadow: '0 2px 12px rgb(0 0 0 / 0.08)', margin: 16, padding: 20, borderTop: `4px solid ${T.error}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <Ph name="smiley-sad" weight="fill" size={22} color={T.error} />
        <span style={{ fontWeight: 700, fontSize: 16, color: T.text }}>Röd dag — bara återhämtning</span>
      </div>
      <p style={{ color: T.muted, fontSize: 14, margin: '0 0 16px' }}>Inga träningskrav idag. Låt hjärnan vila.</p>
      <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, listStyle: 'none', padding: 0, margin: 0 }}>
        {tips.map(([ic, t]) => (
          <li key={t} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: T.bg, borderRadius: 10, padding: '12px 14px', fontSize: 13, lineHeight: 1.5, color: T.text }}>
            <Ph name="paw-print" size={16} color={T.primary} style={{ marginTop: 1, flexShrink: 0 }} />
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

Object.assign(window, {
  CurCheckIn, CurGreen, CurYellow, CurRed,
  BrandCheckIn, BrandGreen, BrandYellow, BrandRed,
});
