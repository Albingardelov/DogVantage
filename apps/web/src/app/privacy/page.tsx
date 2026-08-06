'use client'

import { useRouter } from 'next/navigation'
import { IconCaretLeft } from '@/components/icons'
import styles from './page.module.css'

export default function PrivacyPage() {
  const router = useRouter()

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => router.back()}
          aria-label="Tillbaka"
        >
          <IconCaretLeft size="md" />
        </button>
        <span className={styles.title}>Integritetspolicy</span>
      </header>

      <div className={styles.content}>
        <p className={styles.updated}>Senast uppdaterad: augusti 2026</p>

        <Section title="Personuppgiftsansvarig">
          <p>
            DogVantage (Albin J. Gardelöv) är personuppgiftsansvarig. Kontakt för
            dataskyddsfrågor: <strong>albinjgardelov@gmail.com</strong>.
          </p>
        </Section>

        <Section title="Vad vi lagrar">
          <p>Vi lagrar den information som behövs för att tjänsten ska fungera:</p>
          <ul>
            <li>E-postadress (kontoautentisering via Supabase Auth)</li>
            <li>Hundprofil: namn, födelsedag, ras, kön/kastrering (valfritt), träningsvecka</li>
            <li>Träningsinställningar: mål, miljö, belöning, husdjur, anteckningar</li>
            <li>Träningsloggar, dagliga metrics och progress</li>
            <li>Chatthistorik och AI-frågor (när du använder chatten)</li>
            <li>Egna övningar som du skapar med AI (Pro)</li>
            <li>Cachade träningsscheman kopplade till ditt konto</li>
            <li>Prenumerationsstatus (tier, status, period — via Stripe/webhook; kortuppgifter lagras inte hos oss)</li>
            <li>I mobilappen: sessionsnyckel i säker lagring (SecureStore/AsyncStorage) och tillfällig cache av prenumerationsstatus</li>
          </ul>
        </Section>

        <Section title="Hur vi använder datan">
          <p>Rättslig grund är avtal (användning av tjänsten) och berättigat intresse för drift/säkerhet.</p>
          <ul>
            <li>Generera personliga träningsscheman anpassade till din hund</li>
            <li>Spara träningsprogress och historik</li>
            <li>Ge träningsrådgivning via AI-chatt</li>
            <li>Hantera konto, prenumeration och support</li>
          </ul>
          <p>Vi säljer inte din data och använder den inte för marknadsföring till tredje part. Tjänsten är inte riktad till barn under 13 år.</p>
        </Section>

        <Section title="Tredjepartstjänster">
          <p>Vi anlitar följande leverantörer som behandlar data å våra vägnar:</p>
          <ul>
            <li><strong>Supabase</strong> — autentisering och databas (EU, Frankfurt). DPA/GDPR.</li>
            <li><strong>Google Gemini / Google AI</strong> — generering av scheman, guider och chatt-svar. Relevant hundprofil och träningskontext skickas för att skapa svar.</li>
            <li><strong>Groq</strong> — AI-inferens för vissa chattsvar (USA). Behandlas under lämpliga överföringsmekanismer/DPA.</li>
            <li><strong>Stripe</strong> — betalningar för prenumeration på webb (PCI-DSS). Vi lagrar inte kortnummer.</li>
          </ul>
          <p>Prenumerationer köps och hanteras på webbplatsen (dogvantage.se), inte via in-app-köp i mobilappen.</p>
        </Section>

        <Section title="Lagringstid">
          <p>
            Vi lagrar dina uppgifter så länge kontot är aktivt. När du raderar kontot i appen eller på webben
            tas autentiseringskonto och tillhörande träningsdata bort (loggar, hundprofiler, chatt, egna övningar m.m.).
            Bokförings- och betalningsrelaterad information hos Stripe kan behöva sparas enligt lag.
          </p>
        </Section>

        <Section title="Dina rättigheter (GDPR)">
          <ul>
            <li><strong>Tillgång</strong> — begär utdrag via kontaktmail</li>
            <li><strong>Rättelse</strong> — uppdatera uppgifter i profilen</li>
            <li><strong>Radering</strong> — &quot;Radera konto&quot; i app/webbprofil</li>
            <li><strong>Dataportabilitet</strong> — begär export via kontaktmail</li>
            <li><strong>Invändning / begränsning</strong> — kontakta oss</li>
          </ul>
          <p>Du kan också lämna klagomål till Integritetsskyddsmyndigheten (IMY).</p>
        </Section>

        <Section title="Cookies (webb)">
          <p>
            Webbplatsen använder nödvändiga cookies för inloggning/session. Stripe kan sätta cookies i samband
            med betalningsflödet. Vi använder inte reklam- eller spårningscookies i den här versionen.
          </p>
        </Section>

        <Section title="Kontakt">
          <p>Dataskyddsfrågor: <strong>albinjgardelov@gmail.com</strong></p>
        </Section>
      </div>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  )
}
