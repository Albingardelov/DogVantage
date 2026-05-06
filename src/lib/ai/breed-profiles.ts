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
      '5 min aktiv träning per session, 2–3 ggr/dag. Fokus: namn, inkallning, stoppsignal, socialisering. Inga långa promenader — benen är känsliga.',
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
    'Svår att rentränа — konsekvens från dag ett är avgörande',
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
    'Tar träning på allvar — tål direkt feedback men mår bäst med positiv förstärkning',
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
// EXPORTED MAP
// ─────────────────────────────────────────────────────────────────────────────
export const BREED_PROFILES: Record<Breed, BreedProfile> = {
  braque_francais: braqueFrancais,
  labrador: labrador,
  italian_greyhound: italianGreyhound,
  miniature_american_shepherd: miniatureAmericanShepherd,
}

export function getBreedProfile(breed: Breed): BreedProfile {
  return BREED_PROFILES[breed]
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
    label: 'Ungdomsperiod',
    weeks: { from: 26, to: 52 },
    focus: [
      'Konsekvens viktigare än ny träning — teen-fasen testar gränser',
      'Fortsätt med kortare, roliga pass',
      'Fördjupa rasspecifika färdigheter',
      'Introduktion av tävling/prov om relevant',
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

/** Shorter breed summary for chat RAG — omits breed skills and activity guidelines to save tokens */
export function formatBreedProfileShort(breed: Breed): string {
  const p = getBreedProfile(breed)
  const topTraits = p.temperament.slice(0, 3).map((t) => `• ${t}`).join('\n')
  const topCautions = p.trainingCautions.slice(0, 2).map((c) => `• ${c}`).join('\n')
  return `Ras: ${p.name} | Känslighet: ${p.sensitivity} | Ändamål: ${p.purpose}
Temperament: ${topTraits}
Varningar: ${topCautions}`.trim()
}

/** Render the breed profile as a compact text block for use in prompts */
export function formatBreedProfile(breed: Breed): string {
  const p = getBreedProfile(breed)
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
