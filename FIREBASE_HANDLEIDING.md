# CRMos - Firebase & Google Inlog Handleiding

CRMos is nu gekoppeld aan **Firebase Authentication (Google Login)** en **Cloud Firestore** voor realtime gegevensopslag.

---

## 1. Firebase Project Aanmaken (5 minuten)

1. Ga naar de [Firebase Console](https://console.firebase.google.com/).
2. Klik op **Project toevoegen** en geef je project een naam (bijvoorbeeld `CRMos`).
3. Google Analytics kun je naar wens inschakelen of overslaan.

---

## 2. Google Login Inschakelen

1. In de Firebase Console, ga in het linkermenu naar **Build** > **Authentication**.
2. Klik op **Aan de slag (Get Started)**.
3. Ga naar het tabblad **Sign-in method**.
4. Klik op **Google** in de lijst van providers.
5. Schakel de optie **Inschakelen (Enable)** in.
6. Kies een **Projectondersteunings-e-mailadres** en klik op **Opslaan**.

---

## 3. Firestore Database Aanmaken

1. Ga in het linkermenu naar **Build** > **Firestore Database**.
2. Klik op **Database maken (Create database)**.
3. Kies een serverlocatie (bijvoorbeeld `europe-west1` of `europe-west4` voor Nederland/Europa).
4. Kies bij beveiligingsregels voor nu **Testmodus** (of kopieer de regels uit `firestore.rules`).
5. Klik op **Maken**.

### Beveiligingsregels toepassen:
Ga naar het tabblad **Regels (Rules)** in Firestore en plak de inhoud van het bestand `firestore.rules`:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }

    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && request.auth.uid == userId;
    }

    match /organizations/{orgId} {
      allow read, write: if isAuthenticated();
    }

    match /crm_contacts/{contactId} {
      allow read, write: if isAuthenticated();
    }

    match /crm_companies/{companyId} {
      allow read, write: if isAuthenticated();
    }

    match /crm_deals/{dealId} {
      allow read, write: if isAuthenticated();
    }

    match /crm_activities/{activityId} {
      allow read, write: if isAuthenticated();
    }
  }
}
```

---

## 4. Web App Registreren & Sleutels Kopiëren

1. Klik op het tandwielicoontje linksboven > **Projectinstellingen (Project settings)**.
2. Scroll naar beneden naar de sectie **Je apps (Your apps)** en klik op het Web-icoontje (`</>`).
3. Geef de app een bijnaam (bijvoorbeeld `CRMos Web`) en klik op **App registreren**.
4. Kopieer de waarden uit het `firebaseConfig` object naar het bestand `.env` in de root van dit project:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=jouw-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=jouw-project
VITE_FIREBASE_STORAGE_BUCKET=jouw-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789...
VITE_FIREBASE_APP_ID=1:123456789:web:...
```

---

## 5. De Applicatie Starten

Start de ontwikkelserver met:
```bash
npm run dev
```

Open de browser op `http://localhost:5173`. Op de inlogpagina kun je nu direct klikken op **Inloggen met Google**. Alle contacten, bedrijven, deals en activiteiten die je toevoegt of wijzigt, worden nu realtime gesynchroniseerd met Firestore!
