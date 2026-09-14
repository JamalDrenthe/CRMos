import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

// Pages
import { Dashboard } from '@/pages/Dashboard';
import { ContactsPage } from '@/pages/crm/ContactsPage';
import { CompaniesPage } from '@/pages/crm/CompaniesPage';
import { DealsPage } from '@/pages/crm/DealsPage';
import { ActivitiesPage } from '@/pages/crm/ActivitiesPage';
import { CandidatesPage } from '@/pages/recruitment/CandidatesPage';
import { JobsPage } from '@/pages/recruitment/JobsPage';
import { QuotesPage } from '@/pages/sales/QuotesPage';
import { ProductsPage } from '@/pages/sales/ProductsPage';
import { AgentWorkspace } from '@/pages/contact-center/AgentWorkspace';
import { CampaignsPage } from '@/pages/contact-center/CampaignsPage';
import { PitchFlowsPage } from '@/pages/contact-center/PitchFlowsPage';
import { View360Page } from '@/pages/enhanced/View360Page';
import { GamificationPage } from '@/pages/enhanced/GamificationPage';
import { TerritoriesPage } from '@/pages/enhanced/TerritoriesPage';
import { WorkflowsPage } from '@/pages/enhanced/WorkflowsPage';
import { DashboardBuilderPage } from '@/pages/enhanced/DashboardBuilderPage';
import { AuditLogsPage } from '@/pages/admin/AuditLogsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { LoginPage } from '@/pages/LoginPage';

import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar 
        isCollapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className={cn(
          "flex-1 overflow-auto p-6 transition-all duration-300",
        )}>
          {children}
        </main>
      </div>
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
  return (
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route
            path="/"
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

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
