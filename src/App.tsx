import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  Users,
  PhoneCall,
  GraduationCap,
  Settings,
} from 'lucide-react';

// Lazy Loaded Pages for Instant Performance & Code Splitting
const Dashboard = lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const ContactsPage = lazy(() => import('@/pages/crm/ContactsPage').then((m) => ({ default: m.ContactsPage })));
const CompaniesPage = lazy(() => import('@/pages/crm/CompaniesPage').then((m) => ({ default: m.CompaniesPage })));
const DealsPage = lazy(() => import('@/pages/crm/DealsPage').then((m) => ({ default: m.DealsPage })));
const ActivitiesPage = lazy(() => import('@/pages/crm/ActivitiesPage').then((m) => ({ default: m.ActivitiesPage })));
const CandidatesPage = lazy(() => import('@/pages/recruitment/CandidatesPage').then((m) => ({ default: m.CandidatesPage })));
const JobsPage = lazy(() => import('@/pages/recruitment/JobsPage').then((m) => ({ default: m.JobsPage })));
const QuotesPage = lazy(() => import('@/pages/sales/QuotesPage').then((m) => ({ default: m.QuotesPage })));
const ProductsPage = lazy(() => import('@/pages/sales/ProductsPage').then((m) => ({ default: m.ProductsPage })));
const AgentWorkspace = lazy(() => import('@/pages/contact-center/AgentWorkspace').then((m) => ({ default: m.AgentWorkspace })));
const CampaignsPage = lazy(() => import('@/pages/contact-center/CampaignsPage').then((m) => ({ default: m.CampaignsPage })));
const PitchFlowsPage = lazy(() => import('@/pages/contact-center/PitchFlowsPage').then((m) => ({ default: m.PitchFlowsPage })));
const View360Page = lazy(() => import('@/pages/enhanced/View360Page').then((m) => ({ default: m.View360Page })));
const GamificationPage = lazy(() => import('@/pages/enhanced/GamificationPage').then((m) => ({ default: m.GamificationPage })));
const TerritoriesPage = lazy(() => import('@/pages/enhanced/TerritoriesPage').then((m) => ({ default: m.TerritoriesPage })));
const WorkflowsPage = lazy(() => import('@/pages/enhanced/WorkflowsPage').then((m) => ({ default: m.WorkflowsPage })));
const DashboardBuilderPage = lazy(() => import('@/pages/enhanced/DashboardBuilderPage').then((m) => ({ default: m.DashboardBuilderPage })));
const AuditLogsPage = lazy(() => import('@/pages/admin/AuditLogsPage').then((m) => ({ default: m.AuditLogsPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const IntegrationsPage = lazy(() => import('@/pages/IntegrationsPage').then((m) => ({ default: m.IntegrationsPage })));
const LoginPage = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const LandingPage = lazy(() => import('@/pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const PricingPage = lazy(() => import('@/pages/PricingPage').then((m) => ({ default: m.PricingPage })));
const SolutionsPage = lazy(() => import('@/pages/SolutionsPage').then((m) => ({ default: m.SolutionsPage })));
const ComparePage = lazy(() => import('@/pages/ComparePage').then((m) => ({ default: m.ComparePage })));
const RegisterPage = lazy(() => import('@/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));

function PageLoader() {
  return (
    <div className="flex h-[45vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-2.5">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-xs text-muted-foreground animate-pulse font-medium">Laden...</span>
      </div>
    </div>
  );
}

import { GlobalSearch } from '@/components/search/GlobalSearch';
import { useAuthStore } from '@/stores/authStore';
import { useCRMStore } from '@/stores/crmStore';
import { useRecruitmentStore } from '@/stores/recruitmentStore';
import { useContactCenterStore } from '@/stores/contactCenterStore';
import { useD2DStore } from '@/stores/d2dStore';
import { useThemeStore } from '@/stores/themeStore';
import { cn } from '@/lib/utils';

function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Global Spotlight Keyboard Listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar 
        isCollapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header 
          onOpenSearch={() => setSearchOpen(true)}
          onToggleMobileMenu={() => setMobileSidebarOpen(true)}
        />
        <main className={cn(
          "flex-1 overflow-auto p-3.5 sm:p-5 md:p-6 pb-20 md:pb-6 transition-all duration-300",
        )}>
          {children}
        </main>
      </div>

      {/* Apple-style Mobile Bottom Navigation Bar (md:hidden) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background/90 backdrop-blur-xl border-t border-border/60 px-3 py-1.5 flex items-center justify-around shadow-2xl safe-area-pb">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 text-[11px] font-medium gap-1",
              isActive
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )
          }
        >
          {({ isActive }) => (
            <>
              <div className={cn("p-1 rounded-lg transition-colors", isActive ? "bg-primary/10" : "")}>
                <LayoutDashboard className="h-4 w-4" />
              </div>
              <span>Home</span>
            </>
          )}
        </NavLink>
        <NavLink
          to="/crm/contacts"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 text-[11px] font-medium gap-1",
              isActive
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )
          }
        >
          {({ isActive }) => (
            <>
              <div className={cn("p-1 rounded-lg transition-colors", isActive ? "bg-primary/10" : "")}>
                <Users className="h-4 w-4" />
              </div>
              <span>CRM</span>
            </>
          )}
        </NavLink>
        <NavLink
          to="/contact-center/workspace"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 text-[11px] font-medium gap-1",
              isActive
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )
          }
        >
          {({ isActive }) => (
            <>
              <div className={cn("p-1 rounded-lg transition-colors", isActive ? "bg-primary/10" : "")}>
                <PhoneCall className="h-4 w-4" />
              </div>
              <span>Bellen</span>
            </>
          )}
        </NavLink>
        <NavLink
          to="/recruitment/candidates"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 text-[11px] font-medium gap-1",
              isActive
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )
          }
        >
          {({ isActive }) => (
            <>
              <div className={cn("p-1 rounded-lg transition-colors", isActive ? "bg-primary/10" : "")}>
                <GraduationCap className="h-4 w-4" />
              </div>
              <span>Werving</span>
            </>
          )}
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 text-[11px] font-medium gap-1",
              isActive
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )
          }
        >
          {({ isActive }) => (
            <>
              <div className={cn("p-1 rounded-lg transition-colors", isActive ? "bg-primary/10" : "")}>
                <Settings className="h-4 w-4" />
              </div>
              <span>Account</span>
            </>
          )}
        </NavLink>
      </nav>

      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}

function App() {
  const { initAuthListener, organization, user, isAuthenticated } = useAuthStore();
  const { syncWithFirestore } = useCRMStore();
  const { syncWithFirestore: syncRecruitment } = useRecruitmentStore();
  const { syncWithFirestore: syncContactCenter } = useContactCenterStore();
  const { syncWithFirestore: syncD2D } = useD2DStore();
  const { theme } = useThemeStore();

  // Sync theme class on document element
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme]);

  // Initialize Firebase Auth listener on app start
  useEffect(() => {
    const unsubAuth = initAuthListener();
    return () => {
      if (typeof unsubAuth === 'function') {
        unsubAuth();
      }
    };
  }, [initAuthListener]);

  const isSuperAdmin =
    user?.email?.toLowerCase() === 'info@jamaldrenthe.com' ||
    user?.is_super_admin === true ||
    user?.role === 'admin';

  // Admin has master view to see all data, other organizations are strictly isolated
  const effectiveOrgId = isSuperAdmin ? 'all' : (organization?.id || user?.org_id || 'default_org');

  // Sync CRM, Recruitment, Contact Center, and D2D data with Firestore for active organization
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubCRM = syncWithFirestore(effectiveOrgId);
    const unsubRec = syncRecruitment(effectiveOrgId);
    const unsubCC = syncContactCenter(effectiveOrgId);
    const unsubD2D = syncD2D(effectiveOrgId);
    return () => {
      if (typeof unsubCRM === 'function') unsubCRM();
      if (typeof unsubRec === 'function') unsubRec();
      if (typeof unsubCC === 'function') unsubCC();
      if (typeof unsubD2D === 'function') unsubD2D();
    };
  }, [effectiveOrgId, isAuthenticated, syncWithFirestore, syncRecruitment, syncContactCenter, syncD2D]);

  return (
    <TooltipProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              ) : (
                <LandingPage />
              )
            }
          />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/solutions" element={<SolutionsPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Dedicated Dashboard Route */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* CRM Routes */}
          <Route
            path="/crm/contacts"
            element={
              <ProtectedRoute>
                <ContactsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/crm/companies"
            element={
              <ProtectedRoute>
                <CompaniesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/crm/deals"
            element={
              <ProtectedRoute>
                <DealsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/crm/activities"
            element={
              <ProtectedRoute>
                <ActivitiesPage />
              </ProtectedRoute>
            }
          />

          {/* Recruitment Routes */}
          <Route
            path="/recruitment/candidates"
            element={
              <ProtectedRoute>
                <CandidatesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruitment/jobs"
            element={
              <ProtectedRoute>
                <JobsPage />
              </ProtectedRoute>
            }
          />

          {/* Sales Routes */}
          <Route
            path="/sales/quotes"
            element={
              <ProtectedRoute>
                <QuotesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sales/products"
            element={
              <ProtectedRoute>
                <ProductsPage />
              </ProtectedRoute>
            }
          />

          {/* Contact Center Routes */}
          <Route
            path="/contact-center/workspace"
            element={
              <ProtectedRoute>
                <AgentWorkspace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contact-center/campaigns"
            element={
              <ProtectedRoute>
                <CampaignsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contact-center/pitch-flows"
            element={
              <ProtectedRoute>
                <PitchFlowsPage />
              </ProtectedRoute>
            }
          />

          {/* Enhanced Feature Routes */}
          <Route
            path="/360-view"
            element={
              <ProtectedRoute>
                <View360Page />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gamification"
            element={
              <ProtectedRoute>
                <GamificationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/territories"
            element={
              <ProtectedRoute>
                <TerritoriesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workflows"
            element={
              <ProtectedRoute>
                <WorkflowsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard-builder"
            element={
              <ProtectedRoute>
                <DashboardBuilderPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/audit-logs"
            element={
              <ProtectedRoute>
                <AuditLogsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/integrations"
            element={
              <ProtectedRoute>
                <IntegrationsPage />
              </ProtectedRoute>
            }
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
