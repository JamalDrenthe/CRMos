import { create } from 'zustand';
import type { Contact, Job, JobApplication, Deal, Notification, ViewMode, Company } from '@/types';

// Mock data
const mockContacts: Contact[] = [];
const mockCompanies: Company[] = [];
const mockJobs: Job[] = [];
const mockApplications: JobApplication[] = [];
const mockDeals: Deal[] = [];
const mockNotifications: Notification[] = [];

interface AppState {
  // Data
  contacts: Contact[];
  companies: Company[];
  jobs: Job[];
  applications: JobApplication[];
  deals: Deal[];
  notifications: Notification[];
  
  // UI State
  viewMode: ViewMode;
  searchQuery: string;
  selectedFilters: Record<string, string[]>;
  
  // Actions
  setViewMode: (mode: ViewMode) => void;
  setSearchQuery: (query: string) => void;
  setSelectedFilters: (filters: Record<string, string[]>) => void;
  toggleFilter: (category: string, value: string) => void;
  
  // Data Actions
  addContact: (contact: Contact) => void;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  addJob: (job: Job) => void;
  updateJob: (id: string, updates: Partial<Job>) => void;
  addApplication: (application: JobApplication) => void;
  updateApplicationStage: (id: string, stage: JobApplication['stage']) => void;
  addDeal: (deal: Deal) => void;
  updateDeal: (id: string, updates: Partial<Deal>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial Data
  contacts: mockContacts,
  companies: mockCompanies,
  jobs: mockJobs,
  applications: mockApplications,
  deals: mockDeals,
  notifications: mockNotifications,
  
  // UI State
  viewMode: 'list',
  searchQuery: '',
  selectedFilters: {},
  
  // Actions
  setViewMode: (mode) => set({ viewMode: mode }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedFilters: (filters) => set({ selectedFilters: filters }),
  toggleFilter: (category, value) => {
    const { selectedFilters } = get();
    const currentFilters = selectedFilters[category] || [];
    const newFilters = currentFilters.includes(value)
      ? currentFilters.filter(v => v !== value)
      : [...currentFilters, value];
    set({
      selectedFilters: {
        ...selectedFilters,
        [category]: newFilters,
      },
    });
  },
  
  // Data Actions
  addContact: (contact) => {
    set((state) => ({
      contacts: [contact, ...state.contacts],
    }));
  },
  updateContact: (id, updates) => {
    set((state) => ({
      contacts: state.contacts.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  },
  addJob: (job) => {
    set((state) => ({
      jobs: [job, ...state.jobs],
    }));
  },
  updateJob: (id, updates) => {
    set((state) => ({
      jobs: state.jobs.map((j) =>
        j.id === id ? { ...j, ...updates } : j
      ),
    }));
  },
  addApplication: (application) => {
    set((state) => ({
      applications: [application, ...state.applications],
    }));
  },
  addDeal: (deal) => {
    set((state) => ({
      deals: [deal, ...state.deals],
    }));
  },
  updateApplicationStage: (id, stage) => {
    set((state) => ({
      applications: state.applications.map((a) =>
        a.id === id ? { ...a, stage, updated_at: new Date().toISOString() } : a
      ),
    }));
  },
  updateDeal: (id, updates) => {
    set((state) => ({
      deals: state.deals.map((d) =>
        d.id === id ? { ...d, ...updates, updated_at: new Date().toISOString() } : d
      ),
    }));
  },
  markNotificationRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  },
  markAllNotificationsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },
}));
