import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';

export interface OpenMapStylePreset {
  id: string;
  name: string;
  url: string;
  description: string;
  category: 'standard' | 'minimal' | 'bright';
}

export const CARTO_VOYAGER_STYLE = {
  version: 8,
  sources: {
    'carto-voyager': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
    },
  },
  layers: [
    {
      id: 'carto-voyager-layer',
      type: 'raster',
      source: 'carto-voyager',
      minzoom: 0,
      maxzoom: 20,
    },
  ],
};

export const OPEN_FREE_MAP_STYLES: OpenMapStylePreset[] = [
  {
    id: 'liberty',
    name: 'OpenFreeMap Liberty (Standaard / Modern)',
    url: 'https://tiles.openfreemap.org/styles/liberty',
    description: 'Modern, evenwichtig kleurenpalet met duidelijke straatnamen en pandcontouren. Ideaal voor Door-to-Door verkoop.',
    category: 'standard',
  },
  {
    id: 'positron',
    name: 'OpenFreeMap Positron (Licht / Minimalistisch)',
    url: 'https://tiles.openfreemap.org/styles/positron',
    description: 'Strakke monochrome vectorstijl voor maximale contrast van gekleurde rayon-pins en status-markeringen.',
    category: 'minimal',
  },
  {
    id: 'bright',
    name: 'OpenFreeMap Bright (Helder & Levendig)',
    url: 'https://tiles.openfreemap.org/styles/bright',
    description: 'Hoge verzadiging en duidelijke topografie voor buiteninspectie en daglichtnavigatie.',
    category: 'bright',
  },
  {
    id: 'voyager',
    name: 'Universeel (Carto Voyager Raster)',
    url: 'carto-voyager',
    description: 'Bewezen snelle cartografie. Laadt altijd direct op elk mobiel netwerk.',
    category: 'standard',
  },
];

export interface OpenMapConfig {
  enabled: boolean;
  styleUrl: string;
  defaultZoom: number;
  defaultCenter: [number, number]; // [lng, lat]
  routingProfile: 'foot' | 'cycling' | 'driving';
  updatedAt?: string;
}

export const DEFAULT_OPEN_MAP_CONFIG: OpenMapConfig = {
  enabled: true,
  styleUrl: 'https://tiles.openfreemap.org/styles/liberty',
  defaultZoom: 14,
  defaultCenter: [4.8891, 52.3732], // Amsterdam Centrum
  routingProfile: 'foot',
};

// Mandatory custom User-Agent to prevent 403 Forbidden on public OSM/Nominatim/Overpass/OSRM
export const GEO_USER_AGENT = 'CustomMCPGeoAgent/1.0 (local-development)';

// Simple in-memory cache for geocoding and routing to prevent rate-limit 429 errors
const geoCache = new Map<string, { timestamp: number; data: unknown }>();
const CACHE_TTL_MS = 1000 * 60 * 15; // 15 minuten

function getCached<T>(key: string): T | null {
  const item = geoCache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > CACHE_TTL_MS) {
    geoCache.delete(key);
    return null;
  }
  return item.data as T;
}

function setCached<T>(key: string, data: T): void {
  geoCache.set(key, { timestamp: Date.now(), data });
}

/**
 * Laadt Open-Source Kaartconfiguratie uit Firestore of localStorage (100% keyless)
 */
export async function loadOpenMapConfigFromFirestore(orgId: string): Promise<OpenMapConfig> {
  const local = localStorage.getItem(`crmos_openmap_config_${orgId}`);
  if (local) {
    try {
      return { ...DEFAULT_OPEN_MAP_CONFIG, ...JSON.parse(local) };
    } catch {
      // fallback
    }
  }

  if (!isFirebaseConfigured()) {
    return DEFAULT_OPEN_MAP_CONFIG;
  }

  try {
    const docRef = doc(db, 'organizations', orgId, 'integrations', 'openmap');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as Partial<OpenMapConfig>;
      const config: OpenMapConfig = { ...DEFAULT_OPEN_MAP_CONFIG, ...data };
      localStorage.setItem(`crmos_openmap_config_${orgId}`, JSON.stringify(config));
      return config;
    }
  } catch (err) {
    console.warn('Kon Open-Source kaartconfiguratie niet ophalen uit Firestore:', err);
  }

  return DEFAULT_OPEN_MAP_CONFIG;
}

/**
 * Slaat Open-Source Kaartconfiguratie op in Firestore en localStorage
 */
export async function saveOpenMapConfigToFirestore(config: OpenMapConfig, orgId: string): Promise<void> {
  localStorage.setItem(`crmos_openmap_config_${orgId}`, JSON.stringify(config));

  if (!isFirebaseConfigured()) return;

  try {
    const docRef = doc(db, 'organizations', orgId, 'integrations', 'openmap');
    await setDoc(docRef, {
      ...config,
      updatedAt: new Date().toISOString(),
      _firestore_timestamp: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.error('Fout bij opslaan van kaartconfiguratie in Firestore:', err);
    throw err;
  }
}

/**
 * Geocoding: Adres -> Coördinaten
 * 1. PDOK Locatieserver (bij Nederlandse zoekterm of postcode)
 * 2. Photon API (Komoot / OSM vector autocomplete)
 * 3. Nominatim (OpenStreetMap fallback met custom User-Agent)
 */
export async function geocodeAddress(
  query: string
): Promise<{ lat: number; lng: number; displayName: string; source: string } | null> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return null;

  const cacheKey = `geo_fwd_${cleanQuery.toLowerCase()}`;
  const cached = getCached<{ lat: number; lng: number; displayName: string; source: string }>(cacheKey);
  if (cached) return cached;

  // 1. Probeer eerst PDOK voor Nederlandse adressen / postcodes
  const isDutchPattern = /\b\d{4}\s?[A-Za-z]{2}\b/.test(cleanQuery) || /nederland|netherlands/i.test(cleanQuery);
  if (isDutchPattern) {
    try {
      const pdokUrl = `https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?q=${encodeURIComponent(cleanQuery)}&rows=1`;
      const res = await fetch(pdokUrl, {
        headers: { 'User-Agent': GEO_USER_AGENT },
      });
      if (res.ok) {
        const json = await res.json();
        const docResult = json.response?.docs?.[0];
        if (docResult?.centroide_ll) {
          const match = docResult.centroide_ll.match(/POINT\(([\d.]+)\s+([\d.]+)\)/i);
          if (match) {
            const result = {
              lng: parseFloat(match[1]),
              lat: parseFloat(match[2]),
              displayName: docResult.weergavenaam || cleanQuery,
              source: 'PDOK Kadaster',
            };
            setCached(cacheKey, result);
            return result;
          }
        }
      }
    } catch (err) {
      console.warn('PDOK forward geocode mislukt, fallback naar Photon:', err);
    }
  }

  // 2. Wereldwijd: Photon API (Komoot OpenStreetMap)
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(cleanQuery)}&limit=1`;
    const res = await fetch(photonUrl, {
      headers: { 'User-Agent': GEO_USER_AGENT },
    });
    if (res.ok) {
      const json = await res.json();
      const feat = json.features?.[0];
      if (feat?.geometry?.coordinates) {
        const [lng, lat] = feat.geometry.coordinates;
        const nameParts = [
          feat.properties.name,
          feat.properties.street,
          feat.properties.housenumber,
          feat.properties.postcode,
          feat.properties.city,
          feat.properties.country,
        ].filter(Boolean);
        const result = {
          lng,
          lat,
          displayName: nameParts.join(' ') || cleanQuery,
          source: 'Photon (OSM)',
        };
        setCached(cacheKey, result);
        return result;
      }
    }
  } catch (err) {
    console.warn('Photon forward geocode mislukt, fallback naar Nominatim:', err);
  }

  // 3. Fallback: Nominatim OpenStreetMap (met custom User-Agent)
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanQuery)}&format=jsonv2&limit=1`;
    const res = await fetch(nominatimUrl, {
      headers: { 'User-Agent': GEO_USER_AGENT },
    });
    if (res.ok) {
      const items = await res.json();
      if (items.length > 0) {
        const result = {
          lat: parseFloat(items[0].lat),
          lng: parseFloat(items[0].lon),
          displayName: items[0].display_name,
          source: 'Nominatim (OSM)',
        };
        setCached(cacheKey, result);
        return result;
      }
    }
  } catch (err) {
    console.error('Nominatim geocode fout:', err);
  }

  return null;
}

export interface ReverseGeocodeResult {
  address: string;
  street: string;
  houseNumber: string;
  houseNumberAddition?: string;
  city: string;
  postalCode?: string;
  source: string;
}

/**
 * Reverse Geocoding: Coördinaten -> Exact Adres (On-the-fly bij klik op de kaart)
 * 1. PDOK Locatieserver Reverse (voor Nederland: officiële Kadaster BAG data)
 * 2. Photon Reverse API (Wereldwijd)
 * 3. Nominatim Reverse (Fallback met custom User-Agent)
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<ReverseGeocodeResult | null> {
  const cacheKey = `geo_rev_${lat.toFixed(5)}_${lng.toFixed(5)}`;
  const cached = getCached<ReverseGeocodeResult>(cacheKey);
  if (cached) return cached;

  // 1. Als coördinaten binnen Nederland vallen: gebruik razendsnelle PDOK Kadaster Reverse API
  const isInNetherlands = lat >= 50.7 && lat <= 53.6 && lng >= 3.3 && lng <= 7.3;
  if (isInNetherlands) {
    try {
      const pdokRevUrl = `https://api.pdok.nl/bzk/locatieserver/search/v3_1/reverse?lat=${lat}&lon=${lng}&type=adres&rows=1`;
      const res = await fetch(pdokRevUrl);
      if (res.ok) {
        const json = await res.json();
        const docId = json.response?.docs?.[0]?.id;
        if (docId) {
          // Haal adresdetails op via lookup of free query
          const lookupUrl = `https://api.pdok.nl/bzk/locatieserver/search/v3_1/lookup?id=${encodeURIComponent(docId)}&fl=weergavenaam,straatnaam,huisnummer,huisnummertoevoeging,postcode,woonplaatsnaam`;
          const lookupRes = await fetch(lookupUrl);
          if (lookupRes.ok) {
            const lookupJson = await lookupRes.json();
            const d = lookupJson.response?.docs?.[0];
            if (d) {
              const street = d.straatnaam || 'Onbekende straat';
              const houseNumber = String(d.huisnummer || '');
              const houseNumberAddition = d.huisnummertoevoeging || undefined;
              const address = `${street} ${houseNumber}${houseNumberAddition || ''}`.trim();
              const result: ReverseGeocodeResult = {
                address,
                street,
                houseNumber,
                houseNumberAddition,
                city: d.woonplaatsnaam || 'Nederland',
                postalCode: d.postcode || '',
                source: 'PDOK Kadaster BAG',
              };
              setCached(cacheKey, result);
              return result;
            }
          }
        }
      }
    } catch (err) {
      console.warn('PDOK reverse geocode fout, fallback naar Photon:', err);
    }
  }

  // 2. Photon Reverse (Wereldwijd)
  try {
    const photonUrl = `https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}`;
    const res = await fetch(photonUrl);
    if (res.ok) {
      const json = await res.json();
      const feat = json.features?.[0];
      if (feat?.properties) {
        const p = feat.properties;
        const street = p.street || p.name || 'Locatie';
        const houseNumber = String(p.housenumber || '');
        const address = `${street} ${houseNumber}`.trim() || 'Geselecteerd pand';
        const city = p.city || p.town || p.village || '';
        const postalCode = p.postcode || '';
        const result: ReverseGeocodeResult = {
          address,
          street,
          houseNumber,
          city,
          postalCode,
          source: 'Photon (OSM)',
        };
        setCached(cacheKey, result);
        return result;
      }
    }
  } catch (err) {
    console.warn('Photon reverse geocode fout, fallback naar Nominatim:', err);
  }

  // 3. Nominatim Reverse
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2`;
    const res = await fetch(nomUrl, {
      headers: { 'User-Agent': GEO_USER_AGENT },
    });
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const street = addr.road || addr.pedestrian || addr.suburb || 'Locatie';
      const houseNumber = String(addr.house_number || '');
      const address = `${street} ${houseNumber}`.trim() || data.display_name?.split(',')?.[0] || 'Geselecteerd pand';
      const city = addr.city || addr.town || addr.village || addr.municipality || '';
      const postalCode = addr.postcode || '';
      const result: ReverseGeocodeResult = {
        address,
        street,
        houseNumber,
        city,
        postalCode,
        source: 'Nominatim (OSM)',
      };
      setCached(cacheKey, result);
      return result;
    }
  } catch (err) {
    console.error('Nominatim reverse geocode fout:', err);
  }

  return null;
}

export interface GeoJSONLineString {
  type: 'LineString';
  coordinates: [number, number][];
}

/**
 * Routeberekening via OSRM (Open Source Routing Machine)
 * Profielen: 'foot' (Door-to-door), 'cycling' of 'driving'
 */
export async function calculateRouteOSRM(
  startLngLat: [number, number],
  endLngLat: [number, number],
  profile: 'foot' | 'cycling' | 'driving' = 'foot'
): Promise<{
  distanceMeters: number;
  durationSeconds: number;
  geometry: GeoJSONLineString;
} | null> {
  const cacheKey = `osrm_${profile}_${startLngLat.join(',')}_${endLngLat.join(',')}`;
  const cached = getCached<{ distanceMeters: number; durationSeconds: number; geometry: GeoJSONLineString }>(cacheKey);
  if (cached) return cached;

  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/${profile}/${startLngLat[0]},${startLngLat[1]};${endLngLat[0]},${endLngLat[1]}?overview=full&geometries=geojson`;
    const res = await fetch(osrmUrl, {
      headers: { 'User-Agent': GEO_USER_AGENT },
    });
    if (res.ok) {
      const json = await res.json();
      if (json.code === 'Ok' && json.routes?.[0]) {
        const route = json.routes[0];
        const result = {
          distanceMeters: route.distance,
          durationSeconds: route.duration,
          geometry: route.geometry as GeoJSONLineString,
        };
        setCached(cacheKey, result);
        return result;
      }
    }
  } catch (err) {
    console.error('OSRM routeberekening fout:', err);
  }

  return null;
}

/**
 * POI / Omgevingsonderzoek via Overpass API
 * Voorbeeld: winkels, horeca, scholen of sport binnen een straal rond rayon
 */
export async function queryOverpassNearby(
  lat: number,
  lng: number,
  radiusMeters: number = 300,
  tagKey: string = 'amenity',
  tagValue: string = '*'
): Promise<Array<{ id: number; lat: number; lon: number; name?: string; tags: Record<string, string> }>> {
  const cacheKey = `overpass_${lat.toFixed(4)}_${lng.toFixed(4)}_${radiusMeters}_${tagKey}_${tagValue}`;
  const cached = getCached<Array<{ id: number; lat: number; lon: number; name?: string; tags: Record<string, string> }>>(cacheKey);
  if (cached) return cached;

  try {
    const query = tagValue === '*'
      ? `[out:json][timeout:15];nwr(around:${radiusMeters},${lat},${lng})["${tagKey}"];out center;`
      : `[out:json][timeout:15];nwr(around:${radiusMeters},${lat},${lng})["${tagKey}"="${tagValue}"];out center;`;

    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': GEO_USER_AGENT,
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (res.ok) {
      const json = await res.json();
      const elements = (json.elements || []).map((el: any) => ({
        id: el.id,
        lat: el.lat || el.center?.lat || 0,
        lon: el.lon || el.center?.lon || 0,
        name: el.tags?.name || el.tags?.brand || el.tags?.[tagKey] || 'Onbekend',
        tags: el.tags || {},
      })).filter((el: any) => el.lat !== 0 && el.lon !== 0);

      setCached(cacheKey, elements);
      return elements;
    }
  } catch (err) {
    console.error('Overpass API query fout:', err);
  }

  return [];
}
