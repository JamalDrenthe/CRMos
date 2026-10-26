---
name: logoanywhere
description: >-
  Genereert een productierijpe Digital Asset Pack (favicons, apple-touch-icon, Android/PWA-iconen,
  Open Graph og-image, social media avatars en site.webmanifest) vanuit één master logo.
  Gebruik deze skill wanneer de gebruiker vraagt om favicons, app iconen, touch icons, social preview cards,
  of wanneer 'LogoAnywhere' wordt genoemd.
---

# LogoAnywhere: Digital Asset Pack & Brand Asset Skill

Met **LogoAnywhere** transformeer je één enkel bronlogo (hoge resolutie PNG of SVG) automatisch in een complete, productierijpe set web- en merk-assets, inclusief juiste uitsnedes, safe-zones, HTML `<head>`-integratie en webmanifest.

---

## 1. Gewenste Bestandsstructuur

Plaats de gegenereerde bestanden in de root van de openbare webmap (`public/`) of een submap zoals `public/assets/icons/`:

```text
public/
│
├── favicon.ico                   # Multi-size klassieke favicon (16x16, 32x32, 48x48)
├── favicon.svg                   # Moderne vector favicon (schaalbaar, dark mode)
├── apple-touch-icon.png          # iOS beginscherm (180x180, vaste achtergrondkleur)
├── android-chrome-192x192.png    # Android / PWA normaal (192x192)
├── android-chrome-512x512.png    # Android / PWA splash & HD (512x512)
├── site.webmanifest              # PWA manifest configuratie
│
├── og-image.png                  # Link preview voor WhatsApp, LinkedIn, etc. (1200x630)
└── social-avatar.png             # Universeel profielicoon (1000x1000, 20% marge)
```

---

## 2. Snelle Uitvoering met het Generatiescript

Het generatiescript bevindt zich in [scripts/generate_assets.py](./scripts/generate_assets.py).

### Vereisten
Vereist Python 3 en Pillow:
```bash
pip install Pillow
```

### Gebruik
```bash
# Standaard (neemt logo.png, schrijft naar public/, witte achtergrond)
python3 ~/.gemini/config/skills/logoanywhere/scripts/generate_assets.py pad/naar/master-logo.png

# Met aangepaste uitvoermap, bedrijfsnaam en merkkleur
python3 ~/.gemini/config/skills/logoanywhere/scripts/generate_assets.py master-logo.png -o public -b "#0F172A" -n "MijnBedrijf"
```

> [!TIP]
> **Aanbevolen brongrootte**: Gebruik bij voorkeur een transparante PNG van minimaal **1000x1000 px** (optimaal: 2000x2000 px). Pillow kan standaard geen vector-SVG renderen zonder extra C-libraries (Cairo). Als de bron een SVG is, kopieert het script deze direct als `favicon.svg` en vraagt het om een PNG-versie voor de rasterformaten.

---

## 3. De Skill toevoegen aan een Specifiek Project

Als je deze skill wilt toevoegen aan een individueel project (zodat teamleden of git-workflows er ook toegang toe hebben), kopieer de map dan naar de `.agents/skills/` map van het project:

```bash
# Vanuit de hoofdmap van je project:
mkdir -p .agents/skills
cp -r ~/.gemini/config/skills/logoanywhere .agents/skills/
```

Binnen het project voer je het script dan lokaal uit:
```bash
python3 .agents/skills/logoanywhere/scripts/generate_assets.py master-logo.png
```

### Argumenten
- `input`: Pad naar de bronafbeelding (hoge resolutie PNG met transparantie aanbevolen).
- `-o, --output`: Doelmap (standaard: `public`).
- `-b, --bg`: Achtergrond HEX-kleur voor niet-transparante assets (`apple-touch-icon`, `og-image`, `social-avatar`). Standaard: `#FFFFFF`.

---

## 3. Specificaties & Safe-Zone Referentie

Raadpleeg [references/specifications.md](./references/specifications.md) voor diepgaande details.

| Bestand | Afmeting (px) | Transparant | Belangrijkste Safe-Zone Regel |
| :--- | :--- | :--- | :--- |
| **`favicon.ico`** | 16x16, 32x32, 48x48 | Ja | Geen tekst gebruiken, alleen het herkenbare symbool/beeldmerk. |
| **`favicon.svg`** | Schaalbaar (Vector) | Ja | Zorg dat lijnen voldoende dikte hebben op 16 px weergave. |
| **`apple-touch-icon.png`** | 180 x 180 | **Nee** | Vaste achtergrondkleur vereist; iOS maakt transparantie zwart. Logo binnen 140x140 px box. |
| **`android-chrome-*.png`** | 192x192 / 512x512 | Ja / Dekkend | Minimaal 10-20% marge rondom i.v.m. variabele OS-maskers (cirkels/squirkels). |
| **`og-image.png`** | 1200 x 630 | **Nee** | Belangrijke inhoud binnen de centrale **630 x 400 px** box (WhatsApp preview crop). |
| **`social-avatar.png`** | 1000 x 1000 | Ja of Dekkend | **20% padding rondom**: Instagram en LinkedIn snijden hoeken rond af. |
| **E-mail Handtekening** | Breedte max 300, hoogte 40–60 | Ja | Altijd PNG (geen SVG, Outlook rendert SVG niet). Opslaan op 2x resolutie. |

---

## 4. HTML `<head>` Integratie

Kopieer het sjabloon uit [resources/head.html](./resources/head.html) of plak de onderstaande tags in het `<head>` element:

```html
<!-- ========================================== -->
<!-- 1. FAVICONS & TOUCH ICONS                  -->
<!-- ========================================== -->
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#FFFFFF">

<!-- ========================================== -->
<!-- 2. OPEN GRAPH (WhatsApp, LinkedIn, FB)    -->
<!-- ========================================== -->
<meta property="og:type" content="website">
<meta property="og:locale" content="nl_NL">
<meta property="og:site_name" content="Bedrijfsnaam">
<meta property="og:url" content="https://www.jouwdomein.nl/">
<meta property="og:title" content="Bedrijfsnaam - Korte krachtige titel">
<meta property="og:description" content="Heldere beschrijving van 1 à 2 zinnen over de waarde die het bedrijf levert.">
<meta property="og:image" content="https://www.jouwdomein.nl/og-image.png">
<meta property="og:image:secure_url" content="https://www.jouwdomein.nl/og-image.png">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Logo van Bedrijfsnaam">

<!-- ========================================== -->
<!-- 3. X (VOORHEEN TWITTER) CARD               -->
<!-- ========================================== -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Bedrijfsnaam - Korte krachtige titel">
<meta name="twitter:description" content="Heldere beschrijving van 1 à 2 zinnen.">
<meta name="twitter:image" content="https://www.jouwdomein.nl/og-image.png">
<meta name="twitter:image:alt" content="Logo van Bedrijfsnaam">
```

---

## 5. Web App Manifest (`site.webmanifest`)

Kopieer het sjabloon uit [resources/site.webmanifest](./resources/site.webmanifest) naar de root (`public/site.webmanifest`):

```json
{
  "name": "Mijn Bedrijfsnaam",
  "short_name": "Bedrijfsnaam",
  "description": "Heldere beschrijving van je dienst of product.",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#FFFFFF",
  "theme_color": "#FFFFFF",
  "icons": [
    {
      "src": "/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```
