import { useEffect, useRef, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Territory, D2DAddressPin, D2DPinStatus } from '@/types';
import { useD2DStore } from '@/stores/d2dStore';
import { loadMapboxConfigFromFirestore, type MapboxConfig, DEFAULT_MAPBOX_CONFIG } from '@/services/mapboxService';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Compass,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Eye,
  Navigation,
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
  selectedPinId,
  onSelectPin,
  className = 'h-[360px] w-full',
  showD2DPins = true,
}: RayonMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const { pins: storePins, logVisit } = useD2DStore();
  const { organization, user } = useAuthStore();
  const orgId = organization?.id || user?.org_id || 'default_org';

  const [mapboxConfig, setMapboxConfig] = useState<MapboxConfig>(DEFAULT_MAPBOX_CONFIG);
  const [activePin, setActivePin] = useState<D2DAddressPin | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [canvasPan, setCanvasPan] = useState({ x: 0, y: 0 });
  const [showGoogleStreetView, setShowGoogleStreetView] = useState(false);

  // Select pins to display
  const activePins = useMemo(() => {
    const list = propPins || storePins;
    if (territory) {
      return list.filter((p) => p.territory_id === territory.id || !p.territory_id);
    }
    return list;
  }, [propPins, storePins, territory]);

  useEffect(() => {
    loadMapboxConfigFromFirestore(orgId).then((cfg) => {
      if (cfg) setMapboxConfig(cfg);
    });
  }, [orgId]);

  // Status Color Helper
  const getStatusColor = (status: D2DPinStatus) => {
    switch (status) {
      case 'deal_closed': return '#22c55e'; // Groen
      case 'not_home': return '#f59e0b';    // Amber/Geel
      case 'no_interest': return '#ef4444'; // Rood
      case 'appointment': return '#a855f7'; // Paars
      case 'do_not_knock': return '#0f172a';// Zwart/Kool
      default: return '#94a3b8';            // Grijs
    }
  };

  const getStatusLabel = (status: D2DPinStatus) => {
    switch (status) {
      case 'deal_closed': return 'Deal Gesloten 🟢';
      case 'not_home': return 'Niet Thuis 🟡';
      case 'no_interest': return 'Geen Interesse 🔴';
      case 'appointment': return 'Afspraak Gemaakt 🟣';
      case 'do_not_knock': return 'Niet Aanbellen ⛔';
      default: return 'Onbezocht ⚪';
    }
  };

  // 1. Initialize Mapbox GL if public token is available
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const token = mapboxConfig.publicToken?.trim();

    if (token && token.startsWith('pk.')) {
      try {
        mapboxgl.accessToken = token;

        // Default coordinates: territory center or Amsterdam
        let initialCenter: [number, number] = [4.8891, 52.3732];
        if (territory?.geometry?.coordinates?.[0]?.[0]) {
          const firstCoord = territory.geometry.coordinates[0][0];
          initialCenter = [firstCoord[0], firstCoord[1]];
        }

        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: mapboxConfig.customStyleUrl || 'mapbox://styles/mapbox/dark-v11',
          center: initialCenter,
          zoom: 13,
          attributionControl: false,
        });

        map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right');

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
                  'fill-color': territory.color || '#3b82f6',
                  'fill-opacity': 0.18,
                },
              });

              map.addLayer({
                id: `${sourceId}-line`,
                type: 'line',
                source: sourceId,
                paint: {
                  'line-color': territory.color || '#3b82f6',
                  'line-width': 2.5,
                  'line-dasharray': [2, 1],
                },
              });

              // Fit bounds around territory
              const coords = territory.geometry.coordinates[0];
              const bounds = coords.reduce(
                (b, coord) => b.extend(coord as [number, number]),
                new mapboxgl.LngLatBounds(coords[0] as [number, number], coords[0] as [number, number])
              );
              map.fitBounds(bounds, { padding: 40 });
            }
          }
        });

        mapRef.current = map;

        return () => {
          map.remove();
          mapRef.current = null;
        };
      } catch (err) {
        console.warn('Mapbox initialisatie fout:', err);
      }
    }
  }, [mapboxConfig.publicToken, mapboxConfig.customStyleUrl, territory]);

  // 2. Render Markers on Mapbox
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !showD2DPins) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    activePins.forEach((pin) => {
      const el = document.createElement('div');
      el.className = 'd2d-map-pin cursor-pointer transition-transform hover:scale-125';
      const color = getStatusColor(pin.current_status);

      el.innerHTML = `
        <div style="background-color: ${color}; width: 22px; height: 22px; border-radius: 50%; border: 2.5px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white; font-size: 9px; font-weight: bold;">
          ${pin.house_number.slice(0, 3)}
        </div>
      `;

      el.addEventListener('click', () => {
        setActivePin(pin);
        onSelectPin?.(pin);
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([pin.longitude, pin.latitude])
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });
  }, [activePins, mapLoaded, showD2DPins, onSelectPin]);

  // GPS User Geolocation
  const handleLocateUser = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserLocation({ lat, lng });

          if (mapRef.current) {
            mapRef.current.flyTo({ center: [lng, lat], zoom: 15, essential: true });
            new mapboxgl.Marker({ color: '#2563eb' })
              .setLngLat([lng, lat])
              .addTo(mapRef.current);
          }
        },
        (err) => console.warn('Locatie niet toegestaan:', err)
      );
    }
  };

  const hasLiveMapbox = Boolean(mapboxConfig.publicToken && mapboxConfig.publicToken.startsWith('pk.'));

  return (
    <div className={`relative rounded-2xl border border-border/70 overflow-hidden bg-card ${className}`}>
      {/* Real Mapbox Container */}
      {hasLiveMapbox ? (
        <div ref={mapContainerRef} className="h-full w-full" />
      ) : (
        /* Native High-Performance Vector Simulation (No Token Required) */
        <div className="relative h-full w-full bg-slate-950 flex flex-col justify-between p-4 overflow-hidden select-none">
          {/* Subtle Grid Lines */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)',
              backgroundSize: '24px 24px',
              transform: `translate(${canvasPan.x}px, ${canvasPan.y}px) scale(${canvasZoom})`,
            }}
          />

          {/* Territory & D2D Visual Canvas */}
          <div
            className="relative flex-1 flex items-center justify-center transition-transform duration-200"
            style={{
              transform: `translate(${canvasPan.x}px, ${canvasPan.y}px) scale(${canvasZoom})`,
            }}
          >
            {/* Territory Boundary Polygon */}
            {territory && (
              <div
                className="absolute rounded-3xl border-2 border-dashed p-12 transition-all flex flex-col items-center justify-center"
                style={{
                  borderColor: territory.color || '#3b82f6',
                  backgroundColor: `${territory.color || '#3b82f6'}12`,
                  width: '320px',
                  height: '220px',
                }}
              >
                <div
                  className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-white shadow-md flex items-center gap-1.5"
                  style={{ backgroundColor: territory.color || '#3b82f6' }}
                >
                  <MapPin className="h-3 w-3" />
                  <span>{territory.name}</span>
                </div>
                <p className="text-[10px] text-slate-300 mt-1">Rayon Polygoon actief</p>
              </div>
            )}

            {/* D2D Street Pins Cluster */}
            <div className="relative grid grid-cols-3 gap-8 z-10">
              {activePins.slice(0, 6).map((pin) => {
                const color = getStatusColor(pin.current_status);
                const isSelected = selectedPinId === pin.id || activePin?.id === pin.id;

                return (
                  <button
                    key={pin.id}
                    type="button"
                    onClick={() => {
                      setActivePin(pin);
                      onSelectPin?.(pin);
                    }}
                    className={`group relative flex flex-col items-center transition-all duration-200 cursor-pointer ${
                      isSelected ? 'scale-125 z-20' : 'hover:scale-115'
                    }`}
                  >
                    <div
                      className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg border-2 ${
                        isSelected ? 'border-white ring-4 ring-primary/40' : 'border-slate-800'
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {pin.house_number}
                    </div>
                    <span className="text-[9px] font-medium text-slate-300 mt-1 bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-700/60 whitespace-nowrap">
                      {pin.street} {pin.house_number}
                    </span>
                  </button>
                );
              })}

              {userLocation && (
                <div
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 flex flex-col items-center"
                  style={{ left: '50%', top: '50%' }}
                >
                  <div className="h-4 w-4 rounded-full bg-blue-500 border-2 border-white ring-4 ring-blue-500/40 animate-pulse" />
                  <span className="text-[9px] font-semibold text-blue-400 mt-1 bg-slate-900/90 px-1.5 py-0.5 rounded border border-blue-500/40">
                    Jouw GPS ({userLocation.lat.toFixed(3)}, {userLocation.lng.toFixed(3)})
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Mapbox Token Notice Banner */}
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 backdrop-blur-md text-xs">
            <div className="flex items-center gap-2 text-cyan-400">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span className="text-[11px]">
                Actieve Vector Previews. Voer je Mapbox Token in op <strong>Integraties</strong> voor live satelliet- en 3D-straten.
              </span>
            </div>
            <a
              href="/integrations"
              className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-[10px] font-semibold flex items-center gap-1 shrink-0"
            >
              <span>Koppel Token</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}

      {/* Floating Map Controls */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
        <Button
          size="icon"
          variant="secondary"
          onClick={handleLocateUser}
          className="h-8 w-8 rounded-xl bg-background/90 backdrop-blur shadow-md hover:bg-background"
          title="Mijn GPS Locatie"
        >
          <Compass className="h-4 w-4 text-primary" />
        </Button>
        {!hasLiveMapbox && (
          <>
            <Button
              size="icon"
              variant="secondary"
              onClick={() => setCanvasZoom((z) => Math.min(z + 0.2, 2.0))}
              className="h-8 w-8 rounded-xl bg-background/90 backdrop-blur shadow-md hover:bg-background"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              onClick={() => setCanvasZoom((z) => Math.max(z - 0.2, 0.6))}
              className="h-8 w-8 rounded-xl bg-background/90 backdrop-blur shadow-md hover:bg-background"
              title="Zoom Uit"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              onClick={() => {
                setCanvasZoom(1);
                setCanvasPan({ x: 0, y: 0 });
              }}
              className="h-8 w-8 rounded-xl bg-background/90 backdrop-blur shadow-md hover:bg-background"
              title="Reset Kaart"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>

      {/* Pin Quick Status Inspector Card (When Pin Clicked) */}
      {activePin && (
        <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 sm:w-80 z-20 p-3.5 rounded-2xl bg-card/95 border border-border/80 shadow-2xl backdrop-blur-md space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-start justify-between">
            <div>
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

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">Status:</span>
            <Badge
              className="text-[10px] font-semibold text-white"
              style={{ backgroundColor: getStatusColor(activePin.current_status) }}
            >
              {getStatusLabel(activePin.current_status)}
            </Badge>
          </div>

          {/* Quick Status Buttons for D2D Rep */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => {
                logVisit(activePin.id, 'deal_closed', 'Deal gesloten via snelle kaartknop');
                setActivePin({ ...activePin, current_status: 'deal_closed' });
              }}
              className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold text-center border border-emerald-500/30"
            >
              🟢 Deal
            </button>
            <button
              type="button"
              onClick={() => {
                logVisit(activePin.id, 'not_home', 'Niet thuis aangetroffen');
                setActivePin({ ...activePin, current_status: 'not_home' });
              }}
              className="p-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 text-[10px] font-semibold text-center border border-amber-500/30"
            >
              🟡 Niet Thuis
            </button>
            <button
              type="button"
              onClick={() => {
                logVisit(activePin.id, 'no_interest', 'Geen interesse gemeld');
                setActivePin({ ...activePin, current_status: 'no_interest' });
              }}
              className="p-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-600 dark:text-red-400 text-[10px] font-semibold text-center border border-red-500/30"
            >
              🔴 Geen Int.
            </button>
          </div>

          {/* Google Street View & Pand Inspectie Knop */}
          <button
            type="button"
            onClick={() => setShowGoogleStreetView(true)}
            className="w-full py-1.5 px-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold flex items-center justify-center gap-1.5 border border-blue-500/30 transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Google Street View & Satelliet (360°)</span>
          </button>
        </div>
      )}

      {/* Google Street View & Satelliet Modal */}
      <Dialog open={showGoogleStreetView} onOpenChange={setShowGoogleStreetView}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Eye className="h-5 w-5 text-blue-500" />
              <span>Google Street View & Satelliet Pandinspectie</span>
            </DialogTitle>
          </DialogHeader>
          {activePin && (
            <div className="space-y-3.5 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground text-sm">
                  {activePin.street} {activePin.house_number}{activePin.house_number_addition || ''}, {activePin.postal_code} {activePin.city}
                </span>
                <span>Coördinaten: {activePin.latitude.toFixed(4)}, {activePin.longitude.toFixed(4)}</span>
              </div>

              {/* Embedded Google Maps Satelliet & Pand Viewer */}
              <div className="relative w-full h-80 rounded-2xl border overflow-hidden shadow-inner bg-muted">
                <iframe
                  title="Google Maps Satellite"
                  src={`https://maps.google.com/maps?q=${activePin.latitude},${activePin.longitude}&t=k&z=19&ie=UTF8&iwloc=&output=embed`}
                  className="w-full h-full border-0"
                  loading="lazy"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t">
                <span className="text-[11px] text-muted-foreground">
                  Kadaster coördinaten gekoppeld aan Google Maps Street View
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${activePin.latitude},${activePin.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-sm transition-colors"
                  >
                    <span>Open 360° Street View</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${activePin.latitude},${activePin.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-input hover:bg-accent text-xs font-medium transition-colors"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    <span>Routebeschrijving</span>
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
