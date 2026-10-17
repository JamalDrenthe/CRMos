import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';

export interface MapboxConfig {
  enabled: boolean;
  publicToken: string;
  customStyleUrl?: string;
  googleMapsApiKey?: string;
  enableStreetViewFallback?: boolean;
  defaultZoom?: number;
  defaultCenter?: [number, number]; // [lng, lat]
  updatedAt?: string;
}

export const DEFAULT_MAPBOX_CONFIG: MapboxConfig = {
  enabled: true,
  publicToken: '',
  customStyleUrl: 'mapbox://styles/mapbox/dark-v11',
  googleMapsApiKey: '',
  enableStreetViewFallback: true,
  defaultZoom: 13,
  defaultCenter: [4.8891, 52.3732], // Amsterdam Centrum
};

export const POPULAR_MAPBOX_STYLES = [
  {
    id: 'dark',
    name: 'CRMos Apple Dark',
    url: 'mapbox://styles/mapbox/dark-v11',
    description: 'Donkere minimalistische vectorstijl, optimaal voor contrasterende gekleurde pinnen.',
  },
  {
    id: 'light',
    name: 'CRMos Apple Light',
    url: 'mapbox://styles/mapbox/light-v11',
    description: 'Frisse, heldere monochrome vectorstijl voor daglicht en kantooromgevingen.',
  },
  {
    id: 'streets',
    name: 'Stadsnavigatie (Streets)',
    url: 'mapbox://styles/mapbox/streets-v12',
    description: 'Gedetailleerde straatnamen, fietspaden en looproutes voor veldvertegenwoordigers.',
  },
  {
    id: 'satellite',
    name: 'Satelliet & Panden',
    url: 'mapbox://styles/mapbox/satellite-streets-v12',
    description: 'Luchtfoto met straat-overlays voor directe inspectie van daken en terreinen.',
  },
];

/**
 * Laadt Mapbox configuratie uit Firestore of lokaal
 */
export async function loadMapboxConfigFromFirestore(orgId: string): Promise<MapboxConfig> {
  const local = localStorage.getItem(`crmos_mapbox_config_${orgId}`);
  if (local) {
    try {
      return { ...DEFAULT_MAPBOX_CONFIG, ...JSON.parse(local) };
    } catch {
      // fallback
    }
  }

  if (!isFirebaseConfigured()) {
    return DEFAULT_MAPBOX_CONFIG;
  }

  try {
    const docRef = doc(db, 'organizations', orgId, 'integrations', 'mapbox');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as MapboxConfig;
      localStorage.setItem(`crmos_mapbox_config_${orgId}`, JSON.stringify(data));
      return { ...DEFAULT_MAPBOX_CONFIG, ...data };
    }
  } catch (err) {
    console.warn('Kon Mapbox configuratie niet ophalen uit Firestore:', err);
  }

  return DEFAULT_MAPBOX_CONFIG;
}

/**
 * Slaat Mapbox configuratie op in Firestore en lokaal
 */
export async function saveMapboxConfigToFirestore(config: MapboxConfig, orgId: string): Promise<void> {
  localStorage.setItem(`crmos_mapbox_config_${orgId}`, JSON.stringify(config));

  if (!isFirebaseConfigured()) return;

  try {
    const docRef = doc(db, 'organizations', orgId, 'integrations', 'mapbox');
    await setDoc(docRef, {
      ...config,
      updatedAt: new Date().toISOString(),
      _firestore_timestamp: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error('Fout bij opslaan van Mapbox configuratie in Firestore:', err);
    throw err;
  }
}

/**
 * Verifieert of een Mapbox Public Token geldig is
 */
export async function verifyMapboxToken(token: string): Promise<{ valid: boolean; message: string }> {
  if (!token || !token.trim().startsWith('pk.')) {
    return {
      valid: false,
      message: 'Ongeldig token formaat. Een Mapbox openbare sleutel begint altijd met "pk.".',
    };
  }

  try {
    const testUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12?access_token=${encodeURIComponent(token.trim())}`;
    const res = await fetch(testUrl, { method: 'GET' });
    if (res.ok) {
      return {
        valid: true,
        message: 'Mapbox Public Token is succesvol gevalideerd en operationeel!',
      };
    } else {
      const errorData = await res.json().catch(() => ({}));
      return {
        valid: false,
        message: errorData.message || `Verificatie mislukt (HTTP ${res.status}). Controleer het token in je Mapbox dashboard.`,
      };
    }
  } catch (err) {
    return {
      valid: false,
      message: `Netwerkfout bij validatie: ${(err as Error)?.message || 'Onbekend'}.`,
    };
  }
}
