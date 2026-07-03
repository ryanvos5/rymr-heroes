# iOS-app bouwen (Tiny Power Smashers)

De web-game is met **Capacitor** klaargemaakt om als iOS-app te draaien. Stap 1
(Capacitor) en stap 2 (native-klaar maken) zijn gedaan op Windows. De rest
gebeurt op een **Mac met Xcode** (of via een cloud-build zoals Codemagic).

## Wat al gedaan is
- `package.json` + Capacitor geïnstalleerd (`@capacitor/core`, `/cli`, `/ios`, `/status-bar`, `/splash-screen`).
- `capacitor.config.json` — appId `com.ryanvos.tinypowersmashers`, fullscreen, geen scroll/bounce.
- `npm run build` verzamelt de web-assets in `www/` (Capacitor's `webDir`).
- Supabase wordt **lokaal** geladen (`vendor/supabase.min.js`) i.p.v. via een CDN → app is zelfstandig.
- Native-detectie in `main.js`: verbergt de web-"Update"-knop, verbergt de statusbalk en de splash.
- Safe-area (notch) en landscape-hint zaten al in de CSS.

## Elke keer dat je de game-code aanpast
```bash
npm run build      # kopieert de nieuwste web-assets naar www/
npx cap sync ios   # (op de Mac) zet www/ in het Xcode-project
```

## Eenmalig op de Mac
1. Zet deze repo op de Mac (git clone) en installeer tools:
   ```bash
   npm install
   sudo gem install cocoapods      # of: brew install cocoapods
   ```
2. Genereer het iOS-project:
   ```bash
   npm run add:ios                 # = npm run build && npx cap add ios
   npx cap open ios                # opent Xcode
   ```
3. In **Xcode**:
   - Selecteer target **App** → tab **Signing & Capabilities** → kies je **Team**
     (vereist een Apple Developer-account, €99/jaar).
   - **Info.plist**: zet **Supported interface orientations** op alleen
     *Landscape Left* + *Landscape Right* (de game is liggend).
   - Voeg **app-icoon** en **splash/launch screen** toe (Assets.xcassets).
   - Test in de simulator en op een echt toestel.
4. **Archiveren & uploaden**: Product → Archive → Distribute App → App Store Connect.

## In App Store Connect
- App aanmaken, storepagina invullen (naam, beschrijving, screenshots, leeftijd).
- **Privacybeleid-URL** toevoegen (verplicht: je slaat accounts/e-mail op via Supabase).
- **Account-verwijdering** in de app moet mogelijk zijn (Apple-eis bij accounts).
- Indienen voor review (meestal 1–3 dagen).

## Belangrijk
- Verkoop je ooit munten voor echt geld? → verplicht via Apple In-App Purchase.
- `www/` en `node_modules/` staan in `.gitignore` (build-artefacten). De
  gegenereerde `ios/`-map commit je wél (dat is je Xcode-project).
