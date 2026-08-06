# Demo / App Review account

Apple may ask how to use the app without purchasing. Provide a **reviewer account** in App Review notes (do not put passwords in the public listing).

## Suggested App Review notes (paste in ASC)

```
DogVantage requires an account (email/password). Subscriptions are purchased only on the website (https://dogvantage.se) — the app does not include In-App Purchases or prices.

Demo login:
Email: review@dogvantage.se
Password: <SET_BEFORE_SUBMIT>

This account has an active Pro trial/subscription so all tabs work. Account deletion is under Profile → Radera konto.
Privacy: https://dogvantage.se/privacy
```

## Ops steps before submit
1. Create `review@dogvantage.se` (or similar) in Supabase Auth
2. Complete onboarding with a sample dog
3. Ensure `subscriptions` row is active Basic or Pro for that user
4. Verify login → dashboard → calendar → chat (if Pro) → profile delete confirm dialog (do not actually delete the review account during review)
