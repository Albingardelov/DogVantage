// src/lib/breeds/fci-groups.ts
import type { BreedProfile } from '@/lib/ai/breed-profiles'

export const FCI_GROUP_PROFILES: Record<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10, BreedProfile> = {
  1: {
    name: 'Vallhund (FCI grupp 1)',
    purpose: 'Valla och styra boskap. Arbetar intensivt nära föraren med hög drivnivå och smart självständigt agerande.',
    temperament: [
      'Intelligent och snabblärd — tar till sig kommandon snabbt',
      'Hög energi och arbetsvilja — behöver dagliga mentala utmaningar',
      'Stark instinkt att styra rörelse — kan valla barn, cyklister, katter',
      'Lojal och kontaktssökande mot sin familj',
    ],
    sensitivity: 'medium',
    suggestedGoals: ['herding', 'impulse_control', 'sport'],
    hiddenGoals: ['hunting'],
    breedSkills: [
      { name: 'Impulskontroll', description: 'Kanal vallningsdriften konstruktivt — bygg en stark "av-knapp" tidigt.', startPhase: 'puppy' },
      { name: 'Fokus på föraren', description: 'Träna ögonkontakt och närkontakt i miljöer med rörliga objekt.', startPhase: 'puppy' },
    ],
    trainingCautions: [
      'Understimulerad vallhund hittar egna projekt: grävning, skällande, destruktion',
      'Vallinstinkten mot barn och cyklister måste kanaliseras tidigt',
    ],
    activityGuidelines: {
      puppy: 'Korta, varierade pass 3–4 ggr/dag. Socialisering mot rörelse och ljud är kritisk.',
      junior: '15–25 min. Bygg grundlydnad, introducera sport-grunder.',
      adolescent: '25–45 min. Sport, nosework, formell lydnad — variera för att undvika tristess.',
    },
  },

  2: {
    name: 'Pinscher, Schnauzer & Molosser (FCI grupp 2)',
    purpose: 'Vakt, skydd och arbete. Kraftig byggnad och beslutsamhet — bred grupp från lekfulla Boxers till tunga Molosser.',
    temperament: [
      'Säker och lugn i sin grundnatur — inte nervöst reaktiv',
      'Kan vara envisa och testa gränser',
      'Kräver tydlig, konsekvent ledning från dag ett',
      'Lojala och skyddande mot familjen',
    ],
    sensitivity: 'medium',
    suggestedGoals: ['everyday_obedience', 'sport'],
    hiddenGoals: ['hunting', 'herding'],
    breedSkills: [
      { name: 'Grundlydnad och impulskontroll', description: 'Sitta, ligg, stanna och inkallning med distraktion. Fundamentet för en trygg stor hund.', startPhase: 'puppy' },
      { name: 'Socialisering', description: 'Bred exponering för människor, hundar och miljöer 8–16 veckor.', startPhase: 'puppy' },
    ],
    trainingCautions: [
      'Hård dominansbaserad träning triggar motstånd — positiv förstärkning är effektivare',
      'Tidig socialisering är avgörande: problem i vuxen ålder är svåra att korrigera',
    ],
    activityGuidelines: {
      puppy: 'Korta pass, fokus på socialisering och grundkommandon.',
      junior: '15–20 min. Grundlydnad, koppelgång.',
      adolescent: '20–40 min. Lydig- hets- och sportklass rekommenderas.',
    },
  },

  3: {
    name: 'Terrier (FCI grupp 3)',
    purpose: 'Jakt på grävande djur. Envis, tapper och självständig — skapad för att arbeta ensam i jord.',
    temperament: [
      'Envis och ihärdig — ger inte upp lätt',
      'Hög jaktalert — kan reagera snabbt på smådjur',
      'Social och livlig, ofta med stor personlighet för sin storlek',
      'Oberoende tänkare — "vad är det för mig i det?" är en vanlig reaktion',
    ],
    sensitivity: 'hardy',
    suggestedGoals: ['impulse_control', 'everyday_obedience', 'nosework'],
    hiddenGoals: ['herding'],
    breedSkills: [
      { name: 'Inkallning', description: 'Bygg en stark inkallning tidigt — jaktalerten gör att hunden lätt stänger av lyssnandet utomhus.', startPhase: 'puppy' },
      { name: 'Nosework', description: 'Kanaliserar jaktinstinten konstruktivt. Mentalt utmattande och rasenligt.', startPhase: 'puppy' },
    ],
    trainingCautions: [
      'Terriern testar konsekvent om reglerna gäller idag med — var konsekvent',
      'Aldrig lös i oinringat område med smådjur — jaktinstinkten tar över',
    ],
    activityGuidelines: {
      puppy: 'Lekfulla korta pass. Nosework-intro tidigt.',
      junior: '10–15 min. Inkallning, grundlydnad, enkelt doftspår.',
      adolescent: '20–30 min. Nosework, rally, bruksprov.',
    },
  },

  4: {
    name: 'Tax (FCI grupp 4)',
    purpose: 'Jakt på grävlingar och rävar i jord och skog. Lång, låg kropp för att ta sig in i lyor.',
    temperament: [
      'Modig och ihärdig för sin storlek',
      'Självständig och kan vara envis',
      'Engagerad och livlig i träning när motivationen finns',
      'Stark doftinstinkt — följer gärna spår på promenader',
    ],
    sensitivity: 'medium',
    suggestedGoals: ['everyday_obedience', 'nosework'],
    hiddenGoals: ['herding', 'sport'],
    breedSkills: [
      { name: 'Nosework / doftspår', description: 'Naturlig förmåga — utmärkt mental stimulans.', startPhase: 'puppy' },
      { name: 'Koppelgång', description: 'Låg tyngdpunkt och stark dragkraft. Positiv koppelgång kräver tålamod.', startPhase: 'puppy' },
    ],
    trainingCautions: [
      'Ryggproblem är vanliga — inga höga hopp eller trappor för valpen',
      'Hård korrigering fungerar inte — positiv förstärkning och tålamod',
    ],
    activityGuidelines: {
      puppy: 'Korta pass, undvik hopp och backar. Nosework-intro.',
      junior: '10–15 min. Spårarbete, koppelgång.',
      adolescent: '20–30 min. Spårprov, doftarbete.',
    },
  },

  5: {
    name: 'Spetsar och urtyper (FCI grupp 5)',
    purpose: 'Bred grupp: klövviltsjakt (nordiska spetsar), drag (malamute, husky), sällskap (pomeranian, shiba). Gemensamt: ursprunglig typ, stark självständighet.',
    temperament: [
      'Självständig och ibland envisa — jobbar inte alltid för att glädja föraren',
      'Ofta hög röstanvändning (hyla, yla)',
      'Stark jakt- eller driftsinstinkt',
      'Kan vara reserverade mot okända',
    ],
    sensitivity: 'medium',
    suggestedGoals: ['everyday_obedience', 'sport'],
    hiddenGoals: ['herding'],
    breedSkills: [
      { name: 'Inkallning', description: 'Kritisk för säkerhet — spetsar kan springa väldigt fort och längre. Bygg super-positiv association tidigt.', startPhase: 'puppy' },
      { name: 'Socialisering', description: 'Bred exponering mot människor och situationer 8–16 veckor.', startPhase: 'puppy' },
    ],
    trainingCautions: [
      'Repetitiv träning trökar ut spetsar — håll passen varierade och korta',
      'Drag/hyla kan vara svår att träna bort — förebygg istället för att korrigera',
    ],
    activityGuidelines: {
      puppy: 'Korta, lekfulla pass. Socialisering prioritet.',
      junior: '10–20 min. Grundlydnad, inkallning i inhägnat.',
      adolescent: '20–40 min. Dragkjälke (för dragraser), rally, nosework.',
    },
  },

  6: {
    name: 'Drevhundar och eftersökshundar (FCI grupp 6)',
    purpose: 'Driva och spåra vilt med näsan. Arbetar självständigt och ihärdigt på spår — ofta på långa avstånd från jägaren.',
    temperament: [
      'Nyfikna och envetna — doften är allt',
      'Sociala och vanligtvis vänliga mot alla',
      'Lätta att distrahera av spår — inlyssnandet försvinner utomhus',
      'Glada och uthålliga',
    ],
    sensitivity: 'medium',
    suggestedGoals: ['everyday_obedience', 'nosework'],
    hiddenGoals: ['herding'],
    breedSkills: [
      { name: 'Nosework / doftspår', description: 'Naturlig förmåga — fungerar som mental tröttning och kanaliserar jaktalerten.', startPhase: 'puppy' },
      { name: 'Inkallning utomhus', description: 'Svår att återkalla när spåret är intressant. Träna alltid med lång lina ute tills inkallningen är bombsäker.', startPhase: 'puppy' },
    ],
    trainingCautions: [
      'Aldrig lös i oinringat område förrän inkallningen är säker',
      'Tjuvslukhund — hantera maten aktivt och lägg locket på',
    ],
    activityGuidelines: {
      puppy: 'Lekfulla pass, doftintro.',
      junior: '10–20 min. Enkel spårning, grundlydnad.',
      adolescent: '20–40 min. Spårprov, jaktprov.',
    },
  },

  7: {
    name: 'Stående fågelhundar (FCI grupp 7)',
    purpose: 'Söka och stå på fågelvilt. Arbetar tätt med jägaren, hittar fåglar med nos och markerar med stånd.',
    temperament: [
      'Arbetsvillig och entusiastisk i fält',
      'Vanligtvis lyhörda och kontaktssökande',
      'Kan vara känsliga för press — undvik hård träning',
      'Sociala och vänliga',
    ],
    sensitivity: 'soft',
    suggestedGoals: ['hunting', 'everyday_obedience'],
    hiddenGoals: ['herding', 'impulse_control'],
    breedSkills: [
      { name: 'Stånd', description: 'Stanna stilla när fågellukt hittas. Grundas tidigt med positiv förstärkning.', startPhase: 'junior' },
      { name: 'Sökmönster', description: 'Systematiskt sök i terrängen. Byggs upp gradvis med ökande avstånd.', startPhase: 'junior' },
    ],
    trainingCautions: [
      'Hård ton stänger av viljan hos känsliga fågelhundar',
      'Överträna inte ståndet tidigt — det bygger stress',
    ],
    activityGuidelines: {
      puppy: 'Socialisering, marker-träning, mjuk hantering.',
      junior: '15–25 min. Stånd-intro, sökmönster, dummy.',
      adolescent: '30–45 min. Fältprov-förberedelse.',
    },
  },

  8: {
    name: 'Apporterande, stötande och vattenhundar (FCI grupp 8)',
    purpose: 'Apportera nedskjutet vilt på land och i vatten. Arbetar på kommando från jägaren på avstånd.',
    temperament: [
      'Gladlynt, social och mat-motiverad',
      'Läraktig och samarbetsvillig',
      'Energisk och uthållig',
      'Kan distraheras av dofter',
    ],
    sensitivity: 'medium',
    suggestedGoals: ['hunting', 'everyday_obedience'],
    hiddenGoals: ['herding'],
    breedSkills: [
      { name: 'Apportering', description: 'Grundinstinkt — bygg med lek-apportering tidigt. Mjukt gap och leverans till handen.', startPhase: 'puppy' },
      { name: 'Vattenarbete', description: 'Introduceras med lek nära vatten. Ökar till apportering i vatten.', startPhase: 'junior' },
    ],
    trainingCautions: [
      'Hög matmotivation — passa vikten, använd mat som träningsbelöning',
      'Kan bli fixerade på bollen — hantera apporteringstiden',
    ],
    activityGuidelines: {
      puppy: 'Lek-apportering, socialisering, grundkommandon.',
      junior: '15–25 min. Formell apportering, stillasittning.',
      adolescent: '30–45 min. Distansapportering, vattenarbete, jaktprov.',
    },
  },

  9: {
    name: 'Sällskaps- och tyckhundar (FCI grupp 9)',
    purpose: 'Sällskap och avel för estetiska egenskaper. Bred grupp med allt från Chihuahua till Pudel.',
    temperament: [
      'Varierar mycket inom gruppen',
      'Generellt nära och kontaktssökande med ägaren',
      'Kan vara känsliga för stress och förändringar',
      'Ofta intelligenta och träningsbara (särskilt pudlar)',
    ],
    sensitivity: 'soft',
    suggestedGoals: ['everyday_obedience', 'sport'],
    hiddenGoals: ['hunting', 'herding'],
    breedSkills: [
      { name: 'Grundlydnad', description: 'Namn, inkallning, sitt, ligg. Anpassa kravnivå efter rasens fysik.', startPhase: 'puppy' },
      { name: 'Socialisering', description: 'Bred socialisering är kritisk — många sällskapshundar kan bli rädda utan tidig exponering.', startPhase: 'puppy' },
    ],
    trainingCautions: [
      'Hård korrigering skapar rädsla hos känsliga sällskapshundar',
      'Brachycefala raser (mops, franska bulldogg) — begränsa träning i värme',
    ],
    activityGuidelines: {
      puppy: 'Korta, lekfulla pass. Socialisering prioritet.',
      junior: '10–15 min. Grundlydnad, trickträning.',
      adolescent: '15–25 min. Trick, rally, agility-grunder.',
    },
  },

  10: {
    name: 'Vinthundar (FCI grupp 10)',
    purpose: 'Jakt med synfältet på snabbt vilt. Världens snabbaste hundraser — skapad för sprint, inte uthållighet.',
    temperament: [
      'Mjuka och känsliga — reagerar starkt på hård ton',
      'Stark syninstinkt — jaktar vad som rör sig',
      'Kan vara reserverade mot okända',
      'Lugna inomhus men explosiva utomhus',
    ],
    sensitivity: 'soft',
    suggestedGoals: ['everyday_obedience', 'sport'],
    hiddenGoals: ['hunting', 'herding'],
    breedSkills: [
      { name: 'Inkallning', description: 'Bygg super-positiv association tidigt. Träna alltid i inhägnat — syninstinkten tar över vid rörelse.', startPhase: 'puppy' },
      { name: 'Lure coursing', description: 'Springer efter artificiellt byte. Fantastiskt mentalt och fysiskt utlopp för rasen.', startPhase: 'adolescent' },
    ],
    trainingCautions: [
      'Aldrig lös i oinringat område — kan springa mil om jaktalerten triggas',
      'Hård korrigering skapar rädsla',
    ],
    activityGuidelines: {
      puppy: 'Korta lekfulla pass, socialisering.',
      junior: '10–15 min. Inkallning i inhägnat, koppelgång.',
      adolescent: '20–30 min. Lure coursing, rally.',
    },
  },
}

export function getFciGroupProfile(group: number): BreedProfile {
  const key = group as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  return FCI_GROUP_PROFILES[key] ?? FCI_GROUP_PROFILES[9]
}
