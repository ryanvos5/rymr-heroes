# Rymr Heroes bijwerken

Vaste routine voor elke update na de eerste release.
Bundle-id: `nl.thebrandingfive.rymrheroes` · App-ID: `6791213109`

---

## Eerst: heb je wel een app-update nodig?

Niet elke wijziging vereist Apple. Er zijn drie soorten:

| Wat je verandert | Hoe het live komt | Apple nodig? |
|---|---|---|
| **Spelerdata** — voortgang, characters, levels vrijgeven (Supabase) | direct, zodra de speler de app opnieuw opent | **nee** |
| **Website** — privacy, support, ideeënformulier | automatisch via Vercel zodra je pusht | **nee** |
| **De game zelf** — code, helden, maps, balans, bugfixes | nieuwe build + review | **ja** |

Alleen de derde rij doorloopt de stappen hieronder.

---

## De update-routine

### 1. Code aanpassen en testen
Gewoon lokaal draaien en uitproberen. Test wat je hebt aangeraakt.

### 2. Bouwen, syncen en nummer ophogen
```bash
npm run release
```
Dit doet in één keer: web-assets naar `www/`, `www/` naar het Xcode-project, en het
**buildnummer +1**.

Begin je aan een **nieuw versienummer** (bv. van 1.0 naar 1.1), doe dan in plaats daarvan:
```bash
npm run build && npx cap sync ios && node scripts/bump.mjs 1.1
```

**De regels van Apple:**
- Het **buildnummer** moet bij élke upload hoger zijn dan alles wat je ooit uploadde. Nooit hergebruiken.
- Het **versienummer** moet hoger zijn dan wat live staat, zodra je een nieuwe versie indient.
- Bugfix voor een versie die nog in review zit? Dan mag het versienummer gelijk blijven, alleen het buildnummer omhoog.

### 3. Committen en pushen
Push via **GitHub Desktop**. Dit zet meteen de nieuwe website live via Vercel.

### 4. Archiveren en uploaden
1. **Xcode helemaal afsluiten (⌘Q) en opnieuw openen.** Zonder dit gebruikt Xcode het
   oude, gecachete buildnummer — dat is tijdens de eerste release meerdere keren misgegaan.
2. Controleer linksboven of versie en build kloppen.
3. **Product → Archive** → **Distribute App** → **App Store Connect** → **Upload**.
4. Wacht op de mail "has completed processing" (meestal 5-20 minuten).

### 5. App Store Connect
1. Ga naar je app → linksboven bij **iOS App** op **+** klikken → nieuwe versie aanmaken (bv. 1.1).
2. **What's New in This Version** invullen — verplicht bij updates. Kort en concreet:
   > • Nieuwe held: Buccaneer met Anchor Slam
   > • Wereld 3: Piratenschip met 5 levels
   > • Online matches vallen niet meer weg bij een korte haperende verbinding
3. Bij **Build** de nieuwe build selecteren.
4. Screenshots alleen vervangen als het beeld écht veranderd is.
5. **Add for Review → Submit for Review**.

---

## Goed om te weten

- **Reviews van updates gaan sneller** dan de eerste keer — meestal binnen 24-48 uur, vaak korter.
- **De guideline 2.1-verificatie** (schermopname + vragenlijst) was eenmalig voor de eerste indiening. Die komt normaal niet terug.
- **Automatisch vrijgeven** staat aan: zodra Apple goedkeurt gaat de update live. Wil je zelf het moment kiezen, zet dat dan om naar *Manually release*.
- **Gefaseerd vrijgeven** (Phased Release) is een aanrader bij grotere updates: de update rolt dan over 7 dagen uit naar steeds meer gebruikers, zodat je een probleem kunt stoppen voor iedereen het heeft.
- **Spoedfix nodig?** Bij een ernstige bug kun je in App Store Connect een *Expedited Review* aanvragen. Spaarzaam gebruiken.

## Wat je NIET moet doen

- **Geen serverbestuurde wijzigingen inbouwen** waarmee je gedrag van de app kunt veranderen zonder nieuwe build. Dat is precies waar Apple bij de 2.1-verificatie naar vroeg, en waarom de cloud-map-rotatie eruit is gehaald (richtlijn 2.5.2).
- **Geen buildnummer hergebruiken** — de upload wordt dan geweigerd.
- **Chat niet zomaar aanzetten** (`CHAT_ENABLED` in `js/config.js`). Vrije-tekst chat vereist blokkeren, rapporteren en moderatie (richtlijn 1.2).

---

Zie ook: `APPSTORE.md` (checklist van de eerste release) en `IOS-BUILD.md`
(eenmalige opzet — let op: dat bestand noemt nog CocoaPods, terwijl dit project
met **SPM** werkt; `npx cap sync ios` volstaat, pods installeren is niet nodig).
