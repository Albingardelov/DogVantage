export interface ArticleSection {
  heading: string
  body: string
}

export interface Article {
  id: string
  title: string
  summary: string
  readTime: string
  sources: string[]
  sections: ArticleSection[]
}

export type TabKey = 'grunderna' | 'teknik' | 'mindset' | 'beteende'

export const TAB_LABELS: Record<TabKey, string> = {
  grunderna: 'Valp & Grunder',
  teknik: 'Träningsteknik',
  mindset: 'Förarmindset',
  beteende: 'Beteende',
}

export const CATEGORIES: Record<TabKey, Article[]> = {
  grunderna: [
    {
      id: 'puppy-sleep',
      title: 'Valpsömn — varför 18 timmar är normalt',
      summary: 'Sömnbrist ser ofta ut som "trots". Så här bygger du en vardag med tillräcklig återhämtning.',
      readTime: '4 min',
      sources: ['Dunbar, Before You Get Your Puppy (2024)', 'AVSAB Puppy Socialization (2024)'],
      sections: [
        {
          heading: 'Varför valpar behöver så mycket sömn',
          body: 'Valpars nervsystem är under snabb utveckling. Sömn behövs för minneskonsolidering, återhämtning och känsloreglering. En valp som sover för lite blir inte "tuffare" — den blir oftare övertrött, bitsk och sämre på att ta in träning.',
        },
        {
          heading: 'Tecken på att valpen är övertrött',
          body: 'Plötsliga bett-attacker, zoomies sent på dagen, svårt att ta belöning, låg impulskontroll, "kan inget" den kunde i går. Det är vanliga sömnbristsignaler, inte olydnad. Lösningen är oftast mer planerad vila, inte hårdare krav.',
        },
        {
          heading: 'Praktiskt dygnsupplägg',
          body: 'Tänk rytm: aktivitet följt av vila. För många valpar fungerar 45–90 min vaken tid och sedan 1–2 timmar lugn vila. Dunbar betonar att confinement-träning (bur/lekrum) är det effektivaste sättet att säkerställa att valpen faktiskt vilar — inte stimuleras av omgivningen när den ska ladda om.',
        },
        {
          heading: 'Så hjälper du valpen att komma till ro',
          body: 'Skapa en konsekvent viloplats (bur/box eller bädd), dämpa ljus och ljud, och undvik intensiv lek precis före vila. Ge gärna ett lugnt tugg eller slickmatta i början av vilan. Målet är att platsen signalerar trygg nedvarvning, inte isolering.',
        },
        {
          heading: 'Om kvällarna spårar ur',
          body: 'Kvälls-kaos beror ofta på ackumulerad trötthet. Flytta sista intensiva aktivitet tidigare, korta passen efter middag, och lägg in en tydlig kvällsrutin med låg stimulans. Ofta ser du förbättring inom några dagar när sömnkontot fylls på.',
        },
      ],
    },
    {
      id: 'socialization-window',
      title: 'Socialiseringsfönstret 8–16 veckor',
      summary: 'Målet är trygg exponering, inte maximal mängd intryck. Kvalitet slår kvantitet.',
      readTime: '5 min',
      sources: ['AVSAB Puppy Socialization (2024)', 'Toronto Humane Society Puppy Manual (2023)'],
      sections: [
        {
          heading: 'Vad fönstret betyder i praktiken',
          body: 'Under tidig valpperiod formas hundens förväntningar på världen extra starkt. Positiva, kontrollerade upplevelser av människor, miljöer och ljud ökar chansen för en trygg vuxen hund. AVSAB konstaterar att negativa upplevelser i samma period kan sätta djupa spår som är svåra att reparera senare.',
        },
        {
          heading: 'Socializing vs. socialization',
          body: 'Toronto Humane Society skiljer på begreppen: socialization är en kontinuerlig process där valpen lär sig lämpliga beteenden och sociala färdigheter — socializing är den enstaka handlingen att interagera. Exponering utan positiv association räcker inte. Målet är att varje ny upplevelse kopplas till något tryggt och bra.',
        },
        {
          heading: 'Röda flaggor att backa på',
          body: 'Öron bakåt eller nedåt, svansen under magen, frysning, skakningar, försök att fly, vägrar godis — Toronto Humane Society listar dessa som tydliga rädsletecken. Backa direkt i avstånd och intensitet. Pressad exponering lär valpen att världen är farlig, medan doserad exponering bygger mod.',
        },
        {
          heading: 'Bygg en enkel veckoplan',
          body: 'AVSAB rekommenderar att sikta på 1–2 positiva nya exponeringar per dag under socialiseringsfönstret: olika underlag, ett nytt ljud, en lugn plats, en trygg person. Håll passen korta och avsluta när valpen fortfarande är lugn. En bra upplevelse räcker.',
        },
        {
          heading: 'Koppla socialisering till vila',
          body: 'Nya intryck kostar energi. Lägg alltid in återhämtning efter socialiseringspass — gärna 1–2 timmar lugn vila. Det minskar trigger-stacking och hjälper valpen bearbeta det den upplevt.',
        },
      ],
    },
    {
      id: 'rastning',
      title: 'Renträna valpen — schema, belöning och varför straff inte fungerar',
      summary: 'Rentränan är inte uppfostran — det är blåsmuskulatur och rutin. Här är schemat som faktiskt funkar.',
      readTime: '5 min',
      sources: ['Dunbar, Before You Get Your Puppy (2024)', 'Toronto Humane Society Puppy Manual (2023)'],
      sections: [
        {
          heading: 'Det här handlar om kropp, inte beteende',
          body: 'En valp under 16 veckor har inte muskelkontroll nog att hålla sig länge. Olyckor inne är inte olydnad — det är att kroppen är snabbare än hjärnan. Dunbar betonar att felhusträning "förutsäger många fler olyckor framöver" och att ett strikt schema är enda vägen till ett felfritt renträningsprogram.',
        },
        {
          heading: 'Schemat: ut direkt vid varje trigger',
          body: 'Toronto Humane Society rekommenderar ut: på morgonen, var 30–60 min under vakna stunder, direkt efter mat/dryck, och direkt efter tupplur. Bär valpen ut, sätt inte ner i hallen. Stå still ute, säg en lugn signal och vänta 2 minuter. Belöna direkt på platsen när det händer.',
        },
        {
          heading: 'Belöna ute, aldrig efteråt inne',
          body: 'Belöning sker exakt där och då. Belönar du när ni kommit in igen kopplar valpen ihop "gå in" med belöning, inte "kissa ute". Stå sedan kvar 1–2 minuter och låt valpen utforska — det blir bonusbelöningen.',
        },
        {
          heading: 'Vad du INTE ska göra vid olyckor',
          body: 'Toronto Humane Society är tydliga: straffa aldrig vid olyckor inne. Att skälla, strycka nosen i det eller visa upp det skapar en hund som lär sig att kissa = obehag = göm dig. Torka upp neutralt med enzymatisk rengöring (vanlig rengöring tar inte bort doften — hunden gör det igen där).',
        },
        {
          heading: 'När sitter rutinen?',
          body: 'För de flesta valpar: cirka 4–8 veckor med strikt schema och tät belöning innan rentränan är pålitlig. Olyckor under den här perioden = ditt schema är för långt, inte att valpen är dum.',
        },
      ],
    },
    {
      id: 'bett-inhibition',
      title: 'Valpen biter mig — vad det faktiskt är och vad du gör',
      summary: 'Lek-bett är normalt, inte aggression. Här är skillnaden mellan bett-hämning och problem.',
      readTime: '5 min',
      sources: ['Dunbar, Before You Get Your Puppy (2024)', 'Dunbar, After You Get Your Puppy (2024)'],
      sections: [
        {
          heading: 'Bett-hämning är det viktigaste du lär valpen',
          body: 'Dunbar kallar bett-hämning "the most important priority" och sätter deadlinen vid 18 veckor. Poängen är inte att eliminera bettande — det är att lära valpen hur hårt den får bita. En hund med god bett-hämning kan ta en smörgås ur handen utan att lämna märken. En hund utan bett-hämning som sedan råkar bita i stress orsakar verklig skada.',
        },
        {
          heading: 'Varför puppyklasser är det bästa sättet',
          body: 'Dunbar understryker att valpar måste leka med andra valpar för att träna upp bett-hämning. Lek med vuxna hundar hemma eller i parken räcker inte — det är valp mot valp som ger rätt återkoppling på trycknivåer.',
        },
        {
          heading: 'Tekniken: Aj + frys + omdirigera',
          body: 'Vid hårt bett: säg "Aj!" med mjuk röst (inte arg) + frys helt i 3 sekunder. När valpen släpper: erbjud en godkänd tuggleksak. Tar valpen leksaken? 30 sek lek med den som belöning för rätt val. Händer → mun = leksak belönas.',
        },
        {
          heading: 'Vad du ALDRIG ska göra',
          body: 'Skrika eller dra hårt undan handen triggar mer lek-bett. Knäppa på nosen, hålla munnen stängd, dra i nackskinnet — fysisk korrigering bygger rädsla, inte bett-hämning. Rädsla leder till riktiga bett senare, inte färre.',
        },
        {
          heading: 'När du ska söka hjälp',
          body: 'Bett mot barn, morrande före bett, vakande av mat/leksaker, eller bett som blir hårdare i stället för mjukare över tid — det är inte normalt valp-bett. Kontakta certifierad beteendekonsulent (SBBK/IAABC).',
        },
      ],
    },
    {
      id: 'box-training',
      title: 'Burträning — så bygger du en plats hunden älskar',
      summary: 'En bur är inte ett straff. Rätt introducerad blir den hundens favorit-vilo-plats.',
      readTime: '5 min',
      sources: ['Dunbar, Before You Get Your Puppy (2024)', 'Dunbar, After You Get Your Puppy (2024)'],
      sections: [
        {
          heading: 'Varför confinement är grunden',
          body: 'Dunbar kallar confinement-träning "den snabbaste vägen" till ett väluppfostrat hem. Buren tjänar tre syften: förhindrar att valpen gör misstag i hemmet, maximerar sannolikheten att rentränan lyckas, och lär valpen att slappna av och må bra i eget sällskap.',
        },
        {
          heading: 'Rätt storlek',
          body: 'Hunden ska kunna stå, vända sig om och ligga utsträckt — men inte mycket större. En valp i en för stor bur kissar i ena hörnet och sover i andra. Köp bur för slutstorleken och blocka ena halvan med en papp-separator.',
        },
        {
          heading: 'Introduktionsfas (1–2 veckor)',
          body: 'Dunbar rekommenderar: mata ALLA måltider i öppen bur. Kasta godis in i buren kontinuerligt. Hunden går in och ut frivilligt. Ingen stängd dörr ännu. Vecka 2: stäng dörren medan hunden äter, öppna innan den är klar. Bygg från 5 sek till 1 minut.',
        },
        {
          heading: 'Bygga duration',
          body: 'Först vila med dig i rummet: 5 min → 15 min → 30 min. Sedan korta stunder utan dig. Variera tider så hunden inte räknar minuter. Aldrig hoppa direkt till lång tid — då lär sig hunden att buren = panik.',
        },
        {
          heading: 'Aldrig som straff',
          body: 'Använder du buren som "skamvrå" hatar hunden den för alltid. Om hunden skäller — vänta tystnad (även 5 sek räcker) innan du öppnar. Om hunden får panik (hyperventilerar, vägrar mat, river dörren) — stopp. Det är möjlig separationsångest, kontakta beteendekonsulent.',
        },
      ],
    },
    {
      id: 'ensam-training',
      title: 'Ensam hemma — bygg upp tiden gradvis',
      summary: 'Hopp direkt till 4 timmar = panik. Här är ladd-stegen från 30 sekunder.',
      readTime: '5 min',
      sources: ['Dunbar, After You Get Your Puppy (2024)', 'Toronto Humane Society Puppy Manual (2023)'],
      sections: [
        {
          heading: 'Börja innan du behöver det',
          body: 'Dunbar betonar att ensamhetsträning börjar redan vecka ett hemma — inte på första arbetsdagen. Hundar som "alltid haft sällskap" får oftast störst problem när det väl behövs.',
        },
        {
          heading: 'Konditionera bort avskedscues',
          body: 'Hunden börjar reagera redan när du tar på morgonrocken eller plockar nycklarna. Plocka upp nycklarna 20 gånger om dagen utan att gå någonstans. Ta på skorna, sätt dig igen. Cues förlorar betydelse.',
        },
        {
          heading: 'Bygg upp tiden i små steg',
          body: 'Gå ut → kom tillbaka direkt (5 sek). Belöna lugn hund. Sedan 30 sek → 1 min → 2 min → 5 min → 15 min → 30 min. Variera ordningen. Filma första gångerna — du behöver se vad som händer.',
        },
        {
          heading: 'Före varje gång du går',
          body: 'Tröttkör fysiskt + mentalt: promenad + nosework eller trick-träning. Sömnig hund klarar mer. Lämna en fryst kong. Lugnt avsked — inget stort kalas, det bygger förväntan om dramatiska återkomster.',
        },
        {
          heading: 'Signaler på riktiga problem',
          body: 'Förstör möbler, dörrar, golv → backa nivån till 50%. Salivfläckar, häftig hyperventilation, självskada, vägrar mat efter du varit borta → det är separationsångest, inte ouppfostran. Boka tid med beteendekonsulent (SBBK/IAABC).',
        },
      ],
    },
  ],

  teknik: [
    {
      id: 'timing',
      title: 'Timing — halv sekund avgör allt',
      summary: 'Det handlar inte om vad du belönar utan exakt NÄR. Förstå varför och hur du tränar upp det.',
      readTime: '3 min',
      sources: ['AVSAB Humane Dog Training (2021)'],
      sections: [
        {
          heading: 'Varför timing är kritisk',
          body: 'En hund kan inte koppla ihop en belöning med ett beteende om det går mer än 0,3–0,5 sekunder emellan. AVSAB beskriver hur trainers kan använda "a clicker or verbal marker to mark the behavior" — markörsignalen fryser exakt rätt ögonblick och löser det fysiska problemet att ta fram belöningen.',
        },
        {
          heading: 'Klicker-principen',
          body: 'Klickern (eller "ja!"-markören) markerar exakt rätt ögonblick och kan sedan ta fram belöningen. Utan markör måste belöningen vara i handen redan när beteendet sker. Testa: säg "ja!" i exakt det ögonblick hundens rumpa rör marken. Inte efter. Inte "bra hund satt du fint".',
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
      id: 'reinforcement',
      title: 'Belöning — mer än bara godis',
      summary: 'Att förstå belöningsvärde, scheman och när man ska sluta belöna varje rep gör dig till en bättre tränare.',
      readTime: '4 min',
      sources: ['AVSAB Humane Dog Training (2021)'],
      sections: [
        {
          heading: 'Belöningsvärde är relativt',
          body: 'AVSAB beskriver att trainers kan använda "toys, treats, or other appropriate reinforcers". Belöningsvärdet måste matcha svårighetsgraden. Hög svårighet = hög belöning. Spara den bästa belöningen för de svåraste momenten.',
        },
        {
          heading: 'Continuous vs. intermittent',
          body: 'Under inlärningsfasen: belöna VARJE lyckad rep (continuous reinforcement). Det bygger beteendet snabbt. När beteendet är stabilt: belöna varannan, var tredje (variable ratio). Det gör beteendet mer motståndskraftigt — precis som en enarmad bandit håller folk fast.',
        },
        {
          heading: 'Vad som räknas som belöning',
          body: 'Mat (högst värde för de flesta hundar) · Leksak/lek · Frihet ("fri!") · Social kontakt · Lukta på något spännande · Rörelse och spring. Lär dig vad just din hund värderar mest — det varierar enormt även inom ras.',
        },
        {
          heading: 'När belöningen inte fungerar',
          body: 'AVSAB: "The learner must always feel safe and have the ability to opt out of training sessions." Om hunden vägrar ta belöning signalerar den att situationen är för svår, att den är stressad eller trött. Byt situation, inte bara belöning.',
        },
      ],
    },
    {
      id: 'criteria',
      title: 'Kriterier och progression — split, inte lump',
      summary: '"Lumping" är det vanligaste misstaget. Lär dig vad det är och hur du undviker det.',
      readTime: '4 min',
      sources: ['AVSAB Humane Dog Training (2021)'],
      sections: [
        {
          heading: 'Vad är "lumping"?',
          body: 'Lumping är när du höjer för många kriterier på en gång. Du tränar inkallning hemma utan koppel (lätt), sen ute på lång lina med tre hundar i närheten (svårt). Du lumpade avstånd + störning + koppel på en gång. Hunden misslyckas inte för att den är dum — steget var för stort.',
        },
        {
          heading: 'Split-principen',
          body: '"Split" innebär att du höjer ett kriterium i taget. Längre avstånd ELLER mer störning ELLER ny miljö. Aldrig allt på en gång. AVSAB beskriver hur "systematic desensitization involves very gradual exposure to the stimulus in a way that keeps the dog feeling safe at all times".',
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
      summary: 'Hunden lär sig inte ett beteende — den lär sig ett beteende i en specifik kontext.',
      readTime: '3 min',
      sources: ['AVSAB Humane Dog Training (2021)'],
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
      id: 'basis-kommandon',
      title: 'Grundsignalerna — vad de betyder och hur du använder dem',
      summary: 'Sitt, stanna, fri, fot, inkallning och plats: sex signaler som bygger vardag och säkerhet.',
      readTime: '7 min',
      sources: ['RSPCA Basic Commands', 'AKC S.T.A.R. Puppy Program'],
      sections: [
        {
          heading: 'En signal — ett ömsesidigt löfte',
          body: 'RSPCA definierar ett kommando som en begäran om ett beteende, kopplad till positiv förstärkning. Det är inte en order utan ett erbjudande: gör detta och du får något du tycker om. Var stadig i språket: samma ord, samma ton, belöna rätt ögonblicksbeteende.',
        },
        {
          heading: 'Sitt',
          body: 'Hunden sätter bakdelen på marken. AKC STAR-programmet introducerar "sit on command" i vecka 2 med matlockning, och suddar ut locket gradvis. Belöna i samma ögonblick som bakdelen når marken — annars lär sig många ett halvsitt.',
        },
        {
          heading: 'Stanna / bliv kvar',
          body: 'Hunden håller läge tills du säger "fri". Höj var för sig: väntetid, avstånd till dig, mängd störning. Aldrig allt på en gång — det är split-principen tillämpad på stanna.',
        },
        {
          heading: 'Fri (släppsignal)',
          body: 'Välj ett ord som inte förväxlas med vardagsprat. Koppla i början alltid "fri" till en riktigt fin belöning så det inte bara betyder att ingenting händer. Säg inte fri när hunden är förvirrad eller kraven blev för höga.',
        },
        {
          heading: 'Inkallning',
          body: 'AKC STAR introducerar inkallning i vecka 3 från 5 fot, och ökar gradvis. Belöna varje framkomst rejält i början. Kalla bara när förutsättningarna för lyckade försök är rimliga.',
        },
        {
          heading: 'Plats (målyta)',
          body: 'Gå till en bestämd yta — madrass, filt eller pall. Visa ytan först, belöna när alla fyra trampdynorna är på ytan. Ny yta eller flyttad madrass gör ofta målet till ny inlärning — börja då lätt.',
        },
      ],
    },
    {
      id: 'training-aids',
      title: 'Visselpipa och andra redskap — så använder du dem',
      summary: 'Visselpipa, långlina, sele och markör: vad de är till för och hur du bygger tydliga signaler.',
      readTime: '6 min',
      sources: ['RSPCA Recall Guide', 'AVSAB Humane Dog Training (2021)'],
      sections: [
        {
          heading: 'Visselpipa: börja med betydelse, inte avstånd',
          body: 'RSPCA rekommenderar att konditionera visselpipan separat innan den används på avstånd: blås en kort sekvens direkt följt av högklassig belöning, många gånger, i lugna lägen. Målet är att pipan = "något bra händer nu". Först därefter kan du använda signalen på avstånd.',
        },
        {
          heading: 'En signal = en sak',
          body: 'Bestäm vad just din pipsekvens betyder — ofta "kom hit". Använd samma ton och längd varje gång. Blås inte "pip för arg" och "pip för glad": hunden hör bara olika ljud, inte din frustration.',
        },
        {
          heading: 'När du INTE ska använda pipan',
          body: 'AVSAB: trainers ska aldrig använda redskap som skapar rädsla eller obehag. Pipan ska inte användas som straff eller för att "skärpa" när hunden inte lyssnar — då lär sig hunden att pipan är obehaglig.',
        },
        {
          heading: 'Långlina',
          body: 'En långlina är för träning på avstånd, inte för att straffa drag. Håll den säkrad. Låt aldrig linan "smälla" till när hunden stannar — du vill inte skapa obehag kopplat till stopp.',
        },
        {
          heading: 'Sele och koppel',
          body: 'En väl passande Y-sele eller bröstsele fördelar tryck om hunden drar ibland. AVSAB: "All efforts should be made to communicate effectively and respectfully with the learner" — kopplet är hantering och säkerhet, inte korrektionsredskap.',
        },
      ],
    },
  ],

  mindset: [
    {
      id: 'energy-management',
      title: 'Energihantering — läs hunden innan du tränar',
      summary: 'Hög energi är inte samma sak som redo att träna. Lär dig testet som avgör om ni ska köra ett pass eller ta en vilopromenad.',
      readTime: '4 min',
      sources: ['AVSAB Humane Dog Training (2021)', 'Toronto Humane Society Puppy Manual (2023)'],
      sections: [
        {
          heading: 'Arousal och inlärning går inte ihop',
          body: 'AVSAB konstaterar att "the learner must always feel safe and have the ability to opt out of training sessions." En hund i högt arousal-läge — upprörd, överstimulerad eller stressad — är inte i ett läge där inlärning är möjlig. Kortisol och adrenalin tar över och blockerar de kognitiva funktioner som behövs för att ta in nya saker.',
        },
        {
          heading: 'Det snabba testet: tar hunden godis?',
          body: 'Toronto Humane Society listar "not taking treats" som ett av de tydligaste tecknen på att en hund är rädd eller överstimulerad. Det är det enklaste pre-tränings-testet: erbjud ett litet godis. Tar hunden det mjukt och snabbt? Bra utgångspunkt. Vägrar hunden eller snapper det hårt? Välj en lugnare aktivitet i dag.',
        },
        {
          heading: 'Andra tecken på "inte träningsdag"',
          body: 'Toronto Humane Society: öron bakåt, svansen under magen, frysning, skakningar, skall-reaktioner på saker som brukar gå bra, svårt att fokusera. Stressade hundar lär sig inte — de överlever. Om du ser två eller fler av dessa tecken: välj sniff-promenad eller passiv vila i stället för träning.',
        },
        {
          heading: 'Planera "låg-arousal-dagar" aktivt',
          body: 'Hundar med lättväckt stressrespons behöver fler vilodagar inbyggda i veckoschema. Det handlar inte om att träna mindre — det handlar om att välja rätt typ av aktivitet för dagen. En lugn sniff-promenad utan krav kan vara mer värdefull än ett misslyckat träningspass.',
        },
        {
          heading: 'Återhämtning tar längre tid än du tror',
          body: 'Kortisol tar timmar till dagar att brytas ned efter en intensiv upplevelse. AVSAB understryker att "creating positive associations to stimuli perceived as frightening is essential in easing fear and anxiety." Pressa inte på träning dagen efter en svår upplevelse — ge hunden tid att fylla på.',
        },
      ],
    },
    {
      id: 'relationship-building',
      title: 'Relationsbyggande — vara med hunden utan att kräva',
      summary: 'Träning bygger beteenden. Relation bygger förtroende. Båda behövs — men det ena kommer före det andra.',
      readTime: '4 min',
      sources: ['AVSAB Humane Dog Training (2021)', 'Toronto Humane Society Puppy Manual (2023)'],
      sections: [
        {
          heading: 'Reward-based training bygger band',
          body: 'AVSAB citerar Rooney och Cowan (2011): "dogs who were trained with aversive methods were less likely to interact with a stranger during relaxed social play." Motsatsen är lika sann — belöningsbaserad träning stärker bandet aktivt. Men relation byggs inte bara i träning: den byggs i lugna stunder, tyst närvaro, och förutsägbarhet.',
        },
        {
          heading: 'Vad "bara vara" med hunden innebär',
          body: 'Toronto Humane Society: "Give your dog all the love, attention, and fun you want, but only when you initiate." Det är inte passivt — det är att hunden kan lita på att du är en trygg, förutsägbar närvaro som inte alltid kräver något. Lägg dig på golvet, låt hunden bestämma tempo, ha inga dolda agendor.',
        },
        {
          heading: 'Relation före prestation',
          body: 'AVSAB: "The techniques used to teach manners and skills can strongly affect an animal\'s future behavior and emotional wellbeing." En hund som litar på sin förare lär sig snabbare och generaliserar bättre. En hund som är osäker på relationen tränar alltid med en del av sin uppmärksamhet riktad mot "är detta säkert?".',
        },
        {
          heading: 'Vad som skadar relationen',
          body: 'Toronto Humane Society: "Physical and/or verbal abuse, as well as isolation, can be detrimental to the human-canine bond. A dog loses the ability to think, learn, problem solve and make good choices as a result." Det gäller även mildare former av bestraffning — oförutsägbarhet och press urholkar tilliten.',
        },
        {
          heading: 'Praktiska relationsbyggare',
          body: 'Lugna händelseresor utan prestation: sätt dig, låt hunden komma om den vill. Bygg positiva associationer till din närvaro: godsaker som dyker upp utan att krävas av något. Avsätt tid varje dag som inte är träning — bara promenad, nossökning eller vila tillsammans.',
        },
      ],
    },
    {
      id: 'short-sessions',
      title: 'Korta träningspass — varför 2–3 minuter räcker',
      summary: 'Längre är inte bättre. Kvalitet och timing slår alltid duration. Förstå hur och när du avslutar ett pass.',
      readTime: '3 min',
      sources: ['AVSAB Humane Dog Training (2021)', 'AKC S.T.A.R. Puppy Program'],
      sections: [
        {
          heading: 'Inlärning kräver ett mottaget tillstånd',
          body: 'AVSAB: "Training methods are most effective when they focus on teaching the animal what to do." När hunden är trött, mätt eller överstimulerad sjunker förmågan att ta in och behålla ny information snabbt. Ett 2-minuterspass när hunden är alert och belöningshungrig lär ut mer än 20 minuter mot slutet av en lång dag.',
        },
        {
          heading: 'Avsluta på en lyckad rep',
          body: 'AKC STAR-programmet bygger sin 6-veckors struktur på att varje session avslutas med en övning hunden kan — inte med det svåraste momentet. Slutsignalen (t.ex. "fri!") ska alltid komma direkt efter ett lyckat rep, aldrig efter ett misslyckat. Hunden bär det sista intrycket med sig.',
        },
        {
          heading: 'Tecken på att passet bör avslutas',
          body: 'Ökad latens (hunden svarar långsammare), kroppsspråket blir styvare, hunden börjar sniffa i marken eller titta bort, eller vägrar godis. AVSAB: hunden måste alltid ha möjlighet att "opt out". Dessa är hundens sätt att signalera det — lyssna.',
        },
        {
          heading: 'Fördela träning i vardagen',
          body: 'Dunbar betonar att träning integreras i vardagen snarare än isoleras till dedikerade pass: 5 sekunder vid matskoppen, 10 sekunder vid dörren, 30 sekunder under en reklamtid. Många korta tillfällen under dagen ger mer total träning och bättre generalisering än ett långt pass per dag.',
        },
      ],
    },
    {
      id: 'sniff-walks',
      title: 'Sniff-promenader och decompression',
      summary: 'En promenad utan krav är inte slöseri — det är aktiv återhämtning. Förstå skillnaden mellan träningspromenad och dekompression.',
      readTime: '4 min',
      sources: ['Toronto Humane Society Puppy Manual (2023)', 'AVSAB Humane Dog Training (2021)'],
      sections: [
        {
          heading: 'Promenader bränner inte energi som du tror',
          body: 'Toronto Humane Society konstaterar: "Walks can be great for socializing, but they don\'t use up a lot of energy. This can create frustration if your puppy needs more physical exercise or hasn\'t had much mental stimulation that day." En 30 min promenad med fokus på nossökning ger mer mental trötthet än samma promenad i jämn fart utan att sniffa.',
        },
        {
          heading: 'Nossökning är aktiv mental vila',
          body: 'Att låta hunden leda med nosen och bestämma tempo är inte passivt — det aktiverar en specifik del av hundens nervsystem kopplad till lugn och nyfikenhet, inte stress och vaksamhet. AVSAB: "Creating positive associations with stimuli" — en decompression-promenad i bekant miljö är ett av de bästa verktygen för en hund som bär på ackumulerad stress.',
        },
        {
          heading: 'Strukturen för en sniff-promenad',
          body: 'Välj en lugn, känd miljö. Lång lina (5–10 m) om möjligt. Hunden bestämmer tempo och riktning — din roll är att följa. Inga kommandon, inga krav på fokus mot dig. Sätt en timer på 20 minuter och sätt av mobilen. Det är hundens tid, inte träningens.',
        },
        {
          heading: 'Träningspromenad vs. decompression-promenad',
          body: 'En träningspromenad har mål: inkallning på lina, gångövningar, kontaktbeteenden. Den kräver fokus och kognitivt arbete. En decompression-promenad har inga mål — den fyller på. De är inte motsatser; de tjänar olika syften. En hund som är uttömd på träningsdagar behöver fler decompression-pass för att kunna absorbera det inlärda.',
        },
        {
          heading: 'När du märker att hunden behöver decompression',
          body: 'Svårt att fokusera på dig trots att det brukar gå bra. Mer reaktiv än vanligt. Avvisar godis. Söker sig bort. Dessa är alla tecken på ett tömt "batteri". Välj decompression-promenad och spara träningspasset till nästa dag när hunden har återhämtat sig.',
        },
      ],
    },
  ],

  beteende: [
    {
      id: 'stress-signals',
      title: 'Stresssignaler — läs av din hund',
      summary: 'Hundar pratar hela tiden. Lär dig se de subtila tecknen innan problemen uppstår.',
      readTime: '4 min',
      sources: ['AVSAB Humane Dog Training (2021)', 'Toronto Humane Society Puppy Manual (2023)'],
      sections: [
        {
          heading: 'Vad är stresssignaler?',
          body: 'AVSAB dokumenterar att hundar tränade med aversiva metoder visar "stress-related behaviors during training, including tense body, lower body posture, lip licking, tail lowering, lifting front leg, panting, yawning." Dessa signaler syns redan innan hunden är "over threshold" och är ditt tidiga varningssystem.',
        },
        {
          heading: 'Vanliga tecken att se upp för',
          body: 'Toronto Humane Society listar: öron bakåt eller nedåt, svansen under magen, gömmer sig, fryser, skakar, försök att fly, vägrar godis, söker mänsklig kontakt, flåsar. Gäspning utanför trötthet, slickar nosen utan mat i närheten, skakar kroppen som om den vore blöt — alla är subtilare signaler.',
        },
        {
          heading: 'Skillnad: stress vs. kalibrering',
          body: 'En hund som gapar och tittar bort när du tränar i en ny miljö är inte trött — den bearbetar intryck. Det är normalt. Problemet uppstår när dessa signaler upprepas hela passet utan att lugnas ner. Då är miljön för svår.',
        },
        {
          heading: 'Vad du ska göra',
          body: 'AVSAB: öka avstånd till triggern. Gör övningen enklare. Avsluta passet med en lätt övning och en jackpot-belöning. Pressa aldrig igenom stresssignaler — det bygger negativa associationer som är svåra att reparera.',
        },
      ],
    },
    {
      id: 'over-threshold',
      title: 'Over threshold — när hunden slutar tänka',
      summary: 'En hund som är "over threshold" kan inte lära sig. Förstå skillnaden och vad du ska göra.',
      readTime: '3 min',
      sources: ['AVSAB Humane Dog Training (2021)'],
      sections: [
        {
          heading: 'Vad innebär "over threshold"?',
          body: 'AVSAB: "Aversive training has been shown to impair dogs\' ability to learn new tasks." Samma gäller för rädslobaserad överstimulering generellt — när ett stimuli överstiger hundens stresströskel går den in i "fight-flight-freeze"-läge. Kortisol och adrenalin tar över. Prefrontal cortex kopplas bort och hunden kan bokstavligen inte tänka.',
        },
        {
          heading: 'Tecken på att hunden är over threshold',
          body: 'Fixerad blick som inte bryts · Reaktivt skällande trots att du ropar · Rycker i kopplet mot triggern · Är helt ointresserad av belöning · "Tunnel vision" — ser inget utom triggern · Fladdrar med öronen, stelnar, andas snabbt.',
        },
        {
          heading: 'Testet',
          body: 'AVSAB och Toronto är överens: kan hunden ta ett godis? Nej → over threshold. Ja, mjukt och snabbt → under threshold. Det är det snabbaste och mest pålitliga testet i fält.',
        },
        {
          heading: 'Vad du gör',
          body: 'Öka avstånd tills hunden kan ta belöning och titta på dig — det är ditt working distance. Träna alltid på det avståndet. Minska det bara när hunden är stabil. AVSAB: "Systematic desensitization involves very gradual exposure to the stimulus in a way that keeps the dog feeling safe at all times."',
        },
      ],
    },
    {
      id: 'trigger-stacking',
      title: 'Trigger stacking — varför hunden plötsligt går i taket',
      summary: 'En enskild trigger hunden klarar — flera på samma dag blir för mycket. Förstå arousal-ackumuleringen.',
      readTime: '4 min',
      sources: ['AVSAB Humane Dog Training (2021)'],
      sections: [
        {
          heading: 'Vad är trigger stacking?',
          body: 'Stress staplas. Varje trigger höjer hundens stressnivå. Mellan triggers sjunker den — men inte tillbaka till noll. AVSAB dokumenterar att "several studies show the effect of aversive training persists beyond the time of training" — samma gäller stresshöjande händelser generellt. En hund som klarade tre hundmöten på en lugn dag kan inte klara två på en stressig dag.',
        },
        {
          heading: 'Återhämtningstid',
          body: 'Kortisol tar timmar till dagar att brytas ned. Efter en svår exponering (rejäl skällning, paniksituation) behöver hunden 2–3 dagar lågstimulans för att verkligen återhämta sig. Inte bara "vila tills imorgon".',
        },
        {
          heading: 'Tecken på trigger-staplad hund',
          body: 'Reagerar på saker den brukar klara · Skäller på trigger A trots att den nyss passerade utan reaktion · Svårare att inkalla · Sover oroligt · Äter mindre · Vägrar mat den brukar älska.',
        },
        {
          heading: 'Schemalägga med stacking i åtanke',
          body: 'AVSAB rekommenderar att "management strategies, including antecedent arrangement, have a vital role in all training." Praktiskt: efter en intensiv dag → 1–2 lugna dagar med bara sniff-promenader. Hund-träffar OCH veterinärbesök på samma dag = recept för regress.',
        },
      ],
    },
    {
      id: 'lat-method',
      title: 'Look At That (LAT) — träna automatisk uppmärksamhet',
      summary: 'LAT vänder triggern till en signal: "se den, kolla in mig". Här är hur du bygger den från grunden.',
      readTime: '5 min',
      sources: ['AVSAB Humane Dog Training (2021)'],
      sections: [
        {
          heading: 'Vad LAT gör',
          body: 'LAT är en motkonditioneringsteknik. AVSAB: "Creating positive associations to stimuli perceived by the dog as frightening is essential in easing fear and anxiety." Hunden lär sig: trigger → markör → belöning hos mig. Med tillräckligt många reps blir triggern själv signalen att vända till föraren.',
        },
        {
          heading: 'Förutsättningar',
          body: 'Markörsignal måste vara laddad. High-value belöning enbart för LAT. Du måste kunna identifiera ditt working distance (avståndet där hunden kan ta godis trots triggern syns). AVSAB: "The dog should be set up to make appropriate responses" — working distance är din uppgift att säkerställa.',
        },
        {
          heading: 'Steg för steg',
          body: '1) Identifiera trigger och working distance. 2) Stå still, vänta på att hunden tittar på triggern. 3) I sekunden hunden tittar → markera. 4) Belöna mot ditt ben — hunden vänder för att äta. 5) Repetera 5–10 ggr per pass, aldrig fler. 6) Avsluta lugnt och gå därifrån.',
        },
        {
          heading: 'Working distance varierar',
          body: 'Distansen är inte konstant. En trött hund, en regnig dag, två triggers i rad — allt sänker tröskeln. Ha alltid 50% buffert. Backa hellre 5 m i onödan än att gå over threshold en gång.',
        },
        {
          heading: 'När LAT inte räcker',
          body: 'Vid svår reaktivitet — skäll på 50+ m, attackförsök, bett-historia — räcker LAT inte själv. AVSAB rekommenderar att söka "board-certified veterinary behaviorist, or certified applied animal behaviorist" vid allvarliga beteendeproblem.',
        },
      ],
    },
    {
      id: 'bat-cat-intro',
      title: 'BAT & CAT — när LAT inte räcker till',
      summary: 'För hundar med stark reaktivitet räcker LAT sällan ensamt. Två etablerade metoder du bör känna till.',
      readTime: '4 min',
      sources: ['AVSAB Humane Dog Training (2021)'],
      sections: [
        {
          heading: 'Varför inte alltid LAT?',
          body: 'LAT bygger uppmärksamhet mot föraren. Det fungerar bra för måttlig reaktivitet. Men för hundar med stark rädsla är problemet inte uppmärksamhet — det är känsloläget runt triggern. AVSAB: "Behavior modification plans should include science-based classical or operant conditioning protocols."',
        },
        {
          heading: 'BAT (Behavior Adjustment Training)',
          body: 'BAT handlar om att låta hunden själv besluta avstånd och tempo. Du följer hunden på en lång lina, hunden tittar på triggern, du väntar passivt. När hunden själv vänder bort eller väljer ett annat alternativ → den belönar sig själv genom att avlägsna sig. Det bygger ägarskap över beslutet.',
        },
        {
          heading: 'CAT (Constructional Aggression Treatment)',
          body: 'CAT är mer strukturerat: triggern presenteras på avstånd hunden klarar, hunden väljer ett önskat beteende (sitter, vänder bort, slappnar av), och triggern går då bort. Borttagandet av triggern är belöningen — negativ förstärkning utan aversiv stimulus.',
        },
        {
          heading: 'Det här är inte gör-själv-metoder',
          body: 'AVSAB är tydliga: "Animals with challenging behavior disorders such as aggression should be treated with effective, compassionate, and humane methods of training." Felgjort förstärker problemet. Sök certifierad beteendekonsulent (SBBK/IAABC) som behärskar metoden.',
        },
        {
          heading: 'Vad du kan göra själv just nu',
          body: 'Håll hunden under threshold (avstånd > working distance), kör LAT på säkra avstånd, undvik att stacka triggers, säkerställ vila och bra mat, och dokumentera vad som triggar. Den informationen sparar konsulten tid.',
        },
      ],
    },
  ],
}
