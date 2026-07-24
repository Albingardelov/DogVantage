import type { Exercise } from '@/types'

export type LatencyBucket = 'lt1s' | '1to3s' | 'gt3s'

export interface CriteriaLevel {
  /**
   * Stable identifier stored in metrics (e.g. "home_low_1m").
   */
  id: string
  label: string
  /**
   * Plain-language criteria reminder for the handler.
   * Keep this short; details can live in the AI assistant.
   */
  criteria: string
  tips?: string[]
}

export interface GuideStep {
  how: string
  why: string
}

export interface GuideVariant {
  id: string
  label: string
  whenToUse: string
  how: string[]
  why: string
}

export interface HandlerGuide {
  todaySummary: string
  setup: string[]
  steps: GuideStep[]
  successLooksLike: string
  whenItFails: string[]
  wrapUp: string[]
  variants?: GuideVariant[]
}

export interface ExerciseSpec {
  exerciseId: Exercise['id']
  /**
   * Operational definition: what counts as a successful rep.
   */
  definition: string
  /**
   * Ordered from easiest -> hardest.
   */
  ladder: CriteriaLevel[]
  /**
   * Shown when success rate drops / latency increases.
   */
  troubleshooting: string[]
  /**
   * Optional reminders that indicate readiness to progress.
   */
  goalHints?: string[]

  /**
   * Curated handler guide (static truth) for how to run the exercise/tests.
   */
  guide?: HandlerGuide
}

function spec(s: ExerciseSpec): ExerciseSpec {
  return s
}

export const EXERCISE_SPECS: Record<string, ExerciseSpec> = {
  marker: spec({
    exerciseId: 'marker',
    definition: 'Lyckad rep = inom 0,5 sek efter markörljudet ("ja!" / klick) hör hunden ljudet → tittar på dig / förväntar belöning → får godis. Markören förutsäger belöning, inget annat.',
    ladder: [
      { id: 'charge_easy', label: 'Ladda markören · stilla', criteria: 'Hunden står/sitter framför dig. Säg "ja!" → ge godis direkt (1 sek mellan markör och godis). 10 reps per pass, 2–3 pass första dagen. Inget annat krav — vi bygger associationen markör = godis.' },
      { id: 'charge_distracted', label: 'Ladda · valfri position', criteria: 'Markera när hunden gör vad som helst (sniffar, går, ligger). Hunden ska reagera på markören oavsett vad den gör. Bygger generaliserad förväntan.' },
      { id: 'mark_behavior_lure', label: 'Markera lockat beteende', criteria: 'Locka enkelt beteende (sitt med godis över nosen). När rumpan träffar marken → markera ("ja!") → belöna. Markören kommer i exakt rätt ögonblick.' },
      { id: 'mark_offered', label: 'Markera erbjudet beteende', criteria: 'Vänta. När hunden gör något du vill ha (tittar på dig, sätter sig, lugn vila) → markera + belöna. Kallas "capturing" — hunden uppfinner beteendet, du fångar det.' },
      { id: 'mark_chain', label: 'Markör som brygga i kedjor', criteria: 'Markören används mitt i en kedja för att indikera "rätt, fortsätt". T.ex. inkallning: hunden vänder mot dig 5m bort → markera → hunden kommer hela vägen → primär belöning.' },
    ],
    troubleshooting: [
      'Hunden reagerar inte på markören → laddningen har inte satt sig. Gå tillbaka till charge_easy, 50 reps över 2–3 pass.',
      'Markörljudet kommer alltid sent → öva utan hund först (säg "ja!" exakt när bollen träffar marken vid kast).',
      'Hunden hoppar/skäller efter markören istället för att förvänta godis → du har försenat belöningen för många gånger. Snabba upp leveransen, kortare reps.',
    ],
    guide: {
      todaySummary: 'Idag tränar ni inom 0,5 sek efter markörljudet ("ja!" / klick) hör hunden ljudet → tittar på dig / förväntar belöning → får godis.',
      setup: [
        'Välj ett markörljud du kan göra konsekvent: ett kort "ja!", "yes", eller en klicker. Samma ljud, samma ton — alltid.',
        'Ha 20–30 små godisbitar redo (kibble eller mjuk korv) — markörarbete kräver hög frekvens.',
        'Träna i lugn miljö de första 3–5 passen — bygg associationen ren först.',
      ],
      steps: [
        { how: 'Pass 1: 10 reps "ja!" → godis (1 sek mellanrum). Hunden behöver inte göra något — vi laddar markören. 3 sådana pass första dagen.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Pass 2: testa associationen — vänta tills hunden tittar bort, säg "ja!". Tittar hunden på dig direkt? Då är markören laddad.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Pass 3+: börja markera lockade beteenden (sitt, ligg) — markör i exakt sekunden beteendet inträffar, godis 1 sek senare.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'När markören sitter (oftast 1 vecka): börja "capturing" — fånga beteenden hunden erbjuder spontant.', why: 'Så här byggs beteendet steg för steg.' },
      ],
      successLooksLike: 'Lyckad rep = inom 0,5 sek efter markörljudet ("ja!" / klick) hör hunden ljudet → tittar på dig / förväntar belöning → får godis. Markören förutsäger belöning, inget annat.',
      whenItFails: [
        'Hunden reagerar inte på markören → laddningen har inte satt sig. Gå tillbaka till laddningsfasen, 50 reps över 2–3 pass.',
        'Markörljudet kommer alltid sent → öva utan hund först (säg "ja!" exakt när bollen träffar marken vid kast).',
        'Hunden hoppar/skäller efter markören istället för att förvänta godis → du har försenat belöningen för många gånger. Snabba upp leveransen, kortare reps.',
      ],
      wrapUp: [
        'Hunden ignorerar markören → tillbaka till laddningsfasen, 50 reps över 2 pass.',
        'Du märker att timing är konsekvent fel → träna 10 min utan hund (kasta en boll, markera när den studsar) innan nästa pass.',
      ],
    }
  }),

  koppel: spec({
    exerciseId: 'koppel',
    definition: 'Lyckad rep när hunden kan gå med slakt koppel i några steg och återvända till dig för belöning.',
    ladder: [
      { id: 'wear_harness', label: 'Bära sele inne', criteria: 'Hunden bär sele/halsband 1–2 min inne utan att rycka av sig. Belöna lugn. Pre-step för valpar som aldrig burit utrustning.' },
      { id: 'leash_drag', label: 'Släpa koppel inne', criteria: 'Koppel sitter på, du håller inte. Hunden går runt naturligt. Belöna när den närmar sig dig. Bygger neutral association till kopplet.' },
      { id: 'home_2steps', label: 'Inne · 2 steg', criteria: 'Belöna vid din sida efter 1–2 steg.' },
      { id: 'home_5steps', label: 'Inne · 5 steg', criteria: 'Belöna ofta. Vänd om när kopplet sträcks.' },
      { id: 'first_street', label: 'Första gatan · 2 min', criteria: 'Kort sträcka utanför grinden, hög belöningsfrekvens. Inga möten med andra hundar ännu — bygg miljö-trygghet först.' },
      { id: 'outdoor_low', label: 'Ute · låg störning', criteria: 'Kort sträcka. Hög belöningsfrekvens.' },
      { id: 'outdoor_medium', label: 'Ute · medel störning', criteria: 'Öka svårighet gradvis. Hellre backa än nöta.' },
    ],
    troubleshooting: [
      'Belöna tätare och minska förväntningarna (kortare sträckor).',
      'Byt till bättre belöning utomhus.',
      'Byt miljö till enklare och bygg upp igen.',
    ],
    guide: {
      todaySummary: 'Idag tränar ni slakt koppel i korta bitar och belönar när hunden återvänder till din sida.',
      setup: [
        'Ha 10–20 små belöningar redo i fickan.',
        'Starta i lätt miljö (inne/uppfart) innan du går ut i “svårt”.',
        'Målet är slakt koppel i korta bitar, inte lång promenad.',
      ],
      steps: [
        { how: 'Stå still. Vänta 1 sekund på att hunden vänder mot dig → belöna vid din sida.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Gå 1–2 steg. Om kopplet är slakt → belöna direkt.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Om kopplet sträcks → vänd lugnt bort/byt riktning. Belöna när hunden följer och kopplet slakar.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Gör 5–10 “mikro-reps” och ta paus.', why: 'Så här byggs beteendet steg för steg.' },
      ],
      successLooksLike: 'Lyckad rep när hunden kan gå med slakt koppel i några steg och återvända till dig för belöning.',
      whenItFails: [
        'Belöna tätare och minska förväntningarna (kortare sträckor).',
        'Byt till bättre belöning utomhus.',
        'Byt miljö till enklare och bygg upp igen.',
      ],
      wrapUp: [
        'Två miss i rad → sänk kriteriet (kortare sträcka/lättare miljö) och avsluta efter 1 lyckad.',
        'Om hunden inte tar belöning ute → gå in/byt till enklare miljö.',
      ],
    }
  }),

  hantering: spec({
    exerciseId: 'hantering',
    definition: 'Lyckad rep när hunden är lugn och frivilligt låter dig hantera (tassar/mun/borste) i korta microsteg.',
    ladder: [
      { id: 'touch', label: 'Touch', criteria: 'Kort beröring → belöning. Sluta innan hunden vill undan.' },
      { id: 'hold_1s', label: 'Håll 1s', criteria: 'Håll tass/öra 1 sek. Belöna direkt.' },
      { id: 'tool_intro', label: 'Verktyg', criteria: 'Visa borste/klotång → belöna. Ingen klippning ännu.' },
      { id: 'real_1rep', label: '1 rep', criteria: 'En riktig hanteringsrep (t.ex. en klo) → jackpot, slut.' },
    ],
    troubleshooting: [
      'Backa till enklare steg och belöna snabbare.',
      'Kortare pass: 20–60 sek, avsluta i framgång.',
      'Byt till lugnare miljö och lägre intensitet.',
    ],
    guide: {
      todaySummary: 'Idag tränar ni frivillig, lugn hantering i korta microsteg — tassar, mun och borste.',
      setup: [
        'Välj en lugn plats (soffa/golv) och ha många små belöningar.',
        'Målet är “frivilligt och lugnt”, inte att “bli klar”.',
      ],
      steps: [
        { how: 'Rör lätt vid tass/öra 0,5–1 sekund → belöna direkt.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Upprepa 3–5 gånger. Ta paus.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Öka bara ett steg: lite längre hålltid eller lite mer “svårt” område.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Avsluta tidigt (innan hunden vill dra undan).', why: 'Så här byggs beteendet steg för steg.' },
      ],
      successLooksLike: 'Lyckad rep när hunden är lugn och frivilligt låter dig hantera (tassar/mun/borste) i korta microsteg.',
      whenItFails: [
        'Backa till enklare steg och belöna snabbare.',
        'Kortare pass: 20–60 sek, avsluta i framgång.',
        'Byt till lugnare miljö och lägre intensitet.',
      ],
      wrapUp: [
        'Vid stress/undvikande → backa ett steg direkt och avsluta efter 1 lugn rep.',
        'Om hunden blir trött/uppvarvad → pausa och lek/berika istället.',
      ],
    }
  }),

  inkallning: spec({
    exerciseId: 'inkallning',
    definition: 'Lyckad rep när hunden vänder mot dig direkt och kommer hela vägen in (minst 80% i den här miljön).',
    ladder: [
      { id: 'home_no_distance', label: 'Inne · 0–1 m', criteria: 'Säg signalen när hunden redan är nära. Belöna direkt vid vändning.' },
      { id: 'home_2m', label: 'Inne · 2 m', criteria: 'Hunden kommer 2 m på första signalen. Belöna vid kontakt + när den når dig.' },
      { id: 'garden_low', label: 'Ute · låg störning', criteria: 'Enkelt ute (tom gård). Kort avstånd. Belöna snabbt och generöst.' },
      { id: 'park_low', label: 'Ute · låg störning (park)', criteria: 'Korta avstånd, långlina vid behov. Belöna med hög värde-belöning.' },
      { id: 'park_medium', label: 'Ute · medel störning', criteria: 'Öka störning gradvis. Backa nivå om latens blir lång eller miss ökar.' },
    ],
    troubleshooting: [
      'Sänk avstånd och störning (gå en nivå lättare).',
      'Höj belöningsvärdet (bättre godis/leksak) och belöna snabbare.',
      'Kör 3 “enkla” reps i rad innan du provar igen.',
      'Byt miljö (för svårt just här) och gör passet kortare.',
    ],
    goalHints: [
      'Hög success rate i två olika platser på samma nivå.',
      'Kort latens (<1–3s) utan att du “tjatar” med flera signaler.',
    ],
    guide: {
      todaySummary: 'Idag tränar ni att hunden vänder direkt och kommer hela vägen in (minst 80% i den här miljön).',
      setup: [
        'Träna i säker miljö (inne/inhägnat). Ute: använd långlina vid behov.',
        'Ha belöning som är bättre än omgivningen (särskilt ute).',
        'Säg signalen en gång. Om du behöver “tjata” är kriteriet för svårt.',
      ],
      steps: [
        { how: 'Säg hundens namn → när hunden tittar: säg inkallningssignal (“kom”) och backa 1–2 steg.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Belöna direkt när hunden vänder, och igen när den når dig (om du vill bygga fart).', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Släpp hunden igen (“fri”) så inkallning inte betyder “kul tar slut”.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Gör 3–5 reps, pausa, avsluta i framgång.', why: 'Så här byggs beteendet steg för steg.' },
      ],
      successLooksLike: 'Lyckad rep när hunden vänder mot dig direkt och kommer hela vägen in (minst 80% i den här miljön).',
      whenItFails: [
        'Sänk avstånd och störning (gå en nivå lättare).',
        'Höj belöningsvärdet (bättre godis/leksak) och belöna snabbare.',
        'Kör 3 “enkla” reps i rad innan du provar igen.',
        'Byt miljö (för svårt just här) och gör passet kortare.',
      ],
      wrapUp: [
        'Två miss i rad → sänk avstånd/störning direkt och avsluta efter 1 lyckad rep.',
        'Om latens >3s ute → backa till lättare miljö eller högre belöning.',
      ],
    }
  }),

  namn: spec({
    exerciseId: 'namn',
    definition: 'Lyckad rep när hunden vänder blicken mot dig inom 1–3 sek efter namnet.',
    ladder: [
      { id: 'home_no_distraction', label: 'Inne · ingen störning', criteria: 'Säg namn en gång. Belöna direkt vid blick.' },
      { id: 'home_mild_distraction', label: 'Inne · mild störning', criteria: 'Låg distraktion (någon rör sig). Belöna snabb blick.' },
      { id: 'outdoor_low', label: 'Ute · låg störning', criteria: 'Kort pass, hög belöningsfrekvens. Backa nivå vid många missar.' },
      { id: 'outdoor_medium', label: 'Ute · medel störning', criteria: 'Öka störning gradvis. Belöna i position nära dig.' },
    ],
    troubleshooting: [
      'Byt till bättre belöning och belöna varje lyckad rep.',
      'Minska störning och avstånd, gör 5 snabba reps och avsluta.',
      'Säg namnet bara en gång; annars sänk kriteriet istället för att upprepa.',
    ],
    guide: {
      todaySummary: 'Idag tränar ni att hunden vänder blicken mot dig inom 1–3 sek efter namnet.',
      setup: [
        'Ha 10 små belöningar i handen/fickan.',
        'Börja när hunden är relativt lugn (inte mitt i lek/uppvarvning).',
      ],
      steps: [
        { how: 'Säg namnet en gång i glad neutral ton.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Så fort hunden tittar på dig → belöna.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Pausa 1–2 sek och upprepa.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Byt miljö först när du har stabilt flyt hemma.', why: 'Så här byggs beteendet steg för steg.' },
      ],
      successLooksLike: 'Lyckad rep när hunden vänder blicken mot dig inom 1–3 sek efter namnet.',
      whenItFails: [
        'Byt till bättre belöning och belöna varje lyckad rep.',
        'Minska störning och avstånd, gör 5 snabba reps och avsluta.',
        'Säg namnet bara en gång; annars sänk kriteriet istället för att upprepa.',
      ],
      wrapUp: [
        'Två miss i rad → gå närmare/lättare miljö och avsluta efter 1 lyckad rep.',
      ],
    }
  }),

  sitt: spec({
    exerciseId: 'sitt',
    definition: 'Lyckad rep när rumpan är i marken inom 1–3 sek och hunden stannar kvar tills du belönar.',
    ladder: [
      { id: 'home_lure', label: 'Inne · locka', criteria: 'Locka lugnt till sitt med godis över nosen. Belöna när rumpan träffar marken.' },
      { id: 'home_fade_lure', label: 'Inne · fasa ut locket', criteria: 'Gör samma handrörelse men UTAN godis i handen — godis kommer från andra handen efter rumpan är ner. Hjälper att inte fastna i locking-beroende.' },
      { id: 'home_signal', label: 'Inne · signal', criteria: 'Säg "sitt" först, vänta 2 sek. Hjälp med locking bara om hunden inte fattar. Belöna snabbt.' },
      { id: 'home_duration_2s', label: 'Inne · 2 s', criteria: 'Belöna efter ~2 sek sitt (om hunden klarar det lätt).' },
      { id: 'outdoor_low', label: 'Ute · låg störning', criteria: 'Kort duration. Belöna snabbt och ofta.' },
      { id: 'outdoor_medium', label: 'Ute · medel störning', criteria: 'Sänk duration när störning ökar. Endast ett kriterium åt gången.' },
    ],
    troubleshooting: [
      'Sänk kriteriet: belöna snabbare (ingen duration).',
      'Korta passet och gör 3 lätta reps i följd.',
      'Om hunden studsar: byt till lugnare belöning eller belöna lägre/närmare.',
    ],
    guide: {
      todaySummary: 'Idag tränar ni sitt: rumpan i marken inom 1–3 sek och hunden stannar kvar tills du belönar.',
      setup: [
        'Ha 10 små belöningar redo.',
        'Träna i lugn miljö först. Byt plats först när det är stabilt.',
      ],
      steps: [
        { how: 'Visa lockning (om behövs): för belöningen långsamt upp/över nosen → rumpan hamnar i marken.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Markera precis när rumpan träffar marken → belöna direkt.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Säg signal (“sitt”) precis innan du gör samma handrörelse.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Gör 3–5 reps, pausa, avsluta i framgång.', why: 'Så här byggs beteendet steg för steg.' },
      ],
      successLooksLike: 'Lyckad rep när rumpan är i marken inom 1–3 sek och hunden stannar kvar tills du belönar.',
      whenItFails: [
        'Sänk kriteriet: belöna snabbare (ingen duration).',
        'Korta passet och gör 3 lätta reps i följd.',
        'Om hunden studsar: byt till lugnare belöning eller belöna lägre/närmare.',
      ],
      wrapUp: [
        'Två miss i rad → backa (locka igen / lättare miljö) och avsluta efter 1 lyckad.',
        'Om hunden blir uppvarvad: pausa 30–60 sek, gör 1 lätt rep och avsluta.',
      ],
    }
  }),

  ligg: spec({
    exerciseId: 'ligg',
    definition: 'Lyckad rep när hunden lägger sig ner (bröst/armbågar i marken) inom 1–3 sek.',
    ladder: [
      { id: 'home_lure', label: 'Inne · locka', criteria: 'Locka ner från sitt/stå med godis. Belöna när hunden är helt ner.' },
      { id: 'home_fade_lure', label: 'Inne · fasa ut locket', criteria: 'Samma handrörelse men UTAN godis i handen — godis kommer från andra handen när hunden är ner. Bygger respons på handsignalen, inte på maten.' },
      { id: 'home_signal', label: 'Inne · signal', criteria: 'Säg "ligg" först, vänta 2 sek. Locka bara vid behov, belöna slutposition.' },
      { id: 'home_duration_2s', label: 'Inne · 2 s', criteria: 'Belöna efter ~2 sek i ligg om stabilt.' },
      { id: 'outdoor_low', label: 'Ute · låg störning', criteria: 'Kort pass, belöna snabbt och ofta.' },
    ],
    troubleshooting: [
      'Belöna tidigare (sänk kriteriet).',
      'Byt underlag (vissa ogillar kallt/blött).',
      'Gör passet kort: 3–5 reps och avsluta.',
    ],
    guide: {
      todaySummary: 'Idag tränar ni ligg — bröst och armbågar i marken inom 1–3 sek.',
      setup: [
        'Välj ett skönt underlag (matta) i början.',
        'Ha belöningar redo och håll passen korta.',
      ],
      steps: [
        { how: 'Börja från sitt eller stå. För belöningen långsamt ner mot golvet och lite framåt.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'När bröst/armbågar går i marken → belöna direkt.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Säg signal (“ligg”) precis innan du gör samma handrörelse.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Gör 3–5 reps, pausa. Avsluta när det går bra.', why: 'Så här byggs beteendet steg för steg.' },
      ],
      successLooksLike: 'Lyckad rep när hunden lägger sig ner (bröst/armbågar i marken) inom 1–3 sek.',
      whenItFails: [
        'Belöna tidigare (sänk kriteriet).',
        'Byt underlag (vissa ogillar kallt/blött).',
        'Gör passet kort: 3–5 reps och avsluta.',
      ],
      wrapUp: [
        'Två miss i rad → byt underlag/lättare setup och avsluta efter 1 lyckad.',
        'Om hunden blir frustrerad: gör 1 lätt övning (namn/sitt) och avsluta.',
      ],
    }
  }),

  stanna: spec({
    exerciseId: 'stanna',
    definition: 'Lyckad rep när hunden håller positionen (sitt/ligg/stå) tills frikommando eller belöning.',
    ladder: [
      { id: 'home_1s', label: 'Inne · 1 s', criteria: 'Belöna snabbt. Bara ett steg: duration.' },
      { id: 'home_3s', label: 'Inne · 3 s', criteria: 'Öka duration långsamt. Belöna innan hunden bryter.' },
      { id: 'home_step_away', label: 'Inne · 1 steg', criteria: 'Ett steg bort och tillbaka. Belöna snabbt.' },
      { id: 'outdoor_low', label: 'Ute · låg störning', criteria: 'Sänk duration/avstånd. Belöna generöst.' },
    ],
    troubleshooting: [
      'Sänk durationen och belöna innan hunden bryter.',
      'Träna “stanna” i väldigt korta set och variera belöningsposition.',
      'Om hunden följer: minska dina rörelser och bygg upp igen.',
    ],
    guide: {
      todaySummary: 'Idag tränar ni att hunden håller positionen (sitt/ligg/stå) tills frikommando eller belöning.',
      setup: [
        'Välj en position (sitt eller ligg) och träna bara en sak: duration eller avstånd.',
        'Ha belöningen redo så du kan belöna innan hunden bryter.',
      ],
      steps: [
        { how: 'Be om sitt/ligg. Räkna 1 sekund → belöna.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Upprepa 3 reps. Om det är lätt: öka till 2–3 sek (inte mer).', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Nästa steg: 1 steg bort och tillbaka → belöna.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Avsluta när det går bra.', why: 'Så här byggs beteendet steg för steg.' },
      ],
      successLooksLike: 'Lyckad rep när hunden håller positionen (sitt/ligg/stå) tills frikommando eller belöning.',
      whenItFails: [
        'Sänk durationen och belöna innan hunden bryter.',
        'Träna “stanna” i väldigt korta set och variera belöningsposition.',
        'Om hunden följer: minska dina rörelser och bygg upp igen.',
      ],
      wrapUp: [
        'Två miss i rad → korta ner (1 sek) och avsluta efter 1 lyckad.',
      ],
    }
  }),

  stoppsignal: spec({
    exerciseId: 'stoppsignal',
    definition: 'Lyckad rep när hunden bromsar/stannar direkt på signal (1 pip/ord) och kan belönas där den är.',
    ladder: [
      { id: 'home_close', label: 'Inne · nära', criteria: 'Signal → stanna/sitt på 0–1 m. Belöna direkt.' },
      { id: 'home_3m', label: 'Inne · 3 m', criteria: 'Kort avstånd. Belöna snabbt på plats (skicka belöning).' },
      { id: 'outdoor_low', label: 'Ute · låg störning', criteria: 'Långlina. Sänk avstånd om latens ökar.' },
      { id: 'outdoor_medium', label: 'Ute · medel störning', criteria: 'Öka störning gradvis. Hellre backa nivå än upprepa signal.' },
    ],
    troubleshooting: [
      'Sänk avstånd och störning, belöna direkt på plats.',
      'Byt till bättre belöning och kör 3 lätta reps i rad.',
      'Undvik att upprepa signalen – sänk kriteriet istället.',
    ],
    guide: {
      todaySummary: 'Idag tränar ni att hunden bromsar direkt på signal och kan belönas där den är.',
      setup: [
        'Börja nära (0–1 m) i lugn miljö.',
        'Ha belöningar som kan “levereras på plats” (kasta/rulla godis).',
        'Bestäm signal: 1 pip eller ett ord. Använd samma varje gång.',
      ],
      steps: [
        { how: 'När hunden rör sig långsamt: ge stopsignal en gång.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Så fort hunden bromsar/stannar → kasta belöning vid hundens fötter.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Upprepa 3–5 reps med pauser.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Öka först avstånd ELLER störning (inte båda).', why: 'Så här byggs beteendet steg för steg.' },
      ],
      successLooksLike: 'Lyckad rep när hunden bromsar/stannar direkt på signal (1 pip/ord) och kan belönas där den är.',
      whenItFails: [
        'Sänk avstånd och störning, belöna direkt på plats.',
        'Byt till bättre belöning och kör 3 lätta reps i rad.',
        'Undvik att upprepa signalen – sänk kriteriet istället.',
      ],
      wrapUp: [
        'Två miss i rad → gå närmare/lättare miljö och avsluta efter 1 lyckad.',
        'Om hunden blir hetsig: sänk tempo, korta passet, belöna tätare.',
      ],
    }
  }),

  stadga: spec({
    exerciseId: 'stadga',
    definition: 'Lyckad rep när hunden kan vara still/avvaktande trots trigger (rörelse/doft) tills frikommando.',
    ladder: [
      { id: 'home_food', label: 'Inne · mat-trigger', criteria: 'Lämna/avvakta 1–2 sek. Belöna lugn.' },
      { id: 'home_toy', label: 'Inne · leksak i rörelse', criteria: 'Kort trigger. Belöna direkt när hunden håller sig.' },
      { id: 'outdoor_low', label: 'Ute · låg störning', criteria: 'Kortare tid. Belöna ofta för stillhet.' },
      { id: 'outdoor_medium', label: 'Ute · medel störning', criteria: 'Öka trigger gradvis. Endast ett kriterium åt gången.' },
    ],
    troubleshooting: [
      'Sänk triggern (lugnare/mindre nära) och belöna tätare.',
      'Kortare set: 10–20 sek, paus, repetera.',
      'Lägg in 2–3 lätta reps (kontakt/namn) mellan svåra reps.',
    ],
    goalHints: [
      'Hunden kan avvakta med kort latens i två miljöer på samma nivå.',
    ],
    guide: {
      todaySummary: 'Idag tränar ni stillhet och avvaktande trots trigger tills frikommando.',
      setup: [
        'Välj en tydlig trigger (mat, leksak, rörelse) och gör den “svag” först.',
        'Ha belöning redo och jobba i korta set (10–20 sek).',
      ],
      steps: [
        { how: 'Presentera triggern kort (t.ex. visa mat i handen).', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Belöna direkt när hunden väljer lugn/avvaktande (titta bort, stillhet).', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Öka triggern lite (närmare, längre tid, mer rörelse) först när det är stabilt.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Avsluta medan hunden fortfarande klarar det.', why: 'Så här byggs beteendet steg för steg.' },
      ],
      successLooksLike: 'Lyckad rep när hunden kan vara still/avvaktande trots trigger (rörelse/doft) tills frikommando.',
      whenItFails: [
        'Sänk triggern (lugnare/mindre nära) och belöna tätare.',
        'Kortare set: 10–20 sek, paus, repetera.',
        'Lägg in 2–3 lätta reps (kontakt/namn) mellan svåra reps.',
      ],
      wrapUp: [
        'Två miss i rad → sänk triggern direkt och avsluta efter 1 lyckad.',
        'Om hunden blir stressad: byt till orientering/namn och avsluta.',
      ],
    }
  }),

  orientering: spec({
    exerciseId: 'orientering',
    definition: 'Lyckad rep när hunden självmant återorienterar (blick/kom-in) till dig utan att du ropar.',
    ladder: [
      { id: 'home_free', label: 'Inne · fri', criteria: 'Belöna spontana blickar/kom-in. Inga krav.' },
      { id: 'outdoor_low', label: 'Ute · låg störning', criteria: 'Belöna varje orientering i början. Kort pass.' },
      { id: 'outdoor_medium', label: 'Ute · medel störning', criteria: 'Öka störning långsamt. Backa nivå om hunden “försvinner”.' },
    ],
    troubleshooting: [
      'Öka belöningsfrekvensen och sänk störningen.',
      'Byt plats till lättare miljö och bygg upp igen.',
      'Belöna orientering när hunden fortfarande är “kontaktbar”, inte när den redan drar.',
    ],
    guide: {
      todaySummary: 'Idag tränar ni spontana check-ins — hunden återorienterar till dig utan att du ropar.',
      setup: [
        'Målet är spontana check-ins. Inga kommandon i början.',
        'Ha belöning redo och börja i lätt miljö.',
      ],
      steps: [
        { how: 'Var still/neutral. Vänta på att hunden tittar mot dig → belöna.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'När hunden fattar: rör dig lite (1–2 steg) och belöna check-in igen.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Flytta gradvis till lätt ute-miljö och belöna varje check-in i början.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Avsluta efter några lyckade reps (korta pass).', why: 'Så här byggs beteendet steg för steg.' },
      ],
      successLooksLike: 'Lyckad rep när hunden självmant återorienterar (blick/kom-in) till dig utan att du ropar.',
      whenItFails: [
        'Öka belöningsfrekvensen och sänk störningen.',
        'Byt plats till lättare miljö och bygg upp igen.',
        'Belöna orientering när hunden fortfarande är “kontaktbar”, inte när den redan drar.',
      ],
      wrapUp: [
        'Om ingen orientering på ~30–60 sek → byt till lättare miljö och belöna tätare.',
        'Två “miss”-perioder → avsluta och gör en lätt övning hemma.',
      ],
    }
  }),

  kontrollerat_sok: spec({
    exerciseId: 'kontrollerat_sok',
    definition: 'Lyckad rep när hunden söker/nosar men håller kontakt och kan avbryta/komma in vid signal.',
    ladder: [
      { id: 'home_sniff', label: 'Inne · enkelt gömma', criteria: 'Korta sök. Belöna lugn och avslut på signal.' },
      { id: 'outdoor_low', label: 'Ute · låg störning', criteria: 'Enkla sök i gräs. Kort lina vid behov.' },
      { id: 'outdoor_medium', label: 'Ute · medel störning', criteria: 'Öka svårighet gradvis. Pausa innan hunden går upp i varv.' },
    ],
    troubleshooting: [
      'Gör söket enklare och kortare, belöna lugn.',
      'Om hunden drar: byt till orientering/inkallning på lätt nivå och avsluta.',
      'Byt belöning (mer värde) när miljön blir svårare.',
    ],
    guide: {
      todaySummary: 'Idag tränar ni kontrollerat sök: nosar, håller kontakt och kommer in på signal.',
      setup: [
        'Välj ett enkelt sök: 3–5 godisbitar i gräs eller en lätt gömma inne.',
        'Ha en tydlig avslutssignal (“klart”) och belöna avslut.',
        'Ute: använd långlina om du behöver säkerhet/kontroll.',
      ],
      steps: [
        { how: 'Säg “sök” och låt hunden nosa i 10–20 sek.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Säg “klart” och belöna när hunden vänder upp mot dig/kommer in.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Pausa 10–20 sek och upprepa.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Öka svårighet långsamt (störning, större yta, längre tid) en sak i taget.', why: 'Så här byggs beteendet steg för steg.' },
      ],
      successLooksLike: 'Lyckad rep när hunden söker/nosar men håller kontakt och kan avbryta/komma in vid signal.',
      whenItFails: [
        'Gör söket enklare och kortare, belöna lugn.',
        'Om hunden drar: byt till orientering/inkallning på lätt nivå och avsluta.',
        'Byt belöning (mer värde) när miljön blir svårare.',
      ],
      wrapUp: [
        'Två miss i rad → gör söket enklare/kortare och avsluta efter 1 lyckad.',
        'Om hunden blir överhettad: byt till hantering/namn och avsluta.',
      ],
    }
  }),

  impulskontroll: spec({
    exerciseId: 'impulskontroll',
    definition: 'Lyckad rep när hunden kan avstå eller vänta trots trigger, utan att stressa upp.',
    ladder: [
      { id: 'home_easy', label: 'Inne · lätt', criteria: '1–2 sek väntan. Belöna lugn.' },
      { id: 'home_medium', label: 'Inne · medel', criteria: '3–5 sek väntan eller liten rörelse-trigger.' },
      { id: 'outdoor_low', label: 'Ute · låg störning', criteria: 'Kort väntan, belöna ofta.' },
    ],
    troubleshooting: [
      'Sänk tiden och belöna tidigare.',
      'Sänk triggern (längre avstånd) och avsluta i framgång.',
      'Korta set och fler pauser.',
    ],
    guide: {
      todaySummary: 'Idag tränar ni avstående och väntan trots trigger, utan att stressa upp.',
      setup: [
        'Välj en enkel trigger (mat i hand, skål, leksak).',
        'Ha en tydlig “fri”-signal som betyder att hunden får ta/agera.',
      ],
      steps: [
        { how: 'Visa triggern. Vänta 1 sekund av lugn (ingen kast) → belöna.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Öka till 2–3 sek när det är lätt.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Lägg in “fri” ibland som belöning (så kontroll ger tillgång).', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Träna korta set och avsluta i framgång.', why: 'Så här byggs beteendet steg för steg.' },
      ],
      successLooksLike: 'Lyckad rep när hunden kan avstå eller vänta trots trigger, utan att stressa upp.',
      whenItFails: [
        'Sänk tiden och belöna tidigare.',
        'Sänk triggern (längre avstånd) och avsluta i framgång.',
        'Korta set och fler pauser.',
      ],
      wrapUp: [
        'Två miss i rad → sänk tid/trigger och avsluta efter 1 lyckad.',
        'Om hunden blir frustrerad: kör 1 lätt rep (namn) och avsluta.',
      ],
    }
  }),
  socialisering: spec({
    exerciseId: 'socialisering',
    definition: 'Lyckad rep när hunden exponeras för ett nytt stimuli (ljud, yta, människa, djur) och förblir lugn och nyfiken utan stress.',
    ladder: [
      { id: 'home_objects', label: 'Inne · föremål', criteria: 'Låt hunden utforska nytt föremål i lugn takt. Belöna nyfikenhet.' },
      { id: 'outdoor_low', label: 'Ute · låg störning', criteria: 'Ny miljö med lite folk. Observera, belöna lugn.' },
      { id: 'outdoor_people', label: 'Ute · människor', criteria: 'Passerar förbi folk på lagom avstånd. Belöna avslappnad kroppspostur.' },
      { id: 'outdoor_busy', label: 'Ute · hög stimulans', criteria: 'Trafik, barn, andra hundar på avstånd. Fokus på lugn och orientering mot ägaren.' },
    ],
    troubleshooting: [
      'Öka avstånd till triggern och belöna för varje liten lugn stund.',
      'Gå till enklare miljö och bygg upp positivt igen.',
      'Tvinga aldrig — låt hunden välja avstånd.',
    ],
    guide: {
      todaySummary: 'Idag exponerar ni hunden för nytt stimuli och belönar lugn, nyfiken utforskning.',
      setup: [
        'Välj ett nytt stimuli per session.',
        'Ha hög-värde belöning redo.',
        'Mål: hunden väljer att utforska, inte att fly eller frys.',
      ],
      steps: [
        { how: 'Placera dig och hunden på tryggt avstånd från stimulit.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Belöna varje blick mot stimulit som är lugn och nyfiken.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Minska avstånd BARA om hunden är avslappnad och väljer att gå närmre.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Avsluta efter 2–5 lyckade interaktioner.', why: 'Så här byggs beteendet steg för steg.' },
      ],
      successLooksLike: 'Lyckad rep när hunden exponeras för ett nytt stimuli (ljud, yta, människa, djur) och förblir lugn och nyfiken utan stress.',
      whenItFails: [
        'Öka avstånd till triggern och belöna för varje liten lugn stund.',
        'Gå till enklare miljö och bygg upp positivt igen.',
        'Tvinga aldrig — låt hunden välja avstånd.',
      ],
      wrapUp: [
        'Tydliga stresssignaler (gäsp, slicka sig, undvikande) → öka avstånd och avsluta.',
        'Om hunden vägrar ta belöning → för svårt, gå till enklare miljö.',
      ],
    }
  }),

  fokus: spec({
    exerciseId: 'fokus',
    definition: 'Lyckad rep när hunden håller ögonkontakt med föraren i minst 2 sekunder trots distraktion.',
    ladder: [
      { id: 'home_no_distraction', label: 'Inne · ingen störning', criteria: 'Be om ögonkontakt 2 sek. Belöna direkt.' },
      { id: 'home_mild', label: 'Inne · mild störning', criteria: '2–3 sek kontakt med någon rörelse i bakgrunden.' },
      { id: 'outdoor_low', label: 'Ute · låg störning', criteria: 'Kort kontakt i lugn utemiljö. Belöna tätt.' },
      { id: 'outdoor_medium', label: 'Ute · medel störning', criteria: '3–5 sek kontakt med folk/hundar på avstånd.' },
    ],
    troubleshooting: [
      'Belöna kortare ögonkontakt (0,5 sek) och bygg upp gradvis.',
      'Minska störning och öka belöningsvärde.',
      'Träna "fokus" vid lugnare tillfällen och bygg upp association.',
    ],
    guide: {
      todaySummary: 'Idag tränar ni ögonkontakt i minst 2 sekunder trots distraktion.',
      setup: [
        'Stå still. Ha belöning gömd i handen bakom ryggen.',
        'Vänta på spontan ögonkontakt — belöna.',
      ],
      steps: [
        { how: 'Stå still i lugn miljö. Vänta 1–5 sek på att hunden tittar upp på dig.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Märk exakt när ögonkontakt sker → belöna direkt.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Bygg upp duration: belöna efter 1s, 2s, 3s.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Lägg gradvis in distraktion i bakgrunden.', why: 'Så här byggs beteendet steg för steg.' },
      ],
      successLooksLike: 'Lyckad rep när hunden håller ögonkontakt med föraren i minst 2 sekunder trots distraktion.',
      whenItFails: [
        'Belöna kortare ögonkontakt (0,5 sek) och bygg upp gradvis.',
        'Minska störning och öka belöningsvärde.',
        'Träna "fokus" vid lugnare tillfällen och bygg upp association.',
      ],
      wrapUp: [
        'Tre missar i rad → gå till ingen-störning-version och avsluta efter 1 lyckad.',
      ],
    }
  }),

  apportering: spec({
    exerciseId: 'apportering',
    definition: 'Lyckad rep när hunden hämtar objektet, bär det tillbaka mjukt och lämnar det i handen.',
    ladder: [
      { id: 'home_take', label: 'Inne · ta', criteria: 'Hunden tar objektet i munnen frivilligt. Belöna direkt.' },
      { id: 'home_carry', label: 'Inne · bär', criteria: 'Bär objektet 2–3 steg tillbaka till dig. Belöna generöst.' },
      { id: 'home_deliver', label: 'Inne · lämna', criteria: 'Hunden håller kvar tills du öppnar handen/säger "lämna". Byt mot godis.' },
      { id: 'outdoor_short', label: 'Ute · kort kast', criteria: 'Kast 3–5 meter. Hämtar och återvänder. Belöna vid leverans.' },
      { id: 'outdoor_distraction', label: 'Ute · störning', criteria: 'Apportering med mild distraktion i närheten.' },
    ],
    troubleshooting: [
      'Om hunden inte tar objektet: lägg det på marken och belöna varje beröring.',
      'Om hunden springer iväg med det: bli intressant (backa, squeak) — aldrig jaga.',
      'Om hunden tappar det tidigt: belöna för kortare bärning och bygg upp.',
    ],
    guide: {
      todaySummary: 'Idag tränar ni hämtning, mjukt bärande och leverans i handen.',
      setup: [
        'Välj ett objekt hunden gillar (mjukt dummy, leksak).',
        'Träna inne i kort korridor eller liten yta.',
        'Ha belöning redo för utbyte.',
      ],
      steps: [
        { how: 'Visa objektet, kasta 0,5–1 meter.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Uppmuntra med glad röst när hunden tar det.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Backa 1–2 steg → hunden kommer naturligt mot dig.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Byt objektet mot belöning ("lämna").', why: 'Så här byggs beteendet steg för steg.' },
      ],
      successLooksLike: 'Lyckad rep när hunden hämtar objektet, bär det tillbaka mjukt och lämnar det i handen.',
      whenItFails: [
        'Om hunden inte tar objektet: lägg det på marken och belöna varje beröring.',
        'Om hunden springer iväg med det: bli intressant (backa, squeak) — aldrig jaga.',
        'Om hunden tappar det tidigt: belöna för kortare bärning och bygg upp.',
      ],
      wrapUp: [
        'Tre missar i rad → minska kastet till 0,5 m och avsluta efter 1 lyckad.',
        'Om hunden tröttnar → gör 1 kort kast och avsluta.',
      ],
    }
  }),

  vatten: spec({
    exerciseId: 'vatten',
    definition: 'Lyckad rep när hunden frivilligt kliver/simmar in i vatten på uppmuntran.',
    ladder: [
      { id: 'puddle', label: 'Pöl / grunt', criteria: 'Kliver i pöl eller vid vattenkanten. Belöna varje steg in.' },
      { id: 'knee_deep', label: 'Knädjupt', criteria: 'Vadare. Frivilligt. Inga tvång.' },
      { id: 'swim_short', label: 'Simning · kort', criteria: 'Simmar 1–2 meter och återvänder. Belöna generöst vid retur.' },
      { id: 'retrieve_water', label: 'Apportering i vatten', criteria: 'Hämtar dummy i grunt vatten och levererar.' },
    ],
    troubleshooting: [
      'Tvinga aldrig in hunden — det skapar negativ association som är svår att reparera.',
      'Börja med stillastående grunt vatten och lek nära kanten.',
      'Om hunden är rädd: gå tillbaka till pöl/kanten och belöna närvaro.',
    ],
    guide: {
      todaySummary: 'Idag tränar ni frivilligt vattenarbete — kliva eller simma in på uppmuntran.',
      setup: [
        'Välj stillastående, grunt vatten (strand/bäck) i lugn miljö.',
        'Ha hög-värde belöning och leksak redo.',
        'Kliv gärna i vattnet själv — hunden följer ofta.',
      ],
      steps: [
        { how: 'Låt hunden sniffa och utforska kanten. Belöna nyfikenhet.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Kasta belöning/leksak nära kanten i vattnet.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Öka gradvis djupet och kastet när hunden är trygg.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Avsluta alltid innan hunden är trött/kall.', why: 'Så här byggs beteendet steg för steg.' },
      ],
      successLooksLike: 'Lyckad rep när hunden frivilligt kliver/simmar in i vatten på uppmuntran.',
      whenItFails: [
        'Tvinga aldrig in hunden — det skapar negativ association som är svår att reparera.',
        'Börja med stillastående grunt vatten och lek nära kanten.',
        'Om hunden är rädd: gå tillbaka till pöl/kanten och belöna närvaro.',
      ],
      wrapUp: [
        'Tydliga rädslosignaler → avsluta sessionen och bygg upp nästa gång från grunt.',
        'Om hunden skakar/är kall → avsluta.',
      ],
    }
  }),

  vallning: spec({
    exerciseId: 'vallning',
    definition: 'Lyckad rep när hunden visar kontrollerat vallningsbeteende (eye, crouch, flank) och kan avbryta/komma in på signal.',
    ladder: [
      { id: 'follow_handler', label: 'Följ hanteraren', criteria: 'Hunden rör sig med hanteraren runt en trigger (boll/cone). Belöna nära kontakt.' },
      { id: 'eye_cone', label: 'Eye mot kon', criteria: 'Hunden "låser" blicken (eye) mot ett objekt på kommando. Belöna stillhet + fokus.' },
      { id: 'flank_short', label: 'Kort flank', criteria: 'Hunden rör sig ett halvt varv runt objektet på signal ("fot" / "bort"). Belöna smidig rörelse.' },
      { id: 'stop_on_signal', label: 'Stopp i rörelse', criteria: 'Hunden stannar mitt i flanken på stoppsignal. Kombinerar vallning + impulskontroll.' },
    ],
    troubleshooting: [
      'Om hunden går upp i varv/kastar sig: öka avstånd till "bytet" och belöna stillhet.',
      'Blanda alltid in stoppsignal/impulskontroll — vallning utan stopp är okontrollerad instinkt.',
      'Korta pass (3–5 min) — vallning är mentalt och fysiskt intensivt.',
    ],
    guide: {
      todaySummary: 'Idag tränar ni kontrollerad vallning (eye, flank) med avbrott på signal.',
      setup: [
        'Träna alltid utan boskap här i appen — använd boll, kon eller skateboard som "byte". Live-djur kräver instruktör på plats (vallningsklubb, Svenska Brukshundklubbens vallningskurs).',
        'Ha stoppsignal säkert inlärd INNAN du introducerar rörliga triggers.',
        'Korta pass, ren grundträning av eye/flank/stop — inte boskapskontakt.',
      ],
      steps: [
        { how: 'Rör dig runt objektet och belöna hunden för att följa i kontrollerat tempo.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Introducera "eye": peka mot objektet → belöna när hunden låser blicken.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Lägg till en kort flanksida (halv cirkel) på signal.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Avbryt med stoppsignal eller "här" och belöna lydig avslutning.', why: 'Så här byggs beteendet steg för steg.' },
      ],
      successLooksLike: 'Lyckad rep när hunden visar kontrollerat vallningsbeteende (eye, crouch, flank) och kan avbryta/komma in på signal.',
      whenItFails: [
        'Om hunden går upp i varv/kastar sig: öka avstånd till "bytet" och belöna stillhet.',
        'Blanda alltid in stoppsignal/impulskontroll — vallning utan stopp är okontrollerad instinkt.',
        'Korta pass (3–5 min) — vallning är mentalt och fysiskt intensivt.',
      ],
      wrapUp: [
        'Hunden ignorerar stoppsignal → avsluta sessionen och träna impulskontroll separat.',
        'Tydlig stress/jakt-beteende → öka avstånd och avsluta.',
        'För kontakt med riktiga djur: gå via lokal vallningsklubb eller SBK — appen tränar bara grundmekaniken.',
      ],
    }
  }),

  nosework: spec({
    exerciseId: 'nosework',
    definition: 'Lyckad rep när hunden hittar gömd doft/belöning och indikerar platsen tydligt (sitter/pöser/pekar).',
    ladder: [
      { id: 'box_1', label: 'Boxsök · 1 box', criteria: 'En box med belöning, 2–3 tomma. Hunden hittar och indikerar.' },
      { id: 'box_multi', label: 'Boxsök · flera boxar', criteria: '5–8 boxar. Söker systematiskt och stannar vid rätt.' },
      { id: 'room_search', label: 'Rumssök', criteria: 'Doften gömd i rummet (ej i box). Systematiskt sök.' },
      { id: 'outdoor_search', label: 'Utomhussök', criteria: 'Söker i avgränsat utomhusområde. Hittar och indikerar.' },
    ],
    troubleshooting: [
      'Om hunden tappar intresset: gör boxen med belöningen uppenbar och belöna snabbt.',
      'Om hunden gissar slumpmässigt: öka värdet på belöningen vid rätt box.',
      'Korta pass (3–5 sök) och avsluta med en lätt vinst.',
    ],
    guide: {
      todaySummary: 'Idag tränar ni att hitta gömd doft och indikera platsen tydligt.',
      setup: [
        'Börja med mat-doft (godis i box) — inte nödvändigt med specifik doft.',
        'Starta med 1 box utan lock, bygg upp till stängda boxar.',
        'Sätt upp en tydlig "sök"-signal.',
      ],
      steps: [
        { how: 'Placera belöning i en av 3 boxar. Låt hunden se dig (intro-fas).', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Säg "sök" och låt hunden hitta. Belöna generöst direkt.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Öka antal boxar och döm belöningen bättre.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Byt till doftpinne (t.ex. birch) när hunden förstår spelet.', why: 'Så här byggs beteendet steg för steg.' },
      ],
      successLooksLike: 'Lyckad rep när hunden hittar gömd doft/belöning och indikerar platsen tydligt (sitter/pöser/pekar).',
      whenItFails: [
        'Om hunden tappar intresset: gör boxen med belöningen uppenbar och belöna snabbt.',
        'Om hunden gissar slumpmässigt: öka värdet på belöningen vid rätt box.',
        'Korta pass (3–5 sök) och avsluta med en lätt vinst.',
      ],
      wrapUp: [
        'Tre missar i rad → gör ett lätt fynd och avsluta.',
        'Om hunden verkar mentalt trött (ointresserad, söker ytligt) → avsluta.',
      ],
    }
  }),

  fri: spec({
    exerciseId: 'fri',
    definition: 'Lyckad rep när hunden håller ett beteende (sitt/ligg/stanna/plats) tills "fri" ges — och inte bryter utan signal.',
    ladder: [
      { id: 'after_sitt_1s', label: 'Efter sitt · 1s', criteria: 'Hunden sitter tills du säger "fri" med glad ton. Belöna frihet (låt den röra sig).' },
      { id: 'after_ligg_3s', label: 'Efter ligg · 3s', criteria: 'Hunden ligger 3s tills fri. Avsluta varje ligg/stanna med fri-signal.' },
      { id: 'duration_10s', label: 'Durationer · 10s', criteria: 'Hunden väntar avspänd 10s i position tills fri ges.' },
      { id: 'duration_30s', label: 'Durationer · 30s', criteria: 'Hunden väntar 30s med lätt distraktion runtomkring.' },
    ],
    troubleshooting: [
      'Ge ALLTID fri-signal — hunden ska aldrig avsluta beteendet på eget initiativ.',
      'Om hunden bryter: ingen kommentar, gör om med kortare duration, avsluta på lyckad.',
      'Fri är en belöning — ge det med glad ton och låt hunden njuta av friheten.',
    ],
    guide: {
      todaySummary: 'Idag tränar ni att hunden håller beteende tills "fri" ges — utan att bryta själv.',
      setup: [
        'Välj ett konsekvent ord: "fri", "ok" — och håll det.',
        'Träna alltid fri i kombination med ett annat beteende (sitt, ligg, stanna, plats).',
        'Avsluta varje träningspass med en fri-signal efter sista rep.',
      ],
      steps: [
        { how: 'Be om sitt. Vänta 1s. Ge "fri" med glad ton → uppmuntra att hunden rör sig.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Be om ligg. Vänta 3s. Ge "fri" → belöna frihet.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Öka väntetiden gradvis: 1s → 3s → 5s → 10s → 30s.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Variera varaktigheten inom passet — ibland kort, ibland lång.', why: 'Så här byggs beteendet steg för steg.' },
      ],
      successLooksLike: 'Lyckad rep när hunden håller ett beteende (sitt/ligg/stanna/plats) tills "fri" ges — och inte bryter utan signal.',
      whenItFails: [
        'Ge ALLTID fri-signal — hunden ska aldrig avsluta beteendet på eget initiativ.',
        'Om hunden bryter: ingen kommentar, gör om med kortare duration, avsluta på lyckad.',
        'Fri är en belöning — ge det med glad ton och låt hunden njuta av friheten.',
      ],
      wrapUp: [
        'Tre brott i rad → förkorta duration till 1s och avsluta på lyckad.',
      ],
    }
  }),

  fot: spec({
    exerciseId: 'fot',
    definition: 'Lyckad rep när hunden går i fotsteg (vänster sida, axeln vid ditt knä) i 3–5 steg med blickkontakt.',
    ladder: [
      { id: 'home_position', label: 'Inne · position', criteria: 'Hunden ställer sig bredvid vänster ben och tar belöning vid höften.' },
      { id: 'home_3steps', label: 'Inne · 3 steg', criteria: 'Hunden håller fotposition i 3 steg. Belöna vid höften, inte framför.' },
      { id: 'outdoor_low', label: 'Ute · låg störning', criteria: '5 steg med fokus. Stopp, stopp → belöna. Håll hög frekvens.' },
      { id: 'outdoor_turns', label: 'Ute · vändningar', criteria: 'Hunden håller position vid svängningar åt båda håll.' },
    ],
    troubleshooting: [
      'Om hunden drar framåt: gör fler riktningsändringar, belöna när hunden är vid ditt knä.',
      'Om hunden tappar fokus: sänk svårighetsgraden och belöna tätare.',
      'Blanda in korta fotsteg-sekvenser i vanliga promenader.',
    ],
    guide: {
      todaySummary: 'Idag tränar ni fotsteg vid vänster sida i 3–5 steg med blickkontakt.',
      setup: [
        'Ha belöning i vänster hand eller ficka — inte framför hunden.',
        'Börja inne med låg distraktion.',
        'Skilj tydligt på "fot" (exakt position) och vanlig koppelgång.',
      ],
      steps: [
        { how: 'Locka hunden till vänster sida med belöning vid din vänstra höft.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Ge signalen "fot" + gå 2–3 steg → belöna vid din höft om hunden håller position.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Öka stegantalet gradvis när hunden förstår positionen.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Lägg till riktningsändringar för att hålla uppmärksamheten.', why: 'Så här byggs beteendet steg för steg.' },
      ],
      successLooksLike: 'Lyckad rep när hunden går i fotsteg (vänster sida, axeln vid ditt knä) i 3–5 steg med blickkontakt.',
      whenItFails: [
        'Om hunden drar framåt: gör fler riktningsändringar, belöna när hunden är vid ditt knä.',
        'Om hunden tappar fokus: sänk svårighetsgraden och belöna tätare.',
        'Blanda in korta fotsteg-sekvenser i vanliga promenader.',
      ],
      wrapUp: [
        'Tre missar i rad → sänk till kortare sträcka och avsluta på lyckad.',
        'Hunden visar stresssignaler (gäspar, vänder bort) → avsluta och träna lättare nästa gång.',
      ],
    }
  }),

  plats: spec({
    exerciseId: 'plats',
    definition: 'Lyckad rep när hunden självmant går till sin matta, lägger sig och väntar tills fri-signal ges.',
    ladder: [
      { id: 'intro_mat', label: 'Intro matta', criteria: 'Hunden utforskar och trampar på mattan. Belöna all kontakt (capturing — fånga frivilligt beteende, locka inte).' },
      { id: 'capture_lie_on_mat', label: 'Fånga ligg på matta', criteria: 'Vänta tills hunden lägger sig på mattan av sig själv → jackpot. Inga signaler ännu — hunden lär sig att MATTAN orsakar belöning.' },
      { id: 'go_to_mat', label: 'Gå till matta', criteria: 'Hunden går till mattan och lägger sig på signal "plats". Lägg på signal när hunden gör beteendet pålitligt själv.' },
      { id: 'duration_5s', label: 'Durationer 5s', criteria: 'Hunden stannar liggandes 5 sekunder med lätta distraktioner.' },
      { id: 'duration_30s', label: 'Durationer 30s', criteria: 'Hunden stannar 30s medan du rör dig runtomkring. Avsluta med "fri".' },
    ],
    troubleshooting: [
      'Om hunden inte lägger sig: forma ligg på mattan med luringlocket och belöna.',
      'Om hunden stiger upp tidigt: minska durationen och belöna tätare på mattan.',
      'Bygg upp durationen i väldigt små steg — 1s, 3s, 5s, 10s.',
    ],
    guide: {
      todaySummary: 'Idag tränar ni att hunden går till mattan, lägger sig och väntar tills fri-signal.',
      setup: [
        'Välj en specifik matta/plats — hunden kopplar tydligt objekt till beteendet.',
        'Lägg mattan synlig men inte mitt i vägen.',
        'Ha många små belöningar redo — belöna på mattan, inte vid dig.',
      ],
      steps: [
        { how: 'Locka/peka mot mattan → belöna direkt när hunden kliver på.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Vänta på att hunden lägger sig (forma om det behövs) → jackpot-belöning på mattan.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Ge "plats"-signalen precis innan hunden rör sig mot mattan.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Öka duration gradvis. Avsluta alltid med tydlig "fri"-signal.', why: 'Så här byggs beteendet steg för steg.' },
      ],
      successLooksLike: 'Lyckad rep när hunden självmant går till sin matta, lägger sig och väntar tills fri-signal ges.',
      whenItFails: [
        'Om hunden inte lägger sig: forma ligg på mattan med luringlocket och belöna.',
        'Om hunden stiger upp tidigt: minska durationen och belöna tätare på mattan.',
        'Bygg upp durationen i väldigt små steg — 1s, 3s, 5s, 10s.',
      ],
      wrapUp: [
        'Tre missar → gå tillbaka till kortare duration och avsluta på lyckad.',
        'Om hunden vägrar ligga → träna ligg separat och återkom till plats.',
      ],
    }
  }),

  rastning: spec({
    exerciseId: 'rastning',
    definition: 'Lyckad rep = hunden kissar/bajsar utomhus (eller på avsedd plats) inom 2 minuter efter att du tagit ut den. Belöna direkt på plats.',
    ladder: [
      { id: 'after_sleep', label: 'Efter sömn', criteria: 'Ut direkt när valpen vaknar — innan den hinner kissa inne. Vänta lugnt, belöna när det händer ute.' },
      { id: 'after_meal', label: 'Efter mat', criteria: 'Ut 5–15 min efter måltid. Stå still, låt valpen sniffa. Belöna när den lättar sig.' },
      { id: 'after_play', label: 'Efter lek', criteria: 'Ut direkt efter aktivitet — rörelse triggar tarm/blåsa.' },
      { id: 'scheduled_60min', label: 'Var 60 min', criteria: 'Schemalagda turer för valpar 8–12 v: var 60 min vaken tid + alltid efter sömn/mat/lek.' },
      { id: 'scheduled_90min', label: 'Var 90 min', criteria: 'För valpar 12–16 v som klarar längre intervall.' },
      { id: 'asks_to_go', label: 'Ber själv om att gå ut', criteria: 'Hunden signalerar tydligt (går till dörr, gnäller, tittar) när den behöver ut.' },
    ],
    troubleshooting: [
      'Olyckor inne = för långa intervall eller missade signaler. Korta intervallet, läs hunden bättre.',
      'Belöna ALDRIG efteråt inne — bara på plats där den lyckas. Annars kopplas belöningen till att gå tillbaka in.',
      'Straffa aldrig olyckor — torka upp neutralt med enzymatisk rengöring (ta bort doft helt).',
    ],
    guide: {
      todaySummary: 'Idag tränar ni utomhusrastning — kiss/bajs på avsedd plats inom 2 minuter efter att ni gått ut.',
      setup: [
        'Bestäm en fast rastningsplats utomhus de första veckorna — samma doft hjälper igångsättning.',
        'Ha godis i fickan redan när du sätter på kopplet — du måste belöna inom 1 sekund.',
        'Notera tider: när valpen åt, sov, lekte, kissade — så ser du mönstret.',
      ],
      steps: [
        { how: 'Vakna valpen? → bär den ut direkt (inte gå — de kissar i trappan).', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Stå stilla utomhus, säg en mjuk signal ("kissa", "bajs"). Vänta upp till 2 min.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'I sekunden hunden börjar lätta sig: säg "ja!" mjukt. När den är klar — belöna direkt på plats med 2–3 godis.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Sen 1–2 minuter lek/utforska som extra belöning innan ni går in.', why: 'Så här byggs beteendet steg för steg.' },
      ],
      successLooksLike: 'Lyckad rep = hunden kissar/bajsar utomhus (eller på avsedd plats) inom 2 minuter efter att du tagit ut den. Belöna direkt på plats.',
      whenItFails: [
        'Olyckor inne = för långa intervall eller missade signaler. Korta intervallet, läs hunden bättre.',
        'Belöna ALDRIG efteråt inne — bara på plats där den lyckas. Annars kopplas belöningen till att gå tillbaka in.',
        'Straffa aldrig olyckor — torka upp neutralt med enzymatisk rengöring (ta bort doft helt).',
      ],
      wrapUp: [
        '2+ olyckor inne på samma dag → minska intervallen med 30 min och stå längre ute.',
        'Hunden kissar lite, sedan börjar leka, sedan kissar igen inne → låt den sniffa runt ute längre innan ni går in.',
      ],
    }
  }),

  bett_inhibition: spec({
    exerciseId: 'bett_inhibition',
    definition: 'Lyckad rep = valpen släpper handen/kläderna inom 2 sekunder efter ditt feedback-ljud, ELLER väljer ett godkänt alternativ (leksak, tugg) av sig själv.',
    ladder: [
      { id: 'aj_pause', label: '"Aj" + paus', criteria: 'När valpen biter hårt: säg "Aj!" mjukt + frys helt 3 sekunder. Belöna när den släpper.' },
      { id: 'redirect_toy', label: 'Omdirigera till leksak', criteria: 'Erbjud godkänt tuggalternativ samtidigt som du drar bort handen.' },
      { id: 'walk_away', label: 'Gå därifrån vid hårt bett', criteria: 'Hårt bett = leken slutar. Res dig, vänd dig bort 30 sek. Kom tillbaka lugnt och starta om mjukare.' },
      { id: 'self_redirect', label: 'Valpen väljer själv leksak', criteria: 'När valpen är överstimulerad går den frivilligt till sin leksak istället för att bita.' },
    ],
    troubleshooting: [
      '"Aj" funkar inte → valpen är överstimulerad. Time-out: gå ifrån, lugnt, 30 sekunder.',
      'Värst på kvällarna → trötthet och överstimulering. Inför vilopaus i bur/box innan kvällsbettet börjar.',
      'Bett mot barn → barn ska aldrig vara primär bettmål. Separera fysiskt och bygg upp lugna interaktioner från valpens vila-läge.',
    ],
    guide: {
      todaySummary: 'Idag tränar ni att valpen släpper handen snabbt eller väljer godkänt tuggalternativ.',
      setup: [
        'Ha alltid 2–3 godkända tuggleksaker tillgängliga (kong, raggsocka med knut, gummi-tugg).',
        'Bestäm en tydlig regel: vid hårt bett slutar leken — alla i hushållet följer samma regel.',
        'Identifiera valpens överstimulerings-fönster — ofta sen kväll efter en lång dag.',
      ],
      steps: [
        { how: 'Valp biter mjukt (lek-bett): säg "Aj!" om det blir hårdare, fortsätt om det är mjukt.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Valp biter hårt: säg "Aj!" mjukt + frys helt (ingen rörelse i 3 sek). När den släpper → erbjud leksak.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Valpen tar leksaken → 30 sek lek med leksaken som belöning för rätt val.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Valpen biter igen efter 1–2 reps → leken är slut. Res dig, gå ifrån 30 sek. Återvänd lugnt och starta om eller lägg valpen i vila.', why: 'Så här byggs beteendet steg för steg.' },
      ],
      successLooksLike: 'Lyckad rep = valpen släpper handen/kläderna inom 2 sekunder efter ditt feedback-ljud, ELLER väljer ett godkänt alternativ (leksak, tugg) av sig själv.',
      whenItFails: [
        '"Aj" funkar inte → valpen är överstimulerad. Time-out: gå ifrån, lugnt, 30 sekunder.',
        'Värst på kvällarna → trötthet och överstimulering. Inför vilopaus i bur/box innan kvällsbettet börjar.',
        'Bett mot barn → barn ska aldrig vara primär bettmål. Separera fysiskt och bygg upp lugna interaktioner från valpens vila-läge.',
      ],
      wrapUp: [
        '3+ time-outs i rad → valpen är trött. Lägg den i bur/box för en lugn vila.',
        'Hårda bett mot barn → träna ALDRIG själv, separera fysiskt och kontakta beteendekonsulent.',
      ],
    }
  }),

  box_traning: spec({
    exerciseId: 'box_traning',
    definition: 'Lyckad rep = hunden går frivilligt in i sin bur/box och stannar lugnt under den tid du tränar (start: 10 sek, mål: 1 timme tyst vila).',
    ladder: [
      { id: 'eat_in_open', label: 'Äter i öppen bur', criteria: 'Ställ matskålen längst in i buren. Hunden går in själv och äter. Dörren öppen hela tiden.' },
      { id: 'door_closed_30s', label: 'Stängd dörr · 30 sek', criteria: 'Stäng dörren medan hunden äter, öppna innan den är klar. Stegvis längre.' },
      { id: 'rest_5min', label: 'Vila 5 min', criteria: 'Hunden vilar i buren 5 min med stängd dörr, du i samma rum. Belöna lugn vila vid släpp.' },
      { id: 'rest_30min', label: 'Vila 30 min', criteria: 'Som ovan men 30 min. Bör vara nedvarvad/tröttkörd när du sätter den i buren.' },
      { id: 'alone_15min', label: 'Du går ifrån · 15 min', criteria: 'Du lämnar rummet (eller hemmet) 15 min, hunden vilar i buren.' },
    ],
    troubleshooting: [
      'Hunden gnyr/skäller i buren → backa nivån. Du höjde duration för fort eller hunden var inte trött.',
      'Vägrar gå in → börja om från "äter i öppen bur" med extra god mat (lever, korv). Ta veckor om så behövs.',
      'Hunden går in men panikar när dörren stängs → öppna direkt, ingen press. Träna värdefulla saker (kong med kyld leverpate) i öppen bur tills den älskar platsen.',
    ],
    guide: {
      todaySummary: 'Idag tränar ni frivillig burträning — gå in och vila lugnt (börja med 10 sek).',
      setup: [
        'Bur i passande storlek — hunden ska kunna stå, vända sig och ligga utsträckt. Inte större (för stor = de kissar i ena hörnet).',
        'Mjuk filt + 1–2 favorittuggleksaker. Aldrig täcke som kan kvävas.',
        'Placera buren i ett lugnt rum, inte i farstun där det går folk hela tiden.',
        'Aldrig som straff — buren ska vara en bra plats, inte en "time-out"-cell.',
      ],
      steps: [
        { how: 'Dag 1–3: dörr öppen, mata hunden i buren, kasta in godis när den går nära.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Dag 4–7: stäng dörren medan den äter, öppna innan klar. 5 sek → 30 sek → 1 min.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Vecka 2: hunden går in på signal ("plats"/"in"). Stängd dörr 5–15 min medan du är i rummet.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Vecka 3+: bygg upp tid + du går ifrån. Aldrig släppa ut när den skäller — vänta tystnad (även 5 sek räcker) först.', why: 'Så här byggs beteendet steg för steg.' },
      ],
      successLooksLike: 'Lyckad rep = hunden går frivilligt in i sin bur/box och stannar lugnt under den tid du tränar (start: 10 sek, mål: 1 timme tyst vila).',
      whenItFails: [
        'Hunden gnyr/skäller i buren → backa nivån. Du höjde duration för fort eller hunden var inte trött.',
        'Vägrar gå in → börja om från "äter i öppen bur" med extra god mat (lever, korv). Ta veckor om så behövs.',
        'Hunden går in men panikar när dörren stängs → öppna direkt, ingen press. Träna värdefulla saker (kong med kyld leverpate) i öppen bur tills den älskar platsen.',
      ],
      wrapUp: [
        'Hunden gnyr > 5 min trots att den nyss varit ut och kissat → låt henne ut, kortare duration nästa pass.',
        'Hunden får panik-attack (hyperventilation, salivar, vägrar mat efter) → STOPP. Detta är möjlig separationsångest. Kontakta beteendekonsulent innan ni fortsätter.',
      ],
    }
  }),

  ensam_traning: spec({
    exerciseId: 'ensam_traning',
    definition: 'Lyckad rep = hunden är lugn (ingen skall, gnyl, panik) under hela den tid du är borta. Bygger upp från 30 sek till flera timmar.',
    ladder: [
      { id: 'separation_30s', label: '30 sek separation', criteria: 'Gå till nästa rum, stäng dörren, kom tillbaka. Ingen reaktion = lyckad.' },
      { id: 'separation_5min', label: '5 min separation', criteria: 'Lämna hemmet (gå till källaren/utanför dörren) i 5 min.' },
      { id: 'errand_30min', label: '30 min kort ärende', criteria: 'Gå till mataffären/posten. Hunden ensam hemma, gärna i bur eller på sin plats.' },
      { id: 'errand_2h', label: '2 timmar borta', criteria: 'Längre ärende. Förutsätter att 30-min-nivån är solid.' },
      { id: 'workday_4h', label: 'Halv arbetsdag · 4 h', criteria: 'Maxgräns för vuxen hund. Valp under 6 mån klarar mindre.' },
    ],
    troubleshooting: [
      'Hunden börjar reagera redan vid 30 sek → börja om från sekundnivå (öppna dörren, stäng, öppna).',
      'Du har gått 5 min flera gånger utan problem, men 30 min blir kaos → kliv inte upp i nivå för fort, bygg gradvis (10 → 15 → 20 min).',
      'Skäller bara mot grannar eller ljud → inte separationsångest. Trygga miljön (vita-brus, gardiner) istället.',
    ],
    guide: {
      todaySummary: 'Idag tränar ni ensamhet: hunden ska vara lugn utan skall, gnyl eller panik medan du är borta.',
      setup: [
        'Tröttkör hunden fysiskt + mentalt INNAN du tränar ensamhet — en sömnig hund klarar mer.',
        'Lämna en fryst kong eller långtuggande gott (utan att hunden hinner äta upp på 1 min).',
        'Filma hunden (telefonkamera, baby-monitor) första gångerna — du behöver se vad som händer när du går.',
        'Aldrig stort avsked eller stor hälsning. Lämna och kom hem neutralt.',
      ],
      steps: [
        { how: 'Sätt på morgonrock + skor (avskedscues) — gå INTE. Sätt dig igen. Upprepa till hunden inte längre reagerar på cues.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Gå ut genom dörren — kom tillbaka direkt (5 sek). Belöna när hunden är lugn.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Bygg duration: 30 sek → 1 min → 2 min → 5 min → 15 min → 30 min. Hoppa aldrig över steg.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Variera tider — så hunden inte räknar minuter. Ibland 5 min, ibland 30, ibland 2 h.', why: 'Så här byggs beteendet steg för steg.' },
      ],
      successLooksLike: 'Lyckad rep = hunden är lugn (ingen skall, gnyl, panik) under hela den tid du är borta. Bygger upp från 30 sek till flera timmar.',
      whenItFails: [
        'Hunden börjar reagera redan vid 30 sek → börja om från sekundnivå (öppna dörren, stäng, öppna).',
        'Du har gått 5 min flera gånger utan problem, men 30 min blir kaos → kliv inte upp i nivå för fort, bygg gradvis (10 → 15 → 20 min).',
        'Skäller bara mot grannar eller ljud → inte separationsångest. Trygga miljön (vita-brus, gardiner) istället.',
      ],
      wrapUp: [
        'Hunden förstör (möbler, dörrar, golv) när du varit borta → stoppa nuvarande nivå, backa till 50%.',
        'Hunden visar tecken på panik (drev/saliv/självskada) → STOPP, detta är separationsångest. Kontakta beteendekonsulent — det här tränas inte bort själv.',
      ],
    }
  }),

  lat: spec({
    exerciseId: 'lat',
    definition: 'Lyckad rep = hunden tittar på triggern (max 1 sekund), vänder sig sedan mot dig av sig själv, och tar belöning lugnt. Allt händer under threshold — ingen skällning, ingen fixering.',
    ladder: [
      { id: 'mark_neutral', label: 'Markera neutral titt inne', criteria: 'Hunden tittar på vad som helst (bok, lampa), du markerar och belönar. Bygger associationen: titta → markör → godis. Ingen trigger än.' },
      { id: 'trigger_far', label: 'Trigger på långt avstånd', criteria: 'Identifiera ditt working distance — det avstånd där hunden ser triggern men kan ta godis. Markera varje gång hunden tittar på triggern, belöna mot dig.' },
      { id: 'trigger_medium', label: 'Trigger medel avstånd', criteria: 'Minska avstånd 25%. Endast om hunden konsekvent vänder mot dig efter markering på förra nivån.' },
      { id: 'multiple_triggers', label: 'Flera triggers samma session', criteria: 'Två olika triggers i samma session (cyklist + hund), längre avstånd. Bygger generalisering.' },
      { id: 'recovery_check', label: 'Återhämtningstest', criteria: 'Efter en trigger-passage: hunden ska kunna utföra ett känt beteende (sitt, fokus) inom 10 sek. Om nej → backa avstånd.' },
    ],
    troubleshooting: [
      'Hunden fixerar och tar inte godis → du är för nära. Backa 5–10 m. Working distance är inte konstant — det varierar med dagsform.',
      'Hunden vänder mot dig men nappar inte godiset → godiset är inte värt nog. Använd korv, lever, ost — high-value enbart vid trigger-träning.',
      'Hunden skäller redan när du tagit fram godiset (förväntan-skäll) → byt rutin: ut till trigger-zon, sätt dig 5 min, vänta tills hunden är lugn innan godis.',
    ],
    guide: {
      todaySummary: 'Idag tränar ni LAT: kort blick på trigger, sedan vända mot dig och ta belöning lugnt.',
      setup: [
        'Identifiera DIN hunds working distance i förväg (en lugn promenad utan trigger-pass) — det avståndet där den ser triggern men fortfarande kan engagera sig.',
        'High-value belöningar (korv, lever, ost) ENBART för LAT — inte vanligt godis.',
        'Markörsignal (klicker eller "ja!") måste vara laddad och pålitlig innan LAT-träning.',
        'Träna med fasta triggers (du parkerar nära en hundpark t.ex.) innan rörliga möten.',
      ],
      steps: [
        { how: 'Stå på working distance från triggern, vid sidan av en bil eller buske om hunden behöver visuell skydd.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Vänta. När hunden tittar på triggern → markera DIREKT (inom 0,5 sek).', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Belöna nära ditt ben, så hunden vänder mot dig för att äta. Detta är "automatic check-in" — det vi tränar.', why: 'Så här byggs beteendet steg för steg.' },
        { how: 'Upprepa 5–10 reps. Sluta INNAN hunden tröttnar eller börjar fixera. Avsluta passet med en lugn promenad bort från triggern.', why: 'Så här byggs beteendet steg för steg.' },
      ],
      successLooksLike: 'Lyckad rep = hunden tittar på triggern (max 1 sekund), vänder sig sedan mot dig av sig själv, och tar belöning lugnt. Allt händer under threshold — ingen skällning, ingen fixering.',
      whenItFails: [
        'Hunden fixerar och tar inte godis → du är för nära. Backa 5–10 m. Working distance är inte konstant — det varierar med dagsform.',
        'Hunden vänder mot dig men nappar inte godiset → godiset är inte värt nog. Använd korv, lever, ost — high-value enbart vid trigger-träning.',
        'Hunden skäller redan när du tagit fram godiset (förväntan-skäll) → byt rutin: ut till trigger-zon, sätt dig 5 min, vänta tills hunden är lugn innan godis.',
      ],
      wrapUp: [
        'Hunden tar inte godis trots avstånd → backa 50%, ändra session eller avsluta.',
        'Skällning under en session → STOPP omedelbart. Gå bort tills hunden tar godis igen.',
        'Reaktivitet som blir värre över veckor istället för bättre → kontakta certifierad beteendekonsulent (SBBK/IAABC). LAT är ett verktyg, inte en fullständig behandling för svår reaktivitet.',
      ],
    }
  }),

} as const

export function getExerciseSpec(exerciseId: string): ExerciseSpec | null {
  return EXERCISE_SPECS[exerciseId] ?? null
}

export function isValidCriteriaLevel(exerciseId: string, levelId: string): boolean {
  const s = getExerciseSpec(exerciseId)
  if (!s) return false
  return s.ladder.some((l) => l.id === levelId)
}

export function getDefaultCriteriaLevelId(exerciseId: string): string | null {
  const s = getExerciseSpec(exerciseId)
  return s?.ladder[0]?.id ?? null
}

