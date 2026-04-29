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
}

function spec(s: ExerciseSpec): ExerciseSpec {
  return s
}

export const EXERCISE_SPECS: Record<string, ExerciseSpec> = {
  koppel: spec({
    exerciseId: 'koppel',
    definition: 'Lyckad rep när hunden kan gå med slakt koppel i några steg och återvända till dig för belöning.',
    ladder: [
      { id: 'home_2steps', label: 'Inne · 2 steg', criteria: 'Belöna vid din sida efter 1–2 steg.' },
      { id: 'home_5steps', label: 'Inne · 5 steg', criteria: 'Belöna ofta. Vänd om när kopplet sträcks.' },
      { id: 'outdoor_low', label: 'Ute · låg störning', criteria: 'Kort sträcka. Hög belöningsfrekvens.' },
      { id: 'outdoor_medium', label: 'Ute · medel störning', criteria: 'Öka svårighet gradvis. Hellre backa än nöta.' },
    ],
    troubleshooting: [
      'Belöna tätare och minska förväntningarna (kortare sträckor).',
      'Byt till bättre belöning utomhus.',
      'Byt miljö till enklare och bygg upp igen.',
    ],
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
  }),

  sitt: spec({
    exerciseId: 'sitt',
    definition: 'Lyckad rep när rumpan är i marken inom 1–3 sek och hunden stannar kvar tills du belönar.',
    ladder: [
      { id: 'home_lure', label: 'Inne · locka', criteria: 'Locka lugnt till sitt. Belöna när rumpan träffar marken.' },
      { id: 'home_signal', label: 'Inne · signal', criteria: 'Signal först, locka bara om behövs. Belöna snabbt.' },
      { id: 'home_duration_2s', label: 'Inne · 2 s', criteria: 'Belöna efter ~2 sek sitt (om hunden klarar det lätt).' },
      { id: 'outdoor_low', label: 'Ute · låg störning', criteria: 'Kort duration. Belöna snabbt och ofta.' },
      { id: 'outdoor_medium', label: 'Ute · medel störning', criteria: 'Sänk duration när störning ökar. Endast ett kriterium åt gången.' },
    ],
    troubleshooting: [
      'Sänk kriteriet: belöna snabbare (ingen duration).',
      'Korta passet och gör 3 lätta reps i följd.',
      'Om hunden studsar: byt till lugnare belöning eller belöna lägre/närmare.',
    ],
  }),

  ligg: spec({
    exerciseId: 'ligg',
    definition: 'Lyckad rep när hunden lägger sig ner (bröst/armbågar i marken) inom 1–3 sek.',
    ladder: [
      { id: 'home_lure', label: 'Inne · locka', criteria: 'Locka ner från sitt/stå. Belöna när hunden är helt ner.' },
      { id: 'home_signal', label: 'Inne · signal', criteria: 'Signal först. Hjälp med lockning vid behov, men belöna slutposition.' },
      { id: 'home_duration_2s', label: 'Inne · 2 s', criteria: 'Belöna efter ~2 sek i ligg om stabilt.' },
      { id: 'outdoor_low', label: 'Ute · låg störning', criteria: 'Kort pass, belöna snabbt och ofta.' },
    ],
    troubleshooting: [
      'Belöna tidigare (sänk kriteriet).',
      'Byt underlag (vissa ogillar kallt/blött).',
      'Gör passet kort: 3–5 reps och avsluta.',
    ],
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

