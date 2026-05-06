'use client'

import { useState } from 'react'
import ProfileGuard from '@/components/ProfileGuard'
import BottomNav from '@/components/BottomNav'
import styles from './page.module.css'

export default function LearnPage() {
  return (
    <ProfileGuard>
      <Learn />
    </ProfileGuard>
  )
}

interface Article {
  id: string
  title: string
  summary: string
  readTime: string
  sections: { heading: string; body: string }[]
}

const ARTICLES: Article[] = [
  {
    id: 'stress-signals',
    title: 'Stresssignaler — läs av din hund',
    summary: 'Hundar pratar hela tiden. Lär dig se de subtila tecknen innan problemen uppstår.',
    readTime: '4 min',
    sections: [
      {
        heading: 'Vad är stresssignaler?',
        body: 'Turid Rugaas kallar dem "calming signals" — beteenden hundar använder för att lugna sig själva och kommunicera med omgivningen. De syns redan innan hunden är "over threshold" och är ditt tidiga varningssystem.',
      },
      {
        heading: 'Vanliga tecken att se upp för',
        body: 'Gäspning (utanför trötthet) · Slickar sig om nosen utan mat i närheten · Vänder bort huvudet eller kroppen · Sniffar i marken plötsligt · Skakar kroppen som om den vore blöt · Klipper med öronen · Stela rörelser · Vägrar ta belöning — det sista är det starkaste tecknet.',
      },
      {
        heading: 'Skillnad: stress vs. kalibrering',
        body: 'En hund som gapar och tittar bort när du tränar i en ny miljö är inte trött — den bearbetar intryck. Det är normalt. Problemet uppstår när dessa signaler upprepas hela passet utan att lugnas ner. Då är miljön för svår.',
      },
      {
        heading: 'Vad du ska göra',
        body: 'Öka avstånd till triggern. Gör övningen enklare. Avsluta passet med en lätt övning och ett jackpot-belöning. Pressa aldrig igenom stresssignaler — det bygger negativa associationer som är svåra att reparera.',
      },
    ],
  },
  {
    id: 'basis-kommandon',
    title: 'Grundsignalerna — vad de betyder och hur du använder dem',
    summary:
      'Sitt, stanna, fri, fot, inkallning och plats: sex signaler många tycker alla hundar bör förstå. Här förklaras vad varje signal betyder och hur du tränar steg för steg på svenska.',
    readTime: '7 min',
    sections: [
      {
        heading: 'En signal — ett ömsesidigt löfte',
        body:
          'Ett kommando är inte en order hunden måste lyda utan ett ömsesidigt erbjudande: om du gör detta kan du få något du tycker är värt mödan. Hunden lär sig koppla signal och belöning. Var stadig i språket: samma ord, samma ton, belöna rätt ögonblicksbeteende. Öva i korta pass och sluta med en lyckad rep. Nedan beskrivs orden som många förare i Sverige använder för de viktigaste vardagsbeteendena.',
      },
      {
        heading: 'Sitt',
        body:
          'Sitt betyder att hunden sätter skinkan på golvet eller marken och avslutar rörelsen lugnt (det är okej att bröstkorg och huvud är uppe). Signalen säger vad som ska hända just nu. Lås in beteendet med godbit som lockar nedåt eller med formning; belöna i samma ögonblick som bakdelen når marken — annars lär sig många ett halvsitt som blir knepigt att träna bort senare. Öva först hemma och generalisera långsamt till hall, innergården och lugna promenader innan livliga miljöer.',
      },
      {
        heading: 'Stanna eller bliv kvar',
        body:
          'Stanna eller bliv kvar brukar betyda att hunden inte får lämna plats eller rörelseläge förrän du säger släpp. Ibland säger förare vänta, ligg kvar eller sitt kvar — definiera själv om tassarna ska stå stilla till du släpper eller om det mer är ett kort stopp vid din sida. Höj var för sig väntetid, avstånd till dig och mängd störning; aldrig allt på en gång.',
      },
      {
        heading: 'Fri (släppsignal)',
        body:
          'Fri eller varsågod är en släppsignal: övningen eller kravläget är slut för stunden och hunden får göra det som är tillåtet inom ramen för säkerhet. Välj ett ord som inte förväxlas med vardagsprat i familjen. Koppla i början alltid släpp till en riktigt fin belöning så fri inte bara betyder att ingenting händer. Säg inte fri när hunden är förvirrad eller kraven blev för höga — då lär fel beteenden följa släpp.',
      },
      {
        heading: 'Fot (gå vid sida)',
        body:
          'Att gå i fot är att gå vid förarens sida utan drag i kopplet: blick eller kropp mot dig och utan näsan ständigt framför. Det skiljer sig från lös nosgång där hunden får utforska. Öva på korta raksträckor, belöna kontakt och mjuk ledning på linan. Höj fart, svängar och sträcka först när flödet sitter stadigt.',
      },
      {
        heading: 'Inkallning',
        body:
          'Inkallning betyder att hunden kommer gladlynt till dig och ofta sätter sig eller vidrör handen vid benet för avslut. Bygg långsamt hemma och i trädgården, sedan med långlina, och belöna varje framkomst rejält i början — en riktigt stor belöning här lönar sig. Kalla bara när förutsättningarna för lyckade försök är rimliga, inte mitt bland starka störningar eller när kopplet rycker. Namnet eller ett kort kommando räcker; upprepa inte om hunden inte svarar — backa eller sänk svårigheten.',
      },
      {
        heading: 'Plats (målyta)',
        body:
          'Plats är att gå till en bestämd yta — madrass, filt, pall eller ett ställe vid matbordskanten där du vill ha lugn. Syftet kan vara en lugn zon vid mat eller andrum mellan besök och servering. Visa ytan först, belöna när alla fyra trampdynorna är på ytan; lägg sedan till separat krav för ligg eller sitt om du vill. Ny yta eller flyttad madrass gör ofta målet till ny inlärning — börja då lätt.',
      },
      {
        heading: 'Ordning och helhet',
        body:
          'Många börjar med sitt och fri, därefter stanna eller inkallning och fot — alltid i korta pass. Ett ord för varje beteende; undvik många synonymer. Läs sedan guiderna om timing, hur du höjer ett kriterium i taget och hur beteendet följer med till nya platser.',
      },
    ],
  },
  {
    id: 'timing',
    title: 'Timing — halv sekund avgör allt',
    summary: 'Det handlar inte om vad du belönar utan exakt NÄR. Förstå varför och hur du tränar upp det.',
    readTime: '3 min',
    sections: [
      {
        heading: 'Varför timing är kritisk',
        body: 'En hund kan inte koppla ihop en belöning med ett beteende om det går mer än 0,3–0,5 sekunder emellan. Belönar du 2 sekunder efter att hunden satte sig — belönar du troligen att hunden tittar upp, rör på sig eller rest sig.',
      },
      {
        heading: 'Klicker-principen',
        body: 'En klicker (eller "ja!"-markör) löser problemet — du markerar exakt rätt ögonblick och kan sedan ta fram belöningen. Utan markör måste belöningen vara i handen redan när beteendet sker. Testa: säg "ja!" i exakt det ögonblick hundens rumpa rör marken. Inte efter. Inte "bra hund satt du fint".',
      },
      {
        heading: 'Hur du vet att din timing är dålig',
        body: 'Hunden ser förvirrad ut. Den repeterar beteendet men verkar inte säker. Success-raten går inte upp trots många försök. Du märker att hunden ofta gör något annat precis när du belönar.',
      },
      {
        heading: 'Träna upp din timing',
        body: 'Titta på en video av dig själv och din hund. Notera exakt när du belönar vs. när beteendet sker. Klicka/markera när en boll studsar i marken — träna upp reflexen utan hunden. Håll belöningarna i en hand, markören i den andra, aldrig blanda.',
      },
    ],
  },
  {
    id: 'over-threshold',
    title: 'Over threshold — när hunden slutar tänka',
    summary: 'En hund som är "over threshold" kan inte lära sig. Förstå skillnaden och vad du ska göra.',
    readTime: '3 min',
    sections: [
      {
        heading: 'Vad innebär "over threshold"?',
        body: 'När ett stimuli (en hund, ett ljud, en rörelse) överstiger hundens stresströskel går den in i "fight-flight-freeze"-läge. Kortisol och adrenalin tar över. Prefrontal cortex — hjärnan som behövs för inlärning — kopplas bort. Hunden kan bokstavligen inte tänka.',
      },
      {
        heading: 'Tecken på att hunden är over threshold',
        body: 'Fixerad blick som inte bryts · Reaktivt skällande trots att du ropar · Rycker i kopplet mot triggern · Är helt ointresserad av belöning · Visar "tunnel vision" — ser inget utom triggern · Fladdrar med öronen, stelnar, andas snabbt.',
      },
      {
        heading: 'Skillnaden mot fokuserat intresse',
        body: 'En hund som är nyfiken men "under threshold" kan fortfarande ta emot belöning, titta på dig när du kallar, och återhämta sig. En over-threshold-hund kan inte det. Testet: kan hunden ta ett godis? Nej → over threshold.',
      },
      {
        heading: 'Vad du gör',
        body: 'Öka avstånd tills hunden kan ta belöning och titta på dig — det är ditt "working distance". Träna alltid på det avståndet. Minska det bara när hunden är stabil. Exponering under threshold, inte igenom den.',
      },
    ],
  },
  {
    id: 'criteria',
    title: 'Kriterier och progression — split, inte lump',
    summary: '"Lumping" är det vanligaste misstaget. Lär dig vad det är och hur du undviker det.',
    readTime: '4 min',
    sections: [
      {
        heading: 'Vad är "lumping"?',
        body: 'Lumping är när du höjer för många kriterier på en gång. Du tränar inkallning hemma utan koppel (lätt), sen ute på lång lina med tre hundar i närheten (svårt). Du "lumpade" avstånd + störning + koppel på en gång. Hunden misslyckas inte för att den är dum — den misslyckas för att steget var för stort.',
      },
      {
        heading: 'Split-principen',
        body: '"Split" innebär att du höjer ett kriterium i taget. Längre avstånd ELLER mer störning ELLER ny miljö. Aldrig allt på en gång. Det kan kännas onödigt långsamt, men det är den snabbaste vägen till ett stabilt beteende.',
      },
      {
        heading: 'Hur du vet att du höjt för fort',
        body: 'Success-raten sjunker under 60–70%. Hunden ser tveksam ut. Latensen ökar (svarar allt långsammare). Du behöver upprepa kommandot. Alla dessa signaler betyder: backa ett steg.',
      },
      {
        heading: '80%-regeln',
        body: 'Byt inte kriterium förrän hunden lyckas 8 av 10 gånger på nuvarande nivå, med kort latens, i minst två olika sessioner. Det är grunden för varför success_count och latency finns i appen — de är ditt objektiva mätetal istället för din känsla.',
      },
    ],
  },
  {
    id: 'generalization',
    title: 'Generalisering — "det kan hemma" ≠ "det kan ute"',
    summary: 'Hunden lär sig inte ett beteende — den lär sig ett beteende i en specifik kontext. Förstå det och spara dig massor av frustration.',
    readTime: '3 min',
    sections: [
      {
        heading: 'Hundar generaliserar inte automatiskt',
        body: 'När din hund kan "sitt" perfekt hemma i köket men verkar ha glömt det på promenaden har den inte glömt. Den har aldrig lärt sig att "sitt" gäller utomhus, i rörelse, med distraktioner. För hunden är det ett nytt beteende i ett nytt sammanhang.',
      },
      {
        heading: 'Hur du generaliserar korrekt',
        body: 'Träna varje övning i minst 5–8 olika miljöer och sammanhang. Starta alltid på lättaste kriteriet i ny miljö — backa till "inne-nivå" när du byter plats. Bygg upp igen snabbt (det går mycket snabbare andra gången). Variera: olika tider på dygnet, olika underlag, med och utan koppel.',
      },
      {
        heading: 'Tecknet på ett generaliserat beteende',
        body: 'Hunden reagerar på signalen oavsett var du är, vad du bär på, hur du ser ut, vilken vinkel du är i. Det tar månader — men det är vad "pålitlig lydnad" faktiskt innebär.',
      },
      {
        heading: 'Och distraktioner?',
        body: 'Distraktioner är ett separat kriterium. Börja alltid med noll störning i ny miljö, lägg till störning gradvis. Regeln: ny miljö = sänk störning. Svår störning = sänk miljösvårighet.',
      },
    ],
  },
  {
    id: 'reinforcement',
    title: 'Belöning — mer än bara godis',
    summary: 'Att förstå belöningsvärde, scheman och när man ska sluta belöna varje rep gör dig till en bättre tränare.',
    readTime: '4 min',
    sections: [
      {
        heading: 'Belöningsvärde är relativt',
        body: 'En Labrador jobbar för torrfoder hemma i lugn miljö. Samma Labrador kräver grillad kyckling för att prestera utomhus med distraktioner. Belöningsvärdet måste matcha svårighetsgraden. Hög svårighet = hög belöning. Spara den bästa belöningen för de svåraste momenten.',
      },
      {
        heading: 'Continuous vs. intermittent',
        body: 'Under inlärningsfasen: belöna VARJE lyckad rep (continuous reinforcement). Det bygger beteendet snabbt. När beteendet är stabilt: belöna varannan, var tredje (variable ratio). Det gör beteendet mer motståndskraftigt mot extinction — precis som en enarmad bandit håller folk fast.',
      },
      {
        heading: 'Vad som räknas som belöning',
        body: 'Mat (högst värde för de flesta hundar) · Leksak/lek · Frihet ("fri!") · Social kontakt · Lukta på något spännande · Rörelse och spring. Lär dig vad just din hund värderar mest — det varierar enormt även inom ras.',
      },
      {
        heading: 'När belöningen inte fungerar',
        body: 'Om hunden vägrar ta belöning: den är stressed, sjuk, trött, eller situationen är för svår. Om belöningen inte ökar beteendet: det är inte en belöning för den hunden i den situationen — byt. Belöning definieras av effekten, inte av din avsikt.',
      },
    ],
  },
  {
    id: 'training-aids',
    title: 'Visselpipa och andra redskap — så använder du dem',
    summary:
      'Visselpipa, långlina, sele och markör: vad de är till för, och hur du bygger tydliga signaler utan att stressa hunden.',
    readTime: '6 min',
    sections: [
      {
        heading: 'Visselpipa: börja med betydelse, inte avstånd',
        body: 'En visselpipa är värdelös som "magisk knapp" tills hunden lärt sig vad ljudet betyder. Första veckorna: blås **en kort sekvens** (t.ex. tre snabba pip) **bara** i lugna lägen — direkt följt av högklassig belöning (godis, lek). Upprepa många gånger inne och i trädgård. Målet är att pipan = "något bra händer nu". Först därefter kan du använda samma signal på avstånd, t.ex. som extra tydlig inkallning när rösten inte räcker.',
      },
      {
        heading: 'En signal = en sak',
        body: 'Bestäm vad **just din** pipsekvens betyder — ofta "kom hit" eller "kolla in mig". Använd **samma** ton och längd varje gång. Blås inte olika "pip för arg" och "pip för glad": hunden hör bara olika ljud, inte din frustration. Om du behöver flera meddelanden (t.ex. inkallning vs. stanna), använd **olika** signaler (kort vs. lång ton, eller pip + handtecken) och konditionera varje för sig.',
      },
      {
        heading: 'När du INTE ska använda pipan',
        body: 'Inte som straff eller för att "skärpa" när hunden inte lyssnar — då lär sig hunden att pipan är obehaglig eller meningslös. Inte när hunden är over threshold (skäller, fixerad, vägrar godis): avstånd först, pip senare. Undvik att blåsa upprepade gånger i rad utan belöning — då urvattnas signalen.',
      },
      {
        heading: 'Frekvens, volym och miljö',
        body: 'Olika pipor har olika frekvenser; vissa hundar är känsligare för höga toner. Testa på låg volym först. Utomhus med vind och avstånd kan du behöva en tydligare sekvens — men öka svårighet **efter** att inkallningen funkar nära. Kom ihåg: grannar, vilda djur och hästar — använd sunt förnuft var du blåser.',
      },
      {
        heading: 'Långlina',
        body: 'En långlina är för **träning på avstånd**, inte för att straffa drag. Håll den säkrad (ingen löst släng runt ben på människor). Låt aldrig linan "smälla" till när hunden stannar — du vill inte skapa obehag kopplat till stopp. Kombinera med belöning när hunden vänder mot dig.',
      },
      {
        heading: 'Sele, halsband och koppel',
        body: 'En väl passande **Y-sele** eller bröstsele fördelar tryck om hunden drar ibland. Platta halsband är ofta okej till promenad; undvik att rycka hårt i halsband — det kan ge hals- och ögonskador. Koppel är hantering och säkerhet; lydnad bygger du med **belöning och tydliga signaler**, inte genom att rycka i kopplet.',
      },
      {
        heading: 'Klicker och muntlig markör',
        body: 'Klicker eller ett kort "ja!" markerar **exakt** rätt ögonblick innan belöning kommer — perfekt när du ska fånga små beteenden. Läs mer under guiden **Timing**. Pipan ersätter inte markören; de har olika roller (lång räckvidd vs. precision i tid).',
      },
    ],
  },
]

function Learn() {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>Förarguider</h1>
        <p className={styles.subtitle}>Kunskapen som gör dig till en bättre tränare</p>
      </header>

      <div className={styles.body}>
        {ARTICLES.map((article) => {
          const isOpen = expandedId === article.id
          return (
            <div key={article.id} className={`${styles.card} ${isOpen ? styles.cardOpen : ''}`}>
              <button
                type="button"
                className={styles.cardHeader}
                onClick={() => setExpandedId(isOpen ? null : article.id)}
                aria-expanded={isOpen}
              >
                <div className={styles.cardMeta}>
                  <span className={styles.readTime}>{article.readTime}</span>
                  <h2 className={styles.cardTitle}>{article.title}</h2>
                  <p className={styles.cardSummary}>{article.summary}</p>
                </div>
                <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} aria-hidden="true">›</span>
              </button>

              {isOpen && (
                <div className={styles.content}>
                  {article.sections.map((s) => (
                    <div key={s.heading} className={styles.section}>
                      <h3 className={styles.sectionHeading}>{s.heading}</h3>
                      <p className={styles.sectionBody}>{s.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <BottomNav active="learn" />
    </main>
  )
}
