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
  failTips?: string[]
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
      {
        id: 'charge_easy',
        label: 'Ladda markören · stilla',
        criteria: 'Hunden står/sitter framför dig. Säg "ja!" → ge godis direkt (1 sek mellan markör och godis). 10 reps per pass, 2–3 pass första dagen. Inget annat krav — vi bygger associationen markör = godis.',
        tips: [
          'Stå still framför hunden. Säg "ja!" och ge godis inom 1 sekund — 10 reps per pass.',
          'Inget krav på beteende ännu. Samma ljud, samma ton varje gång.',
        ],
        failTips: [
          'Hunden reagerar inte → kör 10 ren laddning-reps utan krav, fördelat över korta pass.',
          'Belöningen kommer sent → öva timing utan hund först, sedan korta reps med hunden.',
        ],
      },
      {
        id: 'charge_distracted',
        label: 'Ladda · valfri position',
        criteria: 'Markera när hunden gör vad som helst (sniffar, går, ligger). Hunden ska reagera på markören oavsett vad den gör. Bygger generaliserad förväntan.',
        tips: [
          'Vänta tills hunden sniffar, går eller ligger. Säg "ja!" och belöna direkt.',
          'Byt position mellan reps — hunden ska reagera oavsett vad den gör.',
        ],
        failTips: [
          'Ingen reaktion → backa till ren laddning stillastående tills markören sitter.',
          'Hunden hoppar efter markören → snabba upp godisleveransen och gör kortare reps.',
        ],
      },
      {
        id: 'mark_behavior_lure',
        label: 'Markera lockat beteende',
        criteria: 'Locka enkelt beteende (sitt med godis över nosen). När rumpan träffar marken → markera ("ja!") → belöna. Markören kommer i exakt rätt ögonblick.',
        tips: [
          'Locka sitt lugnt. I exakt sekunden rumpan träffar marken: säg "ja!" och belöna 1 sek senare.',
          'Timing är allt — markören ska komma i beteendeögonblicket, inte efteråt.',
        ],
        failTips: [
          'Markören kommer sent → öva timing utan hund, sedan tre långsamma reps med locking.',
          'Hunden följer bara handen → belöna från andra handen när rumpan är ner.',
        ],
      },
      {
        id: 'mark_offered',
        label: 'Markera erbjudet beteende',
        criteria: 'Vänta. När hunden gör något du vill ha (tittar på dig, sätter sig, lugn vila) → markera + belöna. Kallas "capturing" — hunden uppfinner beteendet, du fångar det.',
        tips: [
          'Var still och vänta. Markera direkt när hunden tittar på dig, sätter sig eller vilar lugnt.',
          'Ingen locking — hunden uppfinner beteendet, du fångar det med markören.',
        ],
        failTips: [
          'Hunden erbjuder inget → backa till locking ett pass, prova capturing igen imorgon.',
          'Du missar timingen → gör kortare pass och ha godis redo i handen hela tiden.',
        ],
      },
      {
        id: 'mark_chain',
        label: 'Markör som brygga i kedjor',
        criteria: 'Markören används mitt i en kedja för att indikera "rätt, fortsätt". T.ex. inkallning: hunden vänder mot dig 5m bort → markera → hunden kommer hela vägen → primär belöning.',
        tips: [
          'Använd markören mitt i kedjan: t.ex. vid vändning, sedan primär belöning vid mål.',
          'Markören betyder "rätt, fortsätt" — inte slutbelöning.',
        ],
        failTips: [
          'Hunden stoppar efter markören → följ alltid med primär belöning vid slutmålet.',
          'Kedjan faller → backa till enklare beteende och bygg kedjan steg för steg.',
        ],
      },
    ],
    troubleshooting: [
      'Hunden reagerar inte på markören → laddningen har inte satt sig. Gå tillbaka till charge_easy, 50 reps över 2–3 pass.',
      'Markörljudet kommer alltid sent → öva utan hund först (säg "ja!" exakt när bollen träffar marken vid kast).',
      'Hunden hoppar/skäller efter markören istället för att förvänta godis → du har försenat belöningen för många gånger. Snabba upp leveransen, kortare reps.',
    ],
    guide: {
      todaySummary: 'Idag laddar ni markören så "ja!" blir ett löfte om godis — innan ni börjar markera beteenden.',
      setup: [
        'Välj ett markörljud du kan göra konsekvent: kort "ja!", "yes", eller klicker. Samma ljud, samma ton — alltid.',
        'Ha 20–30 små godisbitar redo — markörarbete kräver hög frekvens.',
        'Träna i lugn miljö de första passen. Ingen krav på beteende ännu.',
      ],
      steps: [
        {
          how: 'Säg "ja!" och ge godis inom 1 sekund. Upprepa 10 gånger. Hunden behöver inte göra något — vi bygger associationen.',
          why: 'När ljudet alltid följs av godis blir markören din snabbaste väg att säga "rätt" i all träning.',
        },
        {
          how: 'Vänta tills hunden tittar bort. Säg "ja!" — tittar den tillbaka på dig direkt? Då är markören laddad.',
          why: 'Det här testet visar att hunden förstår markören, inte bara att godis kommer när den redan tittar på dig.',
        },
        {
          how: 'Locka sitt eller ligg. I exakt sekunden beteendet händer: säg "ja!" och ge godis 1 sekund senare.',
          why: 'Timing här avgör om hunden kopplar markören till beteendet — inte till att du rör handen.',
        },
        {
          how: 'Nästa pass: vänta. När hunden gör något du gillar (tittar på dig, sätter sig) → "ja!" och belöna.',
          why: 'Capturing lär hunden att erbjuda beteenden själv — markören blir din brygga till allt annat ni tränar.',
        },
        {
          how: 'Gör 3–5 korta pass per dag. Avsluta efter en tydlig reaktion på markören.',
          why: 'Korta pass håller associationen ren — markören ska alltid betyda jackpot, aldrig bli bakgrundsljud.',
        },
      ],
      successLooksLike: 'Lyckad rep = inom 0,5 sek efter markörljudet ("ja!" / klick) hör hunden ljudet → tittar på dig / förväntar belöning → får godis. Markören förutsäger belöning, inget annat.',
      whenItFails: [
        'Hunden reagerar inte → tillbaka till ren laddning: 10 reps "ja!" + godis, inga krav.',
        'Markören kommer alltid sent → öva timing utan hund (säg "ja!" när bollen träffar marken vid kast).',
        'Hunden hoppar/skäller efter markören → snabba upp godisleveransen och gör kortare reps.',
      ],
      wrapUp: [
        'Hunden ignorerar markören → avsluta passet och kör 50 ren laddning-reps fördelat över 2 dagar.',
        'Timing känns konsekvent fel → träna 10 min utan hund innan nästa pass med hunden.',
      ],
    }
  }),

  koppel: spec({
    exerciseId: 'koppel',
    definition: 'Lyckad rep när hunden kan gå med slakt koppel i några steg och återvända till dig för belöning.',
    ladder: [
      {
        id: 'wear_harness',
        label: 'Bära sele inne',
        criteria: 'Hunden bär sele/halsband 1–2 min inne utan att rycka av sig. Belöna lugn. Pre-step för valpar som aldrig burit utrustning.',
        tips: [
          'Sätt på sele/halsband inne. Belöna lugn var 15–20 sek — inget krav att gå.',
          'Håll passet kort: 1–2 min, avsluta medan hunden fortfarande är avslappnad.',
        ],
        failTips: [
          'Hunden rycker av sig → gör kortare pass och belöna varje lugn stund med sele på.',
          'Hunden stressar → ta av utrustningen, belöna när den luktar på den, prova igen imorgon.',
        ],
      },
      {
        id: 'leash_drag',
        label: 'Släpa koppel inne',
        criteria: 'Koppel sitter på, du håller inte. Hunden går runt naturligt. Belöna när den närmar sig dig. Bygger neutral association till kopplet.',
        tips: [
          'Koppel på, du håller inte. Låt hunden gå fritt inne och belöna när den närmar sig dig.',
          'Ingen dragning — bara neutral association till kopplet.',
        ],
        failTips: [
          'Hunden biter i kopplet → kortare pass, belöna lugn och avsluta positivt.',
          'Hunden undviker dig → lägg godis vid dina fötter och belöna varje närhet.',
        ],
      },
      {
        id: 'home_2steps',
        label: 'Inne · 2 steg',
        criteria: 'Belöna vid din sida efter 1–2 steg.',
        tips: [
          'Stå still, vänta tills hunden är vid sidan. Gå 1–2 steg — belöna lågt vid benet om kopplet är slakt.',
          'Belöna direkt vid sidan, inte framför hunden.',
        ],
        failTips: [
          'Kopplet sträcks → vänd 180° lugnt och belöna när linan slakar igen.',
          'Hunden tar inte godis → gör stillastående reps vid sidan utan att gå.',
        ],
      },
      {
        id: 'home_5steps',
        label: 'Inne · 5 steg',
        criteria: 'Belöna ofta. Vänd om när kopplet sträcks.',
        tips: [
          'Gå 5 steg inne. Belöna nästan varje steg vid sidan med slakt koppel.',
          'Sträcks linan? Vänd om utan att säga något — belöna när hunden följer.',
        ],
        failTips: [
          'Hunden drar konstant → backa till 2 steg och belöna tätare.',
          'Belöna tätare och håll sträckorna kortare innan ni går ut.',
        ],
      },
      {
        id: 'first_street',
        label: 'Första gatan · 2 min',
        criteria: 'Kort sträcka utanför grinden, hög belöningsfrekvens. Inga möten med andra hundar ännu — bygg miljö-trygghet först.',
        tips: [
          'Kort sträcka utanför grinden, 2 min max. Belöna nästan varje steg vid sidan.',
          'Undvik möten med andra hundar — bygg miljötrygghet först.',
        ],
        failTips: [
          'Hunden tar inte godis ute → miljön är för svår. Gå tillbaka inne/uppfart en stund.',
          'Byt till godare belöning och gör tre mikro-reps innan ni går längre.',
        ],
      },
      {
        id: 'outdoor_low',
        label: 'Ute · låg störning',
        criteria: 'Kort sträcka. Hög belöningsfrekvens.',
        tips: [
          'Kort sträcka i lugn miljö. Belöna tät vid sidan — nästan varje steg.',
          'Vänd om när kopplet sträcks, belöna när linan slakar.',
        ],
        failTips: [
          'Byt till bättre belöning utomhus eller gå tillbaka inne och bygg upp igen.',
          'Byt miljö till enklare och kör kortare sträckor.',
        ],
      },
      {
        id: 'outdoor_medium',
        label: 'Ute · medel störning',
        criteria: 'Öka svårighet gradvis. Hellre backa än nöta.',
        tips: [
          'Öka störning gradvis. Hellre backa nivå än nöta i samma miljö.',
          'Håll hög belöningsfrekvens — belöna vid sidan, vänd vid drag.',
        ],
        failTips: [
          'Två miss i rad → kortare sträcka, en lyckad, och avsluta där.',
          'Byt miljö till enklare och bygg upp igen.',
        ],
      },
    ],
    troubleshooting: [
      'Belöna tätare och minska förväntningarna (kortare sträckor).',
      'Byt till bättre belöning utomhus.',
      'Byt miljö till enklare och bygg upp igen.',
    ],
    guide: {
      todaySummary: 'Idag tränar ni slakt koppel i korta bitar — belöna vid din sida, vänd när linan sträcks.',
      setup: [
        'Ha 15–20 små bitar godis i fickan, lätta att ta fram snabbt.',
        'Börja inne eller på uppfarten — inte på en stökig gata först.',
        'Målet är mikro-reps med slakt koppel, inte en lång promenad.',
      ],
      steps: [
        {
          how: 'Stå still. Vänta tills hunden vänder mot dig eller står vid din sida → belöna lågt vid ditt ben.',
          why: 'Hunden lär sig att din sida är där jackpoten finns, innan ni ens börjar gå.',
        },
        {
          how: 'Gå 1–2 steg. Är kopplet slakt? Belöna direkt vid sidan. Upprepa.',
          why: 'Korta lyckade bitar bygger “gå bredvid = belöning” utan att kräva hela kvarteret.',
        },
        {
          how: 'Sträcks kopplet? Säg inget. Vänd lugnt 180° och gå åt andra hållet. Belöna när hunden följer och linan slakar.',
          why: 'Vändningen gör dig intressant igen — utan att du tjatar eller rycker i linan.',
        },
        {
          how: 'Gör 5–10 sådana mikro-reps, ta paus, avsluta efter en tydlig lyckad bit.',
          why: 'Korta pass håller kvaliteten hög innan hunden tröttnar eller miljön tar över.',
        },
      ],
      successLooksLike: 'Hunden går några steg med slakt koppel och återvänder till din sida för belöning utan att du drar.',
      whenItFails: [
        'Belöna tätare — nästan varje steg — och håll sträckorna kortare.',
        'Byt till godare belöning ute, eller gå tillbaka inne/uppfart en stund.',
        'Om hunden inte tar godis ute: miljön är för svår. Flytta till enklare plats.',
      ],
      wrapUp: [
        'Två miss i rad → kortare sträcka, en lyckad, och avsluta där.',
        'Sluta medan kopplet fortfarande är mestadels slakt — inte mitt i ett långt drag.',
      ],
      variants: [
        {
          id: 'treat_magnet',
          label: 'Godismagnet vid höften',
          whenToUse: 'När hunden drar framåt konstant och aldrig tittar in mot dig.',
          how: [
            'Håll en synlig belöning vid vänster höft medan ni går 2–3 steg.',
            'Belöna från den handen bara när nosen är vid din sida.',
          ],
          why: 'Gör dig till magneten i stället för världen framför — utan att rycka i kopplet.',
        },
        {
          id: 'tree_reset',
          label: 'Stopp vid träd / stolpe',
          whenToUse: 'När gatan är för svår men ni måste vara ute.',
          how: [
            'Gå till närmaste träd/stolpe. Stå still tills kopplet slakar.',
            'Belöna lugn vid sidan, ta 3 steg, upprepa.',
          ],
          why: 'Bryter drag-spiralen och ger hunden en klar “reset” utan konflikt.',
        },
      ],
    }
  }),

  hantering: spec({
    exerciseId: 'hantering',
    definition: 'Lyckad rep när hunden är lugn och frivilligt låter dig hantera (tassar/mun/borste) i korta microsteg.',
    ladder: [
      {
        id: 'touch',
        label: 'Touch',
        criteria: 'Kort beröring → belöning. Sluta innan hunden vill undan.',
        tips: [
          'Rör lätt vid valt område i 0,5–1 sekund. Säg "ja!" och belöna direkt medan hunden är lugn.',
          'Sluta innan hunden vill dra undan — kortare är bättre.',
        ],
        failTips: [
          'Hunden drar undan → backa till att bara lukta på verktyget och belöna nyfikenhet.',
          'Kortare pass: 20–60 sek, avsluta efter en lugn rep.',
        ],
      },
      {
        id: 'hold_1s',
        label: 'Håll 1s',
        criteria: 'Håll tass/öra 1 sek. Belöna direkt.',
        tips: [
          'Håll tass eller öra i 1 sekund. Belöna i samma ögonblick du släpper.',
          'Öka hålltiden bara med en halv sekund om hunden är avslappnad.',
        ],
        failTips: [
          'Hunden drar undan → backa till kort beröring och belöna snabbare.',
          'Byt till lugnare miljö och lägre intensitet.',
        ],
      },
      {
        id: 'tool_intro',
        label: 'Verktyg',
        criteria: 'Visa borste/klotång → belöna. Ingen klippning ännu.',
        tips: [
          'Låt hunden lukta på borsten/verktyget. Belöna nyfikenhet utan att röra kroppen ännu.',
          'Visa verktyget nära området — ingen klippning eller borstning ännu.',
        ],
        failTips: [
          'Hunden drar undan → belöna bara när den luktar på verktyget, avsluta passet där.',
          'Byt till lugnare plats och enklare kroppsdel.',
        ],
      },
      {
        id: 'real_1rep',
        label: '1 rep',
        criteria: 'En riktig hanteringsrep (t.ex. en klo) → jackpot, slut.',
        tips: [
          'Gör en riktig rep (t.ex. en klo). Jackpot-belöning direkt — och avsluta passet.',
          'En rep räcker idag. Målet är frivilligt och lugnt.',
        ],
        failTips: [
          'Tydlig stress (gäsp, slicka sig) → backa ett steg och avsluta efter 1 lugn rep.',
          'Hunden vägrar ta godis → miljön eller området är för svårt. Byt plats imorgon.',
        ],
      },
    ],
    troubleshooting: [
      'Backa till enklare steg och belöna snabbare.',
      'Kortare pass: 20–60 sek, avsluta i framgång.',
      'Byt till lugnare miljö och lägre intensitet.',
    ],
    guide: {
      todaySummary: 'Idag bygger ni frivillig hantering i microsteg — tassar, mun och borste utan att hunden känner sig överkörd.',
      setup: [
        'Välj en lugn plats (soffa eller matta) och ha 15–20 små belöningar redo.',
        'Välj ett område idag: en tass, ett öra, eller bara visa borsten. Bara en sak per pass.',
        'Målet är frivilligt och lugnt — inte att bli klar med klippningen.',
      ],
      steps: [
        {
          how: 'Låt hunden lukta på borsten/verktyget. Belöna nyfikenhet utan att röra den ännu.',
          why: 'Verktyget ska kännas harmlöst innan det når kroppen — annars blir varje beröring ett överraskningsmoment.',
        },
        {
          how: 'Rör lätt vid valt område i 0,5–1 sekund. Säg "ja!" och belöna direkt medan hunden fortfarande är lugn.',
          why: 'Kort beröring + snabb belöning lär att din hand betyder godis, inte obehag.',
        },
        {
          how: 'Upprepa 3–5 gånger med paus emellan. Öka bara hålltiden med en halv sekund om hunden är avslappnad.',
          why: 'Små steg håller hunden under tröskeln — ett långt grepp kan ta veckor att reparera.',
        },
        {
          how: 'Visa verktyget nära området utan att använda det. Belöna lugn. Avsluta innan hunden drar undan.',
          why: 'Hunden lär sig att stanna kvar frivilligt — det är grunden för riktig klippning och borstning senare.',
        },
      ],
      successLooksLike: 'Lyckad rep när hunden är lugn och frivilligt låter dig hantera (tassar/mun/borste) i korta microsteg.',
      whenItFails: [
        'Hunden drar undan → backa till att bara lukta på verktyget och belöna nyfikenhet.',
        'Passet tar mer än 60 sek → avsluta efter en lugn rep, inte efter att du "hunnit klart".',
        'Hunden vägrar ta godis → miljön eller området är för svårt. Byt plats eller enklare kroppsdel.',
      ],
      wrapUp: [
        'Tydlig stress (gäsp, slicka sig, undvikande) → backa ett steg och avsluta efter 1 lugn rep.',
        'Om hunden blir uppvarvad → pausa, gör en lätt övning (namn/sitt) och avsluta positivt.',
      ],
      variants: [
        {
          id: 'consent_test',
          label: 'Samtyckestest',
          whenToUse: 'När hunden verkar osäker men inte flyr — du vill veta om den verkligen är med.',
          how: [
            'Sträck handen mot området och fråga med kroppsspråk. Väntar hunden kvar? Fortsätt.',
            'Drar hunden undan → belöna avståndet den valde och avsluta passet där.',
          ],
          why: 'Hunden får säga nej utan straff — det bygger förtroende snabbare än att tvinga igenom.',
        },
      ],
    }
  }),

  inkallning: spec({
    exerciseId: 'inkallning',
    definition: 'Lyckad rep när hunden vänder mot dig direkt och kommer hela vägen in (minst 80% i den här miljön).',
    ladder: [
      {
        id: 'home_no_distance',
        label: 'Inne · 0–1 m',
        criteria: 'Säg signalen när hunden redan är nära. Belöna direkt vid vändning.',
        tips: [
          'Stå 0–1 m ifrån. Säg namn, sedan "kom", backa ett steg.',
          'Belöna i samma ögonblick hunden vänder — jackpot när den når dig.',
        ],
        failTips: [
          'Säg signalen när hunden redan tittar på dig.',
          'Byt till godare belöning och gör tre supersmå reps.',
        ],
      },
      {
        id: 'home_2m',
        label: 'Inne · 2 m',
        criteria: 'Hunden kommer 2 m på första signalen. Belöna vid kontakt + när den når dig.',
        tips: [
          'Öka till ~2 m. En signal. Backa när hunden kommer.',
          'Dubbelbelöna: vid vändning och vid nosen hos dig.',
        ],
        failTips: [
          'Gå tillbaka till 1 m tills tre lyckade i rad.',
          'Ge fri efter belöning så "kom" inte betyder att leken tar slut.',
        ],
      },
      {
        id: 'garden_low',
        label: 'Ute · låg störning',
        criteria: 'Enkelt ute (tom gård). Kort avstånd. Belöna snabbt och generöst.',
        tips: [
          'Tom gård, kort avstånd. Samma signal som inne.',
          'Belöna generöst ute — miljön konkurrerar.',
        ],
        failTips: [
          'Gå närmare eller tillbaka inne en stund.',
          'Använd långlina om frihet vinner.',
        ],
      },
      {
        id: 'park_low',
        label: 'Ute · låg störning (park)',
        criteria: 'Korta avstånd, långlina vid behov. Belöna med hög värde-belöning.',
        tips: [
          'Korta avstånd, långlina på. En signal.',
          'Högvärdesbelöning (lek/mat) vid dig, sedan fri ut på linan igen.',
        ],
        failTips: [
          'Korta avståndet och höj belöningsvärdet.',
          'Avsluta efter en lyckad — nöta inte i stökig park.',
        ],
      },
      {
        id: 'park_medium',
        label: 'Ute · medel störning',
        criteria: 'Öka störning gradvis. Backa nivå om latens blir lång eller miss ökar.',
        tips: [
          'Öka störning bara om latensen fortfarande är kort.',
          'Hellre backa nivå än upprepa signalen.',
        ],
        failTips: [
          'Backa till park med lägre störning eller kortare avstånd.',
          'Två miss i rad → en lyckad på lättare nivå och avsluta.',
        ],
      },
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
      todaySummary: 'Idag bygger ni en glad inkallning: hunden vänder och springer hela vägen in till dig.',
      setup: [
        'Börja inne eller i inhägnad trädgård — ingen trafik, inga andra hundar.',
        'Ha belöning som är bättre än omgivningen (extra god mat eller favoritleksak).',
        'Planera 3–5 minuter. Hellre korta lyckade reps än långt tjat.',
      ],
      steps: [
        {
          how: 'Stå några steg ifrån. Säg namnet en gång. När hunden tittar: säg er inkallningssignal (“kom”) och backa två steg med glad kropp.',
          why: 'När du rör dig bakåt blir du mer intressant än det hunden höll på med.',
        },
        {
          how: 'I samma ögonblick hunden vänder mot dig: belöna (markör + godis/lek). Belöna igen när nosen når dig.',
          why: 'Dubbel belöning lär “vänd = jackpot” och “kom in till dig = fest”.',
        },
        {
          how: 'Ge en tydlig fri-signal och låt hunden gå ifrån dig igen i några sekunder.',
          why: 'Annars lär sig hunden att “kom” betyder att det roliga tar slut — då blir den seg.',
        },
        {
          how: 'Upprepa 3–5 gånger. Avsluta alltid efter en lyckad rep. Säg signalen bara en gång.',
          why: 'Tjat lär hunden att ignorera dig. Korta pass håller kvaliteten hög.',
        },
      ],
      successLooksLike: 'Hunden vänder direkt och kommer hela vägen in på första signalen, utan att du upprepar dig.',
      whenItFails: [
        'Gå närmare innan du ropar — börja på 1 meter om 3 meter är för svårt.',
        'Byt till godare belöning eller leksak, och belöna snabbare vid vändningen.',
        'Gör tre supersmidiga reps inne innan ni går ut igen.',
      ],
      wrapUp: [
        'Två miss i rad → gå närmare, få en lyckad, och avsluta där.',
        'Sluta medan hunden fortfarande vill mer — inte när den redan tröttnat.',
      ],
      variants: [
        {
          id: 'toy_chase',
          label: 'Leksaksjakt',
          whenToUse: 'När maten känns platt idag, eller hunden är igång och vill leka.',
          how: [
            'Samma korta avstånd och en signal.',
            'När hunden kommer: 2–5 sek dragkamp eller kasta-lek tätt intill dig.',
          ],
          why: 'Byter belöningsvaluta till det som faktiskt motiverar just den här hunden idag.',
        },
        {
          id: 'long_line_release',
          label: 'Långlina + släpp ut igen',
          whenToUse: 'När det funkar hemma men ute “hörs inte”, eller frihet vinner över dig.',
          how: [
            'Sätt långlina. Kalla en gång. Guidda in vid behov — tjata inte med rösten.',
            'Belöna vid dig, ge fri, och låt hunden gå ut på linan igen direkt.',
          ],
          why: 'Ger lycka utan att “kom” betyder fångenskap, och håller träningen ärlig i svårare miljö.',
        },
      ],
    }
  }),

  namn: spec({
    exerciseId: 'namn',
    definition: 'Lyckad rep när hunden vänder blicken mot dig inom 1–3 sek efter namnet.',
    ladder: [
      {
        id: 'home_no_distraction',
        label: 'Inne · ingen störning',
        criteria: 'Säg namn en gång. Belöna direkt vid blick.',
        tips: [
          'Vänta tills hunden tittar bort. Säg namnet en gång i glad ton.',
          'Belöna direkt i samma ögonblick hunden vänder blicken mot dig.',
        ],
        failTips: [
          'Hunden svarar inte → gå närmare och belöna minsta blick mot dig.',
          'Du säger namnet flera gånger → sluta tjata; gör enklare rep med bättre godis.',
        ],
      },
      {
        id: 'home_mild_distraction',
        label: 'Inne · mild störning',
        criteria: 'Låg distraktion (någon rör sig). Belöna snabb blick.',
        tips: [
          'Ha mild rörelse i bakgrunden. Ett namn — belöna snabb blick.',
          'Pausa 2–3 sek mellan reps så hunden verkligen lyssnar.',
        ],
        failTips: [
          'Minska störning och avstånd, gör 5 snabba reps och avsluta.',
          'Byt till bättre belöning och belöna varje lyckad rep.',
        ],
      },
      {
        id: 'outdoor_low',
        label: 'Ute · låg störning',
        criteria: 'Kort pass, hög belöningsfrekvens. Backa nivå vid många missar.',
        tips: [
          'Kort pass ute i lugn miljö. Ett namn, en belöning — hög frekvens.',
          'Stå nära de första passen. Samma regler som inne.',
        ],
        failTips: [
          'Hunden tar inte godis ute → miljön är för svår. Gå tillbaka inne och bygg upp igen.',
          'Backa nivå vid många missar — kortare pass, bättre godis.',
        ],
      },
      {
        id: 'outdoor_medium',
        label: 'Ute · medel störning',
        criteria: 'Öka störning gradvis. Belöna i position nära dig.',
        tips: [
          'Öka störning gradvis. Belöna när hunden tittar på dig nära dig.',
          'Säg namnet bara en gång — sänk kriteriet istället för att upprepa.',
        ],
        failTips: [
          'Två miss i rad → gå närmare, få en lyckad blick, och avsluta där.',
          'Byt plats till lättare miljö och bygg upp igen.',
        ],
      },
    ],
    troubleshooting: [
      'Byt till bättre belöning och belöna varje lyckad rep.',
      'Minska störning och avstånd, gör 5 snabba reps och avsluta.',
      'Säg namnet bara en gång; annars sänk kriteriet istället för att upprepa.',
    ],
    guide: {
      todaySummary: 'Idag lär ni hunden att sitt namn betyder "titta på mig" — en gång, snabbt, med belöning.',
      setup: [
        'Ha 10–15 små belöningar i fickan, lätta att ta fram snabbt.',
        'Börja när hunden är lugn — inte mitt i lek eller när den nosar iväg.',
        'Stå nära (1–2 meter) de första passen. Planera 3–5 minuter.',
      ],
      steps: [
        {
          how: 'Vänta tills hunden tittar bort. Säg namnet en gång i glad, neutral ton.',
          why: 'Namnet ska betyda "hej, titta här" — inte "jag ropar tills du svarar".',
        },
        {
          how: 'I samma ögonblick hunden vänder blicken mot dig: säg "ja!" och ge godis.',
          why: 'Snabb belöning gör namnet mer värdefullt än det hunden höll på med.',
        },
        {
          how: 'Pausa 2–3 sekunder. Låt hunden gå tillbaka till det den gjorde. Upprepa 5–8 gånger.',
          why: 'Pauserna gör att hunden verkligen lyssnar — inte bara väntar på nästa godis.',
        },
        {
          how: 'När det flyter inne: prova i trädgård eller lugn gata. Samma regler — ett namn, en belöning.',
          why: 'Namnet måste fungera ute också, annars har du bara en inomhussignal.',
        },
        {
          how: 'Avsluta efter en snabb, glad blick. Ge fri och låt hunden göra något roligt.',
          why: 'Avslut på topp gör att hunden vill svara nästa gång också.',
        },
      ],
      successLooksLike: 'Lyckad rep när hunden vänder blicken mot dig inom 1–3 sek efter namnet.',
      whenItFails: [
        'Hunden svarar inte → gå närmare och belöna minsta blick mot dig.',
        'Du säger namnet flera gånger → sluta tjata; gör enklare rep med bättre godis.',
        'Hunden tar inte godis ute → miljön är för svår. Gå tillbaka inne och bygg upp igen.',
      ],
      wrapUp: [
        'Två miss i rad → gå närmare, få en lyckad blick, och avsluta där.',
        'Sluta medan hunden fortfarande svarar snabbt — inte när den tröttnat på spelet.',
      ],
    }
  }),

  sitt: spec({
    exerciseId: 'sitt',
    definition: 'Lyckad rep när rumpan är i marken inom 1–3 sek och hunden stannar kvar tills du belönar.',
    ladder: [
      {
        id: 'home_lure',
        label: 'Inne · locka',
        criteria: 'Locka lugnt till sitt med godis över nosen. Belöna när rumpan träffar marken.',
        tips: [
          'Locka lugnt med godis över nosen. Belöna i samma ögonblick rumpan träffar marken.',
          'En hand för locking, den andra för att ge godiset.',
        ],
        failTips: [
          'Belöna snabbare — ingen väntan i sitt ännu.',
          'Gå tillbaka till locking med godis i handen i tre lätta reps.',
        ],
      },
      {
        id: 'home_fade_lure',
        label: 'Inne · fasa ut locket',
        criteria: 'Gör samma handrörelse men UTAN godis i handen — godis kommer från andra handen efter rumpan är ner. Hjälper att inte fastna i locking-beroende.',
        tips: [
          'Samma handrörelse UTAN godis i handen. Belöna från andra handen när rumpan är ner.',
          'Timing: "ja!" i samma sekund rumpan träffar golvet.',
        ],
        failTips: [
          'Hunden följer bara handen → backa till locking med godis i handen tre reps.',
          'Om hunden studsar: belöna lägre (mot golvet) eller byt till lugnare godis.',
        ],
      },
      {
        id: 'home_signal',
        label: 'Inne · signal',
        criteria: 'Säg "sitt" först, vänta 2 sek. Hjälp med locking bara om hunden inte fattar. Belöna snabbt.',
        tips: [
          'Säg "sitt" först, vänta upp till 2 sek. Hjälp med handen bara om det behövs.',
          'Belöna snabbt — signalen ska förutsäga beteendet.',
        ],
        failTips: [
          'Gå tillbaka till locking utan signal i tre lätta reps.',
          'Två miss i rad → backa till locking, få en lyckad, och avsluta.',
        ],
      },
      {
        id: 'home_duration_2s',
        label: 'Inne · 2 s',
        criteria: 'Belöna efter ~2 sek sitt (om hunden klarar det lätt).',
        tips: [
          'Be om sitt. Räkna tyst till två — belöna medan hunden fortfarande sitter.',
          'Öka duration bara om hunden klarar det lätt.',
        ],
        failTips: [
          'Belöna snabbare — ingen duration, bara rumpan i marken.',
          'Om hunden studsar upp: pausa 30–60 sek och gör en lätt rep.',
        ],
      },
      {
        id: 'outdoor_low',
        label: 'Ute · låg störning',
        criteria: 'Kort duration. Belöna snabbt och ofta.',
        tips: [
          'Kort duration ute. Belöna snabbt och ofta — ingen lång väntan ännu.',
          'Börja med samma signal som inne, kort pass.',
        ],
        failTips: [
          'Sänk kriteriet: belöna snabbare utan duration.',
          'Gå tillbaka inne och bygg duration där först.',
        ],
      },
      {
        id: 'outdoor_medium',
        label: 'Ute · medel störning',
        criteria: 'Sänk duration när störning ökar. Endast ett kriterium åt gången.',
        tips: [
          'Sänk duration när störning ökar — ett kriterium i taget.',
          'Belöna snabbt vid sidan, håll passet kort.',
        ],
        failTips: [
          'Endast ett kriterium åt gången — sänk duration eller störning, inte båda.',
          'Korta passet och gör 3 lätta reps inne innan ni provar ute igen.',
        ],
      },
    ],
    troubleshooting: [
      'Sänk kriteriet: belöna snabbare (ingen duration).',
      'Korta passet och gör 3 lätta reps i följd.',
      'Om hunden studsar: byt till lugnare belöning eller belöna lägre/närmare.',
    ],
    guide: {
      todaySummary: 'Idag lär ni sitt: locka → fasa ut godiset i handen → lägg på signalen.',
      setup: [
        'Ha 10 små belöningar. En hand för locking, den andra för att ge godiset.',
        'Träna inne först. Stå framför hunden, inte över den.',
      ],
      steps: [
        {
          how: 'Håll godis vid nosen. För handen långsamt uppåt/bakåt över huvudet så rumpan sjunker i marken.',
          why: 'Rätt handrörelse gör sitt till det bekväma valet — utan att du trycker ner rumpan.',
        },
        {
          how: 'I samma ögonblick rumpan träffar golvet: säg “ja!” (eller klick) och ge godiset.',
          why: 'Timing här avgör om hunden kopplar sitt till belöningen — inte “nosen följer handen”.',
        },
        {
          how: 'Nästa pass: gör samma handrörelse UTAN godis i den handen. Belöna från andra handen när rumpan är ner.',
          why: 'Så slipper ni fastna i att hunden bara sitter när den luktar mat i handen.',
        },
        {
          how: 'När rörelsen sitter: säg “sitt” först, vänta upp till 2 sek, hjälp med handen bara om det behövs. Belöna snabbt.',
          why: 'Signalen ska förutsäga beteendet — inte komma efteråt som en efterhandskommentar.',
        },
        {
          how: 'Gör 3–5 reps, ge fri, pausa. Avsluta på en lyckad.',
          why: 'Korta serier håller rumpan lugn och undviker studs upp-ner.',
        },
      ],
      successLooksLike: 'Rumpan i marken inom 1–3 sekunder på första försöket, och hunden stannar kvar tills du belönar.',
      whenItFails: [
        'Belöna snabbare — ingen väntan i sitt ännu.',
        'Gå tillbaka till locking med godis i handen i tre lätta reps.',
        'Om hunden studsar upp: belöna lägre (mot golvet) eller byt till lugnare godis.',
      ],
      wrapUp: [
        'Två miss i rad → backa till locking, få en lyckad, och avsluta där.',
        'Om hunden blir uppvarvad: pausa 30–60 sek, gör en lätt rep och avsluta.',
      ],
      variants: [
        {
          id: 'capture_sit',
          label: 'Fånga sitt',
          whenToUse: 'När locking gör hunden hetsig eller den bara följer handen utan att tänka.',
          how: [
            'Vänta. När hunden sätter sig av sig själv → “ja!” och jackpot.',
            'Lägg på signalen “sitt” precis när den börjar sätta sig själv.',
          ],
          why: 'Hunden uppfinner beteendet — ofta lugnare och mer medvetet än ren locking.',
        },
        {
          id: 'wall_sit',
          label: 'Sitt vid vägg',
          whenToUse: 'När hunden backar i stället för att sätta sig vid locking.',
          how: [
            'Stå med hunden nära en vägg bakom rumpan.',
            'Locka uppåt — väggen hindrar bakåt, rumpan går ner. Belöna direkt.',
          ],
          why: 'Gör sitt till den enda bekväma vägen utan att du trycker på kroppen.',
        },
      ],
    }
  }),

  ligg: spec({
    exerciseId: 'ligg',
    definition: 'Lyckad rep när hunden lägger sig ner (bröst/armbågar i marken) inom 1–3 sek.',
    ladder: [
      {
        id: 'home_lure',
        label: 'Inne · locka',
        criteria: 'Locka ner från sitt/stå med godis. Belöna när hunden är helt ner.',
        tips: [
          'Från sitt: för godis långsamt ner mot golvet mellan framtassarna.',
          'Belöna i samma ögonblick bröst och armbågar nuddar marken.',
        ],
        failTips: [
          'Hunden reser sig halvvägs → belöna tidigare, när armbågarna börjar böjas.',
          'Hunden vägrar ligga på golvet → byt till matta eller mjukare underlag.',
        ],
      },
      {
        id: 'home_fade_lure',
        label: 'Inne · fasa ut locket',
        criteria: 'Samma handrörelse men UTAN godis i handen — godis kommer från andra handen när hunden är ner. Bygger respons på handsignalen, inte på maten.',
        tips: [
          'Samma handrörelse UTAN godis i handen. Belöna från andra handen när hunden är ner.',
          'Timing: "ja!" när bröst och armbågar nuddar marken.',
        ],
        failTips: [
          'Hunden följer bara handen → backa till locking med godis i handen.',
          'Hunden blir frustrerad → gör tre lätta sitt-reps och avsluta passet.',
        ],
      },
      {
        id: 'home_signal',
        label: 'Inne · signal',
        criteria: 'Säg "ligg" först, vänta 2 sek. Locka bara vid behov, belöna slutposition.',
        tips: [
          'Säg "ligg" precis innan handen går ner. Hjälp bara om hunden fastnar.',
          'Belöna slutposition — hela kroppen ner.',
        ],
        failTips: [
          'Gå tillbaka till locking utan signal i tre lätta reps.',
          'Två miss i rad → backa till locking, få en lyckad, och avsluta.',
        ],
      },
      {
        id: 'home_duration_2s',
        label: 'Inne · 2 s',
        criteria: 'Belöna efter ~2 sek i ligg om stabilt.',
        tips: [
          'Be om ligg. Räkna tyst till två — belöna medan hunden fortfarande ligger.',
          'Öka duration bara om liggpositionen är stabil.',
        ],
        failTips: [
          'Belöna tidigare — ingen väntan i ligg ännu.',
          'Om hunden reser sig → sänk till 1 sekund och belöna snabbare.',
        ],
      },
      {
        id: 'outdoor_low',
        label: 'Ute · låg störning',
        criteria: 'Kort pass, belöna snabbt och ofta.',
        tips: [
          'Kort pass ute. Belöna snabbt och ofta — samma signal som inne.',
          'Välj skönt underlag — kallt eller hårt golv gör det svårare.',
        ],
        failTips: [
          'Byt underlag om hunden vägrar ligga ute.',
          'Gör passet kort: 3–5 reps och avsluta.',
        ],
      },
    ],
    troubleshooting: [
      'Belöna tidigare (sänk kriteriet).',
      'Byt underlag (vissa ogillar kallt/blött).',
      'Gör passet kort: 3–5 reps och avsluta.',
    ],
    guide: {
      todaySummary: 'Idag lär ni ligg: bröst och armbågar i marken — locka, fasa ut, lägg på signal.',
      setup: [
        'Ha 10 små belöningar. En hand för locking, den andra för att ge godiset.',
        'Välj skönt underlag (matta) — kallt eller hårt golv gör det svårare.',
        'Börja från sitt om hunden redan kan det. Stå framför, inte över.',
      ],
      steps: [
        {
          how: 'Från sitt: för godis långsamt ner mot golvet och lite framåt mellan framtassarna.',
          why: 'Rörelsen nedåt-framåt gör ligg till det naturliga valet — utan att du trycker ner kroppen.',
        },
        {
          how: 'I samma ögonblick bröst och armbågar nuddar marken: säg "ja!" och ge godiset.',
          why: 'Timing här avgör om hunden kopplar ligg till belöningen — inte bara att den följer handen.',
        },
        {
          how: 'Nästa pass: gör samma handrörelse UTAN godis i handen. Belöna från andra handen när hunden är ner.',
          why: 'Så slipper ni fastna i att hunden bara ligger när den luktar mat i handen.',
        },
        {
          how: 'När rörelsen sitter: säg "ligg" precis innan handen går ner. Hjälp bara om hunden fastnar.',
          why: 'Signalen ska förutsäga beteendet — inte komma efteråt.',
        },
        {
          how: 'Gör 3–5 reps, ge fri, pausa. Avsluta på en tydlig ligg.',
          why: 'Korta serier håller hunden lugn och undviker frustration.',
        },
      ],
      successLooksLike: 'Lyckad rep när hunden lägger sig ner (bröst/armbågar i marken) inom 1–3 sek.',
      whenItFails: [
        'Hunden reser sig halvvägs → belöna tidigare, när armbågarna börjar böjas.',
        'Hunden vägrar ligga på golvet → byt till matta eller mjukare underlag.',
        'Hunden blir frustrerad → gör tre lätta sitt-reps och avsluta passet.',
      ],
      wrapUp: [
        'Två miss i rad → backa till locking med godis i handen, få en lyckad, och avsluta.',
        'Om hunden vägrar ligga idag → träna sitt imorgon och prova ligg igen då.',
      ],
      variants: [
        {
          id: 'capture_lie',
          label: 'Fånga ligg',
          whenToUse: 'När locking gör hunden hetsig eller den bara följer handen utan att tänka.',
          how: [
            'Vänta. När hunden lägger sig av sig själv → "ja!" och jackpot.',
            'Lägg på signalen "ligg" precis när den börjar lägga sig själv.',
          ],
          why: 'Hunden uppfinner beteendet — ofta lugnare och mer medvetet än ren locking.',
        },
      ],
    }
  }),

  stanna: spec({
    exerciseId: 'stanna',
    definition: 'Lyckad rep när hunden håller positionen (sitt/ligg/stå) tills frikommando eller belöning.',
    ladder: [
      {
        id: 'home_1s',
        label: 'Inne · 1 s',
        criteria: 'Belöna snabbt. Bara ett steg: duration.',
        tips: [
          'Be om sitt eller ligg. Räkna tyst "ett" → belöna medan hunden fortfarande håller position.',
          'Belöna i position — inte när hunden reser sig.',
        ],
        failTips: [
          'Hunden reser sig → sänk till omedelbar belöning, ingen räkning ännu.',
          'Sänk durationen och belöna innan hunden bryter.',
        ],
      },
      {
        id: 'home_3s',
        label: 'Inne · 3 s',
        criteria: 'Öka duration långsamt. Belöna innan hunden bryter.',
        tips: [
          'Räkna tyst till tre. Belöna innan hunden bryter — inte efter.',
          'Öka duration långsamt, bara ett steg per pass.',
        ],
        failTips: [
          'Backa till 1 sekund, få en lyckad, ge fri, och avsluta.',
          'Träna i korta set och variera belöningsposition.',
        ],
      },
      {
        id: 'home_step_away',
        label: 'Inne · 1 steg',
        criteria: 'Ett steg bort och tillbaka. Belöna snabbt.',
        tips: [
          'Ta ett steg bakåt och ett tillbaka. Belöna direkt när du är tillbaka vid sidan.',
          'Träna bara avstånd idag — inte tid och avstånd samtidigt.',
        ],
        failTips: [
          'Hunden följer efter dig → minska till halvt steg och bygg upp igen.',
          'Om hunden bryter → backa till ren duration utan steg.',
        ],
      },
      {
        id: 'outdoor_low',
        label: 'Ute · låg störning',
        criteria: 'Sänk duration/avstånd. Belöna generöst.',
        tips: [
          'Sänk duration och avstånd ute. Belöna generöst i position.',
          'Avsluta alltid med tydlig "fri" så hunden vet när det är slut.',
        ],
        failTips: [
          'Sänk duration/avstånd och belöna tätare.',
          'Gå tillbaka inne och bygg duration där först.',
        ],
      },
    ],
    troubleshooting: [
      'Sänk durationen och belöna innan hunden bryter.',
      'Träna “stanna” i väldigt korta set och variera belöningsposition.',
      'Om hunden följer: minska dina rörelser och bygg upp igen.',
    ],
    guide: {
      todaySummary: 'Idag tränar ni stanna: hunden håller position tills du säger fri eller belönar.',
      setup: [
        'Välj en position (sitt eller ligg) och träna bara en sak idag: antingen tid eller avstånd.',
        'Ha belöningen redo i handen — du ska kunna ge den innan hunden bryter.',
        'Börja inne i lugn miljö. Planera 3–5 minuter.',
      ],
      steps: [
        {
          how: 'Be om sitt eller ligg. Räkna tyst "ett" → säg "ja!" och belöna medan hunden fortfarande sitter/ligger.',
          why: 'Belöning i position lär att stanna kvar ger jackpot — inte att resa sig och jaga dig.',
        },
        {
          how: 'Upprepa 3 gånger. Om det är lätt: räkna till två eller tre — inte mer i samma pass.',
          why: 'Små steg i duration bygger stabilitet utan att hunden börjar gissa när det är slut.',
        },
        {
          how: 'Nästa steg: ta ett steg bakåt och ett tillbaka. Belöna direkt när du är tillbaka vid sidan.',
          why: 'Avstånd är svårare än tid — ett steg i taget håller hunden under tröskeln.',
        },
        {
          how: 'Avsluta alltid med tydlig "fri" och låt hunden resa sig och röra sig.',
          why: 'Utan fri vet hunden inte när det är slut — och reser sig för tidigt nästa gång.',
        },
      ],
      successLooksLike: 'Lyckad rep när hunden håller positionen (sitt/ligg/stå) tills frikommando eller belöning.',
      whenItFails: [
        'Hunden reser sig → sänk till 1 sekund och belöna snabbare, innan den bryter.',
        'Hunden följer efter dig → minska rörelsen till halvt steg och bygg upp igen.',
        'Hunden tappar fokus → variera belöningsposition (kasta till hunden ibland) och gör kortare set.',
      ],
      wrapUp: [
        'Två miss i rad → backa till 1 sekund, få en lyckad, ge fri, och avsluta.',
        'Sluta medan hunden fortfarande håller position lugnt — inte när den börjar vila sig.',
      ],
    }
  }),

  stoppsignal: spec({
    exerciseId: 'stoppsignal',
    definition: 'Lyckad rep när hunden bromsar/stannar direkt på signal (1 pip/ord) och kan belönas där den är.',
    ladder: [
      {
        id: 'home_close',
        label: 'Inne · nära',
        criteria: 'Signal → stanna/sitt på 0–1 m. Belöna direkt.',
        tips: [
          'Stå 0–1 m ifrån. Ge stopsignal en gång när hunden rör sig långsamt.',
          'Belöna direkt på plats — kasta godis vid hundens fötter.',
        ],
        failTips: [
          'Sänk avstånd och belöna direkt på plats.',
          'Byt till bättre belöning och kör 3 lätta reps i rad.',
        ],
      },
      {
        id: 'home_3m',
        label: 'Inne · 3 m',
        criteria: 'Kort avstånd. Belöna snabbt på plats (skicka belöning).',
        tips: [
          'Öka till ~3 m. En signal — skicka belöning till hunden där den stannar.',
          'Belöna snabbt på plats, inte efter att du dragit in hunden.',
        ],
        failTips: [
          'Gå tillbaka till närmare avstånd tills tre lyckade i rad.',
          'Undvik att upprepa signalen — sänk kriteriet istället.',
        ],
      },
      {
        id: 'outdoor_low',
        label: 'Ute · låg störning',
        criteria: 'Långlina. Sänk avstånd om latens ökar.',
        tips: [
          'Långlina på, lugn miljö. En signal — belöna på plats.',
          'Sänk avstånd om latensen ökar.',
        ],
        failTips: [
          'Sänk avstånd och störning, belöna direkt på plats.',
          'Gå tillbaka inne och bygg avstånd där först.',
        ],
      },
      {
        id: 'outdoor_medium',
        label: 'Ute · medel störning',
        criteria: 'Öka störning gradvis. Hellre backa nivå än upprepa signal.',
        tips: [
          'Öka störning gradvis — hellre backa nivå än upprepa signalen.',
          'Belöna på plats med högvärdesbelöning.',
        ],
        failTips: [
          'Två miss i rad → gå närmare/lättare miljö och avsluta efter 1 lyckad.',
          'Om hunden blir hetsig: sänk tempo, korta passet, belöna tätare.',
        ],
      },
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
        {
          how: 'När hunden rör sig långsamt: ge stopsignal en gång.',
          why: 'En signal som alltid betyder samma sak lär hunden bromsa på första försöket — inte efter tjat.',
        },
        {
          how: 'Så fort hunden bromsar/stannar → kasta belöning vid hundens fötter.',
          why: 'Belöning på plats gör stoppet mer värt än att springa vidare — du behöver inte dra in hunden.',
        },
        {
          how: 'Upprepa 3–5 reps med pauser.',
          why: 'Korta serier håller hunden skarp utan att den börjar gissa eller bli hetsig.',
        },
        {
          how: 'Öka först avstånd ELLER störning (inte båda).',
          why: 'Ett kriterium i taget gör det tydligt vad som fungerar — och var ni ska backa om det fallerar.',
        },
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
      {
        id: 'home_food',
        label: 'Inne · mat-trigger',
        criteria: 'Lämna/avvakta 1–2 sek. Belöna lugn.',
        tips: [
          'Visa mat i handen kort. Belöna direkt när hunden väljer lugn/avvaktande.',
          'Håll passet kort: 10–20 sek per set.',
        ],
        failTips: [
          'Sänk triggern — håll maten längre bort och belöna tätare.',
          'Kortare set: 10–20 sek, paus, repetera.',
        ],
      },
      {
        id: 'home_toy',
        label: 'Inne · leksak i rörelse',
        criteria: 'Kort trigger. Belöna direkt när hunden håller sig.',
        tips: [
          'Rör leksaken kort framför hunden. Belöna stillhet och avvaktande.',
          'Belöna direkt när hunden håller sig — inte efter den kastat sig.',
        ],
        failTips: [
          'Sänk triggern — lugnare rörelse, kortare tid.',
          'Lägg in 2–3 lätta reps (kontakt/namn) mellan svåra reps.',
        ],
      },
      {
        id: 'outdoor_low',
        label: 'Ute · låg störning',
        criteria: 'Kortare tid. Belöna ofta för stillhet.',
        tips: [
          'Kortare tid ute. Belöna ofta för stillhet och avvaktande.',
          'Svag trigger först — öka gradvis.',
        ],
        failTips: [
          'Sänk triggern och belöna tätare.',
          'Byt till lättare miljö och bygg upp igen.',
        ],
      },
      {
        id: 'outdoor_medium',
        label: 'Ute · medel störning',
        criteria: 'Öka trigger gradvis. Endast ett kriterium åt gången.',
        tips: [
          'Öka trigger gradvis — endast ett kriterium åt gången.',
          'Avsluta medan hunden fortfarande klarar det.',
        ],
        failTips: [
          'Två miss i rad → sänk triggern direkt och avsluta efter 1 lyckad.',
          'Om hunden blir stressad: byt till orientering/namn och avsluta.',
        ],
      },
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
        {
          how: 'Presentera triggern kort (t.ex. visa mat i handen).',
          why: 'En svag trigger gör det lätt att belöna rätt val — innan hunden hinner kasta sig.',
        },
        {
          how: 'Belöna direkt när hunden väljer lugn/avvaktande (titta bort, stillhet).',
          why: 'Du betalar för stillhet, inte bara avsaknad av fel — då väljer hunden lugnt oftare.',
        },
        {
          how: 'Öka triggern lite (närmare, längre tid, mer rörelse) först när det är stabilt.',
          why: 'Gradvis svårare gör att hunden lär sig hålla sig kall även när det frestar mer.',
        },
        {
          how: 'Avsluta medan hunden fortfarande klarar det.',
          why: 'Slutar du i framgång minns hunden att det gick — inte att det blev för svårt.',
        },
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
      {
        id: 'home_free',
        label: 'Inne · fri',
        criteria: 'Belöna spontana blickar/kom-in. Inga krav.',
        tips: [
          'Var still och neutral. Belöna varje spontan blick eller kom-in mot dig.',
          'Inga kommandon — du betalar för att hunden väljer dig.',
        ],
        failTips: [
          'Öka belöningsfrekvensen — belöna minsta blick mot dig.',
          'Gör kortare pass och avsluta efter några lyckade check-ins.',
        ],
      },
      {
        id: 'outdoor_low',
        label: 'Ute · låg störning',
        criteria: 'Belöna varje orientering i början. Kort pass.',
        tips: [
          'Lätt ute-miljö. Belöna varje check-in generöst i början.',
          'Kort pass — 3–5 minuter max.',
        ],
        failTips: [
          'Öka belöningsfrekvensen och sänk störningen.',
          'Byt plats till lättare miljö och bygg upp igen.',
        ],
      },
      {
        id: 'outdoor_medium',
        label: 'Ute · medel störning',
        criteria: 'Öka störning långsamt. Backa nivå om hunden “försvinner”.',
        tips: [
          'Öka störning långsamt. Belöna när hunden fortfarande är kontaktbar.',
          'Backa nivå om hunden försvinner i miljön.',
        ],
        failTips: [
          'Belöna orientering när hunden fortfarande är kontaktbar, inte när den redan drar.',
          'Två miss-perioder → avsluta och gör en lätt övning hemma.',
        ],
      },
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
        {
          how: 'Var still/neutral. Vänta på att hunden tittar mot dig → belöna.',
          why: 'Du betalar för att hunden väljer dig — utan att du behöver ropa och bli bakgrundsbrus.',
        },
        {
          how: 'När hunden fattar: rör dig lite (1–2 steg) och belöna check-in igen.',
          why: 'Rörelse gör check-in svårare och mer värdefullt på riktiga promenader.',
        },
        {
          how: 'Flytta gradvis till lätt ute-miljö och belöna varje check-in i början.',
          why: 'Hög belöningsfrekvens ute bygger vanan innan världen tar över helt.',
        },
        {
          how: 'Avsluta efter några lyckade reps (korta pass).',
          why: 'Korta pass håller check-ins snabba och glada — inte en sista ansträngning som misslyckas.',
        },
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
      {
        id: 'home_sniff',
        label: 'Inne · enkelt gömma',
        criteria: 'Korta sök. Belöna lugn och avslut på signal.',
        tips: [
          'Göm 3–5 godisbitar inne. Säg "sök" — låt hunden nosa 10–20 sek.',
          'Säg "klart" och belöna när hunden vänder upp mot dig.',
        ],
        failTips: [
          'Gör söket enklare och kortare, belöna lugn.',
          'Om hunden tappar kontakt → kortare sök och tätare belöning vid avslut.',
        ],
      },
      {
        id: 'outdoor_low',
        label: 'Ute · låg störning',
        criteria: 'Enkla sök i gräs. Kort lina vid behov.',
        tips: [
          'Enkla sök i gräs. Långlina vid behov för säkerhet.',
          'Pausa 10–20 sek mellan sök — belöna avslut på signal.',
        ],
        failTips: [
          'Gör söket enklare och kortare, belöna lugn.',
          'Byt belöning (mer värde) när miljön blir svårare.',
        ],
      },
      {
        id: 'outdoor_medium',
        label: 'Ute · medel störning',
        criteria: 'Öka svårighet gradvis. Pausa innan hunden går upp i varv.',
        tips: [
          'Öka svårighet långsamt — större yta eller längre tid, ett steg i taget.',
          'Pausa innan hunden går upp i varv.',
        ],
        failTips: [
          'Om hunden drar: byt till orientering/inkallning på lätt nivå och avsluta.',
          'Två miss i rad → enklare sök, en lyckad, och avsluta.',
        ],
      },
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
        {
          how: 'Säg “sök” och låt hunden nosa i 10–20 sek.',
          why: 'Nosjobb är naturligt belönande — du ger hunden rätt att nosa men sätter en tydlig ram.',
        },
        {
          how: 'Säg “klart” och belöna när hunden vänder upp mot dig/kommer in.',
          why: 'Avslut på signal lär att du kan avbryta sök utan konflikt — viktigt på promenaden.',
        },
        {
          how: 'Pausa 10–20 sek och upprepa.',
          why: 'Pauser förhindrar att hunden går upp i varv och glömmer att kolla in.',
        },
        {
          how: 'Öka svårighet långsamt (störning, större yta, längre tid) en sak i taget.',
          why: 'Ett steg i taget håller söket kontrollerat även när miljön blir mer spännande.',
        },
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
      {
        id: 'home_easy',
        label: 'Inne · lätt',
        criteria: '1–2 sek väntan. Belöna lugn.',
        tips: [
          'Håll godis i knuten hand. Belöna lugn efter 1–2 sek väntan.',
          'Säg "ja!" precis innan du ger godiset från andra handen.',
        ],
        failTips: [
          'Hunden kastar sig → sänk till 0,5 sek lugn och belöna snabbare.',
          'Sänk tiden och belöna tidigare.',
        ],
      },
      {
        id: 'home_medium',
        label: 'Inne · medel',
        criteria: '3–5 sek väntan eller liten rörelse-trigger.',
        tips: [
          'Öka till 3–5 sek lugn, eller lägg till liten rörelse-trigger.',
          'Ge ibland "fri" så hunden får ta det i knuten handen.',
        ],
        failTips: [
          'Hunden tar maten själv → håll handen högre och belöna innan den hinner nosa.',
          'Sänk triggern och avsluta i framgång.',
        ],
      },
      {
        id: 'outdoor_low',
        label: 'Ute · låg störning',
        criteria: 'Kort väntan, belöna ofta.',
        tips: [
          'Kort väntan ute. Belöna ofta för lugn — håll passet kort.',
          'Enklare trigger ute än inne i början.',
        ],
        failTips: [
          'Hunden blir frustrerad → kortare pass, bättre godis, eller enklare trigger.',
          'Två miss i rad → enklare trigger, kortare väntan, en lyckad, och avsluta.',
        ],
      },
    ],
    troubleshooting: [
      'Sänk tiden och belöna tidigare.',
      'Sänk triggern (längre avstånd) och avsluta i framgång.',
      'Korta set och fler pauser.',
    ],
    guide: {
      todaySummary: 'Idag lär ni hunden vänta lugnt trots frestande saker — kontroll ger tillgång, inte frustration.',
      setup: [
        'Välj en enkel trigger: mat i hand, matskål på golvet, eller favoritleksak.',
        'Ha tydlig "fri"-signal som betyder "nu får du ta/det".',
        'Börja inne. Hunden ska vara hungrig men lugn — inte efter en lång promenad.',
      ],
      steps: [
        {
          how: 'Håll godis i knuten hand. Visa handen. Vänta tills hunden är lugn (ingen kast, inget skäll) → belöna från andra handen.',
          why: 'Belöning för lugn gör att väntan blir lönsamt — inte bara ett hinder.',
        },
        {
          how: 'Öka till 2–3 sekunder lugn innan belöning. Säg "ja!" precis innan du ger godiset.',
          why: 'Gradvis ökning håller hunden under tröskeln — ett långt väntande kan ge frustration.',
        },
        {
          how: 'Ibland: ge "fri" och låt hunden ta det i knuten handen som belöning.',
          why: 'När fri ibland betyder "ta nu" lär sig hunden att kontroll leder till det den vill ha.',
        },
        {
          how: 'Gör 5–8 reps i korta set. Pausa 10 sek mellan varje. Avsluta efter en lugn väntan.',
          why: 'Korta set med pauser håller kvaliteten hög — impulskontroll tröttnar snabbt.',
        },
      ],
      successLooksLike: 'Lyckad rep när hunden kan avstå eller vänta trots trigger, utan att stressa upp.',
      whenItFails: [
        'Hunden kastar sig → sänk till 0,5 sek lugn och belöna snabbare.',
        'Hunden tar maten själv → håll handen högre och belöna innan den hinner nosa.',
        'Hunden blir frustrerad (gnyr, slickar) → kortare pass, bättre godis, eller enklare trigger.',
      ],
      wrapUp: [
        'Två miss i rad → enklare trigger, kortare väntan, en lyckad, och avsluta.',
        'Om hunden stressar upp → gör ett namn-rep och avsluta positivt.',
      ],
      variants: [
        {
          id: 'door_wait',
          label: 'Vänta vid dörr',
          whenToUse: 'När det funkar med mat men hunden rusar ut/in vid varje dörröppning.',
          how: [
            'Öppna dörren en springa. Hunden ska sitta/ligga. Belöna lugn.',
            'Öppna lite mer. Belöna. Ge "fri" och gå ut tillsammans.',
          ],
          why: 'Dörren är den vanligaste vardagstriggern — träna den separat innan den blir ett dagligt problem.',
        },
      ],
    }
  }),
  socialisering: spec({
    exerciseId: 'socialisering',
    definition: 'Lyckad rep när hunden exponeras för ett nytt stimuli (ljud, yta, människa, djur) och förblir lugn och nyfiken utan stress.',
    ladder: [
      {
        id: 'home_objects',
        label: 'Inne · föremål',
        criteria: 'Låt hunden utforska nytt föremål i lugn takt. Belöna nyfikenhet.',
        tips: [
          'Presentera nytt föremål inne. Låt hunden sniffa i egen takt — belöna nyfikenhet.',
          'Håll avstånd där kroppen är avslappnad. Inga krav att gå närmare.',
        ],
        failTips: [
          'Hunden fryser → öka avståndet och belöna minsta lugn blick.',
          'Hunden tar inte godis → föremålet är för nära. Gå till enklare stimuli.',
        ],
      },
      {
        id: 'outdoor_low',
        label: 'Ute · låg störning',
        criteria: 'Ny miljö med lite folk. Observera, belöna lugn.',
        tips: [
          'Ny lugn miljö med lite folk. Observera och belöna avslappnad kropp.',
          'Stå på avstånd där hunden kan nosar lugnt.',
        ],
        failTips: [
          'Gå till enklare miljö och bygg upp positivt igen.',
          'Tvinga aldrig — låt hunden välja avstånd.',
        ],
      },
      {
        id: 'outdoor_people',
        label: 'Ute · människor',
        criteria: 'Passerar förbi folk på lagom avstånd. Belöna avslappnad kroppspostur.',
        tips: [
          'Passera folk på lagom avstånd. Belöna avslappnad kroppshållning.',
          'Låt hunden välja tempo — gå närmare bara om den tar steget själv.',
        ],
        failTips: [
          'Öka avstånd till folk och belöna för varje liten lugn stund.',
          'Hunden drar iväg eller skäller → avsluta passet och prova svagare stimuli imorgon.',
        ],
      },
      {
        id: 'outdoor_busy',
        label: 'Ute · hög stimulans',
        criteria: 'Trafik, barn, andra hundar på avstånd. Fokus på lugn och orientering mot ägaren.',
        tips: [
          'Trafik, barn, hundar på avstånd. Belöna lugn och orientering mot dig.',
          'Håll avstånd — under tröskeln där hunden fortfarande tar godis.',
        ],
        failTips: [
          'Stresssignaler → öka avstånd direkt och avsluta efter en lugn stund.',
          'Hunden vägrar gå närmare → det räcker idag. Avsluta positivt på avståndet den valde.',
        ],
      },
    ],
    troubleshooting: [
      'Öka avstånd till triggern och belöna för varje liten lugn stund.',
      'Gå till enklare miljö och bygg upp positivt igen.',
      'Tvinga aldrig — låt hunden välja avstånd.',
    ],
    guide: {
      todaySummary: 'Idag exponerar ni hunden för något nytt och belönar lugn nyfikenhet — aldrig tvång.',
      setup: [
        'Välj ett nytt stimuli idag: ett föremål inne, en lugn promenad, eller folk på avstånd.',
        'Ha hög-värde belöning redo (korv, lever — inte vanligt torrfoder).',
        'Hunden ska vara utvilad och mätt nog att vara nyfiken, inte hungrig-desperat.',
      ],
      steps: [
        {
          how: 'Stå på avstånd där hunden ser stimuli men kroppen är avslappnad (mjuk svans, löst nosande).',
          why: 'Under tröskeln kan hunden lära sig att nytt = intressant, inte farligt.',
        },
        {
          how: 'Belöna varje lugn blick mot stimuli och varje val att sniffa framåt frivilligt.',
          why: 'Belöning för nyfikenhet bygger positiva associationer — rädsla försvinner inte genom att ignoreras.',
        },
        {
          how: 'Låt hunden välja avstånd. Gå närmare bara om den själv tar steget framåt.',
          why: 'När hunden styr tempot bygger den trygghet — tvång skapar rädsla som tar veckor att reparera.',
        },
        {
          how: 'Gör 2–5 korta interaktioner. Avsluta medan hunden fortfarande är nyfiken, inte trött eller stressad.',
          why: 'Korta positiva pass gör att hunden vill utforska mer nästa gång.',
        },
      ],
      successLooksLike: 'Lyckad rep när hunden exponeras för ett nytt stimuli (ljud, yta, människa, djur) och förblir lugn och nyfiken utan stress.',
      whenItFails: [
        'Hunden fryser eller gömmer sig → öka avståndet och belöna minsta lugn blick.',
        'Hunden tar inte godis → för nära triggern. Gå till enklare plats och börja om.',
        'Hunden drar iväg eller skäller → avsluta passet och prova svagare stimuli imorgon.',
      ],
      wrapUp: [
        'Stresssignaler (gäsp, slicka sig, undvikande) → öka avstånd direkt och avsluta efter en lugn stund.',
        'Om hunden vägrar gå närmare → det räcker idag. Avsluta positivt på avståndet den valde.',
      ],
    }
  }),

  fokus: spec({
    exerciseId: 'fokus',
    definition: 'Lyckad rep när hunden håller ögonkontakt med föraren i minst 2 sekunder trots distraktion.',
    ladder: [
      {
        id: 'home_no_distraction',
        label: 'Inne · ingen störning',
        criteria: 'Be om ögonkontakt 2 sek. Belöna direkt.',
        tips: [
          'Stå still. Belöna direkt när hunden tittar upp i dina ögon.',
          'Vänta tyst tills blicken hållit 1–2 sekunder innan du säger "ja!".',
        ],
        failTips: [
          'Hunden tittar aldrig upp → håll godis vid ditt öga en gång, belöna direkt, ta bort locket.',
          'Blicken bryts direkt → belöna efter 0,5 sek och bygg upp gradvis.',
        ],
      },
      {
        id: 'home_mild',
        label: 'Inne · mild störning',
        criteria: '2–3 sek kontakt med någon rörelse i bakgrunden.',
        tips: [
          'Mild rörelse i bakgrunden. Belöna varje blick mot dig i 2–3 sek.',
          'Pausa mellan reps så hunden aktivt väljer att titta på dig.',
        ],
        failTips: [
          'Belöna kortare ögonkontakt (0,5 sek) och bygg upp gradvis.',
          'Minska störning och öka belöningsvärde.',
        ],
      },
      {
        id: 'outdoor_low',
        label: 'Ute · låg störning',
        criteria: 'Kort kontakt i lugn utemiljö. Belöna tätt.',
        tips: [
          'Stanna på lugn plats ute. Belöna varje blick generöst.',
          'Kort kontakt — hög belöningsfrekvens i början.',
        ],
        failTips: [
          'Hunden tar inte godis ute → miljön är för svår. Gå tillbaka inne och bygg duration där.',
          'Tre missar i rad → backa till kort blick inne, en lyckad, och avsluta.',
        ],
      },
      {
        id: 'outdoor_medium',
        label: 'Ute · medel störning',
        criteria: '3–5 sek kontakt med folk/hundar på avstånd.',
        tips: [
          'Folk/hundar på avstånd. Belöna 3–5 sek kontakt mot dig.',
          'Stanna, vänta på blick — belöna generöst.',
        ],
        failTips: [
          'Minska störning och öka belöningsvärde.',
          'Sluta medan hunden fortfarande erbjuder blickar frivilligt.',
        ],
      },
    ],
    troubleshooting: [
      'Belöna kortare ögonkontakt (0,5 sek) och bygg upp gradvis.',
      'Minska störning och öka belöningsvärde.',
      'Träna "fokus" vid lugnare tillfällen och bygg upp association.',
    ],
    guide: {
      todaySummary: 'Idag tränar ni ögonkontakt — hunden tittar på dig och håller kvar blicken i några sekunder.',
      setup: [
        'Stå still. Ha belöning gömd i handen bakom ryggen eller i fickan.',
        'Börja inne i lugn miljö. Hunden ska vara alert men inte hyper.',
        'Planera 3–5 minuter. Hellre korta lyckade blickar än långa misslyckade.',
      ],
      steps: [
        {
          how: 'Stå still och vänta. Så fort hunden tittar upp i dina ögon: säg "ja!" och belöna.',
          why: 'Spontan blick belönas — du behöver inte locka eller vifta med godis framför nosen.',
        },
        {
          how: 'Upprepa 5–8 gånger. Pausa mellan varje så hunden får titta bort och tillbaka.',
          why: 'Pauserna gör att hunden aktivt väljer att titta på dig, inte bara stirrar för mat.',
        },
        {
          how: 'Nästa pass: vänta tyst tills blicken hållit 1–2 sekunder innan du säger "ja!".',
          why: 'Duration byggs genom att belöna lite senare — inte genom att hålla kvar hundens huvud.',
        },
        {
          how: 'När det sitter inne: prova med mild distraktion (någon rör sig i bakgrunden). Belöna varje blick mot dig.',
          why: 'Fokus ute är det som räknas — inne är bara grunden.',
        },
        {
          how: 'Avsluta efter en tydlig, lugn blick. Ge fri.',
          why: 'Avslut på topp gör att hunden gärna tittar på dig igen nästa gång.',
        },
      ],
      successLooksLike: 'Lyckad rep när hunden håller ögonkontakt med föraren i minst 2 sekunder trots distraktion.',
      whenItFails: [
        'Hunden tittar aldrig upp → håll godis vid ditt öga en gång, belöna direkt, ta bort locket.',
        'Blicken bryts direkt → belöna efter 0,5 sek och bygg upp gradvis.',
        'Hunden tar inte godis ute → miljön är för svår. Gå tillbaka inne och bygg duration där.',
      ],
      wrapUp: [
        'Tre missar i rad → backa till kort blick inne, en lyckad, och avsluta.',
        'Sluta medan hunden fortfarande erbjuder blickar frivilligt — inte när den tröttnat.',
      ],
      variants: [
        {
          id: 'outdoor_focus',
          label: 'Fokus ute',
          whenToUse: 'När det funkar inne men hunden "glömmer" dig helt ute på promenaden.',
          how: [
            'Stanna på lugn plats. Vänta på blick. Belöna generöst.',
            'Ta ett steg, stanna igen. Belöna varje check-in de första minuterna.',
          ],
          why: 'Ute kräver högre belöningsfrekvens — världen är helt enkelt mer intressant än dig just nu.',
        },
      ],
    }
  }),

  apportering: spec({
    exerciseId: 'apportering',
    definition: 'Lyckad rep när hunden hämtar objektet, bär det tillbaka mjukt och lämnar det i handen.',
    ladder: [
      {
        id: 'home_take',
        label: 'Inne · ta',
        criteria: 'Hunden tar objektet i munnen frivilligt. Belöna direkt.',
        tips: [
          'Visa objektet, kasta 0,5–1 meter. Belöna direkt när hunden tar det i munnen.',
          'Glad röst när hunden tar — gör dig till målet.',
        ],
        failTips: [
          'Hunden tar inte objektet → lägg det på marken och belöna varje beröring.',
          'Gör passet kortare och använd ett objekt hunden gillar mer.',
        ],
      },
      {
        id: 'home_carry',
        label: 'Inne · bär',
        criteria: 'Bär objektet 2–3 steg tillbaka till dig. Belöna generöst.',
        tips: [
          'Backa 1–2 steg när hunden tar objektet — den kommer naturligt mot dig.',
          'Belöna generöst när hunden bär 2–3 steg tillbaka.',
        ],
        failTips: [
          'Hunden tappar tidigt → belöna för kortare bärning och bygg upp.',
          'Hunden springer iväg → bli intressant (backa, squeak) — aldrig jaga.',
        ],
      },
      {
        id: 'home_deliver',
        label: 'Inne · lämna',
        criteria: 'Hunden håller kvar tills du öppnar handen/säger "lämna". Byt mot godis.',
        tips: [
          'Öppna handen eller säg "lämna". Byt objektet mot belöning direkt.',
          'Belöna mjukt bärande hela vägen till leverans.',
        ],
        failTips: [
          'Hunden släpper inte → håll godis vid nosen och vänta tyst.',
          'Backa till kortare bärning innan du kräver leverans i handen.',
        ],
      },
      {
        id: 'outdoor_short',
        label: 'Ute · kort kast',
        criteria: 'Kast 3–5 meter. Hämtar och återvänder. Belöna vid leverans.',
        tips: [
          'Kast 3–5 meter. Backa när hunden hämtar — belöna vid leverans.',
          'Hög belöning vid nosen hos dig, sedan fri.',
        ],
        failTips: [
          'Tre missar i rad → minska kastet till 0,5 m och avsluta efter 1 lyckad.',
          'Hunden springer iväg → bli intressant, aldrig jaga.',
        ],
      },
      {
        id: 'outdoor_distraction',
        label: 'Ute · störning',
        criteria: 'Apportering med mild distraktion i närheten.',
        tips: [
          'Kort kast med mild distraktion i närheten. Belöna vid leverans.',
          'Håll avståndet kort — miljön konkurrerar.',
        ],
        failTips: [
          'Minska kastet och distraktionen — en lyckad, och avsluta.',
          'Byt till bättre belöning eller enklare miljö.',
        ],
      },
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
        {
          how: 'Visa objektet, kasta 0,5–1 meter.',
          why: 'Kort kast gör det lätt att lyckas hela vägen — hämta, bära, lämna — redan första passet.',
        },
        {
          how: 'Uppmuntra med glad röst när hunden tar det.',
          why: 'Glad röst gör dig till målet — hunden kommer tillbaka till dig, inte bara till leksaken.',
        },
        {
          how: 'Backa 1–2 steg → hunden kommer naturligt mot dig.',
          why: 'Att backa drar hunden mot dig utan jakt — leverans blir naturligt nästa steg.',
        },
        {
          how: 'Byt objektet mot belöning ("lämna").',
          why: 'Utbyte lär att släppa ger något bättre — så slipper du tigga om dummy i munnen.',
        },
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
      {
        id: 'puddle',
        label: 'Pöl / grunt',
        criteria: 'Kliver i pöl eller vid vattenkanten. Belöna varje steg in.',
        tips: [
          'Låt hunden sniffa vid kanten. Belöna varje steg in i pöl eller grunt vatten.',
          'Kliv gärna i vattnet själv — hunden följer ofta.',
        ],
        failTips: [
          'Hunden är rädd → gå tillbaka till kanten och belöna närvaro vid vattnet.',
          'Tvinga aldrig in — belöna nyfikenhet vid kanten istället.',
        ],
      },
      {
        id: 'knee_deep',
        label: 'Knädjupt',
        criteria: 'Vadare. Frivilligt. Inga tvång.',
        tips: [
          'Vadare frivilligt i knädjupt vatten. Belöna varje steg.',
          'Kasta belöning/leksak nära kanten först, öka gradvis djupet.',
        ],
        failTips: [
          'Hunden vägrar → backa till pöl/kant och belöna närvaro.',
          'Börja med stillastående grunt vatten och lek nära kanten.',
        ],
      },
      {
        id: 'swim_short',
        label: 'Simning · kort',
        criteria: 'Simmar 1–2 meter och återvänder. Belöna generöst vid retur.',
        tips: [
          'Simning 1–2 meter. Belöna generöst när hunden återvänder till dig.',
          'Avsluta innan hunden är trött eller kall.',
        ],
        failTips: [
          'Hunden simmar inte → backa till vadning och belöna vid kanten.',
          'Tvinga aldrig — negativ association är svår att reparera.',
        ],
      },
      {
        id: 'retrieve_water',
        label: 'Apportering i vatten',
        criteria: 'Hämtar dummy i grunt vatten och levererar.',
        tips: [
          'Kasta dummy i grunt vatten. Belöna hämtning och leverans vid dig.',
          'Håll kastet kort — belöna generöst vid retur.',
        ],
        failTips: [
          'Hunden hämtar inte → backa till lek vid kanten utan krav på apportering.',
          'Hunden skakar/är kall → avsluta passet.',
        ],
      },
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
        {
          how: 'Låt hunden sniffa och utforska kanten. Belöna nyfikenhet.',
          why: 'Belöna närvaro vid vattnet bygger trygghet — utan att du behöver putta eller dra.',
        },
        {
          how: 'Kasta belöning/leksak nära kanten i vattnet.',
          why: 'Lek vid kanten gör vatten roligt innan djupet ens blir ett tema.',
        },
        {
          how: 'Öka gradvis djupet och kastet när hunden är trygg.',
          why: 'Små steg låter hunden välja själv — tvång skapar rädsla som tar månader att reparera.',
        },
        {
          how: 'Avsluta alltid innan hunden är trött/kall.',
          why: 'Positivt sista minne gör nästa vattenbesök lättare — inte ett minne av obehag.',
        },
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
      {
        id: 'follow_handler',
        label: 'Följ hanteraren',
        criteria: 'Hunden rör sig med hanteraren runt en trigger (boll/cone). Belöna nära kontakt.',
        tips: [
          'Rör dig runt objektet i kontrollerat tempo. Belöna hunden för att följa nära dig.',
          'Använd boll eller kon som "byte" — ingen boskap.',
        ],
        failTips: [
          'Hunden går upp i varv → öka avstånd till bytet och belöna stillhet.',
          'Korta pass (3–5 min) — vallning är mentalt intensivt.',
        ],
      },
      {
        id: 'eye_cone',
        label: 'Eye mot kon',
        criteria: 'Hunden "låser" blicken (eye) mot ett objekt på kommando. Belöna stillhet + fokus.',
        tips: [
          'Peka mot objektet. Belöna när hunden låser blicken och håller sig still.',
          'Stillhet och fokus — belöna innan rörelsen tar över.',
        ],
        failTips: [
          'Hunden kastar sig mot objektet → öka avstånd och belöna stillhet.',
          'Blanda in stoppsignal — vallning utan stopp är okontrollerad instinkt.',
        ],
      },
      {
        id: 'flank_short',
        label: 'Kort flank',
        criteria: 'Hunden rör sig ett halvt varv runt objektet på signal ("fot" / "bort"). Belöna smidig rörelse.',
        tips: [
          'Ge signal för kort flank — halvt varv runt objektet. Belöna smidig rörelse.',
          'Håll tempot kontrollerat — du styr, inte bara instinkten.',
        ],
        failTips: [
          'Hunden går upp i varv → öka avstånd till bytet och belöna stillhet.',
          'Backa till att följa hanteraren runt objektet.',
        ],
      },
      {
        id: 'stop_on_signal',
        label: 'Stopp i rörelse',
        criteria: 'Hunden stannar mitt i flanken på stoppsignal. Kombinerar vallning + impulskontroll.',
        tips: [
          'Mitt i flanken: ge stoppsignal. Belöna när hunden stannar direkt.',
          'Kombinera vallning med impulskontroll — stopp ska sitta säkert.',
        ],
        failTips: [
          'Hunden ignorerar stoppsignal → avsluta och träna impulskontroll separat.',
          'Tydlig stress/jakt-beteende → öka avstånd och avsluta.',
        ],
      },
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
        {
          how: 'Rör dig runt objektet och belöna hunden för att följa i kontrollerat tempo.',
          why: 'Kontrollerad rörelse runt bytet lär att du styr tempot — inte bara instinkten.',
        },
        {
          how: 'Introducera "eye": peka mot objektet → belöna när hunden låser blicken.',
          why: 'Eye ger hunden ett tydligt jobb — fokus som du kan belöna och avbryta.',
        },
        {
          how: 'Lägg till en kort flanksida (halv cirkel) på signal.',
          why: 'Flank bygger riktad rörelse du kan styra — grunden innan riktiga djur ens kommer in.',
        },
        {
          how: 'Avbryt med stoppsignal eller "här" och belöna lydig avslutning.',
          why: 'Stopp på signal gör vallning användbar — inte bara okontrollerad jakt.',
        },
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
      {
        id: 'box_1',
        label: 'Boxsök · 1 box',
        criteria: 'En box med belöning, 2–3 tomma. Hunden hittar och indikerar.',
        tips: [
          'En box med belöning, 2–3 tomma. Säg "sök" och belöna generöst vid rätt box.',
          'Intro-fas: låt hunden se var du gömmer belöningen.',
        ],
        failTips: [
          'Hunden tappar intresset → gör rätt box uppenbar och belöna snabbt.',
          'Korta pass (3–5 sök) och avsluta med en lätt vinst.',
        ],
      },
      {
        id: 'box_multi',
        label: 'Boxsök · flera boxar',
        criteria: '5–8 boxar. Söker systematiskt och stannar vid rätt.',
        tips: [
          '5–8 boxar. Belöna när hunden söker systematiskt och stannar vid rätt.',
          'Jackpot vid rätt box — gör sök mer värt än att gissa.',
        ],
        failTips: [
          'Hunden gissar slumpmässigt → öka värdet på belöningen vid rätt box.',
          'Gör färre boxar och tydligare gömma.',
        ],
      },
      {
        id: 'room_search',
        label: 'Rumssök',
        criteria: 'Doften gömd i rummet (ej i box). Systematiskt sök.',
        tips: [
          'Göm doft i rummet, inte i box. Säg "sök" — belöna systematiskt sök och indikering.',
          'Börja med enkla gömmor på golvet.',
        ],
        failTips: [
          'Hunden söker ytligt → gör gömman enklare och belöna snabbare.',
          'Korta pass och avsluta med en lätt vinst.',
        ],
      },
      {
        id: 'outdoor_search',
        label: 'Utomhussök',
        criteria: 'Söker i avgränsat utomhusområde. Hittar och indikerar.',
        tips: [
          'Avgränsat utomhusområde. Säg "sök" — belöna vid fynd och tydlig indikering.',
          'Håll området hanterbart — inte för stort första gången.',
        ],
        failTips: [
          'Hunden tappar intresset → gör fyndet enklare och belöna generöst.',
          'Tre missar i rad → gör ett lätt fynd och avsluta.',
        ],
      },
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
        {
          how: 'Placera belöning i en av 3 boxar. Låt hunden se dig (intro-fas).',
          why: 'Synlig start gör spelet begripligt — hunden förstår att nos leder till fynd.',
        },
        {
          how: 'Säg "sök" och låt hunden hitta. Belöna generöst direkt.',
          why: 'Jackpot vid rätt box gör sök mer värt än att gissa slumpmässigt.',
        },
        {
          how: 'Öka antal boxar och göm belöningen bättre.',
          why: 'Svårare gömmor bygger systematiskt sök — inte bara tur.',
        },
        {
          how: 'Byt till doftpinne (t.ex. birch) när hunden förstår spelet.',
          why: 'Doft istället för synlig mat gör nosework till en riktig färdighet hemma och ute.',
        },
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
      {
        id: 'after_sitt_1s',
        label: 'Efter sitt · 1s',
        criteria: 'Hunden sitter tills du säger "fri" med glad ton. Belöna frihet (låt den röra sig).',
        tips: [
          'Be om sitt. Vänta 1 sekund. Säg "fri!" med glad röst och låt hunden röra sig.',
          'Fri ska kännas som belöning — klappa och uppmuntra rörelse.',
        ],
        failTips: [
          'Hunden reser sig innan fri → säg inget, be om position igen med kortare väntan.',
          'Hunden förstår inte fri → kasta godis åt sidan samtidigt som du säger ordet.',
        ],
      },
      {
        id: 'after_ligg_3s',
        label: 'Efter ligg · 3s',
        criteria: 'Hunden ligger 3s tills fri. Avsluta varje ligg/stanna med fri-signal.',
        tips: [
          'Be om ligg. Vänta 3 sekunder. Ge "fri" och belöna när hunden reser sig.',
          'Avsluta varje ligg/stanna med fri-signal — alltid.',
        ],
        failTips: [
          'Hunden reser sig innan fri → förkorta till 1 sekund väntan.',
          'Ge fri tydligt varje gång — hunden ska aldrig avsluta på eget initiativ.',
        ],
      },
      {
        id: 'duration_10s',
        label: 'Durationer · 10s',
        criteria: 'Hunden väntar avspänd 10s i position tills fri ges.',
        tips: [
          'Be om sitt eller ligg. Räkna till 10 avspänt — ge sedan "fri" med glad ton.',
          'Variera tiden ibland så hunden inte räknar sekunder.',
        ],
        failTips: [
          'Hunden bryter → ingen kommentar, gör om med kortare duration.',
          'Tre brott i rad → förkorta till 1 sekund väntan, ge fri, och avsluta.',
        ],
      },
      {
        id: 'duration_30s',
        label: 'Durationer · 30s',
        criteria: 'Hunden väntar 30s med lätt distraktion runtomkring.',
        tips: [
          '30 sekunder i position med lätt distraktion. Ge "fri" tydligt efteråt.',
          'Bygg gradvis — inte direkt från 10 till 30 sekunder.',
        ],
        failTips: [
          'Hunden bryter → backa till 10 sekunder och bygg upp igen.',
          'Sluta alltid med fri efter sista lyckade rep.',
        ],
      },
    ],
    troubleshooting: [
      'Ge ALLTID fri-signal — hunden ska aldrig avsluta beteendet på eget initiativ.',
      'Om hunden bryter: ingen kommentar, gör om med kortare duration, avsluta på lyckad.',
      'Fri är en belöning — ge det med glad ton och låt hunden njuta av friheten.',
    ],
    guide: {
      todaySummary: 'Idag lär ni "fri" — signalen som säger att hunden får resa sig och göra vad den vill.',
      setup: [
        'Välj ett konsekvent ord: "fri", "ok", eller "varsågod" — samma varje gång.',
        'Träna fri i kombination med sitt, ligg eller stanna som hunden redan kan.',
        'Fri ska alltid ges med glad ton och följas av att hunden får röra sig.',
      ],
      steps: [
        {
          how: 'Be om sitt. Vänta 1 sekund. Säg "fri!" med glad röst och klappa/handgester som uppmuntrar rörelse.',
          why: 'Fri ska kännas som belöning — inte som att du bara slutar bry dig.',
        },
        {
          how: 'Om hunden sitter kvar efter "fri": kasta en godisbit åt sidan så den reser sig.',
          why: 'Hunden måste lära sig att fri faktiskt betyder slut — annars väntar den i evighet.',
        },
        {
          how: 'Nästa rep: be om ligg, vänta 2–3 sek, ge "fri". Belöna när hunden reser sig och rör sig.',
          why: 'Fri kopplas till olika positioner så hunden förstår att det är en generell "klart"-signal.',
        },
        {
          how: 'Variera tiden: ibland fri efter 1 sek, ibland efter 5. Hunden ska vänta på dig, inte gissa.',
          why: 'Variation förhindrar att hunden räknar sekunder och reser sig på egen hand.',
        },
        {
          how: 'Avsluta varje pass med "fri" efter sista rep — låt hunden leka eller nos.',
          why: 'Avslut med fri gör att träning känns som något som tar slut tydligt, inte oändligt väntande.',
        },
      ],
      successLooksLike: 'Lyckad rep när hunden håller ett beteende (sitt/ligg/stanna/plats) tills "fri" ges — och inte bryter utan signal.',
      whenItFails: [
        'Hunden reser sig innan fri → säg inget, be om position igen med kortare väntan.',
        'Hunden förstår inte fri → kasta godis åt sidan samtidigt som du säger ordet.',
        'Hunden väntar för länge efter fri → du glömde signalen; ge fri tydligt varje gång.',
      ],
      wrapUp: [
        'Tre brott i rad → förkorta till 1 sekund väntan, ge fri, och avsluta passet.',
        'Sluta alltid med fri efter sista lyckade rep — hunden ska gå därifrån glad.',
      ],
    }
  }),

  fot: spec({
    exerciseId: 'fot',
    definition: 'Lyckad rep när hunden går i fotsteg (vänster sida, axeln vid ditt knä) i 3–5 steg med blickkontakt.',
    ladder: [
      {
        id: 'home_position',
        label: 'Inne · position',
        criteria: 'Hunden ställer sig bredvid vänster ben och tar belöning vid höften.',
        tips: [
          'Locka eller guida hunden till vänster sida — axeln vid ditt knä. Belöna vid höften.',
          'Belöning i vänster hand/ficka — aldrig framför hundens nos.',
        ],
        failTips: [
          'Hunden går före dig → stanna, locka tillbaka, belöna vid knät.',
          'Hunden tar inte godis → gör stillastående position-reps utan att gå.',
        ],
      },
      {
        id: 'home_3steps',
        label: 'Inne · 3 steg',
        criteria: 'Hunden håller fotposition i 3 steg. Belöna vid höften, inte framför.',
        tips: [
          'Säg "fot" och ta 3 steg. Belöna vid vänster höft om hunden är kvar vid sidan.',
          'Sträcks hunden framåt? Stanna, locka tillbaka, belöna.',
        ],
        failTips: [
          'Hunden går före dig → stanna, locka tillbaka, belöna vid knät.',
          'Tre miss i rad → stå still, få position, belöna, ge fri, och avsluta.',
        ],
      },
      {
        id: 'outdoor_low',
        label: 'Ute · låg störning',
        criteria: '5 steg med fokus. Stopp, stopp → belöna. Håll hög frekvens.',
        tips: [
          '5 steg ute med fokus. Stopp, stopp — belöna vid höften med hög frekvens.',
          'Korta mikro-reps, inte hela promenaden.',
        ],
        failTips: [
          'Hunden tappar fokus → belöna varje steg vid sidan och håll sträckorna kortare.',
          'Hunden tar inte godis → gå tillbaka inne och bygg position där.',
        ],
      },
      {
        id: 'outdoor_turns',
        label: 'Ute · vändningar',
        criteria: 'Hunden håller position vid svängningar åt båda håll.',
        tips: [
          'Sväng höger och vänster. Belöna om hunden följer med vid sidan.',
          'Positionen ska vara vid knät — inte halvmeter framför dig.',
        ],
        failTips: [
          'Hunden tappar position vid sväng → belöna tätare och gör en sväng i taget.',
          'Gör fler riktningsändringar inne innan ni provar svängar ute.',
        ],
      },
    ],
    troubleshooting: [
      'Om hunden drar framåt: gör fler riktningsändringar, belöna när hunden är vid ditt knä.',
      'Om hunden tappar fokus: sänk svårighetsgraden och belöna tätare.',
      'Blanda in korta fotsteg-sekvenser i vanliga promenader.',
    ],
    guide: {
      todaySummary: 'Idag tränar ni fot: hunden vid vänster sida, axeln vid ditt knä, i några steg med blick mot dig.',
      setup: [
        'Ha belöning i vänster hand eller vänster ficka — aldrig framför hundens nos.',
        'Börja inne eller på uppfart. Ingen promenad — bara mikro-reps.',
        'Skilj tydligt på "fot" (exakt position) och vanlig koppelgång.',
      ],
      steps: [
        {
          how: 'Stå still. Locka eller guida hunden till vänster sida — axeln vid ditt vänstra knä. Belöna vid höften.',
          why: 'Positionen vid benet är grunden — belöning framför hunden lär den att gå före dig.',
        },
        {
          how: 'Säg "fot" och ta 2–3 steg. Är hunden kvar vid sidan? Belöna vid vänster höft.',
          why: 'Korta bitar med belöning vid benet bygger "fot = här är det bra" utan att kräva hela kvarteret.',
        },
        {
          how: 'Sträcks hunden framåt? Stanna, locka tillbaka till position, belöna. Vänd 180° och prova igen.',
          why: 'Positionen ska vara vid knät — inte halvmeter framför dig.',
        },
        {
          how: 'Lägg till en riktningsändring (höger eller vänster sväng). Belöna om hunden följer med vid sidan.',
          why: 'Svängar håller uppmärksamheten — fot handlar om att följa dig, inte bara gå rakt.',
        },
        {
          how: 'Gör 5–8 mikro-reps. Ge "fri" och avsluta efter en tydlig lyckad sekvens.',
          why: 'Korta pass håller kvaliteten — fot tröttnar snabbt om det blir för långt.',
        },
      ],
      successLooksLike: 'Lyckad rep när hunden går i fotsteg (vänster sida, axeln vid ditt knä) i 3–5 steg med blickkontakt.',
      whenItFails: [
        'Hunden går före dig → stanna, locka tillbaka, belöna vid knät — inte efter att den dragit.',
        'Hunden tappar fokus → belöna varje steg vid sidan och håll sträckorna kortare.',
        'Hunden tar inte godis → miljön är för svår. Gå tillbaka inne och bygg position där.',
      ],
      wrapUp: [
        'Tre miss i rad → stå still, få position, belöna, ge fri, och avsluta.',
        'Stresssignaler (gäsp, vänder bort) → avsluta och träna position stillastående imorgon.',
      ],
    }
  }),

  plats: spec({
    exerciseId: 'plats',
    definition: 'Lyckad rep när hunden självmant går till sin matta, lägger sig och väntar tills fri-signal ges.',
    ladder: [
      {
        id: 'intro_mat',
        label: 'Intro matta',
        criteria: 'Hunden utforskar och trampar på mattan. Belöna all kontakt (capturing — fånga frivilligt beteende, locka inte).',
        tips: [
          'Vänta. Belöna direkt på mattan när hunden nosar eller trampar på den.',
          'Ingen locking — fånga frivilligt beteende med belöning på mattan.',
        ],
        failTips: [
          'Hunden ignorerar mattan → lägg godisslinga som slutar på mattan.',
          'Belöna vid dig istället för på mattan → all belöning ska ges på mattan.',
        ],
      },
      {
        id: 'capture_lie_on_mat',
        label: 'Fånga ligg på matta',
        criteria: 'Vänta tills hunden lägger sig på mattan av sig själv → jackpot. Inga signaler ännu — hunden lär sig att MATTAN orsakar belöning.',
        tips: [
          'Vänta tills hunden lägger sig på mattan själv. Jackpot-belöning direkt på mattan.',
          'Inga signaler ännu — mattan ska kännas som jackpot-zonen.',
        ],
        failTips: [
          'Hunden lägger sig inte → forma mjukt ligg på mattan med lätt locking.',
          'Hunden reser sig tidigt → belöna tätare på mattan och sänk tiden.',
        ],
      },
      {
        id: 'go_to_mat',
        label: 'Gå till matta',
        criteria: 'Hunden går till mattan och lägger sig på signal "plats". Lägg på signal när hunden gör beteendet pålitligt själv.',
        tips: [
          'Säg "plats" precis när hunden börjar gå till mattan. Belöna på mattan.',
          'Signalen ska förutsäga något hunden redan kan frivilligt.',
        ],
        failTips: [
          'Hunden går inte till mattan → forma ligg på mattan och belöna där.',
          'Tre missar → kortare tid på mattan, en lyckad, fri, och avsluta.',
        ],
      },
      {
        id: 'duration_5s',
        label: 'Durationer 5s',
        criteria: 'Hunden stannar liggandes 5 sekunder med lätta distraktioner.',
        tips: [
          'Belöna lugn på mattan i 5 sekunder. Avsluta med tydlig "fri".',
          'Bygg sekunder i små steg: 1, 3, 5.',
        ],
        failTips: [
          'Hunden reser sig tidigt → belöna tätare på mattan och sänk till 3 sek.',
          'Bygg inte direkt till 30 — små steg i duration.',
        ],
      },
      {
        id: 'duration_30s',
        label: 'Durationer 30s',
        criteria: 'Hunden stannar 30s medan du rör dig runtomkring. Avsluta med "fri".',
        tips: [
          '30 sekunder på mattan medan du rör dig runt. Ge "fri" tydligt efteråt.',
          'Belöna på mattan — inte när hunden kommer till dig.',
        ],
        failTips: [
          'Hunden reser sig → backa till 5 sekunder och bygg upp igen.',
          'Vägrar ligga? Träna ligg separat, kom tillbaka till plats imorgon.',
        ],
      },
    ],
    troubleshooting: [
      'Om hunden inte lägger sig: forma ligg på mattan med luringlocket och belöna.',
      'Om hunden stiger upp tidigt: minska durationen och belöna tätare på mattan.',
      'Bygg upp durationen i väldigt små steg — 1s, 3s, 5s, 10s.',
    ],
    guide: {
      todaySummary: 'Idag gör ni mattan magisk: dit går hunden, lägger sig, och väntar på fri.',
      setup: [
        'En tydlig matta eller bädd — samma varje gång i början.',
        'Lägg den synlig men inte mitt i trafikstråket hemma.',
        'Ha många små belöningar. Belöna PÅ mattan, inte när hunden kommer till dig.',
      ],
      steps: [
        {
          how: 'Vänta. När hunden nosar eller trampar på mattan av sig själv → belöna direkt på mattan.',
          why: 'Mattan ska kännas som jackpot-zonen — utan att du lockar eller tjatar.',
        },
        {
          how: 'När hunden lägger sig på mattan (vänta eller forma mjukt) → stor belöning på mattan.',
          why: 'Ligg på mattan är målet; belöning vid dig lär fel plats.',
        },
        {
          how: 'När beteendet är frivilligt: säg “plats” precis när hunden börjar gå dit. Belöna på mattan.',
          why: 'Signalen ska förutsäga något hunden redan kan — inte skapa stress.',
        },
        {
          how: 'Lägg till sekunder: belöna lugn på mattan, öka 1 → 3 → 5 sek. Avsluta alltid med tydlig “fri”.',
          why: 'Utan fri vet hunden inte när det är slut — och reser sig för tidigt.',
        },
      ],
      successLooksLike: 'Hunden går till mattan, lägger sig och stannar tills du ger fri — utan att du tjatar.',
      whenItFails: [
        'Om hunden inte lägger sig: forma ligg på mattan med lätt locking och belöna där.',
        'Om den reser sig tidigt: belöna tätare på mattan och sänk tiden.',
        'Bygg sekunder i små steg: 1, 3, 5 — inte direkt 30.',
      ],
      wrapUp: [
        'Tre missar → kortare tid på mattan, en lyckad, fri, och avsluta.',
        'Vägrar ligga? Träna ligg separat, kom tillbaka till plats imorgon.',
      ],
      variants: [
        {
          id: 'treat_trail',
          label: 'Godisslinga till mattan',
          whenToUse: 'När hunden ignorerar mattan helt.',
          how: [
            'Lägg 3–4 godis i en slinga som slutar på mattan.',
            'När nosen är på mattan: jackpot där. Ta bort slingan när den börjar gå dit själv.',
          ],
          why: 'Gör vägen till mattan uppenbar utan att du jagar eller pekar argt.',
        },
        {
          id: 'guest_settle',
          label: 'Plats när det händer något',
          whenToUse: 'När mattan funkar i lugn men faller sönder vid dörr/gäster.',
          how: [
            'En person knackar eller rör sig i hallen på avstånd.',
            'Be om plats, belöna tätare på mattan, ge fri innan hunden spricker.',
          ],
          why: 'Tränar lugn i verkligheten — men bara när grundspelet redan sitter.',
        },
      ],
    }
  }),

  rastning: spec({
    exerciseId: 'rastning',
    definition: 'Lyckad rep = hunden kissar/bajsar utomhus (eller på avsedd plats) inom 2 minuter efter att du tagit ut den. Belöna direkt på plats.',
    ladder: [
      {
        id: 'after_sleep',
        label: 'Efter sömn',
        criteria: 'Ut direkt när valpen vaknar — innan den hinner kissa inne. Vänta lugnt, belöna när det händer ute.',
        tips: [
          'Bär valpen ut direkt vid väckning — innan den hinner kissa inne.',
          'Stå still ute, säg mjuk signal. Belöna inom 1 sekund när det händer på plats.',
        ],
        failTips: [
          'Olycka inne → korta intervallet och läs sömn-signaler bättre.',
          'Belöna ALDRIG efteråt inne — bara på plats där den lyckas.',
        ],
      },
      {
        id: 'after_meal',
        label: 'Efter mat',
        criteria: 'Ut 5–15 min efter måltid. Stå still, låt valpen sniffa. Belöna när den lättar sig.',
        tips: [
          'Ut 5–15 min efter mat. Stå still, låt valpen sniffa upp till 2 min.',
          'Belöna direkt på plats med 2–3 godis när den är klar.',
        ],
        failTips: [
          'Ingen success → stå längre ute och minska distraktioner.',
          'Olyckor inne = för långa intervall. Korta intervallet.',
        ],
      },
      {
        id: 'after_play',
        label: 'Efter lek',
        criteria: 'Ut direkt efter aktivitet — rörelse triggar tarm/blåsa.',
        tips: [
          'Ut direkt efter lek eller aktivitet. Samma rutin: stillhet, signal, belöning på plats.',
          'Ge 1–2 minuter lek/utforska ute som extra belöning efteråt.',
        ],
        failTips: [
          'Valpen kissar inne efter lek → gå ut snabbare efter aktivitet.',
          'Straffa aldrig olyckor — torka upp neutralt med enzymatisk rengöring.',
        ],
      },
      {
        id: 'scheduled_60min',
        label: 'Var 60 min',
        criteria: 'Schemalagda turer för valpar 8–12 v: var 60 min vaken tid + alltid efter sömn/mat/lek.',
        tips: [
          'Schemalagd tur var 60 min vaken tid — plus alltid efter sömn, mat och lek.',
          'Ha godis i fickan redan när du sätter på kopplet.',
        ],
        failTips: [
          '2+ olyckor samma dag → minska intervallet med 30 min.',
          'Missade signaler → notera tider och läs mönstret bättre.',
        ],
      },
      {
        id: 'scheduled_90min',
        label: 'Var 90 min',
        criteria: 'För valpar 12–16 v som klarar längre intervall.',
        tips: [
          'Var 90 min för valpar 12–16 v — fortfarande alltid efter sömn/mat/lek.',
          'Samma fasta rastningsplats — samma doft hjälper igångsättning.',
        ],
        failTips: [
          'Olyckor ökar → backa till 60-min-intervall tills det sitter.',
          'Låt valpen sniffa runt ute längre innan ni går in.',
        ],
      },
      {
        id: 'asks_to_go',
        label: 'Ber själv om att gå ut',
        criteria: 'Hunden signalerar tydligt (går till dörr, gnäller, tittar) när den behöver ut.',
        tips: [
          'Belöna tydlig signal (dörr, gnäll, blick) genom att gå ut direkt.',
          'Samma rastningsplats och rutin — belöna på plats ute.',
        ],
        failTips: [
          'Hunden signalerar men olycka ändå → svara snabbare på signalen.',
          'Ignorera inte signalen — det saboterar inlärningen.',
        ],
      },
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
        {
          how: 'Vakna valpen? → bär den ut direkt (inte gå — de kissar i trappan).',
          why: 'Valpar hinner inte hålla sig — bära ut ger chansen innan olyckan händer inne.',
        },
        {
          how: 'Stå stilla utomhus, säg en mjuk signal ("kissa", "bajs"). Vänta upp till 2 min.',
          why: 'Stillhet och samma ord hjälper kroppen koppla platsen till toalett — inte bara promenad.',
        },
        {
          how: 'I sekunden hunden börjar lätta sig: säg "ja!" mjukt. När den är klar — belöna direkt på plats med 2–3 godis.',
          why: 'Belöning på plats (inte inne efteråt) lär att rätt ställe ger fest — inte bara att gå in igen.',
        },
        {
          how: 'Sen 1–2 minuter lek/utforska som extra belöning innan ni går in.',
          why: 'Lek efteråt gör ute-turen värd mer — så väntar hunden gärna tills den är klar.',
        },
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
      {
        id: 'aj_pause',
        label: '"Aj" + paus',
        criteria: 'När valpen biter hårt: säg "Aj!" mjukt + frys helt 3 sekunder. Belöna när den släpper.',
        tips: [
          'Vid hårt bett: säg "Aj!" mjukt och frys helt i 3 sekunder.',
          'Belöna när valpen släpper — erbjud sedan godkänd leksak.',
        ],
        failTips: [
          '"Aj" funkar inte → valpen är överstimulerad. Time-out: gå ifrån lugnt i 30 sek.',
          'Värst på kvällarna → vilopaus i bur/box innan kvällsbettet börjar.',
        ],
      },
      {
        id: 'redirect_toy',
        label: 'Omdirigera till leksak',
        criteria: 'Erbjud godkänt tuggalternativ samtidigt som du drar bort handen.',
        tips: [
          'Dra bort handen och erbjud godkänd leksak samtidigt.',
          '30 sek lek med leksaken som belöning för rätt val.',
        ],
        failTips: [
          'Valpen ignorerar leksaken → prova annan tuggleksak med högre värde.',
          'Time-out om bettet fortsätter efter 1–2 omdirigeringar.',
        ],
      },
      {
        id: 'walk_away',
        label: 'Gå därifrån vid hårt bett',
        criteria: 'Hårt bett = leken slutar. Res dig, vänd dig bort 30 sek. Kom tillbaka lugnt och starta om mjukare.',
        tips: [
          'Hårt bett = leken slutar. Res dig, vänd dig bort i 30 sek.',
          'Kom tillbaka lugnt och starta om med mjukare lek.',
        ],
        failTips: [
          '3+ time-outs i rad → valpen är trött. Lägg den i bur/box för vila.',
          'Konsekvent regel: hårt bett tar bort uppmärksamhet, inte mer lek.',
        ],
      },
      {
        id: 'self_redirect',
        label: 'Valpen väljer själv leksak',
        criteria: 'När valpen är överstimulerad går den frivilligt till sin leksak istället för att bita.',
        tips: [
          'Ha 2–3 godkända tuggleksaker tillgängliga. Belöna när valpen väljer leksak själv.',
          'Bygg vanan innan överstimulering — belöna proaktiva val.',
        ],
        failTips: [
          'Valpen biter ändå → backa till omdirigering och time-out.',
          'Bett mot barn → separera fysiskt och kontakta beteendekonsulent.',
        ],
      },
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
        {
          how: 'Valp biter mjukt (lek-bett): säg "Aj!" om det blir hårdare, fortsätt om det är mjukt.',
          why: 'Du sätter gränsen tidigt — valpen lär skillnad mellan lek och för hårt utan drama.',
        },
        {
          how: 'Valp biter hårt: säg "Aj!" mjukt + frys helt (ingen rörelse i 3 sek). När den släpper → erbjud leksak.',
          why: 'Frysning + alternativ lär att släppa handen öppnar rolig lek — inte mer bett.',
        },
        {
          how: 'Valpen tar leksaken → 30 sek lek med leksaken som belöning för rätt val.',
          why: 'Belöna rätt val gör tugg mer attraktivt än fingrar och ärmar.',
        },
        {
          how: 'Valpen biter igen efter 1–2 reps → leken är slut. Res dig, gå ifrån 30 sek. Återvänd lugnt och starta om eller lägg valpen i vila.',
          why: 'Konsekvent konsekvens lär att hårt bett tar bort uppmärksamhet — inte mer lek.',
        },
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
      {
        id: 'eat_in_open',
        label: 'Äter i öppen bur',
        criteria: 'Ställ matskålen längst in i buren. Hunden går in själv och äter. Dörren öppen hela tiden.',
        tips: [
          'Ställ matskålen längst in. Dörren öppen — hunden går in själv och äter.',
          'Kasta godis nära buren när hunden går dit. Buren = bra saker händer.',
        ],
        failTips: [
          'Hunden vägrar gå in → börja med extra god mat (lever, korv) i öppen bur.',
          'Aldrig som straff — buren ska vara en bra plats.',
        ],
      },
      {
        id: 'door_closed_30s',
        label: 'Stängd dörr · 30 sek',
        criteria: 'Stäng dörren medan hunden äter, öppna innan den är klar. Stegvis längre.',
        tips: [
          'Stäng dörren medan hunden äter. Öppna innan den är klar — 5 sek → 30 sek.',
          'Kort stängning under måltid gör dörren harmlös.',
        ],
        failTips: [
          'Hunden panikar → öppna direkt, ingen press. Backa till öppen bur.',
          'Du höjde duration för fort → kortare stängning nästa pass.',
        ],
      },
      {
        id: 'rest_5min',
        label: 'Vila 5 min',
        criteria: 'Hunden vilar i buren 5 min med stängd dörr, du i samma rum. Belöna lugn vila vid släpp.',
        tips: [
          '5 min i buren, stängd dörr, du i samma rum. Belöna lugn vila vid släpp.',
          'Hunden ska vara nedvarvad/trött när du sätter den i buren.',
        ],
        failTips: [
          'Hunden gnyr/skäller → backa nivån. Du höjde duration för fort.',
          'Ge värdefull kong i buren innan du stänger dörren.',
        ],
      },
      {
        id: 'rest_30min',
        label: 'Vila 30 min',
        criteria: 'Som ovan men 30 min. Bör vara nedvarvad/tröttkörd när du sätter den i buren.',
        tips: [
          '30 min vila — hunden ska vara tröttkörd innan du sätter den i buren.',
          'Du i samma rum. Belöna lugn vila vid släpp.',
        ],
        failTips: [
          'Gnyr > 5 min → låt hunden ut, kortare duration nästa pass.',
          'Backa till 5 min tills det sitter stabilt.',
        ],
      },
      {
        id: 'alone_15min',
        label: 'Du går ifrån · 15 min',
        criteria: 'Du lämnar rummet (eller hemmet) 15 min, hunden vilar i buren.',
        tips: [
          'Lämna rummet i 15 min. Hunden vilar i buren med fryst kong.',
          'Släpp aldrig ut vid skällning — vänta tystnad (även 5 sek) först.',
        ],
        failTips: [
          'Panik → STOPP. Kontakta beteendekonsulent innan ni fortsätter.',
          'Backa till 5 min med dig i rummet innan du lämnar.',
        ],
      },
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
        {
          how: 'Dag 1–3: dörr öppen, mata hunden i buren, kasta in godis när den går nära.',
          why: 'Buren blir platsen där bra saker händer — innan stängd dörr ens blir ett tema.',
        },
        {
          how: 'Dag 4–7: stäng dörren medan den äter, öppna innan klar. 5 sek → 30 sek → 1 min.',
          why: 'Kort stängning under måltid gör dörren harmlös — hunden hinner inte stressa upp.',
        },
        {
          how: 'Vecka 2: hunden går in på signal ("plats"/"in"). Stängd dörr 5–15 min medan du är i rummet.',
          why: 'Du i närheten gör duration trygg innan ensamhet ens testas.',
        },
        {
          how: 'Vecka 3+: bygg upp tid + du går ifrån. Aldrig släppa ut när den skäller — vänta tystnad (även 5 sek räcker) först.',
          why: 'Släpp vid tystnad lär att lugn öppnar dörren — skällning förlänger bara väntan.',
        },
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
      {
        id: 'separation_30s',
        label: '30 sek separation',
        criteria: 'Gå till nästa rum, stäng dörren, kom tillbaka. Ingen reaktion = lyckad.',
        tips: [
          'Gå till nästa rum, stäng dörren, kom tillbaka efter 30 sek.',
          'Neutralt avsked och hälsning — inget drama.',
        ],
        failTips: [
          'Hunden reagerar redan vid 30 sek → börja om från sekundnivå (öppna, stäng, öppna).',
          'Filma hunden — du behöver se vad som händer när du går.',
        ],
      },
      {
        id: 'separation_5min',
        label: '5 min separation',
        criteria: 'Lämna hemmet (gå till källaren/utanför dörren) i 5 min.',
        tips: [
          'Lämna hemmet i 5 min. Lämna fryst kong eller långtuggande gott.',
          'Tröttkör hunden fysiskt och mentalt innan passet.',
        ],
        failTips: [
          'Reaktion vid 5 min → backa till 30 sek och bygg gradvis.',
          'Stort avsked saboterar — lämna och kom hem neutralt.',
        ],
      },
      {
        id: 'errand_30min',
        label: '30 min kort ärende',
        criteria: 'Gå till mataffären/posten. Hunden ensam hemma, gärna i bur eller på sin plats.',
        tips: [
          '30 min borta — hunden i bur eller på sin plats med kong.',
          'Bygg gradvis: 10 → 15 → 20 → 30 min, hoppa aldrig över steg.',
        ],
        failTips: [
          '30 min blir kaos efter 5 min fungerat → kliv inte upp för fort.',
          'Trygga miljön: vita brus, gardiner om ljud triggar.',
        ],
      },
      {
        id: 'errand_2h',
        label: '2 timmar borta',
        criteria: 'Längre ärende. Förutsätter att 30-min-nivån är solid.',
        tips: [
          '2 timmar — bara om 30-min-nivån är solid.',
          'Variera tider så hunden inte räknar minuter.',
        ],
        failTips: [
          'Reaktion → stoppa nuvarande nivå, backa till 50%.',
          'Panik (drev/saliv/självskada) → STOPP, kontakta beteendekonsulent.',
        ],
      },
      {
        id: 'workday_4h',
        label: 'Halv arbetsdag · 4 h',
        criteria: 'Maxgräns för vuxen hund. Valp under 6 mån klarar mindre.',
        tips: [
          'Max 4 h för vuxen hund. Valp under 6 mån klarar betydligt mindre.',
          'Fryst kong och trygg plats (bur/matta) innan du går.',
        ],
        failTips: [
          'Hunden förstör när du varit borta → backa till kortare duration.',
          'Paniktecken → STOPP, detta tränas inte bort själv.',
        ],
      },
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
        {
          how: 'Sätt på morgonrock + skor (avskedscues) — gå INTE. Sätt dig igen. Upprepa till hunden inte längre reagerar på cues.',
          why: 'Avskedscues blir tråkiga när inget händer — så startar inte paniken redan vid skorna.',
        },
        {
          how: 'Gå ut genom dörren — kom tillbaka direkt (5 sek). Belöna när hunden är lugn.',
          why: 'Mikro-separation bevisar att du alltid kommer tillbaka — innan minuterna ens räknas.',
        },
        {
          how: 'Bygg duration: 30 sek → 1 min → 2 min → 5 min → 15 min → 30 min. Hoppa aldrig över steg.',
          why: 'Gradvis tid håller hunden under tröskeln — ett hopp för långt skapar panik som saboterar veckor av träning.',
        },
        {
          how: 'Variera tider — så hunden inte räknar minuter. Ibland 5 min, ibland 30, ibland 2 h.',
          why: 'Oregelbundna avstånd gör att hunden inte kan räkna ner till panik — den lär sig bara att du kommer tillbaka.',
        },
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
      {
        id: 'mark_neutral',
        label: 'Markera neutral titt inne',
        criteria: 'Hunden tittar på vad som helst (bok, lampa), du markerar och belönar. Bygger associationen: titta → markör → godis. Ingen trigger än.',
        tips: [
          'Inne: när hunden tittar på valfri sak — markera direkt och belöna mot dig.',
          'Bygger associationen titta → markör → godis. Ingen trigger ännu.',
        ],
        failTips: [
          'Markören sitter inte → ladda markören med 10 ren laddning-reps först.',
          'Hunden fixerar → du är för nära triggern redan. Håll det neutralt inne.',
        ],
      },
      {
        id: 'trigger_far',
        label: 'Trigger på långt avstånd',
        criteria: 'Identifiera ditt working distance — det avstånd där hunden ser triggern men kan ta godis. Markera varje gång hunden tittar på triggern, belöna mot dig.',
        tips: [
          'Stå på working distance. Markera direkt när hunden tittar på triggern.',
          'Belöna nära ditt ben så hunden vänder mot dig för att äta.',
        ],
        failTips: [
          'Hunden fixerar och tar inte godis → backa 5–10 m.',
          'Godiset är inte värt nog → använd korv, lever, ost enbart vid trigger-träning.',
        ],
      },
      {
        id: 'trigger_medium',
        label: 'Trigger medel avstånd',
        criteria: 'Minska avstånd 25%. Endast om hunden konsekvent vänder mot dig efter markering på förra nivån.',
        tips: [
          'Minska avstånd med 25% — bara om förra nivån sitter konsekvent.',
          'Markera varje kort blick på triggern. Belöna mot dig.',
        ],
        failTips: [
          'Hunden fixerar → du är för nära. Backa till längre avstånd.',
          'Sluta INNAN hunden tröttnar eller börjar fixera.',
        ],
      },
      {
        id: 'multiple_triggers',
        label: 'Flera triggers samma session',
        criteria: 'Två olika triggers i samma session (cyklist + hund), längre avstånd. Bygger generalisering.',
        tips: [
          'Två olika triggers i samma pass — längre avstånd än vanligt.',
          'Samma rutin: markera blick, belöna mot dig. 5–10 reps totalt.',
        ],
        failTips: [
          'Hunden fixerar → backa avstånd och kör en trigger i taget.',
          'Skällning under session → STOPP. Gå bort tills hunden tar godis igen.',
        ],
      },
      {
        id: 'recovery_check',
        label: 'Återhämtningstest',
        criteria: 'Efter en trigger-passage: hunden ska kunna utföra ett känt beteende (sitt, fokus) inom 10 sek. Om nej → backa avstånd.',
        tips: [
          'Efter trigger-passage: be om sitt eller fokus inom 10 sek.',
          'Klarar hunden det → avståndet var rätt. Annars backa.',
        ],
        failTips: [
          'Hunden klarar inte känt beteende → backa avstånd 50%.',
          'Reaktivitet som blir värre → kontakta certifierad beteendekonsulent.',
        ],
      },
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
        {
          how: 'Stå på working distance från triggern, vid sidan av en bil eller buske om hunden behöver visuell skydd.',
          why: 'Rätt avstånd gör att hunden kan titta utan att gå över tröskeln — där godis slutar funka.',
        },
        {
          how: 'Vänta. När hunden tittar på triggern → markera DIREKT (inom 0,5 sek).',
          why: 'Snabb markering fångar just den korta blicken — innan fixering tar över.',
        },
        {
          how: 'Belöna nära ditt ben, så hunden vänder mot dig för att äta.',
          why: 'Godis vid dig gör att blick på trigger automatiskt leder till check-in — det är hela poängen med LAT.',
        },
        {
          how: 'Upprepa 5–10 reps. Sluta INNAN hunden tröttnar eller börjar fixera. Avsluta passet med en lugn promenad bort från triggern.',
          why: 'Sluta tidigt håller träningen under tröskeln — en fixerad hund lär sig fel saker.',
        },
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

