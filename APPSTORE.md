# App Store-checklist — Rymr Heroes

Doel: de app zonder afkeuringsrisico in de App Store krijgen. Hieronder staat wat **al in de
code/app is geregeld** en wat **jij nog in App Store Connect / dashboards moet doen**.

Bundle-id: `nl.thebrandingfive.rymrheroes` · App-naam: **Rymr Heroes** · Web/privacy: `https://rymrheroes.thebrandingfive.nl`

---

## ✅ Al geregeld in de app (code)

- **Inloggen is optioneel** — je kunt de hele game als gast spelen ("Later — speel als gast").
  Apple verbiedt verplichte registratie voor functies die geen account nodig hebben (5.1.1(i)).
- **Sign in with Apple aanwezig** — Google-login is verwijderd, dus dit is niet meer verplicht (4.8), maar we houden de Apple-knop gewoon. Knop staat
  in het onboarding/inlogscherm.
- **Account verwijderen dat écht verwijdert** (5.1.1(v)) — Instellingen → *Account verwijderen*.
  Roept de Supabase-functie `delete_account()` aan die profiel, vrienden, berichten én het
  auth-account wist, en toont een bevestiging. (Functie is aangemaakt in het Supabase-project.)
- **Privacybeleid in de app** — Instellingen → *Privacy Policy* en een link op het inlogscherm.
  Laadt de meegeleverde `privacy.html` (werkt ook offline).
- **Export-compliance** — `ITSAppUsesNonExemptEncryption = false` in Info.plist, zodat je bij elke
  upload niet de encryptie-vraag krijgt (de app gebruikt alleen standaard HTTPS).
- **Geen placeholder-content** — de "Coming Soon"-tegel is verborgen in de gepubliceerde app (2.1).
- **Geen tracking / geen advertenties** — geen analytics- of ad-SDK's, geen camera/microfoon/locatie.
  Er is dus **geen** App Tracking Transparency-prompt nodig.
- **Alleen landscape** — Info.plist staat op Landscape Left/Right.

---

## ❗ Nog te doen — buiten de code

### 1. Auth-providers instellen (Supabase-dashboard → Authentication → Providers)
Zonder dit geeft de Apple-knop een foutpagina. (Google-login is verwijderd.)
- [ ] **Apple** inschakelen (Services ID, Team ID, Key ID + .p8-sleutel uit je Apple Developer-account).
- [ ] **Redirect-URL's** toevoegen in Supabase → Authentication → URL Configuration → Redirect URLs:
      - Web: `https://rymrheroes.thebrandingfive.nl`
      - iOS-app (deep-link, al in de app ingebouwd): `nl.thebrandingfive.rymrheroes://login-callback`
- E-mail/wachtwoord werkt nu al zonder extra config.

### 2. App Store Connect — app aanmaken & metadata
- [ ] App aanmaken met bundle-id `nl.thebrandingfive.rymrheroes`, categorie **Games**.
- [ ] **Privacybeleid-URL** invullen (verplicht). Gebruik je Vercel-URL, bv. `https://<jouw-domein>/privacy.html`.
- [ ] **Support-URL** en (optioneel) marketing-URL.
- [ ] Naam, subtitel, beschrijving, keywords, **screenshots in landscape** (verplichte maten voor
      iPhone 6.7"/6.9" + iPad indien je iPad support).
- [ ] **Leeftijdsclassificatie** invullen: cartoon-/fantasy-geweld (vechtgame) → waarschijnlijk 9+/12+.
- [ ] Copyright + contactgegevens.

### 3. App Privacy ("nutrition label") in App Store Connect
Declareer eerlijk wat je verwerkt (komt overeen met `privacy.html`):
- [ ] **E-mailadres** — gekoppeld aan identiteit, doel: app-functionaliteit (account). Niet voor tracking.
- [ ] **Gebruikersnaam/nickname** + **spelvoortgang/stats** — gekoppeld aan identiteit, app-functionaliteit.
- [ ] **Gebruikers-content** (chatberichten met vrienden) — app-functionaliteit.
- [ ] "Wordt data gebruikt om je te volgen?" → **Nee**.

### 4. Signing & assets (in Xcode)
- [ ] Target **App** → Signing & Capabilities → jouw **Team** kiezen (Apple Developer, €99/jaar),
      automatic signing.
- [ ] **App-icoon** toevoegen (Assets.xcassets) — bron: `RYMRAPPICONnew.png`. Alle vereiste maten.
- [ ] **Launch screen** controleren.
- [ ] **Sign in with Apple** capability toevoegen (als je native Apple-login doet).

### 5. Testen & indienen
- [ ] Op een **echt toestel** testen (niet alleen de simulator).
- [ ] Via **TestFlight** uitproberen.
- [ ] Product → Archive → Distribute App → App Store Connect → indienen voor review (meestal 1–3 dagen).

---

## 💳 In-app aankopen (toekomst)

De shop heeft nu een **Crates**-tab (epic 150 ◆ / legendary 450 ◆ met robijnen — dit is
in-game economie, geen IAP nodig) en een **Rubies**-tab die robijnen verkoopt voor echt geld.
De Rubies-tab toont nu "In-app aankopen worden binnenkort geactiveerd" en doet nog niets tot
je de stappen hieronder afrondt. **Belangrijk:** activeer IAP vóór submissie, óf verberg de
Rubies-tab, anders kan een niet-werkende koopknop een 2.1-afkeuring geven.

Voorbereiding staat in `js/iap.js` (`IAP.buyRubies`) + de pakketten in `js/config.js` (`RUBY_PACKS`).
Wat er nodig is zodra je het aanzet:

- [ ] **Alles via Apple IAP** — munten, robijnen en "kist-wachttijd skippen" zijn digitale goederen en
      MOETEN via StoreKit (3.1.1). Geen eigen betaal-link of verwijzing naar externe betaling.
- [ ] **Producten aanmaken** in App Store Connect (munten/robijnen = *consumable*; "geen ads" = *non-consumable*).
      Zet dezelfde id's als in `js/iap.js` → `IAP.PRODUCTS`.
- [ ] **Aankoop-plugin** koppelen — aanbevolen: RevenueCat `purchases-capacitor` of
      `@capacitor-community/in-app-purchases`. Vul `_bindPlugin()` in `js/iap.js`.
- [ ] **"Herstel aankopen"-knop** toevoegen (verplicht voor non-consumables/abonnementen).
- [ ] **Loot-box-kansen tonen** — de game heeft kisten met willekeurige zeldzaamheid. Zodra kisten
      (of robijnen die de wachttijd skippen) te kópen zijn, moet je de kans per zeldzaamheid **tonen
      vóór de aankoop** (3.1.1, loot boxes). Nu kisten alleen verdiend worden, geldt dit nog niet.
- [ ] Prijzen/tiers instellen en een **belastingcontract (Paid Apps Agreement)** in ASC accepteren.

---

## Handige verwijzingen
- App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Account-verwijdering-eis: 5.1.1(v) · Login Services: 4.8 · IAP: 3.1.1
- Supabase auth-config: dashboard → Authentication → Providers
- Zie ook `IOS-BUILD.md` voor de build-stappen op deze Mac.
