import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { D2DAddressPin, D2DPinStatus, D2DVisitLog, Territory } from '@/types';
import {
  saveD2DPinToFirestore,
  deleteD2DPinFromFirestore,
  subscribeToD2DPins,
} from '@/services/firestoreService';
import { useAuthStore } from '@/stores/authStore';

const generateId = () => Math.random().toString(36).substring(2, 15);

// Realistic initial Dutch seed pins for Amsterdam, Rotterdam and Utrecht D2D routes
const initialD2DPins: D2DAddressPin[] = [
  // Amsterdam Centrum - Singel
  {
    id: 'pin_ams_01',
    org_id: 'default_org',
    company_name: 'CRMos',
    territory_id: 'terr_ams_01',
    street: 'Singel',
    house_number: '240',
    postal_code: '1012 DH',
    city: 'Amsterdam',
    latitude: 52.3732,
    longitude: 4.8891,
    current_status: 'deal_closed',
    last_visit_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    assigned_agent_id: 'agent_jamal',
    assigned_agent_name: 'Jamal Drenthe',
    deal_id: 'demo_d1',
    visits: [
      {
        id: 'v1',
        visited_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        agent_id: 'agent_jamal',
        agent_name: 'Jamal Drenthe',
        status: 'deal_closed',
        notes: 'Direct contract gesloten voor jaarabonnement. Digitale handtekening afgerond.',
      },
    ],
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'pin_ams_02',
    org_id: 'default_org',
    company_name: 'CRMos',
    territory_id: 'terr_ams_01',
    street: 'Singel',
    house_number: '242',
    postal_code: '1012 DH',
    city: 'Amsterdam',
    latitude: 52.3734,
    longitude: 4.8893,
    current_status: 'not_home',
    last_visit_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    assigned_agent_id: 'agent_jamal',
    assigned_agent_name: 'Jamal Drenthe',
    visits: [
      {
        id: 'v2',
        visited_at: new Date(Date.now() - 3600000 * 4).toISOString(),
        agent_id: 'agent_jamal',
        agent_name: 'Jamal Drenthe',
        status: 'not_home',
        notes: 'Niet thuis om 13:30. Terugkomen in avondronde (na 18:30).',
        follow_up_date: new Date(Date.now() + 3600000 * 5).toISOString(),
      },
    ],
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'pin_ams_03',
    org_id: 'default_org',
    company_name: 'CRMos',
    territory_id: 'terr_ams_01',
    street: 'Singel',
    house_number: '244',
    postal_code: '1012 DH',
    city: 'Amsterdam',
    latitude: 52.3736,
    longitude: 4.8895,
    current_status: 'no_interest',
    last_visit_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    assigned_agent_id: 'agent_jamal',
    assigned_agent_name: 'Jamal Drenthe',
    visits: [
      {
        id: 'v3',
        visited_at: new Date(Date.now() - 3600000 * 6).toISOString(),
        agent_id: 'agent_jamal',
        agent_name: 'Jamal Drenthe',
        status: 'no_interest',
        notes: 'Heeft recent al concurrent gecontracteerd. Geen interesse.',
      },
    ],
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'pin_ams_04',
    org_id: 'default_org',
    company_name: 'CRMos',
    territory_id: 'terr_ams_01',
    street: 'Singel',
    house_number: '246',
    postal_code: '1012 DH',
    city: 'Amsterdam',
    latitude: 52.3738,
    longitude: 4.8897,
    current_status: 'appointment',
    last_visit_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    assigned_agent_id: 'agent_jamal',
    assigned_agent_name: 'Jamal Drenthe',
    visits: [
      {
        id: 'v4',
        visited_at: new Date(Date.now() - 3600000 * 8).toISOString(),
        agent_id: 'agent_jamal',
        agent_name: 'Jamal Drenthe',
        status: 'appointment',
        notes: 'Interesse in voorstel, partner moet aanschuiven. Afspraak morgen om 19:00.',
        follow_up_date: new Date(Date.now() + 86400000).toISOString(),
      },
    ],
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'pin_ams_05',
    org_id: 'default_org',
    company_name: 'CRMos',
    territory_id: 'terr_ams_01',
    street: 'Singel',
    house_number: '248',
    postal_code: '1012 DH',
    city: 'Amsterdam',
    latitude: 52.3740,
    longitude: 4.8899,
    current_status: 'do_not_knock',
    last_visit_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    assigned_agent_id: 'agent_jamal',
    assigned_agent_name: 'Jamal Drenthe',
    visits: [
      {
        id: 'v5',
        visited_at: new Date(Date.now() - 3600000 * 12).toISOString(),
        agent_id: 'agent_jamal',
        agent_name: 'Jamal Drenthe',
        status: 'do_not_knock',
        notes: 'Colportagesticker / Geen verkoop aan de deur. Geregistreerd in systeem.',
      },
    ],
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'pin_ams_06',
    org_id: 'default_org',
    company_name: 'CRMos',
    territory_id: 'terr_ams_01',
    street: 'Singel',
    house_number: '250',
    postal_code: '1012 DH',
    city: 'Amsterdam',
    latitude: 52.3742,
    longitude: 4.8901,
    current_status: 'unvisited',
    assigned_agent_id: 'agent_jamal',
    assigned_agent_name: 'Jamal Drenthe',
    visits: [],
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },

  // Amsterdam Centrum - Herengracht
  {
    id: 'pin_ams_07',
    org_id: 'default_org',
    company_name: 'CRMos',
    territory_id: 'terr_ams_01',
    street: 'Herengracht',
    house_number: '180',
    postal_code: '1016 BR',
    city: 'Amsterdam',
    latitude: 52.3745,
    longitude: 4.8860,
    current_status: 'deal_closed',
    last_visit_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    assigned_agent_id: 'agent_maria',
    assigned_agent_name: 'Maria Garcia',
    visits: [
      {
        id: 'v7',
        visited_at: new Date(Date.now() - 3600000 * 20).toISOString(),
        agent_id: 'agent_maria',
        agent_name: 'Maria Garcia',
        status: 'deal_closed',
        notes: 'Ondernemer tekende direct via tablet.',
      },
    ],
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'pin_ams_08',
    org_id: 'default_org',
    company_name: 'CRMos',
    territory_id: 'terr_ams_01',
    street: 'Herengracht',
    house_number: '182',
    postal_code: '1016 BR',
    city: 'Amsterdam',
    latitude: 52.3747,
    longitude: 4.8862,
    current_status: 'not_home',
    assigned_agent_id: 'agent_maria',
    assigned_agent_name: 'Maria Garcia',
    visits: [],
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'pin_ams_09',
    org_id: 'default_org',
    company_name: 'CRMos',
    territory_id: 'terr_ams_01',
    street: 'Herengracht',
    house_number: '184',
    postal_code: '1016 BR',
    city: 'Amsterdam',
    latitude: 52.3749,
    longitude: 4.8864,
    current_status: 'unvisited',
    assigned_agent_id: 'agent_maria',
    assigned_agent_name: 'Maria Garcia',
    visits: [],
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },

  // Rotterdam Centrum - Coolsingel
  {
    id: 'pin_rdam_01',
    org_id: 'default_org',
    company_name: 'CRMos',
    territory_id: 'terr_rdam_01',
    street: 'Coolsingel',
    house_number: '104',
    postal_code: '3011 AG',
    city: 'Rotterdam',
    latitude: 51.9225,
    longitude: 4.4795,
    current_status: 'deal_closed',
    last_visit_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    assigned_agent_id: 'agent_alex',
    assigned_agent_name: 'Alex Johnson',
    visits: [],
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'pin_rdam_02',
    org_id: 'default_org',
    company_name: 'CRMos',
    territory_id: 'terr_rdam_01',
    street: 'Coolsingel',
    house_number: '106',
    postal_code: '3011 AG',
    city: 'Rotterdam',
    latitude: 51.9228,
    longitude: 4.4797,
    current_status: 'appointment',
    last_visit_at: new Date(Date.now() - 3600000 * 7).toISOString(),
    assigned_agent_id: 'agent_alex',
    assigned_agent_name: 'Alex Johnson',
    visits: [],
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },

  // Utrecht Binnenstad - Oudegracht
  {
    id: 'pin_utr_01',
    org_id: 'default_org',
    company_name: 'CRMos',
    territory_id: 'terr_utr_01',
    street: 'Oudegracht',
    house_number: '165',
    postal_code: '3511 AL',
    city: 'Utrecht',
    latitude: 52.0907,
    longitude: 5.1214,
    current_status: 'deal_closed',
    last_visit_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    assigned_agent_id: 'agent_jamal',
    assigned_agent_name: 'Jamal Drenthe',
    visits: [],
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'pin_utr_02',
    org_id: 'default_org',
    company_name: 'CRMos',
    territory_id: 'terr_utr_01',
    street: 'Oudegracht',
    house_number: '167',
    postal_code: '3511 AL',
    city: 'Utrecht',
    latitude: 52.0910,
    longitude: 5.1216,
    current_status: 'unvisited',
    assigned_agent_id: 'agent_jamal',
    assigned_agent_name: 'Jamal Drenthe',
    visits: [],
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

interface D2DState {
  pins: D2DAddressPin[];
  selectedPin: D2DAddressPin | null;
  activeTerritoryId: string | null;
  userLocation: { latitude: number; longitude: number } | null;
  isTrackingLocation: boolean;
  statusFilter: D2DPinStatus | 'all';
  searchQuery: string;
  isImporting: boolean;

  // Actions
  setPins: (pins: D2DAddressPin[]) => void;
  selectPin: (pin: D2DAddressPin | null) => void;
  setActiveTerritoryId: (territoryId: string | null) => void;
  setUserLocation: (coords: { latitude: number; longitude: number } | null) => void;
  setIsTrackingLocation: (tracking: boolean) => void;
  setStatusFilter: (filter: D2DPinStatus | 'all') => void;
  setSearchQuery: (query: string) => void;

  addPin: (pin: Omit<D2DAddressPin, 'id' | 'created_at' | 'updated_at'>) => D2DAddressPin;
  updatePin: (id: string, updates: Partial<D2DAddressPin>) => void;
  deletePin: (id: string) => void;

  logVisit: (
    pinId: string,
    status: D2DPinStatus,
    notes?: string,
    followUpDate?: string,
    agentId?: string,
    agentName?: string,
    fallbackPinData?: Partial<D2DAddressPin>
  ) => D2DAddressPin | null;

  bulkImportPins: (pins: D2DAddressPin[]) => void;
  fetchAddressesFromPDOK: (postcode: string, city?: string, territoryId?: string) => Promise<{ success: boolean; count: number }>;
  autoSyncKadasterTerritory: (territory: Territory) => Promise<{ success: boolean; count: number; alreadyPopulated: boolean }>;

  // Firestore Sync
  syncWithFirestore: (orgId: string) => () => void;
}

export const useD2DStore = create<D2DState>()(
  persist(
    (set, get) => ({
      pins: initialD2DPins.filter((p) => p.current_status !== 'unvisited'),
      selectedPin: null,
      activeTerritoryId: null,
      userLocation: null,
      isTrackingLocation: false,
      statusFilter: 'all',
      searchQuery: '',
      isImporting: false,

      setPins: (pins) => set({ pins }),
      selectPin: (selectedPin) => set({ selectedPin }),
      setActiveTerritoryId: (activeTerritoryId) => set({ activeTerritoryId }),
      setUserLocation: (userLocation) => set({ userLocation }),
      setIsTrackingLocation: (isTrackingLocation) => set({ isTrackingLocation }),
      setStatusFilter: (statusFilter) => set({ statusFilter }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),

      addPin: (pinData) => {
        const user = useAuthStore.getState().user;
        const orgId = useAuthStore.getState().organization?.id || user?.org_id || 'default_org';

        const newPin: D2DAddressPin = {
          ...pinData,
          id: `pin_${generateId()}`,
          org_id: orgId,
          company_name: user?.company_name || 'CRMos',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        set((state) => ({ pins: [newPin, ...state.pins] }));
        // Alleen opslaan in Firestore als er daadwerkelijk een bezoekstatus is (niet 'unvisited')
        if (newPin.current_status !== 'unvisited') {
          saveD2DPinToFirestore(newPin, orgId);
        }
        return newPin;
      },

      updatePin: (id, updates) => {
        const user = useAuthStore.getState().user;
        const orgId = useAuthStore.getState().organization?.id || user?.org_id || 'default_org';

        set((state) => {
          const updatedPins = state.pins.map((p) =>
            p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
          );
          const updated = updatedPins.find((p) => p.id === id);
          if (updated && updated.current_status !== 'unvisited') {
            saveD2DPinToFirestore(updated, orgId);
          }
          return { pins: updatedPins };
        });
      },

      deletePin: (id) => {
        set((state) => ({
          pins: state.pins.filter((p) => p.id !== id),
          selectedPin: state.selectedPin?.id === id ? null : state.selectedPin,
        }));
        deleteD2DPinFromFirestore(id);
      },

      logVisit: (pinId, status, notes, followUpDate, agentId, agentName, fallbackPinData) => {
        const user = useAuthStore.getState().user;
        const orgId = useAuthStore.getState().organization?.id || user?.org_id || 'default_org';

        const visitLog: D2DVisitLog = {
          id: `visit_${generateId()}`,
          visited_at: new Date().toISOString(),
          agent_id: agentId || user?.id || 'current_user',
          agent_name: agentName || user?.name || user?.email || 'Vertegenwoordiger',
          status,
          notes: notes?.trim() || undefined,
          follow_up_date: followUpDate || undefined,
        };

        let resultPin: D2DAddressPin | null = null;

        set((state) => {
          const exists = state.pins.some((p) => p.id === pinId);

          if (exists) {
            const updatedPins = state.pins.map((p) => {
              if (p.id === pinId) {
                const updated: D2DAddressPin = {
                  ...p,
                  current_status: status,
                  last_visit_at: visitLog.visited_at,
                  visits: [visitLog, ...p.visits],
                  updated_at: new Date().toISOString(),
                };
                resultPin = updated;
                return updated;
              }
              return p;
            });

            if (resultPin && status !== 'unvisited') {
              saveD2DPinToFirestore(resultPin, orgId);
            }
            return { pins: updatedPins, selectedPin: resultPin || state.selectedPin };
          } else if (fallbackPinData) {
            // On-the-fly geklikt pand op de kaart: maak nu pas de pin aan omdat er een echte status wordt gelogd!
            const created: D2DAddressPin = {
              id: pinId.startsWith('on_demand_') ? `pin_${generateId()}` : pinId,
              org_id: orgId,
              company_name: user?.company_name || 'CRMos',
              territory_id: fallbackPinData.territory_id,
              street: fallbackPinData.street || 'Onbekend',
              house_number: fallbackPinData.house_number || '',
              house_number_addition: fallbackPinData.house_number_addition,
              postal_code: fallbackPinData.postal_code || '',
              city: fallbackPinData.city || 'Nederland',
              latitude: fallbackPinData.latitude || 52.3732,
              longitude: fallbackPinData.longitude || 4.8891,
              current_status: status,
              last_visit_at: visitLog.visited_at,
              assigned_agent_id: visitLog.agent_id,
              assigned_agent_name: visitLog.agent_name,
              visits: [visitLog],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            resultPin = created;
            if (status !== 'unvisited') {
              saveD2DPinToFirestore(created, orgId);
            }
            return { pins: [created, ...state.pins], selectedPin: created };
          }

          return state;
        });

        return resultPin;
      },

      bulkImportPins: (newPins) => {
        const user = useAuthStore.getState().user;
        const orgId = useAuthStore.getState().organization?.id || user?.org_id || 'default_org';

        set((state) => {
          const existingMap = new Map(state.pins.map((p) => [p.id, p]));
          for (const pin of newPins) {
            const prev = existingMap.get(pin.id);
            if (prev) {
              // Behoud eventuele bezoekhistorie als het pand al eerder bezocht was
              existingMap.set(pin.id, {
                ...pin,
                current_status: prev.current_status !== 'unvisited' ? prev.current_status : pin.current_status,
                visits: prev.visits?.length ? prev.visits : pin.visits,
                last_visit_at: prev.last_visit_at || pin.last_visit_at,
              });
            } else {
              existingMap.set(pin.id, pin);
            }
          }
          return { pins: Array.from(existingMap.values()) };
        });

        // Sla uitsluitend fysieke bedrijfspanden (is_commercial) of bezochte deuren op in Firestore (negeer reguliere woonhuizen!)
        for (const pin of newPins) {
          if (pin.is_commercial || pin.current_status !== 'unvisited') {
            saveD2DPinToFirestore(pin, orgId);
          }
        }
      },

      fetchAddressesFromPDOK: async (postcodePrefix, city, territoryId) => {
        set({ isImporting: true });
        try {
          const user = useAuthStore.getState().user;
          const orgId = useAuthStore.getState().organization?.id || user?.org_id || 'default_org';
          const companyName = user?.company_name || 'CRMos';

          const { runB2BLeadEnrichmentPipeline } = await import('@/services/b2bEnrichmentPipeline');
          const result = await runB2BLeadEnrichmentPipeline({
            regionQuery: city ? `${postcodePrefix}` : postcodePrefix,
            territoryId,
            orgId,
            companyName,
          });

          if (result.commercialPins.length > 0) {
            get().bulkImportPins(result.commercialPins);
          }

          set({ isImporting: false });
          return { success: true, count: result.commercialPins.length };
        } catch (error) {
          console.error('Fout bij ophalen van B2B PDOK bedrijfspanden:', error);
          set({ isImporting: false });
          return { success: false, count: 0 };
        }
      },

      autoSyncKadasterTerritory: async (_territory) => {
        return { success: true, count: 0, alreadyPopulated: true };
      },

      syncWithFirestore: (orgId) => {
        return subscribeToD2DPins(orgId, (pins) => {
          if (pins.length > 0) {
            set({
              pins: pins.filter((p) => p.is_commercial || p.current_status !== 'unvisited'),
            });
          }
        });
      },
    }),
    {
      name: 'crmos-d2d-storage',
      partialize: (state) => ({
        // Sla alleen B2B bedrijfspanden en daadwerkelijk bezochte deuren op (negeer reguliere woonhuizen)
        pins: state.pins.filter((p) => p.is_commercial || p.current_status !== 'unvisited'),
        activeTerritoryId: state.activeTerritoryId,
        statusFilter: state.statusFilter,
      }),
    }
  )
);
