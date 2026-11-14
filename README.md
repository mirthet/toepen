# TOEP! v2 — score-app voor Toepen

Open **STAPPENPLAN.md** voor de volledige Nederlandstalige handleiding, inclusief installatie, iPhone-PWA, Android, iOS, Google AdMob en €3,99 in-app aankoop.

## Snel starten
1. Open deze map in VS Code.
2. Installeer **Live Server** van Ritwick Dey.
3. Klik met rechts op `index.html` → **Open with Live Server**.
4. Test **Nieuw potje** en **Advertentievrij · €3,99**.

## Belangrijke grenzen van v2
- Betalen en advertenties zijn **DEMO**: nergens wordt geld afgeschreven, nergens worden echte advertenties geladen.
- `monetization.js` is een scaffold, **geen winkelbetaalmodule**.
- De basis volgt een vereenvoudigde Toepen-puntentelling; definitieve huisregels ontbreken nog.
- Scores worden lokaal opgeslagen, maak regelmatig een JSON-back-up.
- De PWA kan via HTTPS op een iPhone worden geïnstalleerd zonder App Store-account.

## Projectstructuur (opgeschoonde versie)

- `index.html`: alle schermen en navigatie
- `app.js`: spelregels, scores, spelers, geschiedenis, statistieken en extra functies
- `style.css`: alle thema's, inclusief Nayade, en uitklapbare spelerskaarten
- `monetization.js`: uitsluitend demo voor advertentievrij (geen echte betaling)
- `sw.js`: offlinebestanden en controle op updates van de webapp
- `manifest.webmanifest`: app-naam en installatiegegevens
- `icons/`: appiconen (paden komen overeen met manifest en serviceworker)
- `Nayade-1961-jpeg.jpg`: Nayade-logo in de themaknop en op het startscherm

### Publiceren

Kopieer de inhoud van deze map naar de hoofdmap van je bestaande GitHub-repository,
met behoud van de `.git`-map van je eigen repository. Commit en push daarna.
De meegeleverde ZIP bevat bewust geen `.git`-geschiedenis of lokale instellingen.
Test na publicatie alle zes gelijke themakaarten, het Nayade-logo en de PWA-update.
De puntengrens wordt uitsluitend via **Instellingen** aangepast.
