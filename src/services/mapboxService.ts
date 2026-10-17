/**
 * @deprecated Vervangen door openMapService.ts
 * Dit bestand dient als backwards-compatibele doorverwijzing naar de 100% open-source MapLibre GL & OpenFreeMap architectuur.
 */
export * from './openMapService';

export interface MapboxConfig {
  enabled: boolean;
  publicToken?: string;
  customStyleUrl?: string;
  defaultZoom?: number;
  defaultCenter?: [number, number];
  updatedAt?: string;
}

export const DEFAULT_MAPBOX_CONFIG: MapboxConfig = {
  enabled: true,
  publicToken: '',
  customStyleUrl: 'https://tiles.openfreemap.org/styles/liberty',
  defaultZoom: 14,
  defaultCenter: [4.8891, 52.3732],
};

export const POPULAR_MAPBOX_STYLES = [
  {
    id: 'liberty',
    name: 'OpenFreeMap Liberty',
    url: 'https://tiles.openfreemap.org/styles/liberty',
    description: 'Modern open-source vectorstijl.',
  },
  {
    id: 'positron',
    name: 'OpenFreeMap Positron',
    url: 'https://tiles.openfreemap.org/styles/positron',
    description: 'Minimalistisch licht vectorthema.',
  },
  {
    id: 'bright',
    name: 'OpenFreeMap Bright',
    url: 'https://tiles.openfreemap.org/styles/bright',
    description: 'Helder contrastrijk vectorthema.',
  },
];

export async function loadMapboxConfigFromFirestore(orgId: string): Promise<MapboxConfig> {
  const cfg = await import('./openMapService').then((m) => m.loadOpenMapConfigFromFirestore(orgId));
  return {
    enabled: cfg.enabled,
    publicToken: '',
    customStyleUrl: cfg.styleUrl,
    defaultZoom: cfg.defaultZoom,
    defaultCenter: cfg.defaultCenter,
    updatedAt: cfg.updatedAt,
  };
}

export async function saveMapboxConfigToFirestore(config: MapboxConfig, orgId: string): Promise<void> {
  const { saveOpenMapConfigToFirestore, DEFAULT_OPEN_MAP_CONFIG } = await import('./openMapService');
  await saveOpenMapConfigToFirestore({
    ...DEFAULT_OPEN_MAP_CONFIG,
    enabled: config.enabled,
    styleUrl: config.customStyleUrl || DEFAULT_OPEN_MAP_CONFIG.styleUrl,
    defaultZoom: config.defaultZoom || DEFAULT_OPEN_MAP_CONFIG.defaultZoom,
    defaultCenter: config.defaultCenter || DEFAULT_OPEN_MAP_CONFIG.defaultCenter,
  }, orgId);
}

export async function verifyMapboxToken(_token: string): Promise<{ valid: boolean; message: string }> {
  return {
    valid: true,
    message: 'OpenFreeMap vector tiles vereisen géén token of API-key. Alles werkt direct en onbeperkt!',
  };
}
