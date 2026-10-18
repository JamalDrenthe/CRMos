import { useState } from 'react';
import type { D2DAddressPin, D2DPinStatus } from '@/types';
import { useD2DStore } from '@/stores/d2dStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Sparkles,
  Phone,
  Globe,
  Clock,
  MapPin,
  X,
  Navigation,
  Euro,
  Search,
  ExternalLink,
} from 'lucide-react';

interface FieldBuildingPopupProps {
  pin: D2DAddressPin | null;
  onClose: () => void;
  onOpenSaleModal: () => void;
  onCalculateRoute?: () => void;
  routeInfo?: { distanceMeters: number; durationSeconds: number } | null;
  onOpenInspectionModal?: () => void;
}

export function FieldBuildingPopup({
  pin,
  onClose,
  onOpenSaleModal,
  onCalculateRoute,
  routeInfo,
  onOpenInspectionModal,
}: FieldBuildingPopupProps) {
  const { logVisit } = useD2DStore();
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');

  if (!pin) return null;

  const getStatusColor = (status: D2DPinStatus, isCommercial?: boolean) => {
    switch (status) {
      case 'deal_closed': return '#10b981'; // Groen
      case 'not_home': return '#f59e0b';    // Geel/Amber
      case 'no_interest': return '#ef4444'; // Rood
      case 'appointment': return '#8b5cf6'; // Paars
      case 'do_not_knock': return '#0f172a';// Zwart
      default:
        return isCommercial ? '#0284c7' : '#64748b';
    }
  };

  const getStatusLabel = (status: D2DPinStatus, isCommercial?: boolean) => {
    switch (status) {
      case 'deal_closed': return 'Deal Gesloten 🟢';
      case 'not_home': return 'Niet Aanwezig 🟡';
      case 'no_interest': return 'Geen Interesse 🔴';
      case 'appointment': return 'Afspraak Gemaakt 🟣';
      case 'do_not_knock': return 'Niet Aanbellen ⛔';
      default: return isCommercial ? 'B2B Bedrijfspand (Te Bezoeken) 🏢' : 'Onbezocht Pand ⚪';
    }
  };

  const handleQuickStatus = (status: D2DPinStatus, defaultNote: string) => {
    logVisit(pin.id, status, defaultNote, undefined, undefined, undefined, pin);
  };

  return (
    <div className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:right-4 sm:left-auto sm:w-[420px] max-h-[85vh] z-30 flex flex-col rounded-3xl bg-card/95 border border-border/80 shadow-2xl backdrop-blur-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-250">
      {/* Grab bar on mobile */}
      <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mt-2 sm:hidden shrink-0" />

      {/* Header Strip */}
      <div className="p-4 sm:p-5 border-b bg-muted/20 relative space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {pin.business_name ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-extrabold text-base sm:text-lg text-foreground tracking-tight truncate">
                  {pin.business_name}
                </h3>
                <Badge className="bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30 text-[10px] font-semibold">
                  🏢 B2B
                </Badge>
              </div>
            ) : (
              <h3 className="font-extrabold text-base text-foreground tracking-tight">
                {pin.street} {pin.house_number}{pin.house_number_addition || ''}
              </h3>
            )}

            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span>
                {pin.street} {pin.house_number}{pin.house_number_addition || ''}, {pin.postal_code} {pin.city}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center text-xs transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Status Pill & Route Info */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <Badge
            className="text-[11px] font-semibold text-white px-2.5 py-0.5 shadow-xs"
            style={{ backgroundColor: getStatusColor(pin.current_status, pin.is_commercial) }}
          >
            {getStatusLabel(pin.current_status, pin.is_commercial)}
          </Badge>

          {routeInfo ? (
            <span className="text-[11px] font-medium text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-lg border border-sky-500/20">
              🚶 {(routeInfo.distanceMeters / 1000).toFixed(2)} km &bull; {Math.round(routeInfo.durationSeconds / 60)} min
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground font-mono">
              {pin.latitude.toFixed(4)}, {pin.longitude.toFixed(4)}
            </span>
          )}
        </div>
      </div>

      {/* PRIMARY SALESDOCK CTA: SALE REGISTREREN */}
      <div className="p-4 pb-2 bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent">
        <Button
          type="button"
          onClick={onOpenSaleModal}
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          <Sparkles className="h-4 w-4 text-emerald-200 animate-pulse" />
          <span>SALE REGISTREREN (Deal Sluiten)</span>
          <Euro className="h-4 w-4 text-emerald-200" />
        </Button>
      </div>

      {/* Secondary Quick Door Status Actions (Salesdock Grid) */}
      <div className="px-4 py-2 space-y-1.5">
        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
          Snelle Deurstatus Registratie
        </span>
        <div className="grid grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={() => handleQuickStatus('not_home', 'Niet aanwezig')}
            className={`p-2 rounded-xl text-[11px] font-semibold border transition-all text-center flex flex-col items-center justify-center gap-0.5 ${
              pin.current_status === 'not_home'
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/25'
            }`}
          >
            <span>🟡</span>
            <span className="truncate">Niet Thuis</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickStatus('no_interest', 'Geen interesse')}
            className={`p-2 rounded-xl text-[11px] font-semibold border transition-all text-center flex flex-col items-center justify-center gap-0.5 ${
              pin.current_status === 'no_interest'
                ? 'bg-red-500 text-white border-red-600 shadow-xs'
                : 'bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/25'
            }`}
          >
            <span>🔴</span>
            <span className="truncate">Geen Int.</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickStatus('appointment', 'Afspraak ingepland')}
            className={`p-2 rounded-xl text-[11px] font-semibold border transition-all text-center flex flex-col items-center justify-center gap-0.5 ${
              pin.current_status === 'appointment'
                ? 'bg-purple-500 text-white border-purple-600 shadow-xs'
                : 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/25'
            }`}
          >
            <span>🟣</span>
            <span className="truncate">Afspraak</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickStatus('do_not_knock', 'Colportageverbod')}
            className={`p-2 rounded-xl text-[11px] font-semibold border transition-all text-center flex flex-col items-center justify-center gap-0.5 ${
              pin.current_status === 'do_not_knock'
                ? 'bg-slate-800 text-white border-slate-900 shadow-xs'
                : 'bg-slate-500/10 hover:bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-500/25'
            }`}
          >
            <span>⛔</span>
            <span className="truncate">Niet Bellen</span>
          </button>
        </div>
      </div>

      {/* Tabs Selector: Pandspecificaties vs Historie */}
      <div className="px-4 pt-2 border-t flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('details')}
          className={`pb-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'details'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          <span>Bedrijfs- & Pandspecificaties</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`pb-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'history'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>Bezoekhistorie ({pin.visits?.length || 0})</span>
        </button>
      </div>

      {/* Scrollable Tab Body */}
      <div className="p-4 pt-2 overflow-y-auto space-y-3 flex-1 text-xs">
        {activeTab === 'details' ? (
          <div className="space-y-3">
            {/* Bedrijfsinformatie Badges & Contact */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-muted/30 border space-y-0.5">
                <span className="text-[10px] text-muted-foreground block font-medium">Branche / Sector</span>
                <span className="font-bold text-foreground truncate block">
                  {pin.branch || 'Zakelijke Dienstverlening'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-muted/30 border space-y-0.5">
                <span className="text-[10px] text-muted-foreground block font-medium">BAG Gebruiksdoel</span>
                <span className="font-bold text-foreground truncate block">
                  {pin.bag_gebruiksdoel || 'Bedrijfsfunctie'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-muted/30 border space-y-0.5">
                <span className="text-[10px] text-muted-foreground block font-medium">Oppervlakte</span>
                <span className="font-bold text-foreground">
                  {pin.surface_area_m2 ? `${pin.surface_area_m2} m²` : 'Onbekend'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-muted/30 border space-y-0.5">
                <span className="text-[10px] text-muted-foreground block font-medium">Bouwjaar</span>
                <span className="font-bold text-foreground font-mono">
                  {pin.build_year || 'Onbekend'}
                </span>
              </div>
            </div>

            {/* Direct Contact Channels */}
            {(pin.business_phone || pin.business_website || pin.opening_hours) && (
              <div className="p-3 rounded-2xl bg-muted/20 border space-y-2">
                {pin.business_phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-primary" /> Telefoon
                    </span>
                    <a
                      href={`tel:${pin.business_phone}`}
                      className="font-bold text-primary hover:underline"
                    >
                      {pin.business_phone}
                    </a>
                  </div>
                )}

                {pin.business_website && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-primary" /> Website
                    </span>
                    <a
                      href={pin.business_website.startsWith('http') ? pin.business_website : `https://${pin.business_website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-primary hover:underline flex items-center gap-1 truncate max-w-[200px]"
                    >
                      <span className="truncate">{pin.business_website.replace(/^https?:\/\//, '')}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </div>
                )}

                {pin.opening_hours && (
                  <div className="flex items-start justify-between gap-2 pt-1 border-t border-border/50">
                    <span className="text-muted-foreground flex items-center gap-1.5 shrink-0">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" /> Openingstijden
                    </span>
                    <span className="font-medium text-right text-foreground">
                      {pin.opening_hours}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Action Bar: Looproute & Omgeving */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {onCalculateRoute && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCalculateRoute}
                  className="rounded-xl text-xs gap-1.5 h-8 border-sky-500/30 text-sky-600 dark:text-sky-400 bg-sky-500/10 hover:bg-sky-500/20"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  <span>OSRM Looproute</span>
                </Button>
              )}

              {onOpenInspectionModal && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onOpenInspectionModal}
                  className="rounded-xl text-xs gap-1.5 h-8 border-border"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span>Omgeving Scannen</span>
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* Bezoekhistorie Tab */
          <div className="space-y-2">
            {pin.visits && pin.visits.length > 0 ? (
              pin.visits.map((v) => (
                <div key={v.id} className="p-3 rounded-xl bg-muted/30 border space-y-1">
                  <div className="flex items-center justify-between">
                    <Badge
                      className="text-[10px] text-white"
                      style={{ backgroundColor: getStatusColor(v.status) }}
                    >
                      {getStatusLabel(v.status)}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(v.visited_at).toLocaleString('nl-NL', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-foreground font-medium">{v.notes || 'Geen toelichting'}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <span>Door: {v.agent_name || 'Agent'}</span>
                  </p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-6 italic text-xs">
                Nog geen eerdere bezoeken geregistreerd voor dit pand.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
