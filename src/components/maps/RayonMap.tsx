import { useEffect, useRef, useState, useMemo } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Territory, D2DAddressPin, D2DPinStatus } from '@/types';
import { useD2DStore } from '@/stores/d2dStore';
import {
  loadOpenMapConfigFromFirestore,
  type OpenMapConfig,
  DEFAULT_OPEN_MAP_CONFIG,
  OPEN_FREE_MAP_STYLES,
  calculateRouteOSRM,
  queryOverpassNearby,
  reverseGeocode,
} from '@/services/openMapService';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Compass,
  Layers,
  Sparkles,
  ExternalLink,
  Navigation,
  Search,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface RayonMapProps {
  territory?: Territory | null;
  pins?: D2DAddressPin[];
  selectedPinId?: string | null;
  onSelectPin?: (pin: D2DAddressPin) => void;
  className?: string;
  showD2DPins?: boolean;
  interactive?: boolean;
}

export function RayonMap({
  territory,
  pins: propPins,
  selectedPinId: _selectedPinId,
  onSelectPin,
  className = 'h-[460px] w-full',
  showD2DPins = true,
}: RayonMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);

  const { pins: storePins, logVisit } = useD2DStore();
  const { organization, user } = useAuthStore();
  const orgId = organization?.id || user?.org_id || 'default_org';

  const [openMapConfig, setOpenMapConfig] = useState<OpenMapConfig>(DEFAULT_OPEN_MAP_CONFIG);
  const [activePin, setActivePin] = useState<D2DAddressPin | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [nearbyPOIs, setNearbyPOIs] = useState<Array<{ id: number; name?: string; tags: Record<string, string> }>>([]);
  const [isLoadingPOIs, setIsLoadingPOIs] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distanceMeters: number; durationSeconds: number } | null>(null);

  // Toon zowel B2B bedrijfspanden (is_commercial) als daadwerkelijk bezochte deuren op de kaart (negeer reguliere woonhuizen)
  const activePins = useMemo(() => {
    const list = (propPins || storePins).filter((p) => p.is_commercial || p.current_status !== 'unvisited');
    if (territory) {
      return list.filter((p) => p.territory_id === territory.id || !p.territory_id);
    }
    return list;
  }, [propPins, storePins, territory]);

  useEffect(() => {
    loadOpenMapConfigFromFirestore(orgId).then((cfg) => {
      if (cfg) setOpenMapConfig(cfg);
    });
  }, [orgId]);

  // Status Color Helper
  const getStatusColor = (status: D2DPinStatus, isCommercial?: boolean, hasMutations?: boolean) => {
    switch (status) {
      case 'deal_closed': return '#22c55e'; // Emerald
      case 'not_home': return '#f59e0b';    // Amber
      case 'no_interest': return '#ef4444'; // Red
      case 'appointment': return '#a855f7'; // Purple
      case 'do_not_knock': return '#0f172a';// Charcoal
      default:
        if (hasMutations) return '#ea580c'; // Oranje/Goud voor bedrijfspand met nieuwe vergunning/mutatie
        if (isCommercial) return '#0284c7'; // Zakelijk Blauw voor B2B bedrijfspand
        return '#64748b';
    }
  };

  const getStatusLabel = (status: D2DPinStatus, isCommercial?: boolean) => {
    switch (status) {
      case 'deal_closed': return 'Deal Gesloten 🟢';
      case 'not_home': return 'Niet Aanwezig 🟡';
      case 'no_interest': return 'Geen Interesse 🔴';
      case 'appointment': return 'Afspraak Gemaakt 🟣';
      case 'do_not_knock': return 'Niet Aanbellen ⛔';
      default: return isCommercial ? 'B2B Bedrijfspand (Te Bezoeken) 🏢' : 'Onbezocht Pand (Live Kadaster) ⚪';
    }
  };

  // 1. Initialize MapLibre GL JS (100% keyless with OpenFreeMap vector tiles)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    let initialCenter: [number, number] = openMapConfig.defaultCenter || [4.8891, 52.3732];
    if (territory?.geometry?.coordinates?.[0]?.[0]) {
      const firstCoord = territory.geometry.coordinates[0][0];
      initialCenter = [firstCoord[0], firstCoord[1]];
    } else if (activePins.length > 0) {
      initialCenter = [activePins[0].longitude, activePins[0].latitude];
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: openMapConfig.styleUrl || 'https://tiles.openfreemap.org/styles/liberty',
      center: initialCenter,
      zoom: openMapConfig.defaultZoom || 15,
      attributionControl: { compact: true },
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');

    // On-Demand Click op de kaart: Haal adres direct live op via Kadaster PDOK / Photon zonder iets op te slaan!
    map.on('click', async (e) => {
      const target = e.originalEvent.target as HTMLElement | null;
      if (target?.closest('.d2d-pin-element')) {
        return; // Klik was op een bestaande gekleurde pin
      }

      const lat = e.lngLat.lat;
      const lng = e.lngLat.lng;

      const resolved = await reverseGeocode(lat, lng);
      if (resolved) {
        const tempPin: D2DAddressPin = {
          id: `on_demand_${Date.now()}`,
          org_id: orgId,
          company_name: user?.company_name || 'CRMos',
          territory_id: territory?.id,
          street: resolved.street,
          house_number: resolved.houseNumber || '',
          house_number_addition: resolved.houseNumberAddition,
          postal_code: resolved.postalCode || '',
          city: resolved.city || 'Nederland',
          latitude: lat,
          longitude: lng,
          current_status: 'unvisited',
          visits: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setActivePin(tempPin);
        setNearbyPOIs([]);
        setRouteInfo(null);
      }
    });

    map.on('load', () => {
      setMapLoaded(true);

      // Add territory polygon layer if coordinates exist
      if (territory?.geometry?.coordinates?.length) {
        const sourceId = `territory-poly-${territory.id}`;
        if (!map.getSource(sourceId)) {
          map.addSource(sourceId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: { name: territory.name, color: territory.color },
              geometry: territory.geometry,
            },
          });

          map.addLayer({
            id: `${sourceId}-fill`,
            type: 'fill',
            source: sourceId,
            paint: {
              'fill-color': territory.color || '#0284c7',
              'fill-opacity': 0.16,
            },
          });

          map.addLayer({
            id: `${sourceId}-line`,
            type: 'line',
            source: sourceId,
            paint: {
              'line-color': territory.color || '#0284c7',
              'line-width': 2.5,
              'line-dasharray': [2, 1],
            },
          });

          // Auto fit bounds
          try {
            const coords = territory.geometry.coordinates[0];
            const bounds = coords.reduce(
              (b, coord) => b.extend(coord as [number, number]),
              new maplibregl.LngLatBounds(coords[0] as [number, number], coords[0] as [number, number])
            );
            map.fitBounds(bounds, { padding: 45, maxZoom: 16 });
          } catch (e) {
            console.warn('Fitbounds error:', e);
          }
        }
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [openMapConfig.styleUrl, territory?.id]);

  // 2. Render D2D & B2B Pins on MapLibre
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !showD2DPins) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    activePins.forEach((pin) => {
      const el = document.createElement('div');
      el.className = 'd2d-pin-element cursor-pointer transition-transform hover:scale-125';
      const hasMutations = Boolean(pin.mutations && pin.mutations.length > 0);
      const color = getStatusColor(pin.current_status, pin.is_commercial, hasMutations);
      const borderStyle = hasMutations
        ? '2.5px solid #fde047'
        : '2.5px solid #ffffff';

      el.innerHTML = `
        <div title="${pin.business_name || `${pin.street} ${pin.house_number}`}" style="background-color: ${color}; width: 26px; height: 26px; border-radius: ${pin.is_commercial ? '8px' : '50%'}; border: ${borderStyle}; box-shadow: 0 3px 8px rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: 800; font-family: system-ui, sans-serif;">
          ${pin.house_number.slice(0, 4)}
        </div>
      `;

      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        setActivePin(pin);
        onSelectPin?.(pin);
        setNearbyPOIs([]);
        setRouteInfo(null);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([pin.longitude, pin.latitude])
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });

    // Als er net nieuwe B2B bedrijfspanden zijn ingeladen (en geen vaste territory polygoon), zoom automatisch naar de panden
    if (activePins.length > 0 && !territory?.geometry?.coordinates?.length) {
      try {
        const bounds = activePins.slice(0, 150).reduce(
          (b, p) => b.extend([p.longitude, p.latitude]),
          new maplibregl.LngLatBounds(
            [activePins[0].longitude, activePins[0].latitude],
            [activePins[0].longitude, activePins[0].latitude]
          )
        );
        mapRef.current.fitBounds(bounds, { padding: 55, maxZoom: 16, duration: 800 });
      } catch {
        // ignore bounds error
      }
    }
  }, [activePins, mapLoaded, showD2DPins, onSelectPin, territory?.geometry?.coordinates?.length]);

  // 3. User Geolocation (GPS)
  const handleLocateUser = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserLocation({ lat, lng });

          if (mapRef.current) {
            mapRef.current.flyTo({ center: [lng, lat], zoom: 16, essential: true });

            if (userMarkerRef.current) {
              userMarkerRef.current.remove();
            }

            const el = document.createElement('div');
            el.innerHTML = `
              <div style="background-color: #0284c7; width: 18px; height: 18px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 0 6px rgba(2, 132, 199, 0.35); animation: pulse 2s infinite;"></div>
            `;

            userMarkerRef.current = new maplibregl.Marker({ element: el })
              .setLngLat([lng, lat])
              .addTo(mapRef.current);
          }
        },
        (err) => console.warn('GPS locatie niet toegankelijk:', err)
      );
    }
  };

  // 4. Switch Style dynamically
  const handleChangeStyle = (styleUrl: string) => {
    setOpenMapConfig((prev) => ({ ...prev, styleUrl }));
    if (mapRef.current) {
      mapRef.current.setStyle(styleUrl);
    }
  };

  // 5. Query Overpass for nearby POIs around active pin
  const handleLoadNearbyPOIs = async () => {
    if (!activePin) return;
    setIsLoadingPOIs(true);
    try {
      const items = await queryOverpassNearby(activePin.latitude, activePin.longitude, 400, 'amenity');
      setNearbyPOIs(items.slice(0, 8));
    } catch (err) {
      console.warn('Fout bij ophalen voorzieningen:', err);
    } finally {
      setIsLoadingPOIs(false);
    }
  };

  // 6. Calculate OSRM route from user location to pin
  const handleCalculateRoute = async () => {
    if (!activePin || !userLocation) {
      handleLocateUser();
      return;
    }
    try {
      const result = await calculateRouteOSRM(
        [userLocation.lng, userLocation.lat],
        [activePin.longitude, activePin.latitude],
        'foot'
      );
      if (result) {
        setRouteInfo(result);

        // Render line on map
        if (mapRef.current) {
          const routeSourceId = 'osrm-active-route';
          if (mapRef.current.getSource(routeSourceId)) {
            (mapRef.current.getSource(routeSourceId) as maplibregl.GeoJSONSource).setData(result.geometry);
          } else {
            mapRef.current.addSource(routeSourceId, {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: result.geometry,
              },
            });
            mapRef.current.addLayer({
              id: 'osrm-active-route-line',
              type: 'line',
              source: routeSourceId,
              paint: {
                'line-color': '#0284c7',
                'line-width': 4,
                'line-dasharray': [1, 1.5],
              },
            });
          }
        }
      }
    } catch (err) {
      console.warn('Fout bij routeberekening:', err);
    }
  };

  return (
    <div className={`relative rounded-2xl border border-border/80 overflow-hidden bg-card shadow-sm ${className}`}>
      {/* Real Open-Source MapLibre Container */}
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* Floating Map Controls (Top-Left) */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
        <Button
          size="icon"
          variant="secondary"
          onClick={handleLocateUser}
          className="h-8 w-8 rounded-xl bg-background/90 backdrop-blur shadow-md hover:bg-background"
          title="Mijn GPS Locatie"
        >
          <Compass className="h-4 w-4 text-sky-600 dark:text-sky-400" />
        </Button>
      </div>

      {/* Style Switcher Pill (Top-Right) */}
      <div className="absolute top-3 right-12 z-10 hidden sm:flex items-center gap-1 p-1 rounded-xl bg-background/90 backdrop-blur-md border border-border/70 shadow-sm text-xs">
        <Layers className="h-3.5 w-3.5 text-muted-foreground ml-1.5 mr-0.5" />
        {OPEN_FREE_MAP_STYLES.map((st) => (
          <button
            key={st.id}
            type="button"
            onClick={() => handleChangeStyle(st.url)}
            className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all ${
              openMapConfig.styleUrl === st.url
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {st.id === 'liberty' ? 'Liberty' : st.id === 'positron' ? 'Positron' : 'Bright'}
          </button>
        ))}
      </div>

      {/* Pin Quick Status Inspector Card */}
      {activePin && (
        <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 sm:w-92 z-20 p-3.5 rounded-2xl bg-card/95 border border-border/80 shadow-2xl backdrop-blur-md space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-start justify-between gap-2">
            <div>
              {activePin.business_name && (
                <p className="font-extrabold text-sm text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 shrink-0" />
                  <span>{activePin.business_name}</span>
                </p>
              )}
              <p className="font-bold text-sm text-foreground">
                {activePin.street} {activePin.house_number}{activePin.house_number_addition || ''}
              </p>
              <p className="text-xs text-muted-foreground">
                {activePin.postal_code} {activePin.city}
              </p>
            </div>
            <button
              onClick={() => setActivePin(null)}
              className="text-xs text-muted-foreground hover:text-foreground font-semibold px-1"
            >
              ✕
            </button>
          </div>

          {/* B2B Bedrijfspand Verrijking (Kadaster BAG + OSM Overpass) */}
          {(activePin.is_commercial || activePin.branch || activePin.surface_area_m2 || activePin.opening_hours) && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {activePin.branch && (
                <Badge variant="secondary" className="text-[10px] font-semibold bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30">
                  {activePin.branch}
                </Badge>
              )}
              {activePin.surface_area_m2 ? (
                <Badge variant="outline" className="text-[10px] font-mono">
                  {activePin.surface_area_m2} m² BAG
                </Badge>
              ) : null}
              {activePin.build_year ? (
                <Badge variant="outline" className="text-[10px] font-mono">
                  Bouwjaar {activePin.build_year}
                </Badge>
              ) : null}
              {activePin.opening_hours && (
                <span className="text-[10px] text-muted-foreground w-full truncate" title={activePin.opening_hours}>
                  🕒 {activePin.opening_hours}
                </span>
              )}
            </div>
          )}

          {/* Overheid.nl KOOP SRU Mutaties (Vergunningen / Faillissementen) */}
          {activePin.mutations && activePin.mutations.length > 0 && (
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                ⚡ Officiële Bekendmaking ({activePin.mutations[0].type === 'faillissement' ? 'Faillissement' : 'Vergunning'})
              </p>
              <p className="text-[11px] font-medium text-foreground line-clamp-2">
                {activePin.mutations[0].title}
              </p>
              {activePin.mutations[0].url && (
                <a
                  href={activePin.mutations[0].url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-300 underline font-semibold"
                >
                  <span>Bekijk publicatie ({activePin.mutations[0].date})</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">Status:</span>
              <Badge
                className="text-[10px] font-semibold text-white"
                style={{
                  backgroundColor: getStatusColor(
                    activePin.current_status,
                    activePin.is_commercial,
                    Boolean(activePin.mutations && activePin.mutations.length > 0)
                  ),
                }}
              >
                {getStatusLabel(activePin.current_status, activePin.is_commercial)}
              </Badge>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">
              {activePin.latitude.toFixed(4)}, {activePin.longitude.toFixed(4)}
            </span>
          </div>

          {/* Quick Door Logging Buttons for Rep (Slaat pas op in database bij klik!) */}
          <div className="grid grid-cols-3 gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={() => {
                const saved = logVisit(activePin.id, 'deal_closed', 'Deal gesloten', undefined, undefined, undefined, activePin);
                setActivePin(saved || { ...activePin, current_status: 'deal_closed' });
              }}
              className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold text-center border border-emerald-500/30"
            >
              🟢 Deal
            </button>
            <button
              type="button"
              onClick={() => {
                const saved = logVisit(activePin.id, 'not_home', 'Niet thuis', undefined, undefined, undefined, activePin);
                setActivePin(saved || { ...activePin, current_status: 'not_home' });
              }}
              className="p-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 text-[10px] font-semibold text-center border border-amber-500/30"
            >
              🟡 Niet Thuis
            </button>
            <button
              type="button"
              onClick={() => {
                const saved = logVisit(activePin.id, 'no_interest', 'Geen interesse', undefined, undefined, undefined, activePin);
                setActivePin(saved || { ...activePin, current_status: 'no_interest' });
              }}
              className="p-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-600 dark:text-red-400 text-[10px] font-semibold text-center border border-red-500/30"
            >
              🔴 Geen Int.
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => {
                const saved = logVisit(activePin.id, 'appointment', 'Afspraak ingepland', undefined, undefined, undefined, activePin);
                setActivePin(saved || { ...activePin, current_status: 'appointment' });
              }}
              className="p-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-600 dark:text-purple-400 text-[10px] font-semibold text-center border border-purple-500/30"
            >
              🟣 Afspraak
            </button>
            <button
              type="button"
              onClick={() => {
                const saved = logVisit(activePin.id, 'do_not_knock', 'Niet aanbellen / Sticker', undefined, undefined, undefined, activePin);
                setActivePin(saved || { ...activePin, current_status: 'do_not_knock' });
              }}
              className="p-1.5 rounded-lg bg-slate-500/15 hover:bg-slate-500/25 text-slate-700 dark:text-slate-300 text-[10px] font-semibold text-center border border-slate-500/30"
            >
              ⛔ Niet Bellen
            </button>
          </div>

          {/* Actions: OpenStreetMap Inspect & OSRM Walk Route */}
          <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-border/50">
            <button
              type="button"
              onClick={() => setShowInspectionModal(true)}
              className="py-1.5 px-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold flex items-center justify-center gap-1 border border-primary/20 transition-colors"
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Pand & Omgeving</span>
            </button>

            <button
              type="button"
              onClick={handleCalculateRoute}
              className="py-1.5 px-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-semibold flex items-center justify-center gap-1 border border-sky-500/20 transition-colors"
            >
              <Navigation className="h-3.5 w-3.5" />
              <span>OSRM Looproute</span>
            </button>
          </div>

          {routeInfo && (
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs text-sky-700 dark:text-sky-300 flex items-center justify-between">
              <span>Loopafstand: <strong>{(routeInfo.distanceMeters / 1000).toFixed(2)} km</strong></span>
              <span>Reistijd: <strong>{Math.round(routeInfo.durationSeconds / 60)} min</strong> te voet</span>
            </div>
          )}
        </div>
      )}

      {/* Open-Source Pand & Omgeving Inspectie Modal */}
      <Dialog open={showInspectionModal} onOpenChange={setShowInspectionModal}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-primary" />
              <span>Open-Source Pandinspectie & Omgevingsdata</span>
            </DialogTitle>
          </DialogHeader>

          {activePin && (
            <div className="space-y-4 pt-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-muted-foreground p-3 rounded-xl bg-muted/40 border">
                <div>
                  <p className="font-bold text-foreground text-sm">
                    {activePin.street} {activePin.house_number}{activePin.house_number_addition || ''}
                  </p>
                  <p>{activePin.postal_code} {activePin.city} &bull; Kadaster BAG Geometrie</p>
                </div>
                <div className="font-mono text-[11px] text-right">
                  <span>GPS: {activePin.latitude.toFixed(5)}, {activePin.longitude.toFixed(5)}</span>
                </div>
              </div>

              {/* OpenStreetMap Interactive Embed */}
              <div className="relative w-full h-64 rounded-xl border overflow-hidden shadow-inner bg-muted">
                <iframe
                  title="OpenStreetMap Inspection"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${activePin.longitude - 0.002}%2C${activePin.latitude - 0.0015}%2C${activePin.longitude + 0.002}%2C${activePin.latitude + 0.0015}&layer=mapnik&marker=${activePin.latitude}%2C${activePin.longitude}`}
                  className="w-full h-full border-0"
                  loading="lazy"
                />
              </div>

              {/* Overpass Nearby POIs Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold flex items-center gap-1.5">
                    <Search className="h-3.5 w-3.5 text-primary" />
                    <span>Overpass API Omgevingsanalyse (Straal 400m)</span>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLoadNearbyPOIs}
                    disabled={isLoadingPOIs}
                    className="h-7 text-xs rounded-lg gap-1 border-primary/30 text-primary"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>{isLoadingPOIs ? 'Scannen...' : 'Zoek Voorzieningen'}</span>
                  </Button>
                </div>

                {nearbyPOIs.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {nearbyPOIs.map((poi) => (
                      <div key={poi.id} className="p-2 rounded-lg bg-muted/30 border border-border/50">
                        <p className="font-semibold text-foreground truncate">{poi.name || 'Voorziening'}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-mono">
                          {poi.tags.amenity || poi.tags.shop || 'Object'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground italic">
                    Klik op &quot;Zoek Voorzieningen&quot; om horeca, winkels en openbare faciliteiten rond dit pand op te vragen via OpenStreetMap Overpass QL.
                  </p>
                )}
              </div>

              {/* Navigation Action Links */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  100% Open-Source &amp; Privacy-vriendelijk (OpenStreetMap &bull; OSRM &bull; PDOK)
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${activePin.latitude}&mlon=${activePin.longitude}#map=19/${activePin.latitude}/${activePin.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium shadow-sm transition-colors"
                  >
                    <span>Open in OSM</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <a
                    href={`https://map.project-osrm.org/?z=17&center=${activePin.latitude}%2C${activePin.longitude}&loc=${activePin.latitude}%2C${activePin.longitude}&hl=nl`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-input hover:bg-accent text-xs font-medium transition-colors"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    <span>OSRM Navigatie</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
