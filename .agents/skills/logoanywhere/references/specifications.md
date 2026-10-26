# LogoAnywhere - Asset Specificaties & Safe-Zone Referenties

Dit referentiedocument beschrijft de exacte ontwerpspecificaties, afmetingen, safe-zones en platform-eigenaardigheden voor het Digital Asset Pack.

---

## 1. Asset Specificatieoverzicht

| Bestand | Afmeting (px) | Transparant | Belangrijkste Safe-Zone Regel |
| :--- | :--- | :--- | :--- |
| **`favicon.ico`** | 16x16, 32x32, 48x48 | Ja | Geen tekst gebruiken, alleen het herkenbare symbool/beeldmerk. |
| **`favicon.svg`** | Schaalbaar (Vector) | Ja | Zorg dat lijnen voldoende dikte hebben op 16 px weergave; ondersteunt dark/light mode via `prefers-color-scheme`. |
| **`apple-touch-icon.png`** | 180 x 180 | **Nee** | Vaste achtergrondkleur vereist; iOS maakt transparantie zwart. Logo binnen 140x140 px box centreren. |
| **`android-chrome-*.png`** | 192x192 / 512x512 | Ja / Dekkend | Minimaal 10% - 20% veilige marge rondom i.v.m. variabele OS-maskers (cirkels, squirkels, vierkanten). |
| **`og-image.png`** | 1200 x 630 | **Nee** | Belangrijke inhoud binnen de centrale **630 x 400 px** box (WhatsApp, LinkedIn, iMessage 1:1 mobile preview uitsnede). |
| **`social-avatar.png`** | 1000 x 1000 | Ja of Dekkend | **20% padding rondom (logo max 700x700)**: Instagram en LinkedIn snijden profielfoto's rond af. |
| **E-mail Handtekening** | Breedte max 300, hoogte 40–60 | Ja | Altijd PNG (geen SVG, Outlook rendert SVG niet). Opslaan op 2x resolutie (retina). |

---

## 2. Platform Safe-Zone Regels in Detail

### Apple Touch Icon (`apple-touch-icon.png`)
- **Afmeting**: 180x180 px.
- **Transparantie-waarschuwing**: iOS rendert PNG-alfatransparantie als een gitzwarte achtergrond (`#000000`).
- **Oplossing**: Altijd een dekkende achtergrondkleur gebruiken (standaard wit `#FFFFFF` of de primaire merkkleur). Het logo wordt geschaald naar maximaal 140x140 px en exact gecentreerd met 20 px padding rondom.

### Android / PWA Icons (`android-chrome-*.png`)
- **Afmetingen**: 192x192 px en 512x512 px.
- **Maskable Icons**: Android 8.0+ past "Adaptive Icons" toe en snijdt iconen bij naar een masker (cirkel, afgerond vierkant of squircle).
- **Safe Zone**: De binnenste 80% van het canvas (de cirkel met diameter = 80% van de breedte) is gegarandeerd zichtbaar. Het script past daarom een contain-box van 80% van de canvasafmeting toe.

### Social Avatar (`social-avatar.png`)
- **Afmeting**: 1000x1000 px.
- **Platformen**: Instagram, LinkedIn, Twitter/X, TikTok, YouTube, GitHub.
- **Cirkelvormige uitsnede**: Vrijwel alle netwerken gebruiken cirkels voor avatars. Alles in de hoeken wordt weggesneden.
- **Safe Zone**: Logo binnen 700x700 px gecentreerd (20% marge tot de rand).

### Open Graph Preview (`og-image.png`)
- **Afmeting**: 1200x630 px (aspect ratio 1.91:1).
- **Platformen**: WhatsApp, LinkedIn, iMessage, Facebook, Slack, Twitter (`summary_large_image`).
- **Het Mobile Crop Probleem**: WhatsApp en iMessage tonen in mobiele chatbalken vaak een vierkante (1:1) uitsnede vanuit het exacte midden van de afbeelding.
- **Safe Zone**: Houd het logo en essentiële grafische elementen binnen een centrale box van 600x320 px (en zeker binnen de centrale 630x630 px zone).
