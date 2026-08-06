# Google Play Data safety

Fill **Play Console → App content → Data safety** from this sheet.

## Data collected

| Data type | Purpose | Required | Shared |
|-----------|---------|----------|--------|
| Email address | Account management | Yes | No (processor: Supabase) |
| Personal info (dog name, breed, birthdate, prefs) | App functionality | Yes | Optional to AI providers when generating plans/chat |
| App activity (training sessions, logs, chat) | App functionality | Yes | Optional AI for chat/custom exercises |
| Other in-app messages (AI chat) | App functionality | Optional (Pro) | Yes — Groq / Google AI for responses |

## Data shared with third parties
- **AI assistant queries** → Groq / Google AI — optional features (chat, custom exercises, plan generation)
- **Payment** → Stripe processes payments on the **website only**; app does not collect payment card data

## Security practices
- [x] Data encrypted in transit (HTTPS / TLS)
- [x] Users can request deletion (in-app **Radera konto** → `DELETE /api/account`)
- [x] Committed to follow Play Families Policy: N/A (not a family-directed app)
- Data stored primarily in Supabase EU (Frankfurt)

## Sensitive permissions
None beyond notifications if/when enabled. No camera, microphone, location, contacts in this release.
