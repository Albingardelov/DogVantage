# PuppyDayCard.tsx — en (1) ändring

Zon-färgerna som används till pricken i dagsbadgen är hårdkodade och off-brand.
Byt konstanten överst i filen:

```diff
- const ZONE_COLORS = { green: '#22c55e', yellow: '#eab308', red: '#ef4444' } as const
+ const ZONE_COLORS = { green: 'var(--color-primary)', yellow: 'var(--color-accent)', red: 'var(--color-error)' } as const
```

(`ZONE_LABELS` är oförändrad. `ZONE_COLORS[zone]` sätts som inline
`style={{ background }}` på `.zoneDot` — CSS-variabler fungerar där.)

Inget annat i `PuppyDayCard.tsx` behöver röras. `yellowFrame` får gärna en
ikon framför texten för att matcha mocken — valfritt:

```tsx
// import { SmileyMeh } from '@phosphor-icons/react'; import { DvIcon } from '@/components/icons'
{zone === 'yellow' && (
  <p className={styles.yellowFrame}>
    <span style={{ color: '#c8742f', display: 'inline-flex' }}>
      <DvIcon icon={SmileyMeh} size="sm" weight="fill" />
    </span>
    Kort och enkelt idag — en enkel vinst är allt ni behöver.
  </p>
)}
```
