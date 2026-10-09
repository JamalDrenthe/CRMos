import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'nl' | 'en';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
}

export const translations: Record<Language, Record<string, string>> = {
  nl: {
    // Navigatie
    'Dashboard': 'Dashboard',
    'CRM': 'CRM',
    'Contacts': 'Contacten',
    'Companies': 'Bedrijven',
    'Deals': 'Deals',
    'Activities': 'Activiteiten',
    'Recruitment': 'Werving',
    'Candidates': 'Kandidaten',
    'Jobs': 'Vacatures',
    'Sales': 'Verkoop',
    'Quotes': 'Offertes',
    'Products': 'Producten',
    'Contact Center': 'Klantcontact',
    'Agent Workspace': 'Werkplek Agent',
    'Campaigns': 'Campagnes',
    'Pitch Flows': 'Belscripts',
    '360° View': '360° Overzicht',
    'Gamification': 'Gamificatie',
    'Territories': 'Rayons & Regio\'s',
    'Workflows': 'Werkstromen',
    'Dashboard Builder': 'Dashboard Bouwer',
    'Audit Logs': 'Auditlogboeken',
    'Settings': 'Instellingen',
    'Enhanced': 'Uitgebreid',
    'Admin': 'Beheer',
    'Collapse': 'Inklappen',

    // Header
    'Search contacts, companies, deals...': 'Zoek contacten, bedrijven, deals...',
    'Notifications': 'Meldingen',
    'Mark all read': 'Alles gelezen markeren',
    'Profile': 'Profiel',
    'Log out': 'Uitloggen',
    'Firestore Live': 'Firestore Live',
    'Demo Storage': 'Demo Opslag',
    'Active Call': 'Actief gesprek',
    'No results found': 'Geen resultaten gevonden',

    // Login pagina
    'Welcome to CRMos': 'Welkom bij CRMos',
    'Log in to your account with Google or your credentials': 'Log in op je CRM-account via Google of met je inloggegevens',
    'Sign in with Google': 'Inloggen met Google',
    'Connecting with Google...': 'Verbinden met Google...',
    'Or with email': 'Of met e-mail',
    'Email': 'E-mailadres',
    'Password': 'Wachtwoord',
    'Sign in': 'Inloggen',
    'Signing in...': 'Inloggen...',
    'Demo credentials (any email/password works)': 'Demo-inloggen (elk gewenst e-mail/wachtwoord werkt)',
    'Use Admin Account': 'Admin Demo',
    'Use Agent Account': 'Agent Demo',
    'Tip: Add Firebase credentials in .env': 'Tip: Voeg je Firebase-gegevens toe aan .env om live in te loggen met Google.',

    // Thema & Weergave
    'Theme': 'Thema',
    'Light': 'Licht',
    'Dark': 'Donker',
    'Language': 'Taal',
    'Dutch': 'Nederlands',
    'English': 'Engels',
    'Appearance': 'Weergave',
    'General': 'Algemeen',
    'Primary Color': 'Primaire kleur',
    'Save': 'Opslaan',
    'Saved successfully': 'Succesvol opgeslagen',

    // Knoppen & Acties
    'Add': 'Toevoegen',
    'Edit': 'Bewerken',
    'Delete': 'Verwijderen',
    'Cancel': 'Annuleren',
    'Filter': 'Filteren',
    'Search': 'Zoeken',
    'Export': 'Exporteren',
    'Status': 'Status',
    'Name': 'Naam',
    'Phone': 'Telefoon',
    'Company': 'Bedrijf',
    'Stage': 'Fase',
    'Value': 'Waarde',
    'Due Date': 'Vervaldatum',
    'Priority': 'Prioriteit',
  },
  en: {
    // Navigation
    'Dashboard': 'Dashboard',
    'CRM': 'CRM',
    'Contacts': 'Contacts',
    'Companies': 'Companies',
    'Deals': 'Deals',
    'Activities': 'Activities',
    'Recruitment': 'Recruitment',
    'Candidates': 'Candidates',
    'Jobs': 'Jobs',
    'Sales': 'Sales',
    'Quotes': 'Quotes',
    'Products': 'Products',
    'Contact Center': 'Contact Center',
    'Agent Workspace': 'Agent Workspace',
    'Campaigns': 'Campaigns',
    'Pitch Flows': 'Pitch Flows',
    '360° View': '360° View',
    'Gamification': 'Gamification',
    'Territories': 'Territories',
    'Workflows': 'Workflows',
    'Dashboard Builder': 'Dashboard Builder',
    'Audit Logs': 'Audit Logs',
    'Settings': 'Settings',
    'Enhanced': 'Enhanced',
    'Admin': 'Admin',
    'Collapse': 'Collapse',

    // Header
    'Search contacts, companies, deals...': 'Search contacts, companies, deals...',
    'Notifications': 'Notifications',
    'Mark all read': 'Mark all read',
    'Profile': 'Profile',
    'Log out': 'Log out',
    'Firestore Live': 'Firestore Live',
    'Demo Storage': 'Demo Storage',
    'Active Call': 'Active Call',
    'No results found': 'No results found',

    // Login page
    'Welcome to CRMos': 'Welcome to CRMos',
    'Log in to your account with Google or your credentials': 'Log in to your account via Google or credentials',
    'Sign in with Google': 'Sign in with Google',
    'Connecting with Google...': 'Connecting with Google...',
    'Or with email': 'Or with email',
    'Email': 'Email',
    'Password': 'Password',
    'Sign in': 'Sign in',
    'Signing in...': 'Signing in...',
    'Demo credentials (any email/password works)': 'Demo credentials (any email/password works)',
    'Use Admin Account': 'Admin Demo',
    'Use Agent Account': 'Agent Demo',
    'Tip: Add Firebase credentials in .env': 'Tip: Add Firebase credentials in .env to sign in live with Google.',

    // Theme & Appearance
    'Theme': 'Theme',
    'Light': 'Light',
    'Dark': 'Dark',
    'Language': 'Language',
    'Dutch': 'Dutch',
    'English': 'English',
    'Appearance': 'Appearance',
    'General': 'General',
    'Primary Color': 'Primary Color',
    'Save': 'Save',
    'Saved successfully': 'Saved successfully',

    // Buttons & Actions
    'Add': 'Add',
    'Edit': 'Edit',
    'Delete': 'Delete',
    'Cancel': 'Cancel',
    'Filter': 'Filter',
    'Search': 'Search',
    'Export': 'Export',
    'Status': 'Status',
    'Name': 'Name',
    'Phone': 'Phone',
    'Company': 'Company',
    'Stage': 'Stage',
    'Value': 'Value',
    'Due Date': 'Due Date',
    'Priority': 'Priority',
  },
};

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'nl',

      setLanguage: (language) => set({ language }),

      toggleLanguage: () => {
        const nextLang: Language = get().language === 'nl' ? 'en' : 'nl';
        set({ language: nextLang });
      },

      t: (key: string, fallback?: string): string => {
        const currentLang = get().language;
        return translations[currentLang]?.[key] || fallback || key;
      },
    }),
    {
      name: 'crmos-language-storage',
    }
  )
);

/**
 * React hook for quick translation in functional components
 */
export function useTranslation() {
  const { language, setLanguage, toggleLanguage, t } = useLanguageStore();
  return { language, setLanguage, toggleLanguage, t };
}
