# TOEP! v2 — volledig stappenplan

**Datum:** 8 november 2026  
**Doel:** één app voor het kaartspel Toepen: gratis met advertenties, of €3,99 eenmalig zonder advertenties.  
**Belangrijk:** de meegeleverde versie bevat géén actieve reclame, échte betalingen of gevalideerde winkeltransacties. Het premium-scherm is een demonstratie. Betalen via een gewone webknop of een zelf ingestelde `localStorage`-waarde is **niet veilig en geen vervanging voor in-app aankopen**.

## A. Wat is er gebouwd?

- Scorebord voor één scorebeheerder, spelers toevoegen, selecteren en verwijderen.
- Spelregels configureren: maximaal strafpunten, armoedeafstand, beginpunten, punten per verliesronde, handmatige of eenvoudige rondemodus.
- Zes kleurschema's: paars, blauw, groen, rood, oranje, licht.
- Armoede- en afvalmelding, herstel vorige scoreactie (undo), scores resetten.
- Spelgeschiedenis met eindscore, winnaar en datum; klassement en statistieken.
- JSON-export en -import voor back-ups; offline PWA-bestanden.
- **Nieuw v2:** 'Advertentievrij €3,99' op Home, Instellingen en een speciaal premium-scherm; voorbeeldadvertentievakken op Klassement en Statistieken; module `monetization.js` als uitbreiding voor native aankoopvalidatie.

**Spelregelsbeperking:** Automatische puntentelling ondersteunt nu alleen het kiezen van een rondewinnaar, waarna de overige actieve spelers punten krijgen. Kloppen, passen en bijzondere Toepen-regels zijn nog niet uitgewerkt. Een potje wordt handmatig afgesloten; de laagste score wint (bij gelijkspel gedeelde winst). Stel eerst je huisregels vast voor een definitieve release.

## B. Benodigdheden

1. Windows-pc of laptop, Google Chrome/Edge, **Visual Studio Code**: https://code.visualstudio.com/
2. VS Code-extensie **Live Server** (Ritwick Dey).
3. Gratis GitHub-account (optioneel, om je PWA online te zetten): https://github.com/
4. Later: **Node.js 22+**, **Android Studio** voor Android, een **Mac met Xcode** voor iOS.
5. Later: Google Play Console, Apple Developer Program, Google AdMob-account en productinstellingen voor in-app aankopen.

## C. De bestanden begrijpen

```text
toep-app/
├── index.html              # Alle schermen; premium-scherm en ad-demo's
├── style.css               # Vormgeving, thema's en premium-styling
├── app.js                  # Spelers, scores, undo, statistieken, navigatie
├── monetization.js         # Veilige demonstratie van advertentievrij-model
├── manifest.webmanifest    # Installatiegegevens PWA
├── sw.js                   # Offline cache, versie toep-v2
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
├── README.md
└── STAPPENPLAN.md
```

**Niet doen:** `monetization.js` wijzigen zodat een onbetaalde gebruiker `verifiedEntitlement=true` kan zetten. Dit is alleen een demonstratie van de vormgeving, geen echte licentiecontrole.

## D. Lokale webapp starten (nu doen)

1. Download `toep-app-v2.zip`, klik in Windows Verkenner op **Alles uitpakken**.
2. Open VS Code → **File → Open Folder** → selecteer de uitgepakte map `toep-app`.
3. Installeer via Extensions de extensie **Live Server** van Ritwick Dey.
4. Open `index.html`, klik met rechts → **Open with Live Server**.
5. In je browser opent bijvoorbeeld `http://127.0.0.1:5500/index.html`.
6. Zie je oude versies? Druk `Ctrl + Shift + R`. Blijft de PWA de oude cache gebruiken? Ga in Chrome naar F12 → Application → Service Workers → Unregister en ververs, of wis sitegegevens. Maak eerst een back-up als je al scores hebt opgeslagen.

### Eerste testpotje

1. Klik **Nieuw potje**.
2. Voeg minstens twee namen toe; selecteer de spelers.
3. Start het potje. Druk op + en − om strafpunten te corrigeren.
4. Open **Instellingen** en kies een andere kleur; de lopende spelregels veranderen niet.
5. Bereik de armoedegrens van een speler en controleer de popup.
6. Controleer **Undo**, **Reset** (na bevestiging) en **Eindig potje**.
7. Kijk bij **Geschiedenis**, **Klassement** en **Statistieken**.
8. Ga op Home of Instellingen naar **Advertentievrij · €3,99**. Je ziet de prijs en de knoppen **Ontgrendel** en **Herstel aankoop**.
9. Klik erop: er verschijnt terecht **Nog niet beschikbaar**. Er vindt geen afschrijving plaats.
10. Controleer dat Klassement en Statistieken een duidelijk gemarkeerde **voorbeeldadvertentieruimte** hebben, en dat tijdens spelen geen advertentieruimte staat.

## E. Instellingen en thema's aanpassen

1. Open Instellingen.
2. Maximale strafpunten = bijvoorbeeld 15.
3. Armoede: punten vóór afvallen = bijvoorbeeld 1. De armoedegrens is `15 - 1 = 14`.
4. Beginstand = 0, strafpunten per verloren ronde = 1.
5. Kies handmatige puntentelling of een rondewinnaar.
6. Kies een thema en druk **Instellingen opslaan**.
7. Begin een nieuw potje om de gewijzigde spelregels te gebruiken.

De standaardwaarden worden ingesteld in `app.js`, in `DEFAULTS`. De CSS-kleuren staan bovenaan `style.css`.

## F. Veilig opslaan en back-ups

1. Open **Potjes & geschiedenis**.
2. Klik **Exporteer JSON** en bewaar het bestand op een veilige plek.
3. Test **Importeer JSON** met een back-up. **Let op:** importeren vervangt de bestaande gegevens.
4. Maak regelmatig een back-up. In de PWA worden scores nu alleen lokaal opgeslagen via `localStorage`; verwijderde browsergegevens of een nieuw apparaat kunnen de geschiedenis doen verdwijnen.
5. Bij een latere release kun je IndexedDB gebruiken voor robuustere opslag. Een optionele cloudfunctie vereist dan accounts/backend en privacyafspraken.

## G. PWA gratis publiceren en installeren op iPhone

1. Ga naar https://github.com/ en maak een account aan.
2. Maak een nieuwe **public** repository `toep-app`. Zet geen privégegevens in een publieke repository.
3. Upload de **inhoud van de uitgepakte map**, niet het ZIP-bestand. `index.html` moet in de root staan; de map `icons` blijft intact.
4. Ga naar repository → **Settings → Pages** → **Deploy from a branch** → `main` → `/(root)` → **Save**.
5. Wacht tot GitHub Pages je site heeft gepubliceerd; het adres lijkt op `https://gebruikersnaam.github.io/toep-app/`.
6. Open dat adres in Safari op je iPhone, kies **Delen → Zet op beginscherm** (eventueel **Open als webapp**).
7. Open het icoon op het beginscherm. Voor offline gebruik moet de site eenmaal online geladen zijn.
8. Test de app met vliegtuigmodus. Heropen de app en controleer of het startscherm en opgeslagen gegevens nog beschikbaar zijn.
9. **Belangrijk:** op GitHub Pages toont de app alleen demo-advertentieruimtes. AdMob werkt niet simpelweg door een SDK aan deze webpagina toe te voegen. Voor een echte PWA is een apart webadvertentiesysteem en toelating nodig, wat niet automatisch gegarandeerd is.

## H. Wanneer de spelregels definitief maken

Maak vóór publicatie een lijst met de huisregels: maximaal punten, wat geldt bij kloppen/meegaan/passen, hoeveel punten bij iedere verhoging, wat doet armoede, wanneer valt iemand af, wanneer eindigt het potje en hoe behandel je gelijke standen.

Programmeertip: maak later `game-rules.js` met een zuivere `calculateRoundResult(game, actions, rules)`-functie en schrijf minstens 20 automatische tests van verwachte puntentellingen. Voer pas daarna automatische potjesafsluiting in.

## I. Native apps maken met Capacitor

**Capacitor v8-documentatie:** https://capacitorjs.com/docs/getting-started  
**Voorwaarden:** Node.js 22+, Android Studio voor Android; voor iOS Xcode op macOS.

1. Installeer de actuele LTS-versie van Node.js: https://nodejs.org/
2. Open de terminal in de projectmap en controleer:

```bash
node --version
npm --version
```

3. Maak `package.json` en installeer Capacitor:

```bash
npm init -y
npm install @capacitor/core
npm install -D @capacitor/cli
npx cap init
```

4. Vul als app-naam `TOEP!` en als bundle ID bijvoorbeeld `nl.jouwnaam.toepapp` in (moet uniek zijn). Gebruik `www` als **webDir**.
5. Maak een map `www` en kopieer daarin de webbestanden `index.html`, `app.js`, `monetization.js`, `style.css`, `manifest.webmanifest`, `sw.js` en `icons/`. Controleer ook `capacitor.config.*` of `webDir: 'www'` staat.
6. Installeer Android-platform:

```bash
npm install @capacitor/android
npx cap add android
npx cap sync android
npx cap open android
```

7. Gebruik Android Studio om te bouwen, op een emulator of fysieke Android-telefoon te testen en een ondertekende Android App Bundle (`.aab`) te maken.
8. Voor iOS voer je de volgende opdrachten **op een Mac** uit:

```bash
npm install @capacitor/ios
npx cap add ios
npx cap sync ios
npx cap open ios
```

9. Open en test de app in Xcode op een simulator of aangesloten iPhone. Werk de appiconen, splashschermen, bundle IDs en versiegegevens af.
10. Na aanpassingen aan de webcode kopieer je de nieuwe webbestanden opnieuw naar `www` en voer je `npx cap sync` uit vóór iedere nieuwe native build. Voor een volwaardig project kun je later een build-script toevoegen zodat die kopie automatisch gaat.

**Let op:** `npm`-opdrachten in dit stappenplan zijn nog niet uitgevoerd in de ZIP; de ZIP is eerst een statische PWA. Capacitor, AdMob en Billing zijn niet vooraf geïnstalleerd.

## J. Advertenties echt toevoegen — native versie

1. Registreer bij https://admob.google.com/ en maak **een appvermelding per platform**: Android en iOS.
2. Configureer de platform-specifieke **AdMob App ID** en banner **Ad Unit IDs**. Bewaar deze configuratie apart van de broncode wanneer nodig.
3. Selecteer een actuele, onderhouden Capacitor-plugin die past bij jouw Capacitor-versie, bijvoorbeeld de community AdMob-plugin: https://github.com/capacitor-community/admob. Controleer vóór installatie versiecompatibiliteit en de exacte installatiestappen.
4. Voeg het native pluginpakket toe en voer `npx cap sync` uit. Configureer op Android `AndroidManifest.xml`, op iOS `Info.plist` en de nodige advertentie-instellingen volgens de officiële plugindocumentatie.
5. Gebruik **testadvertentie-ID's** tijdens ontwikkeling. Klik nooit zelf op live advertenties om inkomsten te genereren.
6. Gebruik de Google **User Messaging Platform (UMP)** consent-flow bij iedere appstart waar nodig: check consentstatus, toon een consentformulier als dat vereist is en laad pas advertenties wanneer het is toegestaan. De Europese toestemmingsregels zijn belangrijk; neem ook privacyverklaring en platform-specifieke trackinginformatie op.
7. Zet echte banneradvertenties bij **Klassement** en **Statistieken**. Niet tijdens een ronde, bij undo of boven bedieningsknoppen.
8. Optioneel: een niet-frequente interstitial na een afgerond potje, maar test of dit gebruikers niet stoort.
9. Zodra de winkel aangeeft dat `remove_ads` gekocht en geverifieerd is, mogen advertentieaanvragen niet meer worden gedaan, en bestaande banners moeten worden verborgen.
10. Vul de vereiste advertentie-, leeftijds- en privacyverklaringen in de appwinkels correct in.

**Bronnen:** https://github.com/capacitor-community/admob/blob/main/docs/consent.md en https://support.google.com/admob/answer/13554116

## K. €3,99 eenmalige aankoop — Android

1. Maak een Google Play Console-account: https://play.google.com/console (registratiekosten doorgaans $25 eenmalig).
2. Maak je app en vul naam, beschrijving, screenshots en beleidsvragen in.
3. Onder monetisatie/in-app producten maak je een **one-time / non-consumable product** aan.
4. Product-ID: `remove_ads`. Kies je beoogde Nederlandse consumentenprijs van **€3,99**; controleer lokaal prijs- en btw-overzicht.
5. Installeer een geschikte actuele Capacitor billing/IAP-plugin die de **Google Play Billing Library** ondersteunt, of bouw zelf een native Capacitor-brug. Let op versiecompatibiliteit en onderhoud.
6. Implementeer aankoop starten via Play Billing, voltooien/acknowledgen volgens de Billing-regels en het herladen van reeds gekochte producten.
7. Implementeer correcte aankoopvalidatie (bij voorkeur via een betrouwbare backend met de winkel-API, of een goed onderbouwde actuele native purchase-verificatieflow). Vertrouw nooit op een `localStorage`-schakelaar alleen.
8. Maak een **Herstel aankoop**-knop die de winkel opnieuw raadpleegt.
9. Test met Play Console-licentietesters en interne/gesloten testtracks. Een nieuw persoonlijk Google Play-account kan vóór productie een verplichte gesloten test met minstens 12 testers gedurende 14 aaneengesloten dagen vereisen; controleer de actuele accountvereisten.
10. Test aankoop, herinstallatie, herstel, geen advertenties na aankoop, geen dubbele aankoop, netwerkfouten en geweigerde/terugbetaalde aankopen.
11. Publiceer pas als de app door Google is goedgekeurd.

**Officieel:** https://developer.android.com/google/play/billing/one-time-products

## L. €3,99 eenmalige aankoop — iOS

1. Meld je aan bij het Apple Developer Program: https://developer.apple.com/programs/ (doorgaans $99 per jaar of lokale prijs).
2. Maak in App Store Connect een app aan met unieke Bundle ID.
3. Maak onder **In-App Purchases** een **Non-Consumable** product met ID `remove_ads` en richtprijs €3,99.
4. Gebruik StoreKit 2, direct via Swift of een onderhouden Capacitor IAP-plugin. Zorg dat de gebruikte SDK compatibel is met jouw Xcode-/Capacitor-versie.
5. Valideer transactiestatus/entitlements en zorg dat terugbetaalde/ingetrokken aankopen geen eeuwigdurende toegang geven.
6. Implementeer **Herstel aankoop**, bijvoorbeeld opnieuw de actieve store-entitlements laden / synchroniseren volgens Apple's richtlijnen.
7. Test aankopen in StoreKit Testing en App Store Sandbox; daarna via TestFlight.
8. Voeg correcte privacy- en advertentie-informatie, screenshots en een privacybeleid toe. Controleer of de app genoeg eigen functionaliteit heeft voor App Review.
9. Upload de build via Xcode en dien de app met IAP-product ter beoordeling in.

**Officieel:** https://developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/overview-for-configuring-in-app-purchases

## M. Inkomsten, kosten, belastingen

- Gratis gebruikers leveren pas geld op nadat advertenties echt worden vertoond en AdMob is goedgekeurd.
- Een advertentievrije upgrade voor €3,99 levert niet volledig €3,99 op: btw, winkelcommissie en eventuele overige kosten spelen mee.
- Voor Nederland: regel belasting- en bedrijfsaspecten indien dit een structurele commerciële activiteit wordt. Laat je zo nodig adviseren over KVK en belastingzaken.
- Eén app met gratis toegang plus een in-app upgrade is eenvoudiger te beheren dan aparte gratis en betaalde appvermeldingen.
- Een Android-aankoop herstelt niet automatisch op iPhone; platformoverschrijdende rechten vereisen een aanvullend accountsysteem en beleidsconforme implementatie.

## N. QA-checklist vóór publicatie

- [ ] Speler toevoegen / selecteren / verwijderen
- [ ] Starten met 2, 3, 4+ spelers
- [ ] Score + / −, undo, reset
- [ ] Armoedemelding precies bij de ingestelde grens
- [ ] Afvallen en handmatig beëindigen
- [ ] Winnaar en gelijke score naar huisregels
- [ ] Bestaand potje hervatten na app herstart
- [ ] Alle zes kleurenthema's, inclusief voldoende contrast
- [ ] Score en data blijven behouden na herstart
- [ ] Export/import getest, ook ongeldige JSON
- [ ] Geen advertenties tijdens het spelen
- [ ] AdMob-testads alleen waar toegestaan, consent eerst
- [ ] €3,99 aankoop in testomgeving, zonder echt geld
- [ ] Na aankoop verdwijnen advertenties en advertentieaanvragen
- [ ] Herstel aankoop na app opnieuw installeren
- [ ] Afwijzing, storing, refund/revocation correct behandeld
- [ ] Android interne/gesloten test en iOS TestFlight
- [ ] App Store privacyverklaring / Google Data safety correct
- [ ] Iconen, screenshots, beschrijving en versienummer afgewerkt

## O. Volgorde van werkzaamheden vanaf nu

**Fase 1 (nu):** ZIP openen, starten met Live Server, eerste potjes testen, kleurenthema's en spelregels nalopen.  
**Fase 2:** Huisregels volledig specificeren en echte puntentelling programmeren met tests.  
**Fase 3:** Statistieken, geschiedenis, archiveren spelers, opslag/back-ups verbeteren.  
**Fase 4:** Gratis PWA online publiceren en met vrienden testen.  
**Fase 5:** Android met Capacitor bouwen, AdMob-testadvertenties en Play Billing-aankoop aansluiten; Google Play testen/publiceren.  
**Fase 6:** iOS bouwen op Mac, StoreKit-aankoop en iOS-advertenties, TestFlight en App Store-review.

**Eerstvolgende stap:** pak ZIP uit, open `index.html` met Live Server en controleer het nieuwe scherm **Advertentievrij · €3,99**. Het premium-scherm is bewust een demo, dus de app kan nu veilig worden getest zonder echte aankopen of advertenties.
