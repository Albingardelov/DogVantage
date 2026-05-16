# DogVantage — Implementation Roadmap

Körordning för alla GitHub-issues. Faserna är beroende-ordnade — bryt inte de
kritiska kedjorna (se längst ner).

**Strategi:** Webbappen/PWA är ett provisorium tills store-licenser är betalda.
Den riktiga produkten är React Native-appen på App Store + Play Store.
Prenumeration sköts på webben (Stripe, "Netflix-modellen") — 0 % cut till
Apple/Google.

**Milstolpe:** Efter Fas 1 kan PWA:n launchas i Sverige med alla raser.

---

## Fas 0 — Städa inaktuella tickets (ingen kod)

| Tickets | Åtgärd |
|---------|--------|
| #41–#46 (Multi-dog #1–6) | Verifiera mot kod — multi-dog är redan implementerat. Stäng. |
| #47 (RAG raskällor) | Ersatt av BREEDS-1/2/3. Stäng som superseded. |
| #57–#59 (UI #1–3) | Lågvärde — webbappen är temporär. Stäng eller märk wontfix (webb). |

---

## Fas 1 — Breeds (existentiellt — gör appen launchbar)

| # | Ticket | Issue |
|---|--------|-------|
| 1 | BREEDS-1 — Breed registry (~356 FCI-raser valbara) | #77 |
| 2 | BREEDS-2 — FCI-grupp → övningsmappning | #78 |
| 3 | BREEDS-3 — FCI-ingest-pipeline, topp 50 profiler | #79 |

→ **Sverige-launch möjlig efter detta.**

## Fas 2 — Backend-städning

| # | Ticket | Issue | Beroende |
|---|--------|-------|----------|
| 4 | REFACTOR-1 — API auth-helpers + types-split | #67 | BREEDS-1 |
| 5 | REFACTOR-2 — Säkerhet & robusthet | #68 | REFACTOR-1 |
| 6 | REFACTOR-3 — Skalbarhet | #69 | REFACTOR-1, -2 |
| 7 | REFACTOR-4 — Decompose week-plan.ts | #70 | Lägst prio — kan skjutas |

## Fas 3 — Webb-billing (Stripe)

| # | Ticket | Issue |
|---|--------|-------|
| 8 | PAY-1 — Stripe setup + DB-schema | #60 |
| 9 | PAY-2 — Subscription-state lib | #61 |
| 10 | PAY-3 — Trial auto-start (14 dagar) | #62 |
| 11 | PAY-4 — Stripe Checkout-flow | #63 |
| 12 | PAY-5 — Webhook-handler | #64 |
| 13 | PAY-6 — Paywall + trial-banner | #65 |
| 14 | PAY-7 — Customer Portal | #66 |

Kör strikt i nummerordning — varje bygger på föregående.

## Fas 4 — Retention & marknad

| # | Ticket | Issue | Not |
|---|--------|-------|-----|
| 15 | MARKET-1 — streak, progress-bar, årspris, landing-copy | #76 | Årspris-delen kräver PAY-1/4. Streak + progress-bar + landing-copy kan dras fram tidigare. |

## Fas 5 — RN-grund

| # | Ticket | Issue |
|---|--------|-------|
| 16 | RN-0 — Monorepo-setup (pnpm + Turborepo + Expo) | #31 |
| 17 | RN-1 — Auth + RN-8 — Navigation (parallellt) | #32, #39 |

## Fas 6 — RN-skalbarhet (innan UI byggs)

| # | Ticket | Issue |
|---|--------|-------|
| 18 | RN-SCALE-1 — State management (TanStack Query + Zustand) | #72 |
| 19 | RN-SCALE-2 — Offline-strategi (SQLite mutation queue) | #73 |

## Fas 7 — i18n

| # | Ticket | Issue | Not |
|---|--------|-------|-----|
| 20 | GLOBAL-1 — i18n-infrastruktur | (ej skapad) | Måste landa före RN-skärmar byggs. |

## Fas 8 — RN-skärmar + butik

| # | Ticket | Issue |
|---|--------|-------|
| 21 | RN-2 — Onboarding | #33 |
| 22 | RN-PAY-1 — Subscription-gate (innan paywall'd skärmar) | #71 |
| 23 | RN-3 — Dashboard | #34 |
| 24 | RN-4 — Loggning | #35 |
| 25 | RN-5 — Kalender | #36 |
| 26 | RN-6 — AI-chat | #37 |
| 27 | RN-7 — Profil | #38 |
| 28 | RN-SCALE-3 — Push notifications | #74 |
| 29 | STORE-1 — App Store + Play Store compliance | #75 |
| 30 | RN-9 — Play Store build & submit | #40 |

→ **Norden + Tyskland fast-follow** — kräver mest översättning, ingen ny arkitektur.

---

## Kritiska beroendekedjor — bryt inte dessa

- **BREEDS-1 → REFACTOR-1** — `Breed`-typen blir registry-baserad i BREEDS-1.
- **REFACTOR-1 → PAY** — billing-routes ska använda `withAuthAndDog` från start.
- **PAY → RN-PAY-1** — mobilen läser billing-state som PAY bygger.
- **GLOBAL-1 → RN-2** — RN-skärmar ska vara flerspråkiga från start.

## Parallellisering

Mestadels sekventiellt (solo-utvecklare). Enda säkra parallell: RN-1 + RN-8.

## Geografisk expansion

1. **Sverige** — efter Fas 1.
2. **Norden** — Norge/Danmark/Finland: samma FCI-struktur, närliggande språk.
3. **Tyskland + engelsktalande** — kräver GLOBAL-1 + FCI-standarder på fler språk.
4. **Bredd** — fler raser mot 356, AKC/TKC-lager för US/UK.
