# TODO – Albin

Branchen `fix/review-findings` är resultatet av en genomgång av repot (säkerhet,
betalning, AI-kostnader, infrastruktur). Den här filen listar vad som är gjort,
vad du behöver göra för att den ska fungera i produktion, och vad som återstår.
Ta bort filen när listan är avbockad.

## Vad branchen innehåller

| Commit | Ändring |
|---|---|
| `chore(deps)` | Next 16.2.4 → 16.4.3 (kritisk sårbarhet: proxy-bypass + RSC DoS), zod ^4.6.7, serwist borttaget (användes inte). `npm audit --omit=dev` = 0. |
| `fix(billing)` | Stripe-webhooken hämtar alltid prenumerationen färskt från Stripe (tål dubbla/omkastade events), läser `current_period_end`/fakturans prenumeration från rätt fält i API-versionen `2026-04-22.dahlia`, en gammal avslutad prenumeration kan inte skriva över en aktiv. Checkout blockerar dubbla prenumerationer (409). Kontoradering raderar Stripe-kunden först och returnerar fel i stället för `deleted: true` om något steg misslyckas. |
| `fix(api)` | `vercel.json` pekade på `src/app/api/training/route.ts` som inte finns. Ersatt med `export const maxDuration` i routerna. |
| `fix(db)` | Migration `030_lock_down_shared_tables.sql`: RLS på `breed_chunks`, `takedown_requests`, `community_submissions`, `api_rate_limits`; `training_cache`-policyn släppte igenom delade cacherader (`dog_id is null`) för alla med anon-nyckeln. |
| `fix(ai)` | Säkerhetsorden matchar hela ord. `'ont'` träffade "ögonkontakt"/"kontroll" och `'sår'` "sårbar" → vanliga träningsfrågor fick veterinärsvar. Engelska nyckelord tillagda. |
| `chore(lint)` | ESLint (`eslint-config-next`) + `npm run lint`. 0 fel, 48 varningar. |
| `chore(docs)` | De 61 tredjeparts-PDF:erna (~105 MB) ut ur git → privat Supabase Storage-bucket. Se `docs/SOURCE-DOCUMENTS.md`. |

## Måste göras innan/när branchen mergas

- [x] **Kör migration 030** mot Supabase (körd via SQL-editorn 2026-10-27, ej registrerad i migrationshistoriken). Kontrollera efteråt:
      `select relname, relrowsecurity from pg_class where relnamespace = 'public'::regnamespace order by 1;`
      – alla tabeller ska ha `relrowsecurity = true`.
- [x] **Ladda upp PDF:erna** en gång (du har dem lokalt eller i historiken t.o.m. `7b01a25`):
      `npm run docs:push` med `SUPABASE_SERVICE_ROLE_KEY` i `.env.local`.
      Testa sedan `npm run docs:pull` i en ren klon. (Uppladdat 2026-10-27: 59 nya, 2 fanns redan. `docs:pull` i ren klon: 61 filer, checksummor OK.)
- [ ] **Stripe-webhooken** – lägg till dessa events på endpointen i Stripe-dashboarden:
      `invoice.paid`, `customer.subscription.paused`, `customer.subscription.resumed`
      (utöver de som redan finns). Testa i test mode med `stripe trigger` eller
      genom att uppgradera/säga upp ett testkonto. Ingen av betalfixarna är
      testad mot riktiga Stripe – bara med enhetstester.
- [ ] **Kontrollera `STRIPE_PRICE_*`** i Vercel. Okända pris-id:n loggas nu som fel
      (`unknown price id`) i stället för att tyst ge gratisnivå – titta i loggarna efter deploy.
- [ ] **Testa kontoradering** med ett testkonto som har en prenumeration: kunden ska
      försvinna i Stripe och användaren i Supabase.
- [ ] **Två PDF:er utan källa**: `docs/homologation titre travail_0.pdf` och
      `docs/training-guides/dog-training-101.pdf` används inte av något skript.
      Fyll i `sourceUrl` i `docs/source-documents.json` eller ta bort dem.

## Beslut som behöver tas

- [ ] **`react-native`-branchen.** Mobilappen (Expo, `apps/mobile`) har inte rörts sedan
      1 september och ligger 223 commits efter main; main har 245 commits som inte finns
      där. En provmerge gav ~200 konfliktfiler, främst för att logik flyttats till
      `packages/core` medan main ändrat samma filer (~7 500 rader). Alternativ:
      1. Merga main → `react-native` och lös konflikterna (du vet vilken version som gäller).
      2. Gör om monorepo-flytten ovanpå dagens main och flytta över `apps/mobile`.
      Den här branchen bör mergas först så att fixarna följer med.
- [ ] **Git-historiken.** PDF:erna ligger kvar i historiken (`.git` ≈ 96 MB). Rensa med
      `git filter-repo` + force-push om repot ska bli publikt – se `docs/SOURCE-DOCUMENTS.md`.
- [ ] **Gratis provperiod.** `ensureTrial` ger varje nytt konto 14 dagar Pro, utan
      begränsning per e-post/enhet. Medvetet?

## Kvar från granskningen (inte fixat här)

### Kostnad och betalvägg
- [ ] **Betalväggen gäller bara chatt och egna övningar.** `api/training/week`, quiz,
      curriculum och micro-lesson anropar aldrig `hasFeature`, så gratis-/utgångna konton
      får AI-genererat innehåll. Lägg in `view_week_plan` / `learn_library`-kontroller.
- [ ] **`week`-parametern är obegränsad** (`week-orchestrator.ts`): varje nytt värde
      (`week=999999`, negativa) är en cache-miss och ett nytt Groq-anrop. Validera intervallet.
- [ ] **Quiz-cachen är global och styrs av klienten** (`learning/quiz.ts`): `contextKey`,
      `title` och `body` kommer från query-parametrar; den första som anropar en nyckel
      bestämmer quizet för alla. Bygg kontexten på servern från lektions-id + ras.
- [ ] **Ingen längdgräns på chattfrågor** (`api/chat/route.ts`) och inga zod-scheman på
      `api/logs` (notes, exercises, week_number). Lägg till `.max()`.
- [ ] **Rate limitern släpper igenom allt om RPC:n fallerar** (`rate-limit.ts`). Fail closed
      för LLM-routes, och en daglig AI-budget per användare för alla genererande endpoints.
- [ ] **Generation lock** (`generation-lock.ts`): TTL 30 s men generering kan ta ~40 s,
      och release saknar ägar-token. Höj TTL och lägg till token.
- [ ] **Chatt-cachen använder en 32-bitars hash** (`training-cache.ts` `shortHash`) – byt
      till sha256 så kollisioner inte serverar fel svar.
- [ ] **Groq `maxRetries: 1`** + 25 s timeout kan överskrida 60 s i chatten; Gemini-anropet
      i `training/custom` saknar timeout.

### Korrekthet
- [ ] **"Idag" i UTC vs lokal tid.** Servern använder `toISOString().slice(0, 10)` medan
      klienten använder `getDay()` – mellan 00 och 02 svensk tid visas fel dags pass och
      loggar hamnar på fel datum. En gemensam datum-hjälpare + klientens datum/tidszon.
- [ ] **Säkerhetsorden i veckoplanen** returnerar 422 utan plan, trots att texten säger
      "fortsätt träna i appen". Servera en reducerad plan tillsammans med hänvisningen.

### Infrastruktur
- [ ] **CI saknas.** Minsta workflow: `npm ci`, `npx tsc --noEmit`, `npm run lint`,
      `npm test`, `next build` (dummy-env), `npm audit --omit=dev --audit-level=high`.
- [ ] **Databasschemat finns på tre ställen** (`docs/supabase-schema.sql`,
      `docs/migration-*.sql`, `supabase/migrations/`). Gör migrationerna till enda källan:
      `supabase init`, `supabase db dump --schema public` från prod → baslinje-migration,
      `supabase migration repair` för att markera den som körd, radera `docs/*.sql`.
- [ ] **`src/types/database.ts` är inaktuell** – saknar `subscriptions`, `api_rate_limits`,
      `quiz_cards`, `curriculum_progress`, `generation_locks`, därav alla `as unknown as`.
      Lägg till `"db:types": "supabase gen types typescript --project-id <id> > src/types/database.ts"`.
- [ ] **Testtäckning ~30 %**; ingen API-route utom `account` har tester. Börja med
      `week-orchestrator.ts` och checkout.
- [ ] **48 ESLint-varningar** (React Compiler-regler, främst `set-state-in-effect`). Rätta
      och sätt tillbaka reglerna till `error` i `eslint.config.mjs`.
- [ ] **Dev-sårbarheter** i vite/vitest (mest Windows-specifika). Uppgradera vitest när
      npm-krocken med `@types/node` är löst.

### Övrigt
- [ ] **i18n används i 11 av 62 komponenter**; resten är hårdkodad svenska.
- [ ] **Integritetspolicyn** bör nämna Groq och Google (Gemini) som personuppgiftsbiträden –
      de får chattmeddelanden och anteckningar.
- [ ] **Telemetri** skickas med `fetch` utan `after()`/`waitUntil` och tappas troligen på Vercel.
- [ ] **README** är create-next-app-standard. `verify_breeds.js` / `verify_functions.js`
      i roten ser ut som engångsskript. `public/` innehåller bara oanvända standard-SVG:er.
- [ ] **PWA-manifestet** har bara `favicon.ico` som ikon – lägg till 192/512 PNG eller ta
      bort manifestet om Expo-appen ersätter PWA:n.
