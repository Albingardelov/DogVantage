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
        <p className={styles.updated}>Senast uppdaterad: maj 2026</p>

        <Section title="Vad vi lagrar">
          <p>Vi lagrar den information som behövs för att appen ska fungera:</p>
          <ul>
            <li>Din e-postadress (via Supabase Auth)</li>
            <li>Hundprofil: namn, födelsedag, ras och träningsvecka</li>
            <li>Inställningar: träningsmiljö, belöningspreferens, husdjur i hemmet</li>
            <li>Träningsloggar och dagliga träningsmetrics</li>
            <li>Egna övningar som du skapar med AI</li>
            <li>Cachade träningsscheman kopplade till ditt konto</li>
          </ul>
        </Section>

        <Section title="Hur vi använder datan">
          <p>Datan används uteslutande för att:</p>
          <ul>
            <li>Generera personliga träningsscheman anpassade till din hund</li>
            <li>Spara din träningsprogress och loggar</li>
            <li>Ge relevant träningsrådgivning via chattfunktionen</li>
          </ul>
          <p>Vi säljer inte din data och använder den inte i marknadsföringssyfte.</p>
        </Section>

        <Section title="Tredjepartstjänster">
          <p>Vi anlitar följande externa tjänster som behandlar data å våra vägnar:</p>
          <ul>
            <li><strong>Supabase</strong> — lagring av data och autentisering (EU-region)</li>
            <li><strong>Google Gemini AI</strong> — generering av träningsscheman och guider. Din hundprofil och träningskontext skickas till Google för att skapa personliga svar.</li>
          </ul>
          <p>Båda leverantörerna täcks av dataskyddsavtal (DPA) i enlighet med GDPR.</p>
        </Section>

        <Section title="Dina rättigheter">
          <p>Enligt GDPR har du rätt att:</p>
          <ul>
            <li><strong>Få tillgång</strong> till dina personuppgifter — kontakta oss</li>
            <li><strong>Rätta</strong> felaktiga uppgifter — gör det direkt i appen</li>
            <li><strong>Radera</strong> alla dina uppgifter — använd "Radera mitt konto" i profilinställningarna</li>
            <li><strong>Invända</strong> mot behandling — kontakta oss</li>
          </ul>
        </Section>

        <Section title="Kontakt">
          <p>Frågor om dataskydd skickas till: <strong>albinjgardelov@gmail.com</strong></p>
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
