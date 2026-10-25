import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Candidate, Job, JobApplication } from '@/types';
import {
  saveCandidateToFirestore,
  deleteCandidateFromFirestore,
  subscribeToCandidates,
  saveJobToFirestore,
  deleteJobFromFirestore,
  subscribeToJobs,
} from '@/services/firestoreService';
import { useAuthStore } from '@/stores/authStore';
import { isFirebaseConfigured } from '@/lib/firebase';
import {
  ensureCandidateVvcTag,
  ensureAllCandidatesHaveVvcTags,
  getVvcTag,
} from '@/services/vvcTagService';

if (typeof window !== 'undefined') {
  window.localStorage.removeItem('crmos-recruitment-storage');
}

const generateId = () => Math.random().toString(36).substring(2, 15);

interface RecruitmentState {
  candidates: Candidate[];
  jobs: Job[];
  applications: JobApplication[];
  selectedCandidate: Candidate | null;
  selectedJob: Job | null;

  // Actions
  setCandidates: (candidates: Candidate[]) => void;
  setJobs: (jobs: Job[]) => void;
  setApplications: (applications: JobApplication[]) => void;
  clearLocalStore: () => void;
  syncWithFirestore: (orgId: string) => () => void;

  addCandidate: (candidate: Omit<Candidate, 'id' | 'created_at' | 'updated_at'>) => Candidate;
  updateCandidate: (id: string, updates: Partial<Candidate>) => void;
  deleteCandidate: (id: string) => void;
  moveCandidate: (candidateId: string, newStatus: Candidate['status']) => void;

  addJob: (job: Omit<Job, 'id' | 'created_at' | 'updated_at'>) => Job;
  updateJob: (id: string, updates: Partial<Job>) => void;
  deleteJob: (id: string) => void;
  publishJob: (id: string) => void;
  closeJob: (id: string) => void;

  addApplication: (application: Omit<JobApplication, 'id'>) => JobApplication;
  updateApplicationStage: (id: string, stage: JobApplication['stage']) => void;

  selectCandidate: (candidate: Candidate | null) => void;
  selectJob: (job: Job | null) => void;

  getCandidatesByJob: (jobId: string) => Candidate[];
  getApplicationsByJob: (jobId: string) => JobApplication[];
  getCandidatesByStage: (stage: Candidate['status']) => Candidate[];

  searchCandidates: (query: string) => Candidate[];
  searchJobs: (query: string) => Job[];
  ensureVvcTagsOnAllCandidates: () => number;
}

export const useRecruitmentStore = create<RecruitmentState>()(
  persist(
    (set, get) => ({
      candidates: [],
      jobs: [],
      applications: [],
      selectedCandidate: null,
      selectedJob: null,

      setCandidates: (candidates) => set({ candidates }),
      setJobs: (jobs) => set({ jobs }),
      setApplications: (applications) => set({ applications }),
      clearLocalStore: () => set({ candidates: [], jobs: [], applications: [], selectedCandidate: null, selectedJob: null }),

      syncWithFirestore: (orgId: string) => {
        if (!isFirebaseConfigured()) return () => {};
        const unsubs: (() => void)[] = [];

        const unsubCandidates = subscribeToCandidates(orgId, (firestoreCandidates) => {
          const rawCandidates = firestoreCandidates || [];
          const { updatedCandidates, changedCount } = ensureAllCandidatesHaveVvcTags(rawCandidates);
          set({ candidates: updatedCandidates });

          if (changedCount > 0 && isFirebaseConfigured()) {
            updatedCandidates.forEach((candidate) => {
              const original = rawCandidates.find((c) => c.id === candidate.id);
              if (original !== candidate) {
                saveCandidateToFirestore(candidate, orgId);
              }
            });
          }
        });
        unsubs.push(unsubCandidates);

        const unsubJobs = subscribeToJobs(orgId, (firestoreJobs) => {
          set({ jobs: firestoreJobs || [] });
        });
        unsubs.push(unsubJobs);

        return () => {
          unsubs.forEach((u) => u());
        };
      },

      addCandidate: (candidateData) => {
        const existingTags = new Set(
          get()
            .candidates.map((c) => getVvcTag(c)?.toLowerCase())
            .filter(Boolean) as string[]
        );

        const baseCandidate: Candidate = {
          ...candidateData,
          id: generateId(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const newCandidate = ensureCandidateVvcTag(baseCandidate, existingTags);
        set((state) => ({ candidates: [...state.candidates, newCandidate] }));
        const orgId = useAuthStore.getState().organization?.id || 'default_org';
        saveCandidateToFirestore(newCandidate, orgId);
        return newCandidate;
      },

      updateCandidate: (id, updates) => {
        set((state) => {
          const updatedCandidates = state.candidates.map((c) =>
            c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
          );
          const updated = updatedCandidates.find((c) => c.id === id);
          if (updated) {
            const orgId = useAuthStore.getState().organization?.id || 'default_org';
            saveCandidateToFirestore(updated, orgId);
          }
          return { candidates: updatedCandidates };
        });
      },

      deleteCandidate: (id) => {
        set((state) => ({
          candidates: state.candidates.filter((c) => c.id !== id),
          applications: state.applications.filter((a) => a.candidate_id !== id),
        }));
        deleteCandidateFromFirestore(id);
      },

      moveCandidate: (candidateId, newStatus) => {
        set((state) => {
          const updatedCandidates = state.candidates.map((c) =>
            c.id === candidateId ? { ...c, status: newStatus, updated_at: new Date().toISOString() } : c
          );
          const updated = updatedCandidates.find((c) => c.id === candidateId);
          if (updated) {
            const orgId = useAuthStore.getState().organization?.id || 'default_org';
            saveCandidateToFirestore(updated, orgId);
          }
          return { candidates: updatedCandidates };
        });
      },

      addJob: (jobData) => {
        const newJob: Job = {
          ...jobData,
          id: generateId(),
          candidates_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        set((state) => ({ jobs: [...state.jobs, newJob] }));
        const orgId = useAuthStore.getState().organization?.id || 'default_org';
        saveJobToFirestore(newJob, orgId);
        return newJob;
      },

      updateJob: (id, updates) => {
        set((state) => {
          const updatedJobs = state.jobs.map((j) =>
            j.id === id ? { ...j, ...updates, updated_at: new Date().toISOString() } : j
          );
          const updated = updatedJobs.find((j) => j.id === id);
          if (updated) {
            const orgId = useAuthStore.getState().organization?.id || 'default_org';
            saveJobToFirestore(updated, orgId);
          }
          return { jobs: updatedJobs };
        });
      },

      deleteJob: (id) => {
        set((state) => ({
          jobs: state.jobs.filter((j) => j.id !== id),
          applications: state.applications.filter((a) => a.job_id !== id),
        }));
        deleteJobFromFirestore(id);
      },

      publishJob: (id) => {
        set((state) => {
          const updatedJobs = state.jobs.map((j) =>
            j.id === id ? { ...j, status: 'published' as const, updated_at: new Date().toISOString() } : j
          );
          const updated = updatedJobs.find((j) => j.id === id);
          if (updated) {
            const orgId = useAuthStore.getState().organization?.id || 'default_org';
            saveJobToFirestore(updated, orgId);
          }
          return { jobs: updatedJobs };
        });
      },

      closeJob: (id) => {
        set((state) => {
          const updatedJobs = state.jobs.map((j) =>
            j.id === id ? { ...j, status: 'closed' as const, updated_at: new Date().toISOString() } : j
          );
          const updated = updatedJobs.find((j) => j.id === id);
          if (updated) {
            const orgId = useAuthStore.getState().organization?.id || 'default_org';
            saveJobToFirestore(updated, orgId);
          }
          return { jobs: updatedJobs };
        });
      },

      addApplication: (applicationData) => {
        const newApplication: JobApplication = {
          ...applicationData,
          id: generateId(),
        };
        set((state) => ({
          applications: [...state.applications, newApplication],
          jobs: state.jobs.map((j) =>
            j.id === applicationData.job_id
              ? { ...j, candidates_count: j.candidates_count + 1 }
              : j
          ),
        }));
        return newApplication;
      },

      updateApplicationStage: (id, stage) => {
        set((state) => ({
          applications: state.applications.map((a) =>
            a.id === id ? { ...a, stage } : a
          ),
        }));
      },

      selectCandidate: (candidate) => set({ selectedCandidate: candidate }),
      selectJob: (job) => set({ selectedJob: job }),

      getCandidatesByJob: (jobId) => {
        const applicationCandidateIds = get()
          .applications.filter((a) => a.job_id === jobId)
          .map((a) => a.candidate_id);
        return get().candidates.filter((c) => applicationCandidateIds.includes(c.id));
      },

      getApplicationsByJob: (jobId) => {
        return get().applications.filter((a) => a.job_id === jobId);
      },

      getCandidatesByStage: (stage) => {
        return get().candidates.filter((c) => c.status === stage);
      },

      ensureVvcTagsOnAllCandidates: () => {
        const { candidates } = get();
        const { updatedCandidates, changedCount } = ensureAllCandidatesHaveVvcTags(candidates);
        if (changedCount > 0) {
          const orgId = useAuthStore.getState().organization?.id || 'default_org';
          set({ candidates: updatedCandidates });
          if (isFirebaseConfigured()) {
            updatedCandidates.forEach((candidate) => {
              const old = candidates.find((c) => c.id === candidate.id);
              if (old !== candidate) {
                saveCandidateToFirestore(candidate, orgId);
              }
            });
          }
        }
        return changedCount;
      },

      searchCandidates: (query) => {
        const lowerQuery = query.toLowerCase();
        return get().candidates.filter(
          (c) =>
            c.first_name.toLowerCase().includes(lowerQuery) ||
            c.last_name.toLowerCase().includes(lowerQuery) ||
            c.email.toLowerCase().includes(lowerQuery) ||
            c.vvc_tag?.toLowerCase().includes(lowerQuery) ||
            c.skills.some((s) => s.toLowerCase().includes(lowerQuery))
        );
      },

      searchJobs: (query) => {
        const lowerQuery = query.toLowerCase();
        return get().jobs.filter(
          (j) =>
            j.title.toLowerCase().includes(lowerQuery) ||
            j.department.toLowerCase().includes(lowerQuery) ||
            j.location.toLowerCase().includes(lowerQuery)
        );
      },
    }),
    {
      name: 'crmos-recruitment-live-v3',
    }
  )
);
