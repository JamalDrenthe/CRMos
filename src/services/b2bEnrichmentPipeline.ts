import type { D2DAddressPin, B2BMutationItem, Company } from '@/types';
import { GEO_USER_AGENT } from './openMapService';

export type BAGCommercialPurpose =
  | 'winkelfunctie'
  | 'kantoorfunctie'
  | 'industriefunctie'
  | 'bijeenkomstfunctie'
  | 'logiesfunctie'
  | 'gezondheidszorgfunctie';

export const ALLOWED_COMMERCIAL_PURPOSES: BAGCommercialPurpose[] = [
  'winkelfunctie',
  'kantoorfunctie',
  'industriefunctie',
  'bijeenkomstfunctie',
  'logiesfunctie',
  'gezondheidszorgfunctie',
];

export const COMMERCIAL_PURPOSE_LABELS: Record<BAGCommercialPurpose, string> = {
  winkelfunctie: 'Winkelpand / Retail',
  kantoorfunctie: 'Kantoorpand / Zakelijk',
  industriefunctie: 'Bedrijfshal / Industrie',
  bijeenkomstfunctie: 'Horeca / Bijeenkomst',
  logiesfunctie: 'Hotel / Logies',
  gezondheidszorgfunctie: 'Zorg / Praktijkruimte',
};

export interface PipelineStepProgress {
  step: 1 | 2 | 3 | 'completed' | 'error';
  stepLabel: string;
  bagBuildingsCount: number;
  enrichedOsmCount: number;
  mutationsCount: number;
  message: string;
}

export interface B2BEnrichmentPipelineResult {
  query: string;
  city: string;
  boundingBox: [number, number, number, number]; // [minLat, minLon, maxLat, maxLon]
  commercialPins: D2DAddressPin[];
  crmCompanies: Omit<Company, 'id' | 'created_at' | 'updated_at'>[];
  regionMutations: B2BMutationItem[];
  stats: {
    totalBagCommercial: number;
    withBusinessName: number;
    withOpeningHours: number;
    withMutations: number;
    byPurpose: Record<string, number>;
  };
}

/**
 * Haversine afstand tussen twee GPS-coördinaten in meters
 */
function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Vertaalt OSM tags naar een nette Nederlandse branche-omschrijving
 */
function deriveBranchFromOsmTags(tags: Record<string, string>, fallbackPurpose?: string): string {
  if (tags.shop) {
    const shopMap: Record<string, string> = {
      supermarket: 'Supermarkt & Levensmiddelen',
      clothes: 'Kleding & Modewinkel',
      bakery: 'Bakkerij & Patisserie',
      hairdresser: 'Kapsalon & Uiterlijke Verzorging',
      beauty: 'Schoonheidssalon',
      jewelry: 'Juwelier & Horloges',
      electronics: 'Elektronica & Telecom',
      bicycle: 'Fietsenwinkel & Tweewielers',
      florist: 'Bloemist & Tuin',
      books: 'Boekhandel & Kantoor',
      optician: 'Opticien & Oogzorg',
      butcher: 'Slagerij & Delicatessen',
      convenience: 'Gemakswinkel / Mini-markt',
      department_store: 'Warenhuis',
      furniture: 'Meubel & Interieur',
    };
    return shopMap[tags.shop] || `Retail (${tags.shop})`;
  }
  if (tags.office) {
    const officeMap: Record<string, string> = {
      company: 'Zakelijke Dienstverlening (Kantoor)',
      lawyer: 'Advocatenkantoor & Juridisch',
      accountant: 'Accountancy & Belastingadvies',
      estate_agent: 'Makelaardij & Vastgoed',
      insurance: 'Verzekeringen & Financiën',
      it: 'IT, Software & Tech',
      architect: 'Architectenbureau',
      consulting: 'Consultancy & Advies',
      notary: 'Notariaat',
      employment_agency: 'Uitzendbureau & Recruitment',
    };
    return officeMap[tags.office] || `Kantoor (${tags.office})`;
  }
  if (tags.amenity) {
    const amenityMap: Record<string, string> = {
      restaurant: 'Horeca: Restaurant',
      cafe: 'Horeca: Café / Koffiebar',
      bar: 'Horeca: Bar & Uitgaansgelegenheid',
      fast_food: 'Horeca: Fastfood & Takeaway',
      bank: 'Financiële Instelling / Bank',
      clinic: 'Medische Kliniek / Gezondheidscentrum',
      pharmacy: 'Apotheek & Farmacie',
    };
    return amenityMap[tags.amenity] || `Voorziening (${tags.amenity})`;
  }
  if (tags.craft) {
    return `Ambacht & Techniek (${tags.craft})`;
  }
  if (tags.industrial) {
    return `Industrie & Productie (${tags.industrial})`;
  }

  if (fallbackPurpose && fallbackPurpose in COMMERCIAL_PURPOSE_LABELS) {
    return COMMERCIAL_PURPOSE_LABELS[fallbackPurpose as BAGCommercialPurpose];
  }
  return 'Zakelijk Bedrijfspand';
}

/**
 * STAP 1: Haal alle fysieke bedrijfspanden + GPS-coördinaten op via PDOK Locatieserver + BAG WFS
 * Filtert 100% reguliere woonhuizen ('woonfunctie') weg.
 */
async function step1FetchCommercialBAGBuildings(
  regionQuery: string,
  allowedPurposes: BAGCommercialPurpose[],
  maxPages: number = 2
): Promise<{
  buildings: Array<{
    id: string;
    pandId: string;
    nummeraanduidingId: string;
    street: string;
    houseNumber: string;
    houseLetter?: string;
    houseAddition?: string;
    postalCode: string;
    city: string;
    purpose: BAGCommercialPurpose;
    surfaceAreaM2: number;
    buildYear?: number;
    latitude: number;
    longitude: number;
  }>;
  city: string;
  bbox: [number, number, number, number]; // [minLat, minLon, maxLat, maxLon]
}> {
  const clean = regionQuery.trim();
  const isPostcode = /^\d{4}\s*[A-Za-z]{0,2}$/.test(clean);
  const pcNormalized = clean.replace(/\s+/g, '').toUpperCase();

  // 1A: Gebruik PDOK Locatieserver om het zoekgebied en de precieze coördinaten te lokaliseren
  const solrQuery = isPostcode
    ? `postcode:${pcNormalized}* AND type:adres`
    : `woonplaatsnaam:"${clean}" AND type:adres`;

  const locUrl =
    `https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?` +
    `q=${encodeURIComponent(solrQuery)}` +
    `&fl=id,weergavenaam,straatnaam,huisnummer,huisletter,huisnummertoevoeging,postcode,woonplaatsnaam,centroide_ll,nummeraanduiding_id` +
    `&rows=100&start=0`;

  const locRes = await fetch(locUrl);
  if (!locRes.ok) {
    throw new Error(`PDOK Locatieserver fout (HTTP ${locRes.status})`);
  }

  const locData = await locRes.json();
  const locDocs = locData.response?.docs || [];
  if (locDocs.length === 0) {
    throw new Error(`Geen adressen gevonden in PDOK voor "${clean}". Controleer de postcode of gemeentenaam.`);
  }

  let minLat = 90,
    maxLat = -90,
    minLon = 180,
    maxLon = -180;
  let detectedCity = locDocs[0].woonplaatsnaam || clean;

  for (const doc of locDocs) {
    if (doc.centroide_ll) {
      const m = doc.centroide_ll.match(/POINT\(([\d.]+)\s+([\d.]+)\)/);
      if (m) {
        const lon = parseFloat(m[1]);
        const lat = parseFloat(m[2]);
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;
      }
    }
  }

  // Zorg voor een minimale bounding box rond de gevonden adressen (bijv. voor PC6 of grote gemeenten)
  const latPad = isPostcode && pcNormalized.length === 6 ? 0.0015 : 0.0045;
  const lonPad = isPostcode && pcNormalized.length === 6 ? 0.0025 : 0.0065;
  const bbox: [number, number, number, number] = [
    minLat - latPad,
    minLon - lonPad,
    maxLat + latPad,
    maxLon + lonPad,
  ];

  // 1B: Haal de verblijfsobjecten met zakelijk 'gebruiksdoel' en 'oppervlakte' op uit de PDOK BAG WFS API
  // Gepagineerd met count=200 & startIndex
  const purposeSet = new Set<string>(allowedPurposes);
  const commercialBuildings: Array<{
    id: string;
    pandId: string;
    nummeraanduidingId: string;
    street: string;
    houseNumber: string;
    houseLetter?: string;
    houseAddition?: string;
    postalCode: string;
    city: string;
    purpose: BAGCommercialPurpose;
    surfaceAreaM2: number;
    buildYear?: number;
    latitude: number;
    longitude: number;
  }> = [];

  const seenAddresses = new Set<string>();
  const pageSize = 200;

  for (let page = 0; page < maxPages; page++) {
    const startIndex = page * pageSize;
    const wfsUrl =
      `https://service.pdok.nl/lv/bag/wfs/v2_0?service=WFS&version=2.0.0&request=GetFeature` +
      `&typeName=bag:verblijfsobject&count=${pageSize}&startIndex=${startIndex}` +
      `&outputFormat=application/json&srsName=EPSG:4326` +
      `&BBOX=${bbox[1]},${bbox[0]},${bbox[3]},${bbox[2]},CRS:84`;

    const wfsRes = await fetch(wfsUrl);
    if (!wfsRes.ok) break;

    const wfsData = await wfsRes.json();
    const features = wfsData.features || [];
    if (features.length === 0) break;

    for (const feat of features) {
      const props = feat.properties || {};
      const purpose = (props.gebruiksdoel || '') as BAGCommercialPurpose;

      // HARDE FILTER: Negeer 'woonfunctie' en sla uitsluitend fysieke bedrijfspanden op!
      if (!purposeSet.has(purpose)) continue;

      const pc = String(props.postcode || '').replace(/\s+/g, '').toUpperCase();
      if (isPostcode && pc && !pc.startsWith(pcNormalized)) {
        continue;
      }

      const coords = feat.geometry?.coordinates;
      if (!coords || coords.length < 2) continue;

      const lon = Number(coords[0]);
      const lat = Number(coords[1]);
      const street = String(props.openbare_ruimte || '');
      const houseNumber = String(props.huisnummer || '');
      const houseLetter = props.huisletter ? String(props.huisletter) : undefined;
      const houseAddition = props.toevoeging ? String(props.toevoeging) : undefined;
      const city = String(props.woonplaats || detectedCity);

      const dedupKey = `${pc}_${houseNumber}_${houseLetter || ''}_${houseAddition || ''}`;
      if (seenAddresses.has(dedupKey)) continue;
      seenAddresses.add(dedupKey);

      commercialBuildings.push({
        id: `bag_${props.identificatie || dedupKey}`,
        pandId: String(props.pandidentificatie || ''),
        nummeraanduidingId: String(props.identificatie || ''),
        street,
        houseNumber,
        houseLetter,
        houseAddition,
        postalCode: pc ? `${pc.slice(0, 4)} ${pc.slice(4)}` : pcNormalized,
        city,
        purpose,
        surfaceAreaM2: Number(props.oppervlakte || 0),
        buildYear: props.bouwjaar ? Number(props.bouwjaar) : undefined,
        latitude: lat,
        longitude: lon,
      });
    }

    if (features.length < pageSize) break;
  }

  return {
    buildings: commercialBuildings,
    city: detectedCity,
    bbox,
  };
}

/**
 * STAP 2: Verrijk panden met Bedrijfsnaam, Branche & Openingstijden via OpenStreetMap Overpass API
 */
async function step2FetchOverpassBusinesses(
  bbox: [number, number, number, number]
): Promise<
  Array<{
    osmId: number;
    name: string;
    branch: string;
    street?: string;
    houseNumber?: string;
    postalCode?: string;
    openingHours?: string;
    phone?: string;
    website?: string;
    email?: string;
    lat: number;
    lon: number;
    tags: Record<string, string>;
  }>
> {
  const [minLat, minLon, maxLat, maxLon] = bbox;
  const overpassQuery = `[out:json][timeout:25];
(
  nwr["name"]["shop"](${minLat},${minLon},${maxLat},${maxLon});
  nwr["name"]["office"](${minLat},${minLon},${maxLat},${maxLon});
  nwr["name"]["craft"](${minLat},${minLon},${maxLat},${maxLon});
  nwr["name"]["amenity"~"restaurant|cafe|bar|fast_food|bank|clinic|pharmacy"](${minLat},${minLon},${maxLat},${maxLon});
  nwr["name"]["industrial"](${minLat},${minLon},${maxLat},${maxLon});
);
out center tags;`;

  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': GEO_USER_AGENT,
      },
      body: `data=${encodeURIComponent(overpassQuery)}`,
    });

    if (!res.ok) return [];
    const data = await res.json();
    const elements = data.elements || [];

    return elements
      .map((el: any) => {
        const tags: Record<string, string> = el.tags || {};
        const lat = el.lat ?? el.center?.lat;
        const lon = el.lon ?? el.center?.lon;
        if (!lat || !lon || !tags.name) return null;

        return {
          osmId: el.id,
          name: tags.name,
          branch: deriveBranchFromOsmTags(tags),
          street: tags['addr:street'],
          houseNumber: tags['addr:housenumber'],
          postalCode: tags['addr:postcode']?.replace(/\s+/g, '').toUpperCase(),
          openingHours: tags.opening_hours,
          phone: tags.phone || tags['contact:phone'],
          website: tags.website || tags['contact:website'],
          email: tags.email || tags['contact:email'],
          lat: Number(lat),
          lon: Number(lon),
          tags,
        };
      })
      .filter(Boolean);
  } catch (err) {
    console.warn('Overpass API verrijking waarschuwing:', err);
    return [];
  }
}

/**
 * STAP 3: Haal recente zakelijke mutaties (vergunningen & faillissementen) op via Overheid.nl KOOP SRU Open Data API
 */
async function step3FetchOfficialMutations(
  regionQuery: string,
  city: string
): Promise<B2BMutationItem[]> {
  const clean = regionQuery.trim();
  const isPostcode = /^\d{4}/.test(clean);
  const pc4 = clean.slice(0, 4);

  const cqlQuery = isPostcode
    ? `c.product-area=="officielepublicaties" AND cql.textAndIndexes="${pc4}" AND (cql.textAndIndexes="vergunning" OR cql.textAndIndexes="horeca" OR cql.textAndIndexes="faillissement" OR cql.textAndIndexes="exploitatievergunning") sortBy dt.modified/sort.descending`
    : `c.product-area=="officielepublicaties" AND dt.creator=="${city}" AND (cql.textAndIndexes="vergunning" OR cql.textAndIndexes="faillissement" OR cql.textAndIndexes="exploitatievergunning") sortBy dt.modified/sort.descending`;

  const sruUrl =
    `https://repository.overheid.nl/sru?version=2.0&operation=searchRetrieve` +
    `&query=${encodeURIComponent(cqlQuery)}&maximumRecords=15`;

  try {
    const res = await fetch(sruUrl);
    if (!res.ok) return [];

    const xmlText = await res.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    const records = Array.from(xmlDoc.getElementsByTagName('sru:record'));

    const mutations: B2BMutationItem[] = [];

    for (const rec of records) {
      const id = rec.getElementsByTagName('dcterms:identifier')[0]?.textContent || '';
      const title = rec.getElementsByTagName('dcterms:title')[0]?.textContent || '';
      const rubriek = rec.getElementsByTagName('dcterms:type')[0]?.textContent || 'bekendmaking';
      const date =
        rec.getElementsByTagName('dcterms:modified')[0]?.textContent ||
        rec.getElementsByTagName('dcterms:date')[0]?.textContent ||
        new Date().toISOString().slice(0, 10);
      const abstract = rec.getElementsByTagName('dcterms:abstract')[0]?.textContent || undefined;

      if (!id || !title) continue;

      const lower = `${title} ${rubriek}`.toLowerCase();
      const type: 'vergunning' | 'faillissement' | 'bekendmaking' = lower.includes('faillissement') ||
        lower.includes('surseance')
        ? 'faillissement'
        : lower.includes('vergunning')
        ? 'vergunning'
        : 'bekendmaking';

      mutations.push({
        id,
        title,
        type,
        rubriek,
        date,
        url: `https://zoek.officielebekendmakingen.nl/${id}.html`,
        abstract,
      });
    }

    return mutations;
  } catch (err) {
    console.warn('Overheid.nl SRU mutaties ophalen mislukt:', err);
    return [];
  }
}

/**
 * Voert de volledige 3-stappen B2B Lead- & Kaart-Enrichment Pipeline uit
 */
export async function runB2BLeadEnrichmentPipeline(params: {
  regionQuery: string;
  territoryId?: string;
  orgId: string;
  companyName: string;
  allowedPurposes?: BAGCommercialPurpose[];
  onProgress?: (progress: PipelineStepProgress) => void;
}): Promise<B2BEnrichmentPipelineResult> {
  const {
    regionQuery,
    territoryId,
    orgId,
    companyName,
    allowedPurposes = ALLOWED_COMMERCIAL_PURPOSES,
    onProgress,
  } = params;

  // STAP 1: PDOK / BAG Zakelijke Bedrijfspanden
  onProgress?.({
    step: 1,
    stepLabel: 'Stap 1/3: Fysieke bedrijfspanden ophalen uit Kadaster BAG (PDOK)...',
    bagBuildingsCount: 0,
    enrichedOsmCount: 0,
    mutationsCount: 0,
    message: 'Filteren op winkels, kantoren, horeca, industrie, logies & zorg (woonhuizen worden genegeerd)...',
  });

  const { buildings, city, bbox } = await step1FetchCommercialBAGBuildings(regionQuery, allowedPurposes);

  // STAP 2: OpenStreetMap Overpass API Verrijking
  onProgress?.({
    step: 2,
    stepLabel: 'Stap 2/3: Bedrijfsnamen, branches & openingstijden verrijken (Overpass QL)...',
    bagBuildingsCount: buildings.length,
    enrichedOsmCount: 0,
    mutationsCount: 0,
    message: `${buildings.length} zakelijke BAG-panden gevonden. Nu matchen met OpenStreetMap bedrijfsdata...`,
  });

  const osmBusinesses = await step2FetchOverpassBusinesses(bbox);

  // STAP 3: Overheid.nl Bekendmakingen (Vergunningen & Faillissementen)
  onProgress?.({
    step: 3,
    stepLabel: 'Stap 3/3: Recente vergunningen & faillissementen analyseren (Overheid.nl)...',
    bagBuildingsCount: buildings.length,
    enrichedOsmCount: osmBusinesses.length,
    mutationsCount: 0,
    message: 'Officiële bekendmakingen (Gemeenteblad & Staatscourant) controleren op mutaties...',
  });

  const regionMutations = await step3FetchOfficialMutations(regionQuery, city);

  // KOPPEL & MERGE DATA
  const usedOsmIds = new Set<number>();
  const commercialPins: D2DAddressPin[] = [];
  const crmCompanies: Omit<Company, 'id' | 'created_at' | 'updated_at'>[] = [];
  const byPurpose: Record<string, number> = {};

  let withBusinessName = 0;
  let withOpeningHours = 0;
  let withMutations = 0;

  for (const b of buildings) {
    byPurpose[b.purpose] = (byPurpose[b.purpose] || 0) + 1;
    const bPcClean = b.postalCode.replace(/\s+/g, '').toUpperCase();

    // Zoek beste match in OSM Overpass bedrijven:
    // 1. Op exacte postcode + huisnummer
    // 2. Op straatnaam + huisnummer
    // 3. Op GPS afstand <= 28 meter
    let matchedOsm = osmBusinesses.find(
      (o) =>
        !usedOsmIds.has(o.osmId) &&
        o.postalCode === bPcClean &&
        String(o.houseNumber || '') === b.houseNumber
    );

    if (!matchedOsm) {
      matchedOsm = osmBusinesses.find(
        (o) =>
          !usedOsmIds.has(o.osmId) &&
          o.street?.toLowerCase() === b.street.toLowerCase() &&
          String(o.houseNumber || '') === b.houseNumber
      );
    }

    if (!matchedOsm) {
      let bestDist = 28; // max 28 meter
      for (const o of osmBusinesses) {
        if (usedOsmIds.has(o.osmId)) continue;
        const d = haversineDistanceMeters(b.latitude, b.longitude, o.lat, o.lon);
        if (d < bestDist) {
          bestDist = d;
          matchedOsm = o;
        }
      }
    }

    if (matchedOsm) {
      usedOsmIds.add(matchedOsm.osmId);
    }

    // Check of een bekendmaking/vergunning dit adres noemt
    const addressPattern = `${b.street} ${b.houseNumber}`.toLowerCase();
    const matchedMutations = regionMutations.filter((m) => {
      const text = `${m.title} ${m.abstract || ''}`.toLowerCase();
      return text.includes(addressPattern) || (bPcClean && text.includes(bPcClean.toLowerCase()));
    });

    const businessName =
      matchedOsm?.name ||
      `${COMMERCIAL_PURPOSE_LABELS[b.purpose]} (${b.street} ${b.houseNumber}${b.houseLetter || ''}${b.houseAddition || ''})`;
    const branch = matchedOsm?.branch || COMMERCIAL_PURPOSE_LABELS[b.purpose];

    if (matchedOsm?.name) withBusinessName++;
    if (matchedOsm?.openingHours) withOpeningHours++;
    if (matchedMutations.length > 0) withMutations++;

    const pin: D2DAddressPin = {
      id: b.id,
      org_id: orgId,
      company_name: companyName,
      territory_id: territoryId,
      street: b.street,
      house_number: b.houseNumber,
      house_number_addition: [b.houseLetter, b.houseAddition].filter(Boolean).join(' ') || undefined,
      postal_code: b.postalCode,
      city: b.city,
      latitude: b.latitude,
      longitude: b.longitude,
      current_status: 'unvisited',
      is_commercial: true,
      business_name: businessName,
      branch,
      bag_gebruiksdoel: b.purpose,
      surface_area_m2: b.surfaceAreaM2,
      build_year: b.buildYear,
      pand_identificatie: b.pandId,
      nummeraanduiding_id: b.nummeraanduidingId,
      opening_hours: matchedOsm?.openingHours,
      business_phone: matchedOsm?.phone,
      business_website: matchedOsm?.website,
      business_email: matchedOsm?.email,
      mutations: matchedMutations.length > 0 ? matchedMutations : undefined,
      visits: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    commercialPins.push(pin);

    // Bereid ook een CRM Company record voor (voor 1-klik import naar CRM Bedrijven)
    if (matchedOsm?.name || matchedMutations.length > 0) {
      crmCompanies.push({
        org_id: orgId,
        company_name: companyName,
        name: businessName,
        industry: branch,
        website: matchedOsm?.website,
        domain: matchedOsm?.website ? matchedOsm.website.replace(/^https?:\/\//, '').split('/')[0] : undefined,
        phone: matchedOsm?.phone,
        size: b.surfaceAreaM2 ? `${b.surfaceAreaM2} m² BAG` : undefined,
        address: {
          street: `${b.street} ${b.houseNumber}${b.houseLetter || ''}${b.houseAddition || ''}`,
          city: b.city,
          postal_code: b.postalCode,
          country: 'Nederland',
        },
        contacts_count: 0,
        deals_count: 0,
      });
    }
  }

  onProgress?.({
    step: 'completed',
    stepLabel: 'B2B Enrichment Pipeline Voltooid!',
    bagBuildingsCount: commercialPins.length,
    enrichedOsmCount: withBusinessName,
    mutationsCount: regionMutations.length,
    message: `${commercialPins.length} bedrijfspanden geladen (${withBusinessName} met bedrijfsnaam, ${regionMutations.length} overheidsmutaties).`,
  });

  return {
    query: regionQuery,
    city,
    boundingBox: bbox,
    commercialPins,
    crmCompanies,
    regionMutations,
    stats: {
      totalBagCommercial: commercialPins.length,
      withBusinessName,
      withOpeningHours,
      withMutations,
      byPurpose,
    },
  };
}
