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

  /**
   * Curated handler guide (static truth) for how to run the exercise/tests.
   */
  guide?: {
    setup: string[]
    steps: string[]
    logging: string[]
    commonMistakes: string[]
    stopRules: string[]
  }
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
    guide: {
      setup: [
        'Ha 10–20 små belöningar redo i fickan.',
        'Starta i lätt miljö (inne/uppfart) innan du går ut i “svårt”.',
        'Målet är slakt koppel i korta bitar, inte lång promenad.',
      ],
      steps: [
        'Stå still. Vänta 1 sekund på att hunden vänder mot dig → belöna vid din sida.',
        'Gå 1–2 steg. Om kopplet är slakt → belöna direkt.',
        'Om kopplet sträcks → vänd lugnt bort/byt riktning. Belöna när hunden följer och kopplet slakar.',
        'Gör 5–10 “mikro-reps” och ta paus.',
      ],
      logging: [
        'Tryck “Lyckad” när du fick slakt koppel i de steg du siktade på.',
        'Tryck “Miss” när kopplet sträcks innan du hann belöna.',
        'Latens = hur snabbt hunden återvänder/återfår slakt koppel.',
      ],
      commonMistakes: [
        'För lång sträcka per rep → belöna oftare istället.',
        'Du går vidare fast kopplet är sträckt (hundens drag blir självbelönande).',
        'Belöningen hamnar framför hunden (driver mer drag). Belöna nära ditt ben.',
      ],
      stopRules: [
        'Två miss i rad → sänk kriteriet (kortare sträcka/lättare miljö) och avsluta efter 1 lyckad.',
        'Om hunden inte tar belöning ute → gå in/byt till enklare miljö.',
      ],
    },
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
      setup: [
        'Välj en lugn plats (soffa/golv) och ha många små belöningar.',
        'Målet är “frivilligt och lugnt”, inte att “bli klar”.',
      ],
      steps: [
        'Rör lätt vid tass/öra 0,5–1 sekund → belöna direkt.',
        'Upprepa 3–5 gånger. Ta paus.',
        'Öka bara ett steg: lite längre hålltid eller lite mer “svårt” område.',
        'Avsluta tidigt (innan hunden vill dra undan).',
      ],
      logging: [
        'Lyckad = hunden var lugn och stannade kvar i steget du tränade.',
        'Miss = hunden drar undan, spänner sig eller vill bort → backa nivå.',
        'Latens = hur snabbt hunden blir lugn igen efter din beröring.',
      ],
      commonMistakes: [
        'För långa pass → håll 20–60 sek.',
        'Håller fast hunden → skapar motstånd. Backa och belöna frivillighet.',
        'Går direkt på “klippa klo” utan att ha byggt upp verktyg-intro.',
      ],
      stopRules: [
        'Vid stress/undvikande → backa ett steg direkt och avsluta efter 1 lugn rep.',
        'Om hunden blir trött/uppvarvad → pausa och lek/berika istället.',
      ],
    },
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
      setup: [
        'Träna i säker miljö (inne/inhägnat). Ute: använd långlina vid behov.',
        'Ha belöning som är bättre än omgivningen (särskilt ute).',
        'Säg signalen en gång. Om du behöver “tjata” är kriteriet för svårt.',
      ],
      steps: [
        'Säg hundens namn → när hunden tittar: säg inkallningssignal (“kom”) och backa 1–2 steg.',
        'Belöna direkt när hunden vänder, och igen när den når dig (om du vill bygga fart).',
        'Släpp hunden igen (“fri”) så inkallning inte betyder “kul tar slut”.',
        'Gör 3–5 reps, pausa, avsluta i framgång.',
      ],
      logging: [
        'Lyckad = hunden vänder och kommer hela vägen på första signalen.',
        'Miss = ingen vändning / kommer bara delvis / du behövde flera signaler.',
        'Latens = tiden till vändning (snabb vändning är viktigast tidigt).',
      ],
      commonMistakes: [
        'Kallar när hunden redan är “borta i hjärnan” (för svår störning).',
        'Lockar med belöningen framför hunden ute (hund tar belöningen och drar vidare). Belöna nära dig.',
        'Inkallning används bara för att stoppa kul → hunden blir seg.',
      ],
      stopRules: [
        'Två miss i rad → sänk avstånd/störning direkt och avsluta efter 1 lyckad rep.',
        'Om latens >3s ute → backa till lättare miljö eller högre belöning.',
      ],
    },
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
      setup: [
        'Ha 10 små belöningar i handen/fickan.',
        'Börja när hunden är relativt lugn (inte mitt i lek/uppvarvning).',
      ],
      steps: [
        'Säg namnet en gång i glad neutral ton.',
        'Så fort hunden tittar på dig → belöna.',
        'Pausa 1–2 sek och upprepa.',
        'Byt miljö först när du har stabilt flyt hemma.',
      ],
      logging: [
        'Lyckad = blick inom 1–3 sek.',
        'Miss = ingen blick / du behövde upprepa namnet.',
        'Latens = hur snabbt blicken kommer.',
      ],
      commonMistakes: [
        'Använder namnet när du ändå inte kan belöna (namnet tappar värde).',
        'Upprepar namnet flera gånger → lär hunden att ignorera första.',
      ],
      stopRules: [
        'Två miss i rad → gå närmare/lättare miljö och avsluta efter 1 lyckad rep.',
      ],
    },
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
    guide: {
      setup: [
        'Ha 10 små belöningar redo.',
        'Träna i lugn miljö först. Byt plats först när det är stabilt.',
      ],
      steps: [
        'Visa lockning (om behövs): för belöningen långsamt upp/över nosen → rumpan hamnar i marken.',
        'Markera precis när rumpan träffar marken → belöna direkt.',
        'Säg signal (“sitt”) precis innan du gör samma handrörelse.',
        'Gör 3–5 reps, pausa, avsluta i framgång.',
      ],
      logging: [
        'Lyckad = sitt inom 1–3 sek och hunden stannar kvar tills belöning.',
        'Miss = inget sitt, väldigt seg respons, eller hunden studsar upp direkt.',
        'Latens = tiden till sitt (snabb respons är viktigare än “perfekt” form i början).',
      ],
      commonMistakes: [
        'Lockar för snabbt → hunden hoppar/studsar. Sakta ner.',
        'Höjer kriteriet (duration + störning) samtidigt.',
        'Tränar för länge → valpen tappar fokus och kvaliteten faller.',
      ],
      stopRules: [
        'Två miss i rad → backa (locka igen / lättare miljö) och avsluta efter 1 lyckad.',
        'Om hunden blir uppvarvad: pausa 30–60 sek, gör 1 lätt rep och avsluta.',
      ],
    },
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
    guide: {
      setup: [
        'Välj ett skönt underlag (matta) i början.',
        'Ha belöningar redo och håll passen korta.',
      ],
      steps: [
        'Börja från sitt eller stå. För belöningen långsamt ner mot golvet och lite framåt.',
        'När bröst/armbågar går i marken → belöna direkt.',
        'Säg signal (“ligg”) precis innan du gör samma handrörelse.',
        'Gör 3–5 reps, pausa. Avsluta när det går bra.',
      ],
      logging: [
        'Lyckad = helt ner inom 1–3 sek.',
        'Miss = halvvägs ner, seg respons, eller hunden reser sig direkt.',
        'Latens = tiden tills hunden går ner.',
      ],
      commonMistakes: [
        'För svårt underlag (kallt/vått) → hunden vill inte lägga sig.',
        'Du håller belöningen för nära → hunden “fastnar” i sitt.',
        'Du väntar för länge med belöning → hunden reser sig och du tränar fel.',
      ],
      stopRules: [
        'Två miss i rad → byt underlag/lättare setup och avsluta efter 1 lyckad.',
        'Om hunden blir frustrerad: gör 1 lätt övning (namn/sitt) och avsluta.',
      ],
    },
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
      setup: [
        'Välj en position (sitt eller ligg) och träna bara en sak: duration eller avstånd.',
        'Ha belöningen redo så du kan belöna innan hunden bryter.',
      ],
      steps: [
        'Be om sitt/ligg. Räkna 1 sekund → belöna.',
        'Upprepa 3 reps. Om det är lätt: öka till 2–3 sek (inte mer).',
        'Nästa steg: 1 steg bort och tillbaka → belöna.',
        'Avsluta när det går bra.',
      ],
      logging: [
        'Lyckad = hunden höll positionen tills belöning/frikommando.',
        'Miss = hunden reser sig/följer efter innan du hann belöna.',
        'Latens = hur snabbt hunden “låser sig” i position (lugnt kvar).',
      ],
      commonMistakes: [
        'Ökar både tid och avstånd samtidigt.',
        'Belönar för sent → hunden bryter och du tränar oavsiktligt brytning.',
      ],
      stopRules: [
        'Två miss i rad → korta ner (1 sek) och avsluta efter 1 lyckad.',
      ],
    },
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
      setup: [
        'Börja nära (0–1 m) i lugn miljö.',
        'Ha belöningar som kan “levereras på plats” (kasta/rulla godis).',
        'Bestäm signal: 1 pip eller ett ord. Använd samma varje gång.',
      ],
      steps: [
        'När hunden rör sig långsamt: ge stopsignal en gång.',
        'Så fort hunden bromsar/stannar → kasta belöning vid hundens fötter.',
        'Upprepa 3–5 reps med pauser.',
        'Öka först avstånd ELLER störning (inte båda).',
      ],
      logging: [
        'Lyckad = stannar/bromsar direkt på första signalen.',
        'Miss = fortsätter framåt / du behövde upprepa.',
        'Latens = tiden tills broms/stopp (snabb broms är målet).',
      ],
      commonMistakes: [
        'Belönar genom att kalla in → stoppsignalen blir inkallning.',
        'Kör för svårt för tidigt (för långt avstånd, för hög störning).',
        'Upprepar signalen → lär hunden att första inte räknas.',
      ],
      stopRules: [
        'Två miss i rad → gå närmare/lättare miljö och avsluta efter 1 lyckad.',
        'Om hunden blir hetsig: sänk tempo, korta passet, belöna tätare.',
      ],
    },
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
      setup: [
        'Välj en tydlig trigger (mat, leksak, rörelse) och gör den “svag” först.',
        'Ha belöning redo och jobba i korta set (10–20 sek).',
      ],
      steps: [
        'Presentera triggern kort (t.ex. visa mat i handen).',
        'Belöna direkt när hunden väljer lugn/avvaktande (titta bort, stillhet).',
        'Öka triggern lite (närmare, längre tid, mer rörelse) först när det är stabilt.',
        'Avsluta medan hunden fortfarande klarar det.',
      ],
      logging: [
        'Lyckad = hunden avvaktar trots trigger (ingen kast, ingen rusning).',
        'Miss = hunden kastar sig, piper, stressar, eller tappar kontroll.',
        'Latens = hur snabbt hunden går från trigger → lugn/avvaktande.',
      ],
      commonMistakes: [
        'Triggern är för stark för tidigt (för nära/för länge).',
        'Du väntar på “perfekt” och belönar för sällan → hunden går upp i varv.',
        'Du gör seten för långa.',
      ],
      stopRules: [
        'Två miss i rad → sänk triggern direkt och avsluta efter 1 lyckad.',
        'Om hunden blir stressad: byt till orientering/namn och avsluta.',
      ],
    },
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
      setup: [
        'Målet är spontana check-ins. Inga kommandon i början.',
        'Ha belöning redo och börja i lätt miljö.',
      ],
      steps: [
        'Var still/neutral. Vänta på att hunden tittar mot dig → belöna.',
        'När hunden fattar: rör dig lite (1–2 steg) och belöna check-in igen.',
        'Flytta gradvis till lätt ute-miljö och belöna varje check-in i början.',
        'Avsluta efter några lyckade reps (korta pass).',
      ],
      logging: [
        'Lyckad = hunden checkar in spontant (blick/kommer nära).',
        'Miss = hunden “försvinner” länge utan orientering i vald miljö.',
        'Latens = tiden tills första check-in efter att ni startade/byter miljö.',
      ],
      commonMistakes: [
        'Du ropar/lockar för mycket → det blir inte spontant beteende.',
        'Du belönar för sällan i början (beteendet dör).',
        'Du går till för svår plats direkt.',
      ],
      stopRules: [
        'Om ingen orientering på ~30–60 sek → byt till lättare miljö och belöna tätare.',
        'Två “miss”-perioder → avsluta och gör en lätt övning hemma.',
      ],
    },
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
      setup: [
        'Välj ett enkelt sök: 3–5 godisbitar i gräs eller en lätt gömma inne.',
        'Ha en tydlig avslutssignal (“klart”) och belöna avslut.',
        'Ute: använd långlina om du behöver säkerhet/kontroll.',
      ],
      steps: [
        'Säg “sök” och låt hunden nosa i 10–20 sek.',
        'Säg “klart” och belöna när hunden vänder upp mot dig/kommer in.',
        'Pausa 10–20 sek och upprepa.',
        'Öka svårighet långsamt (störning, större yta, längre tid) en sak i taget.',
      ],
      logging: [
        'Lyckad = hunden söker lugnt och kan avsluta/komma in när du ber om det.',
        'Miss = hunden går upp i varv, drar iväg eller går inte att avbryta.',
        'Latens = tiden från avslutssignal till orientering/kom-in.',
      ],
      commonMistakes: [
        'Söket blir för långt → hunden går upp i varv och blir svår att bryta.',
        'Du höjer svårighet och duration samtidigt.',
        'Du “jagar” hunden efter sök i stället för att göra enklare.',
      ],
      stopRules: [
        'Två miss i rad → gör söket enklare/kortare och avsluta efter 1 lyckad.',
        'Om hunden blir överhettad: byt till hantering/namn och avsluta.',
      ],
    },
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
      setup: [
        'Välj en enkel trigger (mat i hand, skål, leksak).',
        'Ha en tydlig “fri”-signal som betyder att hunden får ta/agera.',
      ],
      steps: [
        'Visa triggern. Vänta 1 sekund av lugn (ingen kast) → belöna.',
        'Öka till 2–3 sek när det är lätt.',
        'Lägg in “fri” ibland som belöning (så kontroll ger tillgång).',
        'Träna korta set och avsluta i framgång.',
      ],
      logging: [
        'Lyckad = hunden kan vänta/avstå i den tid du tränar, lugnt.',
        'Miss = hunden kastar sig, piper, stressar eller tappar kontroll.',
        'Latens = hur snabbt hunden går tillbaka till lugn efter trigger.',
      ],
      commonMistakes: [
        'För lång väntan för tidigt.',
        'Belönar bara med att “ta triggern” → hunden lär sig att kasta sig.',
        'Tränar när hunden redan är för uppvarvad.',
      ],
      stopRules: [
        'Två miss i rad → sänk tid/trigger och avsluta efter 1 lyckad.',
        'Om hunden blir frustrerad: kör 1 lätt rep (namn) och avsluta.',
      ],
    },
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
      setup: [
        'Välj ett nytt stimuli per session.',
        'Ha hög-värde belöning redo.',
        'Mål: hunden väljer att utforska, inte att fly eller frys.',
      ],
      steps: [
        'Placera dig och hunden på tryggt avstånd från stimulit.',
        'Belöna varje blick mot stimulit som är lugn och nyfiken.',
        'Minska avstånd BARA om hunden är avslappnad och väljer att gå närmre.',
        'Avsluta efter 2–5 lyckade interaktioner.',
      ],
      logging: [
        'Lyckad = hunden närmade sig/passerade/tittade på stimulit utan stress.',
        'Miss = hunden frös, flydde, skällde eller visade tydlig stress.',
        'Latens = hur snabbt hunden "återhämtar sig" och blir nyfiken igen.',
      ],
      commonMistakes: [
        'Tvinga hunden för nära för fort.',
        'Belöna när hunden är stressad (förstärker stresstillståndet).',
        'För många nya stimuli per session — välj ett åt gången.',
      ],
      stopRules: [
        'Tydliga stresssignaler (gäsp, slicka sig, undvikande) → öka avstånd och avsluta.',
        'Om hunden vägrar ta belöning → för svårt, gå till enklare miljö.',
      ],
    },
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
      setup: [
        'Stå still. Ha belöning gömd i handen bakom ryggen.',
        'Vänta på spontan ögonkontakt — belöna.',
      ],
      steps: [
        'Stå still i lugn miljö. Vänta 1–5 sek på att hunden tittar upp på dig.',
        'Märk exakt när ögonkontakt sker → belöna direkt.',
        'Bygg upp duration: belöna efter 1s, 2s, 3s.',
        'Lägg gradvis in distraktion i bakgrunden.',
      ],
      logging: [
        'Lyckad = ögonkontakt i minst 2 sek i aktuell miljö.',
        'Miss = hunden tittar bort/iväg innan 2 sek.',
        'Latens = hur lång tid det tar tills hunden tittar upp.',
      ],
      commonMistakes: [
        'Säger hundens namn upprepade gånger för att "tvinga" kontakt.',
        'Ökar distraktion och duration samtidigt.',
        'Belönar för sent (ögonkontakten har redan brutits).',
      ],
      stopRules: [
        'Tre missar i rad → gå till ingen-störning-version och avsluta efter 1 lyckad.',
      ],
    },
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
      setup: [
        'Välj ett objekt hunden gillar (mjukt dummy, leksak).',
        'Träna inne i kort korridor eller liten yta.',
        'Ha belöning redo för utbyte.',
      ],
      steps: [
        'Visa objektet, kasta 0,5–1 meter.',
        'Uppmuntra med glad röst när hunden tar det.',
        'Backa 1–2 steg → hunden kommer naturligt mot dig.',
        'Byt objektet mot belöning ("lämna").',
      ],
      logging: [
        'Lyckad = komplett kedja: hämtar → bär → lämnar i handen.',
        'Miss = hunden hämtar inte, springer iväg, eller vägrar lämna.',
        'Latens = hur snabbt hunden sätter sig i rörelse mot kastet.',
      ],
      commonMistakes: [
        'Kastar för långt för tidigt.',
        'Springer efter hunden som flyr med objektet.',
        'Tar objektet för snabbt utan "lämna"-signal — hunden lär sig att hålla fast.',
      ],
      stopRules: [
        'Tre missar i rad → minska kastet till 0,5 m och avsluta efter 1 lyckad.',
        'Om hunden tröttnar → gör 1 kort kast och avsluta.',
      ],
    },
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
      setup: [
        'Välj stillastående, grunt vatten (strand/bäck) i lugn miljö.',
        'Ha hög-värde belöning och leksak redo.',
        'Kliv gärna i vattnet själv — hunden följer ofta.',
      ],
      steps: [
        'Låt hunden sniffa och utforska kanten. Belöna nyfikenhet.',
        'Kasta belöning/leksak nära kanten i vattnet.',
        'Öka gradvis djupet och kastet när hunden är trygg.',
        'Avsluta alltid innan hunden är trött/kall.',
      ],
      logging: [
        'Lyckad = hunden gick/simmade in frivilligt på given signal/uppmuntran.',
        'Miss = hunden vägrar, drar sig tillbaka, eller visar stress.',
        'Latens = hur snabbt hunden agerar efter uppmuntran.',
      ],
      commonMistakes: [
        'Bära/tvinga in hunden i vatten — skapar rädsla.',
        'Kalla på hunden in mot djupare vatten för fort.',
        'Träna när hunden är kall, trött eller ledsen.',
      ],
      stopRules: [
        'Tydliga rädslosignaler → avsluta sessionen och bygg upp nästa gång från grunt.',
        'Om hunden skakar/är kall → avsluta.',
      ],
    },
  }),

  vallning: spec({
    exerciseId: 'vallning',
    definition: 'Lyckad rep när hunden visar kontrollerat vallningsbeteende (eye, crouch, flank) och kan avbryta/komma in på signal.',
    ladder: [
      { id: 'follow_handler', label: 'Följ hanteraren', criteria: 'Hunden rör sig med hanteraren runt en trigger (boll/cone). Belöna nära kontakt.' },
      { id: 'eye_cone', label: 'Eye mot kon', criteria: 'Hunden "låser" blicken (eye) mot ett objekt på kommando. Belöna stillhet + fokus.' },
      { id: 'flank_short', label: 'Kort flank', criteria: 'Hunden rör sig ett halvt varv runt objektet på signal ("fot" / "bort"). Belöna smidig rörelse.' },
      { id: 'stop_on_signal', label: 'Stopp i rörelse', criteria: 'Hunden stannar mitt i flanken på stoppsignal. Kombinerar vallning + impulskontroll.' },
      { id: 'livestock_intro', label: 'Boskap intro', criteria: 'Hunden introduceras för boskap på lina med lugnt kroppsspråk. Belöna avspänning.' },
    ],
    troubleshooting: [
      'Om hunden går upp i varv/kastar sig: öka avstånd till "bytet" och belöna stillhet.',
      'Blanda alltid in stoppsignal/impulskontroll — vallning utan stopp är okontrollerad instinkt.',
      'Korta pass (3–5 min) — vallning är mentalt och fysiskt intensivt.',
    ],
    guide: {
      setup: [
        'Börja utan boskap — använd en boll, kon eller skateboard som "byte".',
        'Ha stoppsignal säkert inlärd INNAN du introducerar rörliga triggers.',
        'Lina vid all kontakt med boskap tills hunden är pålitlig på stopp.',
      ],
      steps: [
        'Rör dig runt objektet och belöna hunden för att följa i kontrollerat tempo.',
        'Introducera "eye": peka mot objektet → belöna när hunden låser blicken.',
        'Lägg till en kort flanksida (halv cirkel) på signal.',
        'Avbryt med stoppsignal eller "här" och belöna lydig avslutning.',
      ],
      logging: [
        'Lyckad = hunden visade kontrollerat vallningsbeteende och stannade på signal.',
        'Miss = hunden tappade kontrollen, ignorerade stopp eller gick upp i stress.',
        'Latens = hur snabbt hunden svarar på stoppkommando mitt i vallningsrörelsen.',
      ],
      commonMistakes: [
        'Träna vallning utan inlärd stoppsignal — instinkten tar över.',
        'För tidigt kontakt med boskap utan tillräcklig impulskontroll.',
        'Passen blir för långa — hunden hetsar upp sig.',
      ],
      stopRules: [
        'Hunden ignorerar stoppsignal → avsluta sessionen och träna impulskontroll separat.',
        'Tydlig stress/jakt-beteende → öka avstånd och avsluta.',
      ],
    },
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
      setup: [
        'Börja med mat-doft (godis i box) — inte nödvändigt med specifik doft.',
        'Starta med 1 box utan lock, bygg upp till stängda boxar.',
        'Sätt upp en tydlig "sök"-signal.',
      ],
      steps: [
        'Placera belöning i en av 3 boxar. Låt hunden se dig (intro-fas).',
        'Säg "sök" och låt hunden hitta. Belöna generöst direkt.',
        'Öka antal boxar och döm belöningen bättre.',
        'Byt till doftpinne (t.ex. birch) när hunden förstår spelet.',
      ],
      logging: [
        'Lyckad = hunden indikerar korrekt box/plats utan att "gissa runt".',
        'Miss = hunden ger upp, indikerar fel, eller söker för ytligt.',
        'Latens = tid från "sök" till korrekt indikering.',
      ],
      commonMistakes: [
        'För svårt för tidigt (för många boxar, för dold doft).',
        'Belönar "nästan rätt" — hunden lär sig att ge svaga indikeringar.',
        'Tränar för länge — nosework är mentalt utmattande.',
      ],
      stopRules: [
        'Tre missar i rad → gör ett lätt fynd och avsluta.',
        'Om hunden verkar mentalt trött (ointresserad, söker ytligt) → avsluta.',
      ],
    },
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

