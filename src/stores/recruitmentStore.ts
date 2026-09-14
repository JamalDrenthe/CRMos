import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Candidate, Job, JobApplication } from '@/types';

const generateId = () => Math.random().toString(36).substring(2, 15);

const sampleCandidates: Candidate[] = [
  {
    id: '1',
    first_name: 'Alice',
    last_name: 'Williams',
    email: 'alice.williams@email.com',
    phone: '+1 (555) 111-2222',
    status: 'interview',
    source: 'LinkedIn',
    skills: ['React', 'TypeScript', 'Node.js'],
    experience_years: 5,
    expected_salary: 120000,
    location: 'San Francisco, CA',
    notes: 'Strong technical background',
    assigned_to: 'user1',
    created_at: new Date(Date.now() - 1209600000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: '2',
    first_name: 'David',
    last_name: 'Brown',
    email: 'david.brown@email.com',
    phone: '+1 (555) 222-3333',
    status: 'screening',
    source: 'Referral',
    skills: ['Python', 'Django', 'PostgreSQL'],
    experience_years: 3,
    expected_salary: 95000,
    location: 'New York, NY',
    assigned_to: 'user2',
    created_at: new Date(Date.now() - 604800000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '3',
    first_name: 'Jennifer',
    last_name: 'Lee',
    email: 'jennifer.lee@email.com',
    phone: '+1 (555) 333-4444',
    status: 'offer',
    source: 'Indeed',
    skills: ['Product Management', 'Agile', 'Analytics'],
    experience_years: 7,
    current_salary: 130000,
    expected_salary: 150000,
    location: 'Austin, TX',
    notes: 'Excellent leadership skills',
    assigned_to: 'user1',
    created_at: new Date(Date.now() - 2592000000).toISOString(),
    updated_at: new Date(Date.now() - 432000000).toISOString(),
  },
  {
    id: '4',
    first_name: 'James',
    last_name: 'Taylor',
    email: 'james.taylor@email.com',
    status: 'new',
    source: 'Company Website',
    skills: ['Sales', 'CRM', 'B2B'],
    experience_years: 4,
    expected_salary: 80000,
    location: 'Chicago, IL',
    assigned_to: 'user2',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: '5',
    first_name: 'Maria',
    last_name: 'Garcia',
    email: 'maria.garcia@email.com',
    phone: '+1 (555) 444-5555',
    status: 'hired',
    source: 'LinkedIn',
    skills: ['UX Design', 'Figma', 'User Research'],
    experience_years: 6,
    current_salary: 110000,
    expected_salary: 125000,
    location: 'Seattle, WA',
    assigned_to: 'user1',
    created_at: new Date(Date.now() - 5184000000).toISOString(),
    updated_at: new Date(Date.now() - 604800000).toISOString(),
  },
];

const sampleJobs: Job[] = [
  {
    id: '1',
    title: 'Senior Frontend Developer',
    department: 'Engineering',
    location: 'San Francisco, CA (Remote)',
    type: 'full-time',
    status: 'published',
    description: 'We are looking for an experienced Frontend Developer to join our team.',
    requirements: ['5+ years React experience', 'TypeScript proficiency', 'Experience with state management'],
    salary_min: 120000,
    salary_max: 160000,
    currency: 'USD',
    hiring_manager: 'user1',
    assigned_recruiters: ['user1', 'user2'],
    candidates_count: 12,
    created_at: new Date(Date.now() - 2592000000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '2',
    title: 'Product Manager',
    department: 'Product',
    location: 'New York, NY',
    type: 'full-time',
    status: 'published',
    description: 'Lead product development for our core platform.',
    requirements: ['7+ years PM experience', 'B2B SaaS background', 'Data-driven mindset'],
    salary_min: 140000,
    salary_max: 180000,
    currency: 'USD',
    hiring_manager: 'user2',
    assigned_recruiters: ['user1'],
    candidates_count: 8,
    created_at: new Date(Date.now() - 5184000000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: '3',
    title: 'Sales Representative',
    department: 'Sales',
    location: 'Chicago, IL',
    type: 'full-time',
    status: 'published',
    description: 'Join our growing sales team and help expand our customer base.',
    requirements: ['3+ years B2B sales experience', 'CRM proficiency', 'Excellent communication skills'],
    salary_min: 60000,
    salary_max: 90000,
    currency: 'USD',
    hiring_manager: 'user2',
    assigned_recruiters: ['user2'],
    candidates_count: 15,
    created_at: new Date(Date.now() - 7776000000).toISOString(),
    updated_at: new Date(Date.now() - 604800000).toISOString(),
  },
  {
    id: '4',
    title: 'UX Designer',
    department: 'Design',
    location: 'Remote',
    type: 'full-time',
    status: 'closed',
    description: 'Design beautiful and intuitive user experiences.',
    requirements: ['Portfolio demonstrating UX skills', 'Figma expertise', 'User research experience'],
    salary_min: 100000,
    salary_max: 140000,
    currency: 'USD',
    hiring_manager: 'user1',
    assigned_recruiters: ['user1'],
    candidates_count: 20,
    created_at: new Date(Date.now() - 10368000000).toISOString(),
    updated_at: new Date(Date.now() - 2592000000).toISOString(),
  },
];

const sampleApplications: JobApplication[] = [
  { id: '1', job_id: '1', candidate_id: '1', stage: 'interview', applied_at: new Date(Date.now() - 1209600000).toISOString() },
  { id: '2', job_id: '2', candidate_id: '3', stage: 'offer', applied_at: new Date(Date.now() - 2592000000).toISOString() },
  { id: '3', job_id: '3', candidate_id: '4', stage: 'screening', applied_at: new Date(Date.now() - 172800000).toISOString() },
  { id: '4', job_id: '4', candidate_id: '5', stage: 'hired', applied_at: new Date(Date.now() - 5184000000).toISOString() },
];

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
}

export const useRecruitmentStore = create<RecruitmentState>()(
  persist(
    (set, get) => ({
      candidates: sampleCandidates,
      jobs: sampleJobs,
      applications: sampleApplications,
      selectedCandidate: null,
      selectedJob: null,

      setCandidates: (candidates) => set({ candidates }),
      setJobs: (jobs) => set({ jobs }),
      setApplications: (applications) => set({ applications }),

      addCandidate: (candidateData) => {
        const newCandidate: Candidate = {
          ...candidateData,
          id: generateId(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        set((state) => ({ candidates: [...state.candidates, newCandidate] }));
        return newCandidate;
      },

      updateCandidate: (id, updates) => {
        set((state) => ({
          candidates: state.candidates.map((c) =>
            c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
          ),
        }));
      },

      deleteCandidate: (id) => {
        set((state) => ({
          candidates: state.candidates.filter((c) => c.id !== id),
          applications: state.applications.filter((a) => a.candidate_id !== id),
        }));
      },

      moveCandidate: (candidateId, newStatus) => {
        set((state) => ({
          candidates: state.candidates.map((c) =>
            c.id === candidateId ? { ...c, status: newStatus, updated_at: new Date().toISOString() } : c
          ),
        }));
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
        return newJob;
      },

      updateJob: (id, updates) => {
        set((state) => ({
          jobs: state.jobs.map((j) =>
            j.id === id ? { ...j, ...updates, updated_at: new Date().toISOString() } : j
          ),
        }));
      },

      deleteJob: (id) => {
        set((state) => ({
          jobs: state.jobs.filter((j) => j.id !== id),
          applications: state.applications.filter((a) => a.job_id !== id),
        }));
      },

      publishJob: (id) => {
        set((state) => ({
          jobs: state.jobs.map((j) =>
            j.id === id ? { ...j, status: 'published', updated_at: new Date().toISOString() } : j
          ),
        }));
      },

      closeJob: (id) => {
        set((state) => ({
          jobs: state.jobs.map((j) =>
            j.id === id ? { ...j, status: 'closed', updated_at: new Date().toISOString() } : j
          ),
        }));
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
        const applicationCandidateIds = get().applications
          .filter((a) => a.job_id === jobId)
          .map((a) => a.candidate_id);
        return get().candidates.filter((c) => applicationCandidateIds.includes(c.id));
      },

      getApplicationsByJob: (jobId) => {
        return get().applications.filter((a) => a.job_id === jobId);
      },

      getCandidatesByStage: (stage) => {
        return get().candidates.filter((c) => c.status === stage);
      },

      searchCandidates: (query) => {
        const lowerQuery = query.toLowerCase();
        return get().candidates.filter(
          (c) =>
            c.first_name.toLowerCase().includes(lowerQuery) ||
            c.last_name.toLowerCase().includes(lowerQuery) ||
            c.email.toLowerCase().includes(lowerQuery) ||
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
      name: 'jamcrm-recruitment-storage',
    }
  )
);
