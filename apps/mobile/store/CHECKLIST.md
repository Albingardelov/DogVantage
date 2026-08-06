# STORE-1 compliance checklist

## Done in repo (rn-0)
- [x] Privacy policy updated (`apps/web/.../privacy`) — vendors, retention, GDPR, Stripe, mobile storage
- [x] Apple privacy labels reference (`store/apple-privacy-labels.md`)
- [x] Google Data safety reference (`store/google-data-safety.md`)
- [x] Listing copy SV + EN
- [x] Android targetSdk **35** via `expo-build-properties`
- [x] iOS/Android bundle ids `se.dogvantage.app`
- [x] `eas.json` scaffold (replace EAS/ASC placeholders before submit)
- [x] Auth screens link to privacy policy
- [x] In-app account deletion (RN-7) + Netflix billing gate (RN-PAY-1)

## Manual / console (before submit)
- [ ] Create EAS project → paste `extra.eas.projectId` in `app.json`
- [ ] Fill App Store Connect App Privacy from `apple-privacy-labels.md`
- [ ] Fill Play Data safety from `google-data-safety.md`
- [ ] Capture screenshots (see listing docs)
- [ ] TestFlight + Play internal testing
- [ ] Apple reviewer notes: “Subscriptions on website only; no IAP. Account deletion in Profile.”

## Apple review self-check
- [ ] No price strings or “Subscribe/Buy/Pay” CTAs in the app
- [ ] No ATT / tracking SDKs
- [ ] No Sign in with Apple required (email/password only)
- [ ] Guideline 5.1.1(v) risk: account required — mitigate with reviewer demo account (see `demo-reviewer.md`) if rejected

## IAP / Netflix
- [x] Paywall opens website in in-app browser
- [x] Text is account-management oriented, not purchase marketing
