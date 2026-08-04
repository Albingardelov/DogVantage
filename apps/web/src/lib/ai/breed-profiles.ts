/**
 * Breed profiles — the "blueprint" layer.
 *
 * Each profile captures what makes the breed unique:
 * temperament, training sensitivity, breed purpose, and the
 * specific behaviours/skills expected according to breed standards
 * and hunting/work traditions.
 *
 * This is combined with the general training methodology
 * (Dunbar/positive reinforcement docs in RAG + model knowledge)
 * to produce breed-appropriate, week-specific recommendations.
 */

import type { Breed, TrainingGoal } from '@/types'
import { getBreedEntry } from '@/lib/breeds/registry'
import { getFciGroupProfile } from '@/lib/breeds/fci-groups'

export interface BreedProfile {
  /** Swedish display name */
  name: string
  /** What the breed was developed to do */
  purpose: string
  /**
   * Temperament traits relevant to training.
   * Drives how methods should be applied — soft vs. firm,
   * food vs. play motivation, sensitivity to pressure etc.
   */
  temperament: string[]
  /**
   * Training sensitivity — how the breed responds to corrections
   * and to reinforcement pressure.
   * "soft" = very sensitive, avoid hard corrections.
   * "medium" = normal reinforcement pressure works fine.
   * "hardy" = can handle more direct feedback.
   */
  sensitivity: 'soft' | 'medium' | 'hardy'
  /**
   * Breed-specific skills/behaviours that are central to the breed's
   * purpose and should be encouraged/shaped during development.
   * These are the "rasspecifika grejer" — what the dog is expected
   * to do according to its breed standard and working tradition.
   */
  breedSkills: BreedSkill[]
  /**
   * Goals that make sense for this breed and should be pre-selected in onboarding.
   */
  suggestedGoals: TrainingGoal[]
  /**
   * Goals that are irrelevant or misleading for this breed — hidden in onboarding.
   */
  hiddenGoals: TrainingGoal[]
  /**
   * Common training pitfalls or things to actively avoid with this breed.
   */
  trainingCautions: string[]
  /**
   * Exercise and mental stimulation needs by development phase.
   */
  activityGuidelines: {
    puppy: string   // 8–16 weeks
    junior: string  // 4–9 months
    adolescent: string // 9–18 months
  }
}

export interface BreedSkill {
  /** Short label */
  name: string
  /** What the standard/tradition expects */
  description: string
  /** Approximate age/week range to start introducing this skill */
  startPhase: 'puppy' | 'junior' | 'adolescent' | 'adult'
}

// ─────────────────────────────────────────────────────────────────────────────
// BRAQUE FRANÇAIS (TYPE PYRÉNÉES)
// Source: FCI-standard nr 134, SKK rasstandard, franska jaktklubben
// ─────────────────────────────────────────────────────────────────────────────
const braqueFrancais: BreedProfile = {
  name: 'Braque Français (Pyrénées)',
  purpose:
    'Stående fågelhund för jakt i fält, skog och vatten. Arbetar nära jägaren i ett samarbetssök och stannar i ståndet tills jägaren är framme.',
  temperament: [
    'Mjuk och känslig — tål inte hård ton eller fysisk bestraffning',
    'Samarbetsvillig och kontaktssökande med ägaren',
    'Nyfiken och lekfull, motiveras av beröm och samspel',
    'God arbetsvilja men kan stängas av vid för mycket press',
    'Social mot människor och andra hundar',
  ],
  sensitivity: 'soft',
  suggestedGoals: ['hunting', 'everyday_obedience'],
  hiddenGoals: ['herding', 'impulse_control'],
  breedSkills: [
    {
      name: 'Sökets vidd (Quête)',
      description:
        'Till skillnad från en Pointer ska Braque Français ha ett nära, kontaktssökande sök — rimligt brett för terrängen men alltid med blickkontakt med jägaren. "Courant dans un rayon raisonnable" (rör sig inom rimlig räckvidd).',
      startPhase: 'junior',
    },
    {
      name: 'Stånd (Arrêt)',
      description:
        'Fast, stilla och stadig stående ställning när hunden hittar fågellukt. Hunden ska hålla ståndet tills jägaren är framme. Premieras tidigt med spel och positiv förstärkning.',
      startPhase: 'junior',
    },
    {
      name: 'Resning/coulé (Produire le gibier)',
      description:
        'Mjuk, långsam och följsam framgång på fågeln efter ståndet — inte aggressiv eller hastig. Rasen är känd för att vara "douce" (mjuk) i sin resning. Tränas med tålamod.',
      startPhase: 'adolescent',
    },
    {
      name: 'Rapport (Apport)',
      description:
        'Naturlig apporteringsinstinkt finns. Tränas med mjukt vilt. Hunden ska bära varsamt (mjukt gap) och lämna på kommando.',
      startPhase: 'junior',
    },
    {
      name: 'Stoppsignal (Arrêt sur ordre)',
      description:
        'Sitta/stanna direkt vid visselsignal eller handtecken. Grunden för säker jakt. Introduceras tidigt med visselpipa och positiv förstärkning.',
      startPhase: 'puppy',
    },
    {
      name: 'Vattenarbete',
      description:
        'Rasen ska gärna arbeta i vatten. Introduceras försiktigt — aldrig tvinga — med lek och uppmuntran nära vattenkanten.',
      startPhase: 'junior',
    },
  ],
  trainingCautions: [
    'Hård ton, skrik eller fysisk korrigering stänger av hunden — undvik alltid',
    'För långa pass skapar överbelastning och tappad motivation',
    'Tvinga aldrig in i vatten eller på nytt underlag — låt hunden utforska själv',
    'Övertränа inte ståndet i tidiga faser — bygger stress',
    'Undvik att jaga hunden tillbaka om den springer iväg — locka istället',
  ],
  activityGuidelines: {
    puppy:
      '60–90 sek micro-sessions, 4–6 ggr/dag (under 12 v). Fokus: namn, marker-laddning, mjuk hantering, socialisering. Inga långa promenader — benen är känsliga. Från 12–16 v: upp till 3 min/pass.',
    junior:
      '10–20 min strukturerad träning. Introducera sökmönster, stånd med dummy/vilt, apportering. Fria lekar i lagom terräng.',
    adolescent:
      '20–40 min pass. Koppla samman sök + stånd + resning. Vattenträning. Börja fältprov-förberedelser.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// LABRADOR RETRIEVER
// Source: SKK rasstandard, Labrador Retriever Club Sweden
// ─────────────────────────────────────────────────────────────────────────────
const labrador: BreedProfile = {
  name: 'Labrador Retriever',
  purpose:
    'Apporterande jakthund för land och vatten. Hämtar nedskjutet vilt på kommando, arbetar på distans från jägaren.',
  temperament: [
    'Glad, social och omtyckt — motiveras starkt av mat och lek',
    'Energisk och uthållig, behöver mycket rörelse',
    'Läraktig och vill gärna samarbeta med ägaren',
    'Kan vara distraherad av dofter i omgivningen',
    'Generellt sett tålig — hanterar mer direkt feedback än mjukare raser',
  ],
  sensitivity: 'medium',
  suggestedGoals: ['hunting', 'everyday_obedience'],
  hiddenGoals: ['herding', 'impulse_control'],
  breedSkills: [
    {
      name: 'Apportering (Retrieve)',
      description:
        'Central rasinstinkt. Ska hämta objekt (dummy, vilt) mjukt i gapet och lämna i handen. Grundas tidigt med lek-apportering.',
      startPhase: 'puppy',
    },
    {
      name: 'Stillasittning (Steady)',
      description:
        'Sitta still vid sidan av jägaren tills kommando ges — inte rusa ut vid skott eller fågelrörelse. Tränas parallellt med apportering.',
      startPhase: 'junior',
    },
    {
      name: 'Distansapportering',
      description:
        'Hämta dummy/vilt på avstånd med handtecken och vissla. Bygger upp successivt med korta avstånd.',
      startPhase: 'adolescent',
    },
    {
      name: 'Vattenarbete',
      description:
        'Labradoren älskar vatten. Introduceras tidigt med lek. Ökar till apportering i vatten.',
      startPhase: 'puppy',
    },
    {
      name: 'Stoppsignal',
      description:
        'Sitta direkt vid enpips-vissla. Grunden för säker distanshantering.',
      startPhase: 'junior',
    },
  ],
  trainingCautions: [
    'Hög matmotivation — passa vikten, använd kibble som belöning',
    'Kan bli besatt av bollen/dummyn — håll apporteringstid lagom',
    'Behöver tydliga gränser tidigt — gillar att testa vad som funkar',
    'Lång valpfas: undvik hård belastning på lederna tills 12–18 månader',
  ],
  activityGuidelines: {
    puppy:
      '5 min träning per session. Mat-motiverad — utmärkt för luring. Lek-apportering, namn, sitt.',
    junior:
      '15–25 min. Formell apportering, stillasittning, distansarbete börjar.',
    adolescent:
      '30–45 min. Fullständiga apporteringssekvenser, vattenarbete, jaktprov-förberedelser.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// ITALIENSK VINTHUND
// Source: AKC/IGCA breed guide, SKK rasstandard
// ─────────────────────────────────────────────────────────────────────────────
const italianGreyhound: BreedProfile = {
  name: 'Italiensk Vinthund',
  purpose:
    'Sällskapshund och lättare jakthund på småvilt. Jagar med synfältet (synhund/windhund). Tävlar i lure coursing.',
  temperament: [
    'Känslig och fin — reagerar starkt på ton och kroppsspråk',
    'Kan vara envis och selektiv i vad den samarbetar kring',
    'Stark anknytning till sin person — jobbar bäst i relation',
    'Kan vara skygg mot okända — socialisering tidigt är kritiskt',
    'Leker gärna men på sina egna villkor',
  ],
  sensitivity: 'soft',
  suggestedGoals: ['everyday_obedience', 'sport'],
  hiddenGoals: ['hunting', 'herding', 'impulse_control'],
  breedSkills: [
    {
      name: 'Koppelanpassning',
      description:
        'Trivs inte alltid i koppel — börja tidigt med positiv koppelanpassning, korta pass.',
      startPhase: 'puppy',
    },
    {
      name: 'Återkallning (inkallning)',
      description:
        'Svår att återkalla när syninstinkten kickar in. Bygg stark positiv association till namn/signal tidigt. Träna alltid i inhägnat område.',
      startPhase: 'puppy',
    },
    {
      name: 'Lure coursing',
      description:
        'Springer efter artificiellt byte (vit plastpåse i bana). Fantastisk motion och mentalt utlopp för rasen.',
      startPhase: 'adolescent',
    },
    {
      name: 'Socialisering',
      description:
        'Rassen kan bli reserverad mot okända. Bred socialisering 8–16 veckor är avgörande för ett stabilt vuxet temperament.',
      startPhase: 'puppy',
    },
  ],
  trainingCautions: [
    'Extremt sköra ben — inga hopp från höga möbler eller bänkar',
    'Aldrig springa lös i oinringat område — jaktinstinkten tar över',
    'Rentränas långsamt — håll en strikt rutin: ut direkt efter sömn, mat, lek och var 60–90 min för valpar. Belöna varje lyckad utomhustur de första 4 veckorna. Straffa aldrig olyckor inne — städa neutralt och justera intervallen.',
    'Undvik kallt och blött väder utan täcke — termoreglering sämre än de flesta raser',
    'Hård korrigering eller skrik skapar skräck, inte lydnad',
  ],
  activityGuidelines: {
    puppy:
      'Korta, lekfulla pass 3–4 ggr/dag. Fokus: socialisering, namn, mjuk koppelanpassning. Inga höga hopp.',
    junior:
      '10–15 min pass. Inkallning i inhägnat område, koppelgång, grundkommando.',
    adolescent:
      '20–30 min. Introduktion av lure coursing, distansinkallning, rally.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// MINIATURE AMERICAN SHEPHERD
// Source: AKC breed standard (2015), MASCUSA breed guide, SKK rasstandard
// ─────────────────────────────────────────────────────────────────────────────
const miniatureAmericanShepherd: BreedProfile = {
  name: 'Miniature American Shepherd',
  purpose:
    'Vallhund för lättare boskap (får, getter). Utvecklad på 1960-talet ur små Australiska Vallhundar av Doris Cordova. Erkänd av AKC 2015. Jobbar nära människan, tänker självständigt men är mycket kontaktssökande.',
  temperament: [
    'Intelligent och snabblärd — tar till sig kommandon snabbt, behöver mentala utmaningar',
    'Energisk och arbetsvillig — trivs bäst när den har ett uppdrag',
    'Lojal och nära sin familj — stark anknytning, kan bli överdrivet vaktande',
    'Reserverad mot okända — inte skygg, men iakttagande och försiktig initialt',
    'Stark vallandeininstinkt — kan försöka valla barn, cyklister, katter om instinkten inte kanaliseras',
    'Lär sig snabbt med positiv förstärkning — undvik hård korrigering, det stänger av en arbetsvillig MAS',
  ],
  sensitivity: 'medium',
  suggestedGoals: ['impulse_control', 'sport', 'herding'],
  hiddenGoals: ['hunting'],
  breedSkills: [
    {
      name: 'Vallning (Herding)',
      description:
        'Rasens kärna. Hunden har naturligt "eye" (fasthållande blick), crouch (sänkt postur) och flank-rörelse för att styra boskap. Kanaliseras tidigt med grundlydnad och impulskontroll — utan detta kan instinkten bli problematisk mot allt som rör sig.',
      startPhase: 'adolescent',
    },
    {
      name: 'Agility & rörlighet',
      description:
        'Naturligt atletisk och koordinerad. Fantastisk för agility-träning: tunnlar, slalom, hopp, kontakthinder. Rasen är en av de mest framgångsrika i agility på sin storlek.',
      startPhase: 'junior',
    },
    {
      name: 'Tävlingslydnad (Obedience)',
      description:
        'Extremt träningsbar för formell lydnad: heel, front, apportering, distansarbete. Lär sig snabbt precis beteende och trivs med utmaningar som kräver tänkande.',
      startPhase: 'junior',
    },
    {
      name: 'Nosework / doftspår',
      description:
        'MAS är en naturlig sökare med bra nos. Nosework ger enormt mentalt utlopp. Introduceras med enkla doftboxar och bygger upp gradvis.',
      startPhase: 'puppy',
    },
    {
      name: 'Frisbee / disc dog',
      description:
        'Hög lekdrift kombinerat med atletisk förmåga gör MAS utmärkt för disc dog. Börja med rullande skiva på marken, bygg upp till luftfångst.',
      startPhase: 'junior',
    },
    {
      name: 'Trickträning',
      description:
        'Rasen älskar att lära sig trick — snurra, bow, paw, cover, skateboard. Utmärkt vardagsträning för mentalt utlopp och relationsbygge.',
      startPhase: 'puppy',
    },
  ],
  trainingCautions: [
    'Understimulerad MAS hittar egna projekt — grävning, skällande, destruktion',
    'Vallinstinkten kan bli problematisk mot barn, cyklister eller katter om den inte kanaliseras tidigt',
    'Kan bli överdrivet vaktande/barklystet om socialiseringen är otillräcklig',
    'Repetitiv träning utan variation trökar ut hunden — variera övningarna',
    'Stark lekdrift kan skapa fixering på boll/skiva — hantera drivnivån aktivt',
    'Undvik för tidigt agility-hopp — leder är känsliga under 12–15 månader',
  ],
  activityGuidelines: {
    puppy:
      '5 min träning per session, 3–4 ggr/dag. Fokus: namn, inkallning, impulskontroll, socialisering mot ALLT (folk, hundar, cyklar, barn). Nosework-intro med enkla doftboxar.',
    junior:
      '15–25 min. Introducera agility-grunder (tunnlar, plank, kontakt utan hopp), formell lydnad, trickträning. Kanalisera lekdrift.',
    adolescent:
      '25–45 min. Agility med full utrustning (inga höga hopp förrän 15 mån), tävlingslydnad, vallnings-intro om intresse finns. Sport 3–4 ggr/vecka.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// GOLDEN RETRIEVER
// ─────────────────────────────────────────────────────────────────────────────
const goldenRetriever: BreedProfile = {
  name: 'Golden Retriever',
  purpose:
    'Apporterande jakthund för land och vatten. Nära besläktad med Labrador men med mjukare, mer känsligt temperament.',
  temperament: [
    'Glad, social och tillgiven — motiveras starkt av beröm och mat',
    'Mjukare och känsligare än Labrador — reagerar negativt på hård ton',
    'Stark vilja att samarbeta och glädja föraren',
    'Energisk och lekfull, behöver daglig rörelse',
    'Kan vara distraherad av dofter och rörelse',
  ],
  sensitivity: 'soft',
  suggestedGoals: ['hunting', 'everyday_obedience'],
  hiddenGoals: ['herding', 'impulse_control'],
  breedSkills: [
    {
      name: 'Apportering (Retrieve)',
      description:
        'Central rasinstinkt. Mjukt gap är viktigt — rasen har naturlig "soft mouth". Grundas med lek-apportering.',
      startPhase: 'puppy',
    },
    {
      name: 'Stillasittning (Steady)',
      description:
        'Sitta stilla vid sidan av jägaren tills kommando ges. Tränas parallellt med apportering.',
      startPhase: 'junior',
    },
    {
      name: 'Vattenarbete',
      description:
        'Naturlig vattenvana. Introduceras med lek. Ökar till apportering i vatten.',
      startPhase: 'puppy',
    },
  ],
  trainingCautions: [
    'Hård ton eller frustration skapar oro och tappad motivation — positiv förstärkning hela vägen',
    'Kan bli tjock — viktkontroll viktigt, använd kibble som träningsmat',
    'Lång valpfas — undvik belastning på leder under 12–18 månader',
  ],
  activityGuidelines: {
    puppy: '5 min/session. Lek-apportering, socialisering, grundkommandon.',
    junior: '15–25 min. Apportering, stillasittning, koppelgång.',
    adolescent: '30–45 min. Fullständiga apporteringssekvenser, vattenarbete.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// TYSK SCHÄFER
// ─────────────────────────────────────────────────────────────────────────────
const germanShepherd: BreedProfile = {
  name: 'Tysk schäfer',
  purpose:
    'Mångsidig arbets- och brukshund. Vakt, spår, räddning, ledarhund. En av världens mest tränade raser.',
  temperament: [
    'Intelligent, lyhörd och snabblärd',
    'Stark lojalitet mot sin familj — kan bli överdrivet skyddande',
    'Hög energinivå och behöver dagliga mentala utmaningar',
    'Kan vara reserverad mot okända — socialisering tidigt är avgörande',
    'Arbetar bäst i nära samarbete med sin förare',
  ],
  sensitivity: 'medium',
  suggestedGoals: ['everyday_obedience', 'sport', 'problem_solving'],
  hiddenGoals: ['hunting', 'herding'],
  breedSkills: [
    {
      name: 'Brukslydnad (IPO/IGP)',
      description:
        'Formell tävlingslydnad med heel, front, distanskommando. Rasen är topprankad internationellt i brukslydnad.',
      startPhase: 'junior',
    },
    {
      name: 'Spårning',
      description:
        'Naturlig spårförmåga. Schäfer används professionellt för eftersök och kriminalspårning.',
      startPhase: 'junior',
    },
    {
      name: 'Skydd (Schutzarbeit)',
      description:
        'Kontrollerad skyddsförmåga — tränas enbart av erfarna förare inom organiserad brukssport.',
      startPhase: 'adolescent',
    },
  ],
  trainingCautions: [
    'Underaktiverad schäfer hittar egna projekt — destruktion, skällande, grävning',
    'Tidig och bred socialisering är kritisk: problem i vuxen ålder är svåra att korrigera',
    'Höftledsproblem vanliga — undvik hård belastning för valpen',
  ],
  activityGuidelines: {
    puppy: '5–10 min/session. Socialisering, namn, grundkommandon.',
    junior: '20–30 min. Grundlydnad, spårgrunder, nosework.',
    adolescent: '30–60 min. Brukssport, spårning, tävlingslydnad.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// FRANSK BULLDOGG
// ─────────────────────────────────────────────────────────────────────────────
const frenchBulldog: BreedProfile = {
  name: 'Fransk bulldogg',
  purpose:
    'Sällskapshund med ursprung från engelska bulldoggar kryssade med franska ratthundar. Idag en av Sveriges vanligaste raser.',
  temperament: [
    'Social, lustig och anknuten till sin familj',
    'Kan vara envis och testa gränser',
    'Måttligt energisk — vill ha promenader men inget maratonlopp',
    'Lär sig snabbt med rätt motivation men testar om reglerna gäller',
  ],
  sensitivity: 'medium',
  suggestedGoals: ['everyday_obedience', 'problem_solving'],
  hiddenGoals: ['hunting', 'herding', 'sport'],
  breedSkills: [
    {
      name: 'Grundlydnad',
      description:
        'Namn, inkallning, sitt, ligg. Håll passen korta och roliga — Fransen tröttnar på upprepning.',
      startPhase: 'puppy',
    },
    {
      name: 'Trickträning',
      description:
        'Utmärkt för mental stimulans. Fransen lär sig gärna trick när motivationen är hög.',
      startPhase: 'puppy',
    },
  ],
  trainingCautions: [
    'Brachycefal — begränsa träning i värme och fukt, risk för överhettning',
    'Aldrig motionera hårt i varmt väder — svårt att reglera kroppstemperaturen',
    'Ryggproblem (IVDD) är vanliga — inga höga hopp',
    'Envisa pass utan belöning fungerar inte — håll det roligt och lönsamt',
  ],
  activityGuidelines: {
    puppy: 'Korta, lekfulla pass inomhus. Undvik värme.',
    junior: '10–15 min. Grundkommandon, trickträning.',
    adolescent: '15–20 min. Lydnad, trick, kort promenad morgon/kväll.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// BORDER COLLIE
// ─────────────────────────────────────────────────────────────────────────────
const borderCollie: BreedProfile = {
  name: 'Border Collie',
  purpose:
    'Vallhund för får och nötkreatur. Världens mest intelligenta hundras. Arbetar med intensivt "eye" och tyst, metodisk styrning av boskapen.',
  temperament: [
    'Extremt intelligent och snabblärd — lär sig beteenden efter bara ett fåtal repetitioner',
    'Hög energi och extremt arbetsvillig — kräver dagliga mentala och fysiska utmaningar',
    'Stark vallningsinstinkt — reagerar på rörelse, kan valla barn, cyklar, bilar',
    'Känslig för stressmiljöer och hög intensitet — behöver balans',
    'Lojal och nära sin förare — trivs med tydliga uppgifter',
  ],
  sensitivity: 'medium',
  suggestedGoals: ['sport', 'herding', 'problem_solving'],
  hiddenGoals: ['hunting'],
  breedSkills: [
    {
      name: 'Vallning (Herding)',
      description:
        'Rasens kärna. Arbetar med "eye" — intensiv, fixerande blick — och flankar runt djuren för att styra dem. Kräver organiserad träning med erfaren instruktör.',
      startPhase: 'adolescent',
    },
    {
      name: 'Agility',
      description:
        'Border Collie dominerar agilityvärlden globalt. Naturlig koordination och snabbhet. Grunder med låga hinder från junior-fas.',
      startPhase: 'junior',
    },
    {
      name: 'Frisbee / disc dog',
      description:
        'Kombination av rörelseinstinkt och lekdrift. Börja med rullande skiva, bygg till luftfångst och kombinations-rutiner.',
      startPhase: 'junior',
    },
    {
      name: 'Tävlingslydnad',
      description:
        'Extremt träningsbar för formell lydnad och rally. Rasen tar till sig precisa beteenden snabbt.',
      startPhase: 'junior',
    },
    {
      name: 'Nosework / doftspår',
      description:
        'Utmärkt mentalt utlopp för en Border Collie som inte kan valla. Ger fokus och lugn.',
      startPhase: 'puppy',
    },
  ],
  trainingCautions: [
    'Underaktiverad Border Collie är ett problem — destruktion, tvångsbeteenden, skällande',
    'Vallningsinstinkten måste kanaliseras tidigt — annars vallas allt som rör sig',
    'Kan bli stressad och fixerad utan tydlig struktur',
    'Undvik hård ton — rasen är känsligare än sin intensitet antyder',
    'Undvik för tidiga höga hopp i agility — leder är känsliga under 12–15 månader',
  ],
  activityGuidelines: {
    puppy: '5–10 min/session. Socialisering, namn, impulskontroll, nosework-intro.',
    junior: '20–30 min. Agility-grunder, frisbee-intro, grundlydnad.',
    adolescent: '45–60 min. Agility, vallning, tävlingslydnad, spårning.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// SHETLAND SHEEPDOG (SHELTIE)
// ─────────────────────────────────────────────────────────────────────────────
const shetlandSheepdog: BreedProfile = {
  name: 'Shetland Sheepdog',
  purpose:
    'Liten vallhund från Shetlandsöarna. Arbetar med flock på trånga, vindpinade holmar. Nära besläktad med Rough Collie men i miniatyrformat.',
  temperament: [
    'Mjuk, känslig och lyhörd — reagerar negativt på hård eller otålig ton',
    'Intelligens i klass med Border Collie men mer reserverad',
    'Stark lojalitet mot sin familj — reserverad eller skygg mot okända',
    'Naturlig varningsskällare — kan bli problematisk om instinkten inte hanteras',
    'Motiveras starkt av beröm och samarbete',
  ],
  sensitivity: 'soft',
  suggestedGoals: ['sport', 'everyday_obedience'],
  hiddenGoals: ['hunting'],
  breedSkills: [
    {
      name: 'Agility',
      description:
        'Sheltien är en av de mest framgångsrika agilityraserna. Naturlig smidighet och snabbhet.',
      startPhase: 'junior',
    },
    {
      name: 'Tävlingslydnad',
      description:
        'Extremt träningsbar. Precision och samarbete med föraren är rasens styrka.',
      startPhase: 'junior',
    },
    {
      name: 'Rally lydnad',
      description:
        'Perfekt ingångspunkt för formell tävling. Rasen trivs med strukturerade uppgifter.',
      startPhase: 'junior',
    },
    {
      name: 'Nosework',
      description:
        'Ger mentalt utlopp och stärker självförtroendet — bra för mer reserverade individer.',
      startPhase: 'puppy',
    },
  ],
  trainingCautions: [
    'Skällbeteende måste hanteras tidigt — rasen har starkt varningsinstinkt',
    'Hård ton skapar rädsla och blockerar inlärning — alltid mjuk och positiv',
    'Tidig socialisering mot okända avgörande — annars kan reservationen cementeras',
    'Undvik tidiga höga hopp — leder är känsliga under 12 månader',
  ],
  activityGuidelines: {
    puppy: '5 min/session. Socialisering mot okända, mjuk klickerträning, grundkommandon.',
    junior: '15–20 min. Agility-grunder, lydnad, nosework.',
    adolescent: '30–40 min. Agilityträning, tävlingslydnad, rally.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// AUSTRALIAN SHEPHERD
// ─────────────────────────────────────────────────────────────────────────────
const australianShepherd: BreedProfile = {
  name: 'Australian Shepherd',
  purpose:
    'Mångsidig vallhund för boskap. Utvecklad i västra USA — extremt arbetsvillig, intelligent och energisk. Populär i sport och som familjehund.',
  temperament: [
    'Hög energi och nästan obegränsad uthållighet',
    'Intelligent och självständig — hittar egna lösningar om den inte ges tydliga uppgifter',
    'Stark vallningsinstinkt — kan bli problematisk mot barn och cyklister',
    'Nära sin familj men kan vara reserverad mot okända',
    'Lär sig snabbt och minns länge — fel beteenden befästs lika snabbt som rätt',
  ],
  sensitivity: 'medium',
  suggestedGoals: ['sport', 'herding', 'nosework'],
  hiddenGoals: ['hunting'],
  breedSkills: [
    {
      name: 'Vallning (Herding)',
      description:
        'Lika kapabel som Border Collie på flock. Mer kraftfull och mångsidig — arbetar med fler djurslag.',
      startPhase: 'adolescent',
    },
    {
      name: 'Agility',
      description:
        'Naturlig atlet. Används i toppklass i agility. Grunder tidigt, full träning från 15 månader.',
      startPhase: 'junior',
    },
    {
      name: 'Frisbee / disc dog',
      description:
        'Kombination av rörelseinstinkt och lekdrift. En av de bästa disc dog-raserna.',
      startPhase: 'junior',
    },
    {
      name: 'Nosework',
      description:
        'Ger lugn och fokus till en Aussie som annars kan bli överstimulerad. Viktigt mentalt utlopp.',
      startPhase: 'puppy',
    },
  ],
  trainingCautions: [
    'Underaktiverad Aussie är destruktiv — behöver minst 2 timmars aktivitet per dag som vuxen',
    'Vallningsinstinkten måste kanaliseras tidigt',
    'Lär sig fel beteenden lika snabbt som rätt — konsekvens är kritiskt',
    'Undvik monoton upprepning — rasen tröttnar och hittar egna lösningar',
  ],
  activityGuidelines: {
    puppy: '5–10 min/session. Socialisering, impulskontroll, nosework-intro.',
    junior: '20–30 min. Agility-grunder, lydnad, frisbee-intro.',
    adolescent: '45–60 min. Agility, vallning, nosework, sport 4–5 ggr/vecka.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// BELGISK VALLHUND MALINOIS
// ─────────────────────────────────────────────────────────────────────────────
const belgianMalinois: BreedProfile = {
  name: 'Belgisk vallhund Malinois',
  purpose:
    'Brukshund för polis, militär, räddningstjänst och sport. Extremt arbetsdriven och en av världens mest kapabla brukshundar.',
  temperament: [
    'Extremt hög energi och arbetsdriv — behöver dagliga uppgifter',
    'Intelligent, snabblärd och beslutsam',
    'Intensiv och alert — reagerar snabbt på miljöförändringar',
    'Kräver erfaren hundägare — inte lämplig för nybörjare',
    'Stark lojalitet mot sin förare — kan bli aggressiv om det uppstår en konflikt',
  ],
  sensitivity: 'hardy',
  suggestedGoals: ['sport', 'everyday_obedience', 'problem_solving'],
  hiddenGoals: ['hunting', 'herding'],
  breedSkills: [
    {
      name: 'IPO/IGP brukssport',
      description:
        'Spårning, lydnad och skyddsarbete. Malinois är topprankad i IPO globalt. Kräver organiserad träning.',
      startPhase: 'junior',
    },
    {
      name: 'Skyddsarbete',
      description:
        'Kontrollerad skyddsförmåga inom brukssport. Tränas ENBART av erfarna förare med kompetent instruktör.',
      startPhase: 'adolescent',
    },
    {
      name: 'Spårning',
      description:
        'Extremt kapabel spårare. Används professionellt för eftersök och kriminalspår.',
      startPhase: 'junior',
    },
    {
      name: 'Agility / sport',
      description:
        'Naturlig atlet med extremt driv. Kan kanaliseras till agility om skyddsarbete inte är aktuellt.',
      startPhase: 'junior',
    },
  ],
  trainingCautions: [
    'Inte lämplig för oerfarna hundägare — kräver tydlig ledning och kanaliserbart driv',
    'Underaktiverad Malinois är farlig — destruktion och aggressivitet kan uppstå',
    'Tidig och bred socialisering är absolut kritisk',
    'Skyddsarbete ska ALDRIG tränas utan kompetent instruktör',
  ],
  activityGuidelines: {
    puppy: '5–10 min/session. Socialisering, impulskontroll, grundkommandon.',
    junior: '30–45 min. Grundlydnad, spårgrunder, nosework, driv-kanalisering.',
    adolescent: '60–90 min. IPO-träning, spårning, avancerad lydnad, sport dagligen.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// ROTTWEILER
// ─────────────────────────────────────────────────────────────────────────────
const rottweiler: BreedProfile = {
  name: 'Rottweiler',
  purpose:
    'Drovarhund och vakthund från Rottweil, Tyskland. Användes för att driva boskap och vakta gods. Idag populär brukshund och familjehund.',
  temperament: [
    'Trygg, lugn och självsäker — inte reaktiv utan provokation',
    'Stark lojalitet mot sin familj — naturligt skyddande',
    'Intelligent och träningsbar med tydlig struktur',
    'Kan vara dominant mot andra hundar',
    'Reserverad mot okända — inte aggressiv, men iakttagande',
  ],
  sensitivity: 'medium',
  suggestedGoals: ['everyday_obedience', 'sport'],
  hiddenGoals: ['hunting', 'herding'],
  breedSkills: [
    {
      name: 'Grundlydnad',
      description:
        'Rottweiler kräver gedigen grundlydnad. Tydliga regler och konsekvent uppfostran är grundpelaren.',
      startPhase: 'puppy',
    },
    {
      name: 'IPO/IGP brukssport',
      description:
        'En av de klassiska brukshundraserna i IPO. Stark och kapabel i spårning, lydnad och skyddsarbete.',
      startPhase: 'junior',
    },
    {
      name: 'Drag och lastning',
      description:
        'Rasens traditionella arbete. Kan tränas att dra kärra — ger fysisk och mental stimulans.',
      startPhase: 'adolescent',
    },
  ],
  trainingCautions: [
    'Kräver tidig och bred socialisering — reservationen mot okända kan annars bli problematisk',
    'Hög vikt — undvik hård belastning på leder under 18 månader',
    'Dominant mot andra hundar — kontrollerade hundmöten från valp',
    'Kräver kunnig ägare — rasen utnyttjar otydlighet i ledarskapet',
  ],
  activityGuidelines: {
    puppy: '5–10 min/session. Socialisering, grundkommandon, impulskontroll.',
    junior: '20–30 min. Grundlydnad, koppelgång, nosework.',
    adolescent: '30–60 min. Brukssport, avancerad lydnad, drag-intro.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// BERNER SENNENHUND
// ─────────────────────────────────────────────────────────────────────────────
const berneseMountainDog: BreedProfile = {
  name: 'Berner Sennenhund',
  purpose:
    'Allsidig gårdshund och drovarhund från Bernska Alperna. Vaktade gård, drev boskap och drog mjölkvagnar.',
  temperament: [
    'Lugn, trygg och vänlig — en av de mest lätthanterliga storraserna',
    'Mjuk och känslig — reagerar dåligt på hård ton',
    'Lojal och familjeanknuten — mår bra av att vara med sin familj',
    'Kan vara trög att lära sig — tålamod är viktigt',
    'God med barn och andra djur',
  ],
  sensitivity: 'soft',
  suggestedGoals: ['everyday_obedience'],
  hiddenGoals: ['hunting', 'herding', 'sport'],
  breedSkills: [
    {
      name: 'Drag (Carting)',
      description:
        'Rasens traditionella arbete. Berners är starka och stabila — drag-träning ger fantastisk mentalt och fysisk stimulans.',
      startPhase: 'adolescent',
    },
    {
      name: 'Grundlydnad',
      description:
        'Rasen är läraktig men kan vara trög. Positiv förstärkning och tålamod ger bäst resultat.',
      startPhase: 'puppy',
    },
    {
      name: 'Nosework',
      description:
        'Utmärkt mentalt utlopp för en ras som inte alltid orkar med intensiv fysisk träning.',
      startPhase: 'puppy',
    },
  ],
  trainingCautions: [
    'Hög risk för höftled- och armbågsproblem — undvik hård belastning under 18 månader',
    'Hård ton skapar rädsla och blockerar inlärning',
    'Ras med kortare förväntad livslängd — cancer är vanlig, regelbundna veterinärkontroller',
    'Trivs inte i värme — begränsa träning under varma dagar',
  ],
  activityGuidelines: {
    puppy: 'Korta pass 5 min. Socialisering, grundkommandon, nosework-intro.',
    junior: '15–20 min. Grundlydnad, nosework, försiktig koppelgång.',
    adolescent: '20–30 min. Grundlydnad, drag-intro, nosework.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// BOXER
// ─────────────────────────────────────────────────────────────────────────────
const boxer: BreedProfile = {
  name: 'Boxer',
  purpose:
    'Molosserras som kombinerar vakt, bud och sällskap. Användes under båda världskrigen som sambandshund och vakthund.',
  temperament: [
    'Lekfull, energisk och barnslig — behåller valplynnet länge',
    'Stark lojalitet och skyddsinstinkt mot sin familj',
    'Kan vara dominant och visa en tydlig personlighet',
    'Lär sig snabbt men kan testa gränser',
    'Extremt kärlek till sina barn — naturlig familjehund',
  ],
  sensitivity: 'medium',
  suggestedGoals: ['sport', 'everyday_obedience'],
  hiddenGoals: ['hunting', 'herding'],
  breedSkills: [
    {
      name: 'Grundlydnad',
      description:
        'Boxer kan vara envis — tydliga regler och positiv förstärkning utan att ge upp ger resultat.',
      startPhase: 'puppy',
    },
    {
      name: 'Agility',
      description:
        'Naturlig atlet. Boxern är energisk och koordinerad — agility är bra utlopp.',
      startPhase: 'junior',
    },
    {
      name: 'Nosework',
      description:
        'Ger mental stimulans. Boxern trivs med meningsfulla uppgifter.',
      startPhase: 'puppy',
    },
  ],
  trainingCautions: [
    'Brachycefal — undvik intensiv träning i värme',
    'Kan bli för uppspelt och dominant utan tydliga gränser tidigt',
    'Leder känsliga under 18 månader — undvik hård belastning',
    'Kräver daglig rörelse — understimulerad Boxer är kaotisk',
  ],
  activityGuidelines: {
    puppy: '5–10 min/session. Socialisering, grundkommandon, impulskontroll.',
    junior: '20–25 min. Grundlydnad, agility-grunder, nosework.',
    adolescent: '30–45 min. Agility, lydnad, sport.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// DOBERMANN
// ─────────────────────────────────────────────────────────────────────────────
const dobermann: BreedProfile = {
  name: 'Dobermann',
  purpose:
    'Vakthund och brukshund skapad av Karl Friedrich Louis Dobermann på 1870-talet. Kombination av intelligens, snabbhet och skyddsförmåga.',
  temperament: [
    'Intelligent, alert och snabblärd — en av de mest kapabla brukshundraserna',
    'Energisk och fokuserad — behöver dagliga utmaningar',
    'Stark lojalitet och skyddsinstinkt',
    'Kan vara reserverad och misstänksam mot okända',
    'Känsligare än sin pondus antyder — responderar bäst på positiv förstärkning',
  ],
  sensitivity: 'medium',
  suggestedGoals: ['sport', 'everyday_obedience', 'problem_solving'],
  hiddenGoals: ['hunting', 'herding'],
  breedSkills: [
    {
      name: 'IPO/IGP brukssport',
      description:
        'Dobermann är topprankad i IPO. Spårning, lydnad, skyddsarbete — rasen klarar allt.',
      startPhase: 'junior',
    },
    {
      name: 'Tävlingslydnad',
      description:
        'Naturlig precision och driv för formell lydnad. Heel och distansarbete är rasens styrka.',
      startPhase: 'junior',
    },
    {
      name: 'Skyddsarbete',
      description:
        'Kontrollerat skyddsarbete inom brukssport. Enbart med kompetent instruktör.',
      startPhase: 'adolescent',
    },
  ],
  trainingCautions: [
    'Tidig och bred socialisering är kritisk — reservationen mot okända kan bli problematisk',
    'Kräver daglig aktivitet — underaktiverad Dobermann är destruktiv',
    'Känslig för kyla — behöver täcke i kallt väder',
    'Hjärtsjukdom (DCM) är vanlig i rasen — undvik extrem belastning',
  ],
  activityGuidelines: {
    puppy: '5–10 min/session. Socialisering, grundkommandon, impulskontroll.',
    junior: '25–35 min. Grundlydnad, spårgrunder, nosework.',
    adolescent: '45–60 min. Brukssport, tävlingslydnad, skyddsarbete.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// DVÄRG-SCHNAUZER
// ─────────────────────────────────────────────────────────────────────────────
const miniatureSchnauzer: BreedProfile = {
  name: 'Dvärg-Schnauzer',
  purpose:
    'Råtthund och gårdshund. Den minsta av schnauzer-raserna, skapad för att jaga råttor och möss i tyska gårdar.',
  temperament: [
    'Pigg, alert och nyfiken — ständigt uppmärksam på sin omgivning',
    'Intelligent och snabblärd — men kan vara envis',
    'Modig och självsäker trots sin storlek',
    'Social med sin familj men kan vara misstänksam mot okända',
    'Naturlig skällare — varningsbeteendet måste hanteras tidigt',
  ],
  sensitivity: 'medium',
  suggestedGoals: ['everyday_obedience', 'nosework'],
  hiddenGoals: ['hunting', 'herding'],
  breedSkills: [
    {
      name: 'Grundlydnad',
      description:
        'Rasen är kapabel men envis — korta, roliga pass med hög belöningsfrekvens fungerar bäst.',
      startPhase: 'puppy',
    },
    {
      name: 'Nosework',
      description:
        'Naturliga sökar-instinkter. Nosework är perfekt mentalt utlopp för Dvärg-schnauzer.',
      startPhase: 'puppy',
    },
    {
      name: 'Trickträning',
      description:
        'Rasen lär sig gärna trick. Ger mental stimulans och rolig vardagsträning.',
      startPhase: 'puppy',
    },
  ],
  trainingCautions: [
    'Skällbeteendet måste hanteras tidigt — rasen har stark varningsinstinkt',
    'Kan vara envis — ge aldrig upp, men håll passen korta och lönsamma',
    'Socialisering mot barn och andra djur är viktig tidigt',
  ],
  activityGuidelines: {
    puppy: 'Korta, lekfulla pass. Socialisering, grundkommandon, nosework-intro.',
    junior: '15–20 min. Grundlydnad, nosework, trickträning.',
    adolescent: '20–30 min. Avancerad lydnad, nosework, rally.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// JACK RUSSELL TERRIER
// ─────────────────────────────────────────────────────────────────────────────
const jackRussellTerrier: BreedProfile = {
  name: 'Jack Russell Terrier',
  purpose:
    'Terrier skapad av Reverend John Russell för räv-jakt. Liten och snabb nog att följa efter hästarna men modig nog att gå ner i lyan.',
  temperament: [
    'Envis, livlig och obegränsat energisk',
    'Intelligent men självständig — testar vad som funkar',
    'Naturlig jaktinstinkt — reagerar starkt på dofter och rörelse',
    'Modig och kan ibland överskatta sin storlek',
    'Social och glad men på sina egna villkor',
  ],
  sensitivity: 'hardy',
  suggestedGoals: ['impulse_control', 'everyday_obedience', 'nosework'],
  hiddenGoals: ['herding'],
  breedSkills: [
    {
      name: 'Nosework / doftspår',
      description:
        'Naturlig sökförmåga. Nosework ger enormt mentalt utlopp och kanaliserar jaktinstinkten.',
      startPhase: 'puppy',
    },
    {
      name: 'Impulskontroll',
      description:
        'Kritisk för JRT. Rasen har hög impulsivitet — "lämna", "vänta" och "sitta" är de viktigaste övningarna.',
      startPhase: 'puppy',
    },
    {
      name: 'Trick och agilitet',
      description:
        'JRT älskar agility och trick — rörelse och mental stimulans i kombination. Naturligt atletisk.',
      startPhase: 'junior',
    },
    {
      name: 'Inkallning i oinringat område',
      description:
        'Svåraste utmaningen. Bygg extremt stark positiv association. Öva alltid i inhägnat område tills inkallningen är stensäker.',
      startPhase: 'puppy',
    },
  ],
  trainingCautions: [
    'Aldrig lös i oinringat område tills inkallningen är stensäker',
    'Jaktinstinkten tar över vid doft — träna impulskontroll aktivt',
    'Kan vara aggressiv mot andra hundar — hundmöten kräver kontroll',
    'Grävning är naturligt — ge en legalt grävhörna om problemet uppstår',
  ],
  activityGuidelines: {
    puppy: 'Korta pass, 4–5 ggr/dag. Impulskontroll, namn, nosework-intro.',
    junior: '20–25 min. Impulskontroll, inkallning, nosework, agility-grunder.',
    adolescent: '30–40 min. Agility, nosework, avancerad impulskontroll.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// WEST HIGHLAND WHITE TERRIER
// ─────────────────────────────────────────────────────────────────────────────
const westHighlandWhiteTerrier: BreedProfile = {
  name: 'West Highland White Terrier',
  purpose:
    'Skotsk terrier för jakt på grävling, räv och råttdjur i bergsterräng. Vit färg för att skiljas från bytesdjuren.',
  temperament: [
    'Modig, nyfiken och full av självförtroende',
    'Social och vänlig — mer lätthanterlig än många terrierraser',
    'Intelligent men med typisk terrier-envisa',
    'Kan vara envis och testa gränser',
    'God med barn men kan ha låg tolerans mot rough play',
  ],
  sensitivity: 'medium',
  suggestedGoals: ['everyday_obedience', 'nosework'],
  hiddenGoals: ['hunting', 'herding', 'sport'],
  breedSkills: [
    {
      name: 'Grundlydnad',
      description:
        'Westie är kapabel — håll passen korta, roliga och belönande. Envisheten är terrier-typisk.',
      startPhase: 'puppy',
    },
    {
      name: 'Nosework',
      description:
        'Naturlig sökförmåga. Ger mentalt utlopp och kanaliserar jaktinstinkten produktivt.',
      startPhase: 'puppy',
    },
  ],
  trainingCautions: [
    'Envisheten är raskarak — ge aldrig efter för tjat utan håll linjen konsekvent',
    'Kan gräva — ge en tillåten plats om problemet uppstår',
    'Skällbeteende måste hanteras tidigt',
  ],
  activityGuidelines: {
    puppy: 'Korta, lekfulla pass. Socialisering, grundkommandon.',
    junior: '15–20 min. Grundlydnad, nosework.',
    adolescent: '20–30 min. Avancerad lydnad, nosework, trick.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// SIBERIAN HUSKY
// ─────────────────────────────────────────────────────────────────────────────
const siberianHusky: BreedProfile = {
  name: 'Siberian Husky',
  purpose:
    'Uthållig draghund från Sibirien. Tränades av Chukchi-folket för långa avstånd i arktiska förhållanden. Samarbetsorienterad i pack.',
  temperament: [
    'Frihetslystnande och självständig — inte ett lydigt hundrasa i traditionell mening',
    'Social, glad och vänskaplig mot alla — dålig vakthund',
    'Extremt hög uthållighet och driv för rörelse',
    'Stark jaktinstinkt och flyktdriv — kan försvinna på sekunder',
    'Intelligens kombinerat med envishet — motiveras inte av att behaga sin ägare',
  ],
  sensitivity: 'medium',
  suggestedGoals: ['sport', 'everyday_obedience'],
  hiddenGoals: ['herding', 'hunting'],
  breedSkills: [
    {
      name: 'Dragsport (Mushing/Pulling)',
      description:
        'Rasens naturliga element. Pulka, kicksled, bikejoring, cani-cross. Naturlig sele-acceptans och dragdriv.',
      startPhase: 'adolescent',
    },
    {
      name: 'Inkallning',
      description:
        'Svåraste utmaningen. Aldrig lös i oinringat område — flyktrisk är extrem. Tränas konsekvent men förvänta inte 100% pålitlighet.',
      startPhase: 'puppy',
    },
    {
      name: 'Cani-cross / löpning',
      description:
        'Husky älskar att springa med sin ägare. Cani-cross är perfekt — koppel med bukbälte, energiutlopp för båda.',
      startPhase: 'adolescent',
    },
  ],
  trainingCautions: [
    'Aldrig lös i oinringat område — flyktinstinkten är extrem',
    'Tjuter och skäller vid understimulering — behöver daglig intensiv rörelse',
    'Klassisk lydnad kräver kreativa metoder — rasen motiveras inte av att behaga',
    'Undvik intensiv träning i värme — rasen är skapad för kyla',
  ],
  activityGuidelines: {
    puppy: 'Korta pass. Socialisering, grundkommandon, sele-intro.',
    junior: '20–30 min. Grundlydnad, sele-träning, löpning.',
    adolescent: '60+ min. Dragsport, cani-cross, daglig intensiv rörelse.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// SAMOJED
// ─────────────────────────────────────────────────────────────────────────────
const samoyed: BreedProfile = {
  name: 'Samojed',
  purpose:
    'Ren-vallhund och draghund från Sibirien. Samojed-folkets mångsidigaste hjälp — vakthund, värmekälla och arbetspartner.',
  temperament: [
    'Social, glad och lekfull — en av de vänligaste spetsraserna',
    'Mjuk och känslig — reagerar dåligt på hård ton',
    'Kan vara envis och självständig',
    'Älskar uppmärksamhet och sällskap — mår dåligt av isolering',
    'Naturlig skällare — kommunicerar aktivt',
  ],
  sensitivity: 'soft',
  suggestedGoals: ['everyday_obedience', 'sport'],
  hiddenGoals: ['hunting'],
  breedSkills: [
    {
      name: 'Dragsport',
      description:
        'Naturlig dragdrift. Pulka och cani-cross är utmärkta aktiviteter för Samojed.',
      startPhase: 'adolescent',
    },
    {
      name: 'Grundlydnad',
      description:
        'Rasen är läraktig men kan vara envis. Positiv förstärkning och tålamod är nyckeln.',
      startPhase: 'puppy',
    },
    {
      name: 'Nosework',
      description:
        'Ger mentalt utlopp och tränar fokus — bra för en Samojed som är svår att koncentrera.',
      startPhase: 'puppy',
    },
  ],
  trainingCautions: [
    'Hård ton skapar rädsla och blockerar inlärning',
    'Skällbeteendet måste hanteras tidigt — rasen kommunicerar vokalt',
    'Pälsen kräver regelbunden grooming — börja tidigt med hanteringsträning',
    'Kan bli destruktiv vid understimulering och isolering',
  ],
  activityGuidelines: {
    puppy: 'Korta pass. Socialisering, grundkommandon, hanteringsträning.',
    junior: '20–25 min. Grundlydnad, nosework, sele-intro.',
    adolescent: '45–60 min. Dragsport, avancerad lydnad.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// SVENSK LAPPHUND
// ─────────────────────────────────────────────────────────────────────────────
const swedishLapphund: BreedProfile = {
  name: 'Svensk Lapphund',
  purpose:
    'Sveriges äldsta hundras. Renvallar för samerna, vakthund och sällskapshund. Erkänd av FCI 1944.',
  temperament: [
    'Vaktsam och alert — naturlig varningsskällare',
    'Arbetsvillig och samarbetsorienterad med sin familj',
    'Intelligent och snabblärd',
    'Kan vara reserverad mot okända',
    'Energisk men mer lätthanterlig än Border Collie',
  ],
  sensitivity: 'medium',
  suggestedGoals: ['everyday_obedience', 'herding'],
  hiddenGoals: ['hunting'],
  breedSkills: [
    {
      name: 'Vallning',
      description:
        'Naturlig vallningsinstinkt. Kan introduceras för ren eller fårvallning.',
      startPhase: 'adolescent',
    },
    {
      name: 'Grundlydnad',
      description:
        'Rasen är snabblärd och samarbetsvillig — positiv förstärkning ger snabba resultat.',
      startPhase: 'puppy',
    },
    {
      name: 'Nosework',
      description:
        'Mentalt utlopp som passar rasen. Ger fokus och kanaliserar sökar-instinkter.',
      startPhase: 'puppy',
    },
  ],
  trainingCautions: [
    'Skällbeteendet måste hanteras tidigt',
    'Socialisering mot okända är viktig för att undvika överdrivet vaktsamt beteende',
    'Rasen kräver daglig motion och mentala utmaningar',
  ],
  activityGuidelines: {
    puppy: '5–10 min/session. Socialisering, grundkommandon.',
    junior: '15–25 min. Grundlydnad, nosework.',
    adolescent: '30–45 min. Avancerad lydnad, vallning, nosework.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// FINSK LAPPHUND
// ─────────────────────────────────────────────────────────────────────────────
const finnishLapphund: BreedProfile = {
  name: 'Finsk Lapphund',
  purpose:
    'Renvallar och sällskapshund från Lappland. Mjukare och mer familjeorienterad än den svenska varianten.',
  temperament: [
    'Trevlig, social och familjeanknuten',
    'Mjuk och känslig — mår bäst med positiv förstärkning',
    'Intelligent men kan vara lite avvaktande',
    'God med barn och andra djur',
    'Naturlig skällare vid nya intryck',
  ],
  sensitivity: 'soft',
  suggestedGoals: ['everyday_obedience'],
  hiddenGoals: ['hunting'],
  breedSkills: [
    {
      name: 'Grundlydnad',
      description:
        'Snabblärd och samarbetsvillig. Positiv förstärkning och tålamod ger utmärkta resultat.',
      startPhase: 'puppy',
    },
    {
      name: 'Nosework',
      description:
        'Ger mentalt utlopp — bra för en Finsk lapphund som behöver fokus-träning.',
      startPhase: 'puppy',
    },
  ],
  trainingCautions: [
    'Hård ton skapar rädsla och blockerar inlärning',
    'Skällbeteendet måste hanteras tidigt',
    'Socialisering mot okända miljöer och ljud är viktig',
  ],
  activityGuidelines: {
    puppy: 'Korta, lekfulla pass. Socialisering, grundkommandon.',
    junior: '15–20 min. Grundlydnad, nosework.',
    adolescent: '25–35 min. Avancerad lydnad, nosework, rally.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// BEAGLE
// ─────────────────────────────────────────────────────────────────────────────
const beagle: BreedProfile = {
  name: 'Beagle',
  purpose:
    'Drevhund för hare-jakt. Arbetar i pack med näsa mot marken. Vacker stämma som signalerar till jägaren.',
  temperament: [
    'Social, nyfiken och glad — en av de mest vänliga hundraserna',
    'Extremt nosdrivna — doft tar alltid prioritet',
    'Envis och självständig när doftspåret är hett',
    'Fantastisk med barn och andra djur',
    'Vokalt — stämman används frikostigt',
  ],
  sensitivity: 'medium',
  suggestedGoals: ['nosework', 'everyday_obedience'],
  hiddenGoals: ['herding', 'sport'],
  breedSkills: [
    {
      name: 'Nosework / doftspår',
      description:
        'Beaglen har en av de bästa nosorna i hundvärlden. Nosework är naturligt och ger enormt utlopp.',
      startPhase: 'puppy',
    },
    {
      name: 'Inkallning',
      description:
        'Utmaningen. Doftspåret vinner alltid om inkallningen inte är extrem stark. Träna alltid i inhägnat område.',
      startPhase: 'puppy',
    },
    {
      name: 'Grundlydnad',
      description:
        'Rasen är kapabel men envisheten kräver att träningen alltid är lönsam och rolig.',
      startPhase: 'puppy',
    },
  ],
  trainingCautions: [
    'Aldrig lös i oinringat område utan stensäker inkallning',
    'Stämman — tjuter och skäller vid ensamhet och understimulering',
    'Mat-motivation är extremt hög — passa vikten',
    'Envishet vid doftspår är naturlig — inte olydnad',
  ],
  activityGuidelines: {
    puppy: 'Korta pass. Socialisering, namn, nosework-intro.',
    junior: '20–25 min. Grundlydnad, nosework, inkallning i inhägnat.',
    adolescent: '30–40 min. Nosework, avancerad lydnad.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// HAMILTONSTÖVARE
// ─────────────────────────────────────────────────────────────────────────────
const hamiltonsStovare: BreedProfile = {
  name: 'Hamiltonstövare',
  purpose:
    'Svensk stövare för enkeljakt på hare och räv. Skapad av greve A.P. Hamilton på 1800-talet. Nationell rasklenod.',
  temperament: [
    'Energisk, uthållig och målmedveten på spåret',
    'Lugn och vänlig i hemmet',
    'Självständig och envis när jaktinstinkten tar vid',
    'Social med sin familj och barn',
    'Stark spårinstinkt som dominerar utomhus',
  ],
  sensitivity: 'medium',
  suggestedGoals: ['nosework', 'hunting'],
  hiddenGoals: ['herding', 'sport'],
  breedSkills: [
    {
      name: 'Spårning (Stövning)',
      description:
        'Rasens syfte. Följer viltspår med näsan mot marken och ger ljud. Tränas med spårarbete och viltdoft.',
      startPhase: 'junior',
    },
    {
      name: 'Nosework',
      description:
        'Naturlig sökförmåga som kanaliseras produktivt. Utmärkt mentalt utlopp.',
      startPhase: 'puppy',
    },
    {
      name: 'Inkallning',
      description:
        'Svårt när spårinstinkten tar vid. Bygg stark positiv association tidigt.',
      startPhase: 'puppy',
    },
  ],
  trainingCautions: [
    'Aldrig lös i oinringat område utan stensäker inkallning',
    'Spårinstinkten dominerar utomhus — koppelkontroll är viktigt',
    'Stämman används aktivt — inte lämplig i lägenhetsmiljö utan träning',
  ],
  activityGuidelines: {
    puppy: 'Korta pass. Socialisering, grundkommandon, nosework-intro.',
    junior: '20–30 min. Grundlydnad, spårgrunder, nosework.',
    adolescent: '45–60 min. Spårning, stövning, avancerad lydnad.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// RHODESIAN RIDGEBACK
// ─────────────────────────────────────────────────────────────────────────────
const rhodesianRidgeback: BreedProfile = {
  name: 'Rhodesian Ridgeback',
  purpose:
    'Sydafrikansk jakthund och lejonhund. Ursprungligen för att hålla lejon på plats tills jägaren anlände — inte döda dem.',
  temperament: [
    'Modig, självständig och dominant',
    'Intelligent men kan testa gränser',
    'Lojal och nära sin familj — naturligt skyddande',
    'Reserverad mot okända',
    'Kräver respekt och tydlighet — inte en nybörjarhund',
  ],
  sensitivity: 'hardy',
  suggestedGoals: ['everyday_obedience', 'sport'],
  hiddenGoals: ['herding'],
  breedSkills: [
    {
      name: 'Grundlydnad',
      description:
        'Kräver konsekvent och tydlig träning. Rasen testar gränser — ge inte efter.',
      startPhase: 'puppy',
    },
    {
      name: 'Löpning / uthållighetssport',
      description:
        'Ridgebacken är naturlig sprinter och uthållighetsatlet. Cani-cross och löpning passar perfekt.',
      startPhase: 'adolescent',
    },
    {
      name: 'Nosework',
      description:
        'Jaktinstinkt kanaliserad till doftarbete — ger mentalt utlopp.',
      startPhase: 'junior',
    },
  ],
  trainingCautions: [
    'Kräver erfaren hundägare — rasen utnyttjar otydlighet',
    'Tidig och bred socialisering är kritisk',
    'Dominant mot andra hundar — kontrollerade hundmöten från valp',
    'Hög vikt — undvik hård belastning under 18 månader',
  ],
  activityGuidelines: {
    puppy: '5–10 min/session. Socialisering, grundkommandon.',
    junior: '20–30 min. Grundlydnad, nosework.',
    adolescent: '45–60 min. Löpning, nosework, avancerad lydnad.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// DALMATINER
// ─────────────────────────────────────────────────────────────────────────────
const dalmatian: BreedProfile = {
  name: 'Dalmatiner',
  purpose:
    'Historisk vägarhund som sprang vid sidan av hästvagnar i timmar. Hög uthållighet och energi.',
  temperament: [
    'Energisk, social och lekfull',
    'Intelligent men kan vara envis och självständig',
    'Nära sin familj och älskar uppmärksamhet',
    'Kräver daglig intensiv rörelse — annars destruktiv',
    'Kan vara reserverad mot okända hundar',
  ],
  sensitivity: 'medium',
  suggestedGoals: ['sport', 'everyday_obedience'],
  hiddenGoals: ['hunting', 'herding'],
  breedSkills: [
    {
      name: 'Löpning / uthållighetssport',
      description:
        'Dalmatinern är skapad för uthållighet. Cani-cross, löpning och cykling passar perfekt.',
      startPhase: 'adolescent',
    },
    {
      name: 'Grundlydnad',
      description:
        'Rasen är kapabel men kan vara envis. Positiv förstärkning och konsekvens ger resultat.',
      startPhase: 'puppy',
    },
    {
      name: 'Agility',
      description:
        'Naturlig atlet med koordination. Agility ger bra kombinerat fysiskt och mentalt utlopp.',
      startPhase: 'junior',
    },
  ],
  trainingCautions: [
    'Kräver minst 2 timmar rörelse per dag som vuxen',
    'Medfödda hörselnedsättningar är vanliga i rasen — kontrollera valpen',
    'Kan bli destruktiv vid understimulering',
    'Undvik hård belastning under 18 månader',
  ],
  activityGuidelines: {
    puppy: '5–10 min/session. Socialisering, grundkommandon.',
    junior: '20–30 min. Grundlydnad, agility-grunder.',
    adolescent: '45–60 min. Löpning, agility, avancerad lydnad.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// UNGERSK VORSTEH (VIZSLA)
// ─────────────────────────────────────────────────────────────────────────────
const hungarianVizsla: BreedProfile = {
  name: 'Ungersk vorsteh',
  purpose:
    'Ungersk mångsidig fågelhund för skog, fält och vatten. Stående, spårande och apporterande — allt i en ras.',
  temperament: [
    'Känslig, energisk och extremt kontaktssökande',
    'Stark koppling till sin ägare — tål inte isolering',
    'Motiveras av beröm och nära samarbete',
    'Hög energi och träningslust',
    'Reagerar starkt negativt på hård ton eller frustration',
  ],
  sensitivity: 'soft',
  suggestedGoals: ['hunting', 'everyday_obedience'],
  hiddenGoals: ['herding', 'impulse_control'],
  breedSkills: [
    {
      name: 'Söket och ståndet',
      description:
        'Bred söker i fält och skog. Stannar i fast stånd vid fågellukt. Naturlig instinkt som grundas tidigt.',
      startPhase: 'junior',
    },
    {
      name: 'Apportering',
      description:
        'Naturlig apporteringsinstinkt. Ska hämta vilt mjukt ur vatten och land.',
      startPhase: 'junior',
    },
    {
      name: 'Vattenarbete',
      description:
        'Rasen trivs i vatten. Introduceras med lek och apportering.',
      startPhase: 'junior',
    },
  ],
  trainingCautions: [
    'Hård ton stänger av hunden direkt — alltid positiv förstärkning',
    'Tål inte isolering — separationsångest är vanlig',
    'Kräver daglig rörelse och mental stimulans',
    'Undvik belastning på leder under 12–18 månader',
  ],
  activityGuidelines: {
    puppy: '5 min/session. Socialisering, grundkommandon, mjuk hantering.',
    junior: '20–30 min. Söket, stånd, apportering, vattenintro.',
    adolescent: '30–45 min. Jaktträning, fältprov-förberedelser.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// WEIMARANER
// ─────────────────────────────────────────────────────────────────────────────
const weimaraner: BreedProfile = {
  name: 'Weimaraner',
  purpose:
    'Tysk allround-jakthund. Ursprungligen jagad stor vilt, nu fågelhund för fält, skog och vatten. Elegant och kraftfull.',
  temperament: [
    'Intelligent, dominant och full av energi',
    'Kan testa gränser och kräver tydlig ledning',
    'Stark lojalitet och nära relation till sin ägare',
    'Kan vara destruktiv vid understimulering',
    'Lär sig snabbt men minnesgod för fel beteenden också',
  ],
  sensitivity: 'medium',
  suggestedGoals: ['hunting', 'sport'],
  hiddenGoals: ['herding', 'impulse_control'],
  breedSkills: [
    {
      name: 'Söket och ståndet',
      description:
        'Bred söker med naturlig stånd-instinkt. Rasen är kapabel i fält, skog och vatten.',
      startPhase: 'junior',
    },
    {
      name: 'Apportering',
      description:
        'Naturlig apporteringsinstinkt. Används i fullblodsjakt och prov.',
      startPhase: 'junior',
    },
    {
      name: 'Löpning / uthållighetssport',
      description:
        'Weimaranern kräver intensiv rörelse. Cani-cross och löpning passar rasen.',
      startPhase: 'adolescent',
    },
  ],
  trainingCautions: [
    'Kräver erfaren hundägare — rasen testar gränser aktivt',
    'Underaktivering leder till destruktion och ångest',
    'Separationsångest är vanlig — träna självständighet tidigt',
    'Undvik belastning under 18 månader',
  ],
  activityGuidelines: {
    puppy: '5–10 min/session. Socialisering, grundkommandon.',
    junior: '25–35 min. Söket, apportering, grundlydnad.',
    adolescent: '45–60 min. Jaktträning, löpning, avancerad lydnad.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// TYSK KORTHÅRIG FÅGELHUND
// ─────────────────────────────────────────────────────────────────────────────
const germanShorthairedPointer: BreedProfile = {
  name: 'Tysk korthårig fågelhund',
  purpose:
    'Tysk allsidig jakthund för fält, skog och vatten. Stående, apporterande och spårande — en av världens mest mångsidiga jakthundar.',
  temperament: [
    'Energisk, arbetsvillig och intelligent',
    'Hög träningslust och vilja att samarbeta',
    'Kan vara envis och dominant utan tydlig struktur',
    'Kräver daglig rörelse och mentala utmaningar',
    'Social med sin familj men kan vara aktiv och intensiv',
  ],
  sensitivity: 'medium',
  suggestedGoals: ['hunting', 'everyday_obedience'],
  hiddenGoals: ['herding', 'impulse_control'],
  breedSkills: [
    {
      name: 'Söket och ståndet',
      description:
        'Bred söker i varierande terräng. Fast stånd vid fågellukt. Naturlig rasinstinkt.',
      startPhase: 'junior',
    },
    {
      name: 'Apportering från land och vatten',
      description:
        'Ska hämta vilt ur alla terrängtyper inklusive vatten. Mjukt gap och säker hantering.',
      startPhase: 'junior',
    },
    {
      name: 'Spårning (Schweisshund)',
      description:
        'Kan tränas för eftersök på blodspår. Naturlig spårförmåga.',
      startPhase: 'adolescent',
    },
  ],
  trainingCautions: [
    'Kräver intensiv daglig rörelse — 1–2 timmar som vuxen',
    'Underaktivering ger destruktion och ångest',
    'Undvik hård belastning under 18 månader',
    'Socialisering mot okända miljöer är viktig',
  ],
  activityGuidelines: {
    puppy: '5–10 min/session. Socialisering, grundkommandon.',
    junior: '25–35 min. Söket, apportering, grundlydnad.',
    adolescent: '45–60 min. Jaktträning, spårning, vattenarbete.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// IRLÄNDSK RÖD SETTER
// ─────────────────────────────────────────────────────────────────────────────
const irishRedSetter: BreedProfile = {
  name: 'Irländsk röd setter',
  purpose:
    'Irländsk stående fågelhund med bred sökning. Elegant och snabb — en av de vackraste jakthundarna.',
  temperament: [
    'Livlig, entusiastisk och evigt glad',
    'Mjuk och känslig — reagerar starkt negativt på hård ton',
    'Hög energi och livslust — behåller valplynnet länge',
    'Samarbetsvillig men kan vara distraherad',
    'Social och vänlig mot alla',
  ],
  sensitivity: 'soft',
  suggestedGoals: ['hunting', 'everyday_obedience'],
  hiddenGoals: ['herding', 'impulse_control'],
  breedSkills: [
    {
      name: 'Söket och ståndet',
      description:
        'Bred, galopperade sökning i fält och skog. Sätter fast stånd vid fågellukt.',
      startPhase: 'junior',
    },
    {
      name: 'Grundlydnad',
      description:
        'Rasen kräver tålamod — entusiasmen kan göra det svårt att fokusera. Korta roliga pass.',
      startPhase: 'puppy',
    },
    {
      name: 'Apportering',
      description:
        'Naturlig apporteringsinstinkt. Tränas med dummy och vilt.',
      startPhase: 'junior',
    },
  ],
  trainingCautions: [
    'Hård ton skapar oro och tappad motivation',
    'Långsam att mogna — valplynnet kan hålla i 3–4 år',
    'Kräver daglig intensiv rörelse',
    'Undvik belastning under 18 månader',
  ],
  activityGuidelines: {
    puppy: '5 min/session. Socialisering, grundkommandon.',
    junior: '20–30 min. Söket, grundlydnad.',
    adolescent: '40–60 min. Jaktträning, avancerad lydnad.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// FLATCOATED RETRIEVER
// ─────────────────────────────────────────────────────────────────────────────
const flatCoatedRetriever: BreedProfile = {
  name: 'Flatcoated Retriever',
  purpose:
    'Engelsk apporterande jakthund. Känd som "the Peter Pan of dogs" — behåller glädjen och valplynnet hela livet.',
  temperament: [
    'Evigt glad, entusiastisk och full av energi',
    'Mjuk och känslig — mår bäst med positiv förstärkning',
    'Extremt social mot alla — dålig vakthund',
    'Kan ha svårt att fokusera och koncentrera sig',
    'Lekfull långt in i vuxen ålder',
  ],
  sensitivity: 'soft',
  suggestedGoals: ['hunting', 'everyday_obedience'],
  hiddenGoals: ['herding', 'impulse_control'],
  breedSkills: [
    {
      name: 'Apportering (Retrieve)',
      description:
        'Central rasinstinkt. Mjukt gap och villighet att hämta allt som kastas.',
      startPhase: 'puppy',
    },
    {
      name: 'Vattenarbete',
      description:
        'Naturlig vattenkärlek. Introduceras med lek och apportering från vattenlinjen.',
      startPhase: 'puppy',
    },
    {
      name: 'Stillasittning (Steady)',
      description:
        'Svårare för Flat-coat — entusiasmen tar gärna över. Träna tålamod och impulskontroll.',
      startPhase: 'junior',
    },
  ],
  trainingCautions: [
    'Hård ton skapar rädsla och motarbetad inlärning',
    'Entusiasmen kan göra impulskontroll svår — prioritera från valp',
    'Ras med ökad cancerrisk — regelbundna veterinärkontroller',
    'Undvik belastning under 18 månader',
  ],
  activityGuidelines: {
    puppy: '5 min/session. Lek-apportering, socialisering, vattenintro.',
    junior: '20–25 min. Formell apportering, stillasittning.',
    adolescent: '30–45 min. Jaktträning, vattenarbete, distansapportering.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// COCKER SPANIEL (ENGELSK)
// ─────────────────────────────────────────────────────────────────────────────
const cockerSpaniel: BreedProfile = {
  name: 'Cocker Spaniel',
  purpose:
    'Engelsk spaniels för att söka och spola upp fågel i tät vegetation. "Cocker" syftar på träning mot väderstrecket.',
  temperament: [
    'Glad, energisk och lätt att träna',
    'Mjuk och känslig — positiv förstärkning fungerar bäst',
    'Social och kärleksfull mot sin familj',
    'Stark nosinstinkt — dofter tar uppmärksamheten',
    'Kan vara överdrivet entusiastisk och excitabel',
  ],
  sensitivity: 'soft',
  suggestedGoals: ['everyday_obedience', 'hunting'],
  hiddenGoals: ['herding'],
  breedSkills: [
    {
      name: 'Flushing och apportering',
      description:
        'Söker tät vegetation, spolar upp fågel och apporterar ned-skjutet vilt. Naturlig rasinstinkt.',
      startPhase: 'junior',
    },
    {
      name: 'Nosework',
      description:
        'Extremt god nos — nosework är naturligt och ger mentalt utlopp.',
      startPhase: 'puppy',
    },
    {
      name: 'Grundlydnad',
      description:
        'Lättlärd och samarbetsvillig. Korta roliga pass med hög belöningsfrekvens.',
      startPhase: 'puppy',
    },
  ],
  trainingCautions: [
    'Hård ton skapar rädsla — rasen är känslig',
    'Öronproblem är vanliga — kontrollera och rengör regelbundet',
    'Excitabilitet vid uppspelthet — träna impulskontroll',
  ],
  activityGuidelines: {
    puppy: 'Korta, lekfulla pass. Socialisering, grundkommandon.',
    junior: '15–25 min. Grundlydnad, nosework, flushing-intro.',
    adolescent: '30–40 min. Jaktträning, nosework, avancerad lydnad.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// NOVA SCOTIA DUCK TOLLING RETRIEVER
// ─────────────────────────────────────────────────────────────────────────────
const novaScotiaRetriever: BreedProfile = {
  name: 'Nova Scotia Duck Tolling Retriever',
  purpose:
    'Kanadensisk apportör som lockar (tollar) änder genom att leka vid stranden — änderna nyfikna flyger närmare och jägaren skjuter.',
  temperament: [
    'Energisk, smart och arbetsvillig',
    'Måttligt känslig — responderar bäst på positiv förstärkning',
    'Nyfiken och initiativrik — löser problem självständigt',
    'Stark lekdrift och apporteringsdriv',
    'Kan vara reserverad mot okända',
  ],
  sensitivity: 'medium',
  suggestedGoals: ['hunting', 'sport', 'nosework'],
  hiddenGoals: ['herding'],
  breedSkills: [
    {
      name: 'Tolling',
      description:
        'Unikt rasspecifikt beteende — leker och leker vid vattenkanten för att locka nyfikna änder. Tränas med lek-rutiner.',
      startPhase: 'puppy',
    },
    {
      name: 'Apportering från vatten',
      description:
        'Primärt syfte: hämta nedskjuten fågel ur vatten. Naturlig vattenkärlek och driv.',
      startPhase: 'junior',
    },
    {
      name: 'Nosework',
      description:
        'Excellent nos. Nosework ger mentalt utlopp och kanaliserar sökinstinkten.',
      startPhase: 'puppy',
    },
    {
      name: 'Agility / sport',
      description:
        'Atletisk och koordinerad — passar agility och rally utmärkt.',
      startPhase: 'junior',
    },
  ],
  trainingCautions: [
    'Kräver daglig rörelse och mentala utmaningar',
    'Kan bli frustrerad vid monoton träning — variera',
    'Undvik belastning under 18 månader',
  ],
  activityGuidelines: {
    puppy: '5 min/session. Lek-apportering, socialisering, nosework-intro.',
    junior: '20–30 min. Apportering, vattenintro, nosework.',
    adolescent: '35–45 min. Jaktträning, nosework, agility.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// CAVALIER KING CHARLES SPANIEL
// ─────────────────────────────────────────────────────────────────────────────
const cavalierKingCharles: BreedProfile = {
  name: 'Cavalier King Charles Spaniel',
  purpose:
    'Sällskapshund älskad av brittiskt kungahus. Liten spaniel med anpassningsbart temperament och stor kärlek.',
  temperament: [
    'Snäll, lugn och extremt anpassningsbar',
    'Mjuk och känslig — mår bäst i lugn miljö',
    'Social mot alla människor och djur',
    'Liten rörelseenergi — nöjer sig med promenader',
    'Stark anknytning till sin familj',
  ],
  sensitivity: 'soft',
  suggestedGoals: ['everyday_obedience'],
  hiddenGoals: ['hunting', 'herding', 'sport'],
  breedSkills: [
    {
      name: 'Grundlydnad',
      description:
        'Snabblärd och samarbetsvillig. Positiv förstärkning ger snabba resultat.',
      startPhase: 'puppy',
    },
    {
      name: 'Trickträning',
      description:
        'Cavalieren lär sig gärna trick. Ger mental stimulans och stärker relationen.',
      startPhase: 'puppy',
    },
    {
      name: 'Nosework',
      description:
        'Spaniels har naturlig nosinstinkt. Nosework ger bra mentalt utlopp.',
      startPhase: 'puppy',
    },
  ],
  trainingCautions: [
    'Hjärtsjukdom (MVD) och syringomyeli är vanliga — regelbundna kontroller',
    'Hård ton skapar rädsla och blockerar inlärning',
    'Övervikt är vanligt — viktkontroll och portionerat träningsmat',
  ],
  activityGuidelines: {
    puppy: 'Korta, lekfulla pass. Socialisering, grundkommandon.',
    junior: '10–15 min. Grundlydnad, trickträning, nosework.',
    adolescent: '15–25 min. Avancerad lydnad, nosework, rally.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// PUDEL (STANDARD)
// ─────────────────────────────────────────────────────────────────────────────
const poodleStandard: BreedProfile = {
  name: 'Pudel (stor)',
  purpose:
    'Ursprungligen retrievers för vattenjakt i Tyskland. Idag en av de mest mångsidiga och intelligenta hundraserna.',
  temperament: [
    'Extremt intelligent — lär sig kommandon på ett fåtal repetitioner',
    'Mjuk och känslig — responderar bäst på positiv förstärkning',
    'Social, glad och nyfiken',
    'Anpassningsbar till sport, lydnad, cirkus och sällskap',
    'Kan bli överkänslig om träningen är för hård',
  ],
  sensitivity: 'soft',
  suggestedGoals: ['sport', 'everyday_obedience', 'nosework'],
  hiddenGoals: ['hunting', 'herding'],
  breedSkills: [
    {
      name: 'Tävlingslydnad',
      description:
        'Pudeln är en av de bästa lydnadshundarna. Precision, snabbhet och samarbete.',
      startPhase: 'puppy',
    },
    {
      name: 'Agility',
      description:
        'Naturlig koordination och energi. Pudeln är framgångsrik i agility på alla nivåer.',
      startPhase: 'junior',
    },
    {
      name: 'Nosework',
      description:
        'Ursprungliga sök-instinkter. Nosework är naturligt och ger mentalt utlopp.',
      startPhase: 'puppy',
    },
    {
      name: 'Trickträning',
      description:
        'Pudeln lär sig trick snabbt och imponerande. Utmärkt för show och vardagsträning.',
      startPhase: 'puppy',
    },
  ],
  trainingCautions: [
    'Hård ton skapar stress och blockar inlärning',
    'Extremt intelligent — lär sig fel beteenden lika snabbt som rätt',
    'Pälsen kräver regelbunden grooming — börja med hanteringsträning tidigt',
  ],
  activityGuidelines: {
    puppy: '5 min/session. Grundkommandon, socialisering, nosework-intro.',
    junior: '20–25 min. Agility-grunder, lydnad, trickträning.',
    adolescent: '30–45 min. Tävlingslydnad, agility, nosework.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// PUDEL (DVÄRG)
// ─────────────────────────────────────────────────────────────────────────────
const poodleMiniature: BreedProfile = {
  name: 'Pudel (dvärg)',
  purpose:
    'Miniatyrvariant av standardpudeln. Samma intelligens och mångsidighet i ett mindre format.',
  temperament: [
    'Lika intelligent som stor pudel — extremt snabblärd',
    'Mjuk och känslig — positiv förstärkning är avgörande',
    'Social, glad och anpassningsbar',
    'Passar bra som stadshund utan att tappa träningskapacitet',
    'Energisk och aktiv — inte en softhund',
  ],
  sensitivity: 'soft',
  suggestedGoals: ['sport', 'everyday_obedience'],
  hiddenGoals: ['hunting', 'herding'],
  breedSkills: [
    {
      name: 'Tävlingslydnad',
      description:
        'Dvärg-pudeln är topprankad i lydnadstävlingar. Precis och samarbetsvillig.',
      startPhase: 'puppy',
    },
    {
      name: 'Agility',
      description:
        'Naturlig smidighet och energi. Fungerar utmärkt i agility för sin storlek.',
      startPhase: 'junior',
    },
    {
      name: 'Trickträning',
      description:
        'Utmärkt trick-hund. Lär sig komplexa beteendekedjor snabbt.',
      startPhase: 'puppy',
    },
  ],
  trainingCautions: [
    'Hård ton skapar stress och blockar inlärning',
    'Lär sig fel beteenden lika snabbt — konsekvens viktigt',
    'Pälsen kräver grooming — hanteringsträning tidigt',
  ],
  activityGuidelines: {
    puppy: '5 min/session. Grundkommandon, socialisering.',
    junior: '15–20 min. Agility-grunder, lydnad, trickträning.',
    adolescent: '25–35 min. Tävlingslydnad, agility.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// SHIH TZU
// ─────────────────────────────────────────────────────────────────────────────
const shihTzu: BreedProfile = {
  name: 'Shih Tzu',
  purpose:
    'Kinesisk palatshund. Sällskapshund för kejsarfamiljen i tusentals år. Skapad för kärlek och sällskap, inget annat.',
  temperament: [
    'Lugn, kärleksfull och anpassningsbar',
    'Mjuk och känslig — mår bäst med tålamod och positiv förstärkning',
    'Social mot alla — inte en vakthund',
    'Kan vara envis och lite självständig',
    'Trivs bäst inomhus och i lugna miljöer',
  ],
  sensitivity: 'soft',
  suggestedGoals: ['everyday_obedience'],
  hiddenGoals: ['hunting', 'herding', 'sport'],
  breedSkills: [
    {
      name: 'Grundlydnad',
      description:
        'Snabblärd med rätt motivation. Korta, roliga pass med hög belöningsfrekvens.',
      startPhase: 'puppy',
    },
    {
      name: 'Trickträning',
      description:
        'Shih Tzu lär sig gärna trick. Mental stimulans och relationsbygge.',
      startPhase: 'puppy',
    },
  ],
  trainingCautions: [
    'Brachycefal — begränsa träning i värme',
    'Hård ton skapar rädsla och blockerar inlärning',
    'Ögon- och andningsproblem vanliga — kontrollera regelbundet',
    'Pälsen kräver daglig vård — hanteringsträning från dag ett',
  ],
  activityGuidelines: {
    puppy: 'Korta, lekfulla pass inomhus. Grundkommandon.',
    junior: '10–15 min. Grundlydnad, trickträning.',
    adolescent: '15–20 min. Lydnad, trick, korta promenader.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// CHIHUAHUA
// ─────────────────────────────────────────────────────────────────────────────
const chihuahua: BreedProfile = {
  name: 'Chihuahua',
  purpose:
    'Äldsta och minsta hundrasen i Amerika. Ursprung i Mexico — sällskapshund och möjligen rituell hund hos aztekerna.',
  temperament: [
    'Modig och lojal med enorm personlighet',
    'Stark anknytning till sin person — kan bli överdrivet besittningslystnande',
    'Kan vara misstänksam och skrämd av okända och barn',
    'Intelligent och snabblärd när motivationen är rätt',
    'Mjuk och känslig under sin modiga fasad',
  ],
  sensitivity: 'soft',
  suggestedGoals: ['everyday_obedience', 'problem_solving'],
  hiddenGoals: ['hunting', 'herding', 'sport'],
  breedSkills: [
    {
      name: 'Grundlydnad',
      description:
        'Chihuahua kan mer än folk tror — positivt förstärkt lydnad med högt värde på belöningen.',
      startPhase: 'puppy',
    },
    {
      name: 'Socialisering',
      description:
        'Kritiskt viktig — misstänksamhet mot okända och barn kan bli problematisk. Bred socialisering 8–16 v.',
      startPhase: 'puppy',
    },
    {
      name: 'Trickträning',
      description:
        'Utmärkt mentalt utlopp. Chihuahuan lär sig trick snabbt med rätt belöning.',
      startPhase: 'puppy',
    },
  ],
  trainingCautions: [
    'Hård ton skapar rädsla — rasen är känsligare än den ser ut',
    'Undvik att bära hunden för mycket — jordkontakt är viktigt för självförtroende',
    'Benbräcklighet — inga höga hopp',
    '"Small dog syndrome" uppstår när rasen behandlas som ett plyschleksak och inte en hund',
  ],
  activityGuidelines: {
    puppy: 'Korta, lekfulla pass. Socialisering prioritet ett.',
    junior: '10–15 min. Grundlydnad, trickträning.',
    adolescent: '15–20 min. Avancerad lydnad, trick, promenader.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// MOPS
// ─────────────────────────────────────────────────────────────────────────────
const pug: BreedProfile = {
  name: 'Mops',
  purpose:
    'Kinesisk sällskapshund älskad av europeiska furstar sedan 1600-talet. Skapad enbart för sällskap och kärlek.',
  temperament: [
    'Sällskaplig, rolig och full av personlighet',
    'Anpassningsbar och lugn — trivs i de flesta hemmiljöer',
    'Social mot alla',
    'Kan vara envis men sällan aggressiv',
    'Motiveras av mat och uppmärksamhet',
  ],
  sensitivity: 'soft',
  suggestedGoals: ['everyday_obedience'],
  hiddenGoals: ['hunting', 'herding', 'sport'],
  breedSkills: [
    {
      name: 'Grundlydnad',
      description:
        'Mopsen lär sig grundkommandon med rätt motivation. Håll passen korta och roliga.',
      startPhase: 'puppy',
    },
    {
      name: 'Trickträning',
      description:
        'Ger mental stimulans. Mopsen är underhållande att träna trick med.',
      startPhase: 'puppy',
    },
  ],
  trainingCautions: [
    'Brachycefal — begränsa intensiv träning, undvik värme och fukt',
    'Övervikt är ett allvarligt hälsoproblem — strikt viktkontroll',
    'Ögonproblem vanliga — undvik irritanter',
    'Njuter inte av intensiv motion — men behöver dagliga korta promenader',
  ],
  activityGuidelines: {
    puppy: 'Korta, lekfulla pass inomhus. Grundkommandon.',
    junior: '10–15 min. Grundlydnad, trickträning.',
    adolescent: '15–20 min. Lydnad, trick, korta promenader morgon/kväll.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// MALTESER
// ─────────────────────────────────────────────────────────────────────────────
const maltese: BreedProfile = {
  name: 'Malteser',
  purpose:
    'En av världens äldsta sällskapshundraser. Ursprung i medelhavsregionen — sällskapshund för adel i årtusenden.',
  temperament: [
    'Aktiv, kontaktsökande och lekfull',
    'Mjuk och känslig — mår bäst med positiv förstärkning och mjuk hantering',
    'Intelligent och snabblärd',
    'Kan vara envis och testa gränser',
    'Social och glad — trivs i sällskap',
  ],
  sensitivity: 'soft',
  suggestedGoals: ['everyday_obedience', 'sport'],
  hiddenGoals: ['hunting', 'herding'],
  breedSkills: [
    {
      name: 'Grundlydnad',
      description:
        'Snabblärd och villig. Positiv förstärkning med högt värde ger snabba resultat.',
      startPhase: 'puppy',
    },
    {
      name: 'Rally lydnad',
      description:
        'Maltesern är kapabel i tävling trots sin storlek. Rally är perfekt ingångspunkt.',
      startPhase: 'junior',
    },
    {
      name: 'Trickträning',
      description:
        'Utmärkt för mental stimulans och relationsbygge.',
      startPhase: 'puppy',
    },
  ],
  trainingCautions: [
    'Hård ton skapar rädsla och blockar inlärning',
    'Pälsen kräver daglig vård — hanteringsträning tidigt',
    'Benbräcklighet — inga höga hopp',
    '"Small dog syndrome" — sätt tydliga gränser från dag ett',
  ],
  activityGuidelines: {
    puppy: 'Korta, lekfulla pass. Socialisering, grundkommandon.',
    junior: '10–20 min. Grundlydnad, trickträning, rally-grunder.',
    adolescent: '20–30 min. Rally, avancerad lydnad, trick.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// HAVANAIS
// ─────────────────────────────────────────────────────────────────────────────
const havanese: BreedProfile = {
  name: 'Havanais',
  purpose:
    'Kubansk sällskapshund, Kubas nationalhund. Skapad ur Bichon-familjen för det kubanska borgerskapet.',
  temperament: [
    'Social, lekfull och extremt fäst vid sin familj',
    'Mjuk och känslig — trivs med positiv träning',
    'Intelligent och snabblärd',
    'Kan vara en naturlig underhållare — lär sig gärna tricks',
    'Mår dåligt av isolering och ensamhet',
  ],
  sensitivity: 'soft',
  suggestedGoals: ['everyday_obedience', 'sport'],
  hiddenGoals: ['hunting', 'herding'],
  breedSkills: [
    {
      name: 'Grundlydnad',
      description:
        'Havanais är snabblärd och samarbetsvillig. Positiv träning ger utmärkta resultat.',
      startPhase: 'puppy',
    },
    {
      name: 'Trickträning',
      description:
        'Naturlig underhållare. Lär sig långa beteendekedjor och trick snabbt.',
      startPhase: 'puppy',
    },
    {
      name: 'Rally / agility (mini)',
      description:
        'Aktiv och koordinerad för sin storlek. Passar utmärkt i rally och mini-agility.',
      startPhase: 'junior',
    },
  ],
  trainingCautions: [
    'Separationsångest är vanlig — träna självständighet tidigt',
    'Hård ton skapar rädsla',
    'Pälsen kräver vård — hanteringsträning tidigt',
  ],
  activityGuidelines: {
    puppy: 'Korta, lekfulla pass. Socialisering, grundkommandon.',
    junior: '15–20 min. Grundlydnad, trickträning, rally-intro.',
    adolescent: '20–30 min. Rally, avancerad lydnad, agility.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// BICHON FRISÉ
// ─────────────────────────────────────────────────────────────────────────────
const bichonFrise: BreedProfile = {
  name: 'Bichon Frisé',
  purpose:
    'Fransk/belgisk sällskapshund med medelhavs-ursprung. Populär cirkushund under 1800-talet tack vare sin läraktighet.',
  temperament: [
    'Glad, lättlärd och social',
    'Mjuk och känslig — positiv förstärkning fungerar utmärkt',
    'Lekfull och energisk trots sin storlek',
    'Trivs med uppmärksamhet och sällskap',
    'Historisk cirkushund — naturlig underhållare',
  ],
  sensitivity: 'soft',
  suggestedGoals: ['everyday_obedience', 'sport'],
  hiddenGoals: ['hunting', 'herding'],
  breedSkills: [
    {
      name: 'Trickträning',
      description:
        'Rasens historiska specialitet. Bichon Frisé lär sig komplexa beteendekedjor med glädje.',
      startPhase: 'puppy',
    },
    {
      name: 'Grundlydnad',
      description:
        'Lättlärd och samarbetsvillig. Positiv förstärkning ger snabba resultat.',
      startPhase: 'puppy',
    },
    {
      name: 'Rally / agility (mini)',
      description:
        'Naturlig rörelseenergi och koordination. Passar rally och mini-agility.',
      startPhase: 'junior',
    },
  ],
  trainingCautions: [
    'Hård ton skapar rädsla och blockerar inlärning',
    'Pälsen kräver regelbunden grooming',
    'Separationsångest kan uppstå — träna självständighet',
  ],
  activityGuidelines: {
    puppy: 'Korta, lekfulla pass. Socialisering, grundkommandon.',
    junior: '15–20 min. Trickträning, grundlydnad, rally-intro.',
    adolescent: '20–30 min. Rally, avancerad lydnad, agility.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// WHIPPET
// ─────────────────────────────────────────────────────────────────────────────
const whippet: BreedProfile = {
  name: 'Whippet',
  purpose:
    'Engelsk vinthund för harar-jakt och racing. "Arbetarklassens galgo" — snabb, sansad och lättskött.',
  temperament: [
    'Snabb och explosiv utomhus — lugn och soffig inomhus',
    'Mjuk och känslig — reagerar starkt på hård ton',
    'Nära sin familj, reserverad mot okända',
    'Intelligent men inte alltid motiverad att behaga',
    'Stark jaktinstinkt mot rörelse',
  ],
  sensitivity: 'soft',
  suggestedGoals: ['everyday_obedience', 'sport'],
  hiddenGoals: ['hunting', 'herding'],
  breedSkills: [
    {
      name: 'Lure coursing',
      description:
        'Springer efter artificiellt byte. Naturligt utlopp för rörelseinstinkten. Fantastisk motion.',
      startPhase: 'adolescent',
    },
    {
      name: 'Inkallning i oinringat område',
      description:
        'Svåraste utmaningen. Jaktinstinkten tar över vid rörelse. Bygg extrem positiv association tidigt.',
      startPhase: 'puppy',
    },
    {
      name: 'Grundlydnad',
      description:
        'Whippet är kapabel — positiv förstärkning och motiverande belöningar ger resultat.',
      startPhase: 'puppy',
    },
  ],
  trainingCautions: [
    'Aldrig lös i oinringat område — jaktinstinkten tar över',
    'Hård ton skapar rädsla och blockerar inlärning',
    'Sköra ben och tunn päls — undvik kyla och hårda underlag',
    'Behöver täcke i kylan',
  ],
  activityGuidelines: {
    puppy: 'Korta pass. Socialisering, grundkommandon, inkallning i inhägnat.',
    junior: '15–20 min. Grundlydnad, inkallning.',
    adolescent: '30–40 min. Lure coursing, grundlydnad, distansinkallning.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// GREYHOUND
// ─────────────────────────────────────────────────────────────────────────────
const greyhound: BreedProfile = {
  name: 'Greyhound',
  purpose:
    'Världens äldsta jakthundras. Jagar med synfältet och hastighet — historiskt för hare, idag tävlingslöpning.',
  temperament: [
    'Extremt lugn och sansad inomhus — nästan kattlik',
    'Explosiv och fokuserad utomhus vid rörelse',
    'Mjuk och känslig — mycket fin',
    'Kan vara reserverad mot okända men sällan aggressiv',
    'God med sin familj — söker kontakt på sina egna villkor',
  ],
  sensitivity: 'soft',
  suggestedGoals: ['sport', 'everyday_obedience'],
  hiddenGoals: ['hunting', 'herding'],
  breedSkills: [
    {
      name: 'Lure coursing',
      description:
        'Naturligt utlopp för rörelseinstinkten. Fantastisk motion i kontrollerad form.',
      startPhase: 'adolescent',
    },
    {
      name: 'Inkallning',
      description:
        'Kritisk utmaning. Aldrig lös i oinringat — hastigheten gör en flykt farlig. Bygg stark association.',
      startPhase: 'puppy',
    },
    {
      name: 'Socialisering',
      description:
        'Greyhounds som räddas från racing behöver bred re-socialisering mot vardagslivet.',
      startPhase: 'puppy',
    },
  ],
  trainingCautions: [
    'Aldrig lös i oinringat — kan nå 70 km/h och försvinna',
    'Hård ton skapar rädsla',
    'Tunn päls och låg kroppsfett — behöver täcke och skydd mot kyla',
    'Sova på mjuka ytor — känsliga kotben',
  ],
  activityGuidelines: {
    puppy: 'Korta pass. Socialisering, inkallning i inhägnat.',
    junior: '15–20 min. Grundlydnad, inkallning.',
    adolescent: '30–40 min. Lure coursing, promenader, avkoppling.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// AFGHANSK MYNDE
// ─────────────────────────────────────────────────────────────────────────────
const afghanHound: BreedProfile = {
  name: 'Afghansk mynde',
  purpose:
    'Asiatisk vinthund för jakt i bergterräng på gaseller och snöleoparder. Självständig, snabb och uthållig.',
  temperament: [
    'Majestätisk, självständig och egensinnig',
    'Mjuk och känslig under den distanserade fasaden',
    'Motiveras inte av att behaga sin ägare — intern motivation',
    'Kan vara sky mot okända',
    'Lär sig bäst i sin egen takt utan tryck',
  ],
  sensitivity: 'soft',
  suggestedGoals: ['everyday_obedience'],
  hiddenGoals: ['hunting', 'herding', 'sport'],
  breedSkills: [
    {
      name: 'Lure coursing',
      description:
        'Naturligt utlopp för rasens instinkter. Fantastisk motion i säker form.',
      startPhase: 'adolescent',
    },
    {
      name: 'Grundlydnad (på rasens villkor)',
      description:
        'Afghanen kan lära sig grundkommandon men kräver kreativitet och tålamod. Kräver aldrig upprepning.',
      startPhase: 'puppy',
    },
    {
      name: 'Inkallning',
      description:
        'Svår — jaktinstinkten dominerar. Bygg extrem positiv association och träna alltid i inhägnat.',
      startPhase: 'puppy',
    },
  ],
  trainingCautions: [
    'Aldrig lös i oinringat — jaktinstinkten dominerar',
    'Hård ton skapar aldrig lydnad — bara rädsla och distans',
    'Rasen kräver extremt tålamod — konventionell träning fungerar dåligt',
    'Pälsen kräver intensiv grooming — hanteringsträning tidigt',
  ],
  activityGuidelines: {
    puppy: 'Korta, lekfulla pass. Socialisering, inkallning i inhägnat.',
    junior: '15–20 min. Grundlydnad på rasens villkor.',
    adolescent: '30–40 min. Lure coursing, promenader, avkoppling.',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTED MAP
// ─────────────────────────────────────────────────────────────────────────────
export const BREED_PROFILES: Partial<Record<string, BreedProfile>> = {
  braque_francais: braqueFrancais,
  labrador: labrador,
  italian_greyhound: italianGreyhound,
  miniature_american_shepherd: miniatureAmericanShepherd,
  golden_retriever: goldenRetriever,
  german_shepherd: germanShepherd,
  french_bulldog: frenchBulldog,
  border_collie: borderCollie,
  shetland_sheepdog: shetlandSheepdog,
  australian_shepherd: australianShepherd,
  belgian_malinois: belgianMalinois,
  rottweiler: rottweiler,
  bernese_mountain_dog: berneseMountainDog,
  boxer: boxer,
  dobermann: dobermann,
  miniature_schnauzer: miniatureSchnauzer,
  jack_russell_terrier: jackRussellTerrier,
  west_highland_white_terrier: westHighlandWhiteTerrier,
  siberian_husky: siberianHusky,
  samoyed: samoyed,
  swedish_lapphund: swedishLapphund,
  finnish_lapphund: finnishLapphund,
  beagle: beagle,
  hamiltons_stovare: hamiltonsStovare,
  rhodesian_ridgeback: rhodesianRidgeback,
  dalmatian: dalmatian,
  hungarian_vizsla: hungarianVizsla,
  weimaraner: weimaraner,
  german_shorthaired_pointer: germanShorthairedPointer,
  irish_red_setter: irishRedSetter,
  flat_coated_retriever: flatCoatedRetriever,
  cocker_spaniel: cockerSpaniel,
  nova_scotia_retriever: novaScotiaRetriever,
  cavalier_king_charles: cavalierKingCharles,
  poodle_standard: poodleStandard,
  poodle_miniature: poodleMiniature,
  shih_tzu: shihTzu,
  chihuahua: chihuahua,
  pug: pug,
  maltese: maltese,
  havanese: havanese,
  bichon_frise: bichonFrise,
  whippet: whippet,
  greyhound: greyhound,
  afghan_hound: afghanHound,
}

export function resolveBreedProfile(slug: string): BreedProfile {
  const full = BREED_PROFILES[slug]
  if (full) return full
  const entry = getBreedEntry(slug)
  if (entry) return getFciGroupProfile(entry.fciGroup)
  return getFciGroupProfile(9)
}

// ─────────────────────────────────────────────────────────────────────────────
// TRAINING CURRICULUM — week-by-week milestones (age in weeks from birth)
// These are what the dog *should* be able to do by the end of each phase,
// plus what to actively work on during that phase.
// ─────────────────────────────────────────────────────────────────────────────

export interface TrainingPhase {
  label: string
  weeks: { from: number; to: number }
  /** What the owner should prioritize this phase */
  focus: string[]
  /** Specific exercises to do every week in this phase */
  weeklyExercises: string[]
  /** How long each training session should be */
  sessionLength: string
  /** How many sessions per day */
  sessionsPerDay: string
  /** Milestones — what the dog should be able to do by end of phase */
  milestones: string[]
}

export const TRAINING_CURRICULUM: TrainingPhase[] = [
  {
    label: 'Nytt hem (anknytningstid)',
    weeks: { from: 8, to: 10 },
    focus: [
      'Namnträning — hunden ska lära sig reagera på sitt namn',
      'Inkallning — grund för allt annat, bygg super-positiv association',
      'Koppelintroduktion — bara bära selen/halsband, inga krav',
      'Socialisering — nya miljöer, ljud, människor, ytor',
      'Valpvissling/inkallningssignal — börja koppla visselljud till belöning',
    ],
    weeklyExercises: [
      'Namnövning: säg namnet, belöna direkt när hunden tittar. 10x per session.',
      'Inkallning: gå 2 steg bakåt, säg "kom" + vifta med godiset, belöna när hunden når dig.',
      'Sitt: håll godiset över nosen, flytta bakåt — hunden sätter sig naturligt. Markera + belöna.',
      'Valplydnad 5 min: blandade enkla övningar i lekform.',
      'Socialisering: 10–15 min i ny miljö — observera lugnt, tvinga inte.',
    ],
    sessionLength: '3–5 minuter',
    sessionsPerDay: '3–4 ggr/dag',
    milestones: [
      'Reagerar på sitt namn 80% av gångerna',
      'Kommer på inkallning i säker hemmiljö',
      'Sitter på kommando med handsignal',
      'Är lugn med sele/halsband',
    ],
  },
  {
    label: 'Grundläggande lydnad',
    weeks: { from: 10, to: 16 },
    focus: [
      'Befästa inkallning i allt fler miljöer',
      'Ligg — grundläggande lugnaövning',
      'Stanna/plats — korta ögonblick av stillasittande',
      'Nej/lämna — viktigt impulskontrollsmoment',
      'Löskoppling i inhägnat område',
      'Fortsatt socialisering — hundar, barn, trafik',
    ],
    weeklyExercises: [
      'Inkallning med 2 belöningsnivåer: godis för 1–3 meter, lek+godis för längre avstånd.',
      'Ligg: från sitt — håll godiset mot golvet framåt, lär hunden sjunka ner.',
      'Plats/stanna: be om sitt, gå ett steg ifrån, kom tillbaka och belöna. Öka steg för steg.',
      'Lös-kommando: "fri" — hunden springer iväg = frihetssignal, kalla in regelbundet under leken.',
      'Koppelgång: 5 min strukturerad gång utan nackdrag, godiset hålls vid höften.',
    ],
    sessionLength: '5–8 minuter',
    sessionsPerDay: '3 ggr/dag',
    milestones: [
      'Inkallning fungerar i trädgård med distraktioner',
      'Ligg på kommando med handsignal',
      'Sitter still 5 sekunder medan du tar 3 steg',
      'Grundläggande koppelgång utan konstant nackdrag',
    ],
  },
  {
    label: 'Konsolidering & impulskontroll',
    weeks: { from: 16, to: 26 },
    focus: [
      'Befästa alla grundkommando utomhus med distraktioner',
      'Stanna på avstånd — stoppsignal',
      'Längre stillasittande (stay)',
      'Hantera frustration och upphetsning',
      'Introduktion av rasspecifika övningar',
    ],
    weeklyExercises: [
      'Proofing: öva sit/ligg/kom på nya platser, med andra hundar i närheten.',
      'Stoppsignal/ett pip: ena pipet = sitt direkt, var du än är. Börja på 3 meter.',
      'Impulskontroll: mat på golvet — "lämna" — belöna med annat godis.',
      'Rasspecifik introduktion: dummy-lek (retriever), doftspår (pointer), löpträning (vinthund).',
      'Valpkurs eller träningsgrupp: socialt och mentalt stimulerande.',
    ],
    sessionLength: '8–12 minuter',
    sessionsPerDay: '2 ggr/dag',
    milestones: [
      'Inkallning fungerar i park med lösa hundar i närheten',
      'Stoppsignal sitter på 10 meters avstånd',
      'Stay — 30 sekunder medan du försvinner ur sikten',
      'Första kontakt med rasspecifika uppgifter',
    ],
  },
  {
    label: 'Ungdomsperiod (adolescent regression)',
    weeks: { from: 26, to: 52 },
    focus: [
      'Kortikal pruning omformar nervsystemet — tidigare inlärda beteenden kan verka "försvinna". Det är neurobiologi, inte attityd.',
      'Andra frykperiod kan inträffa här — stötta hunden vid plötsliga rädslor istället för att tvinga.',
      'Konsolidera befintliga beteenden, höj inte kriterier under regressionsfasen.',
      'Korta, lyckade pass med generös förstärkning — minska luringen, öka markörarbetet.',
    ],
    weeklyExercises: [
      'Upprepa alla grundövningar men med ökad distans och distraktion.',
      'Distansarbete: ut till dummy/vilt på 20–30 meter på kommando.',
      'Fokusövning: 30 sek ögonkontakt med distraktion runtomkring.',
      'Rasspecifik träning 2–3 ggr/vecka i riktig miljö.',
    ],
    sessionLength: '10–20 minuter',
    sessionsPerDay: '2 ggr/dag',
    milestones: [
      'Alla grundkommandon sitter utomhus med distraktioner',
      'Redo för nybörjarklass i lydnad eller jaktprov',
    ],
  },
  {
    label: 'Vuxen hund',
    weeks: { from: 52, to: 9999 },
    focus: [
      'Underhåll och förfining av befintliga färdigheter',
      'Fördjupning inom ras/sport',
      'Mentalt stimulerande utmaningar',
    ],
    weeklyExercises: [
      'Veckovis repetition av grundkommandon.',
      'Rasspecifik träning: jaktprov, tävling, spår, rally.',
      'Nosework/doftsök som mental stimulans.',
    ],
    sessionLength: '15–30 minuter',
    sessionsPerDay: '1–2 ggr/dag',
    milestones: [],
  },
]

export function getPhaseForWeek(weekAge: number): TrainingPhase {
  return (
    TRAINING_CURRICULUM.find(
      (p) => weekAge >= p.weeks.from && weekAge < p.weeks.to
    ) ?? TRAINING_CURRICULUM[TRAINING_CURRICULUM.length - 1]
  )
}

/** Format the current training phase as a text block for the prompt */
export function formatCurrentPhase(weekAge: number): string {
  const phase = getPhaseForWeek(weekAge)
  const focus = phase.focus.map((f) => `• ${f}`).join('\n')
  const exercises = phase.weeklyExercises.map((e) => `• ${e}`).join('\n')
  const milestones = phase.milestones.length
    ? phase.milestones.map((m) => `• ${m}`).join('\n')
    : '(inga definierade för denna fas)'

  return `
=== TRÄNINGSFAS: ${phase.label} (vecka ${phase.weeks.from}–${phase.weeks.to === 9999 ? '∞' : phase.weeks.to}) ===
Passlängd: ${phase.sessionLength} | Antal pass/dag: ${phase.sessionsPerDay}

Vad du ska prioritera just nu:
${focus}

Konkreta övningar för veckan:
${exercises}

Milstolpar (mål för fasen):
${milestones}
`.trim()
}

/** Compact phase summary for chat — omits weeklyExercises (the model doesn't need a curriculum to answer a question) */
export function formatCurrentPhaseShort(weekAge: number): string {
  const phase = getPhaseForWeek(weekAge)
  const focus = phase.focus.slice(0, 3).map((f) => `• ${f}`).join('\n')
  return `Fas: ${phase.label} (v ${phase.weeks.from}–${phase.weeks.to === 9999 ? '∞' : phase.weeks.to}) | Passlängd: ${phase.sessionLength}
Prioritet just nu:
${focus}`.trim()
}

/** Shorter breed summary for chat RAG — omits breed skills and activity guidelines to save tokens */
export function formatBreedProfileShort(breed: string): string {
  const p = resolveBreedProfile(breed)
  const topTraits = p.temperament.slice(0, 3).map((t) => `• ${t}`).join('\n')
  const topCautions = p.trainingCautions.slice(0, 2).map((c) => `• ${c}`).join('\n')
  return `Ras: ${p.name} | Känslighet: ${p.sensitivity} | Ändamål: ${p.purpose}
Temperament: ${topTraits}
Varningar: ${topCautions}`.trim()
}

/** Render the breed profile as a compact text block for use in prompts */
export function formatBreedProfile(breed: string): string {
  const p = resolveBreedProfile(breed)
  const skills = p.breedSkills
    .map((s) => `• ${s.name}: ${s.description}`)
    .join('\n')
  const cautions = p.trainingCautions.map((c) => `• ${c}`).join('\n')
  const temperament = p.temperament.map((t) => `• ${t}`).join('\n')

  return `
=== RASPROFIL: ${p.name} ===
Ändamål: ${p.purpose}

Temperament & träningskänslighet (${p.sensitivity}):
${temperament}

Rasspecifika färdigheter (vad rasen förväntas kunna):
${skills}

Viktiga varningar:
${cautions}

Aktivitet per fas:
• Valp (8–16v): ${p.activityGuidelines.puppy}
• Junior (4–9mån): ${p.activityGuidelines.junior}
• Ungdjur (9–18mån): ${p.activityGuidelines.adolescent}
`.trim()
}
