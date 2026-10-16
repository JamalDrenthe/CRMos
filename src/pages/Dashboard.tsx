// Dashboard page
import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useCRMStore } from '@/stores/crmStore';
import { useRecruitmentStore } from '@/stores/recruitmentStore';
import { useContactCenterStore } from '@/stores/contactCenterStore';
import { useEnhancedStore } from '@/stores/enhancedStore';
import { useAuthStore } from '@/stores/authStore';
import { filterRecordsForUser } from '@/lib/companyAccess';
import { isCoreEcosystemCompany, type Candidate, type Deal, type Contact, type Activity as ActivityType, type Job } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import {
  TrendingUp,
  Users,
  Briefcase,
  Euro,
  Phone,
  Target,
  Activity,
  GraduationCap,
  Trophy,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ShieldCheck,
  Layers,
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: 'up' | 'down';
  trendValue?: string;
  icon: React.ElementType;
  iconColor?: string;
}

function StatCard({ title, value, description, trend, trendValue, icon: Icon, iconColor = 'text-primary' }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
            {description && (
              <p className="mt-1 text-xs text-muted-foreground">{description}</p>
            )}
            {trend && trendValue && (
              <div className={`mt-2 flex items-center gap-1 text-sm ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                {trend === 'up' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                <span>{trendValue}</span>
              </div>
            )}
          </div>
          <div className={`rounded-lg bg-primary/10 p-3 ${iconColor}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PipelineOverview({ deals }: { deals: Deal[] }) {
  const { pipelines } = useCRMStore();
  const defaultPipeline = pipelines[0];

  const getStageStats = (stageId: string) => {
    const stageDeals = deals.filter((d) => d.stage === stageId);
    const value = stageDeals.reduce((sum, d) => sum + d.value, 0);
    return { count: stageDeals.length, value };
  };

  const totalValue = deals.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Pipeline Overview</CardTitle>
        <CardDescription>{defaultPipeline?.name}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {defaultPipeline?.stages.map((stage) => {
            const stats = getStageStats(stage.id);
            const percentage = totalValue > 0 ? (stats.value / totalValue) * 100 : 0;
            return (
              <div key={stage.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-3 w-3 rounded-full" 
                      style={{ backgroundColor: stage.color }}
                    />
                    <span>{stage.name}</span>
                    <Badge variant="secondary">{stats.count}</Badge>
                  </div>
                  <span className="font-medium">€{stats.value.toLocaleString()}</span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function RecentActivity({
  activities,
  contacts,
  deals,
}: {
  activities: ActivityType[];
  contacts: Contact[];
  deals: Deal[];
}) {
  const recentActivities = activities.slice(0, 10);

  const getRelatedName = (activity: ActivityType) => {
    if (activity.related_to.type === 'contact') {
      const contact = contacts.find((c) => c.id === activity.related_to.id);
      return contact ? `${contact.first_name} ${contact.last_name}` : 'Unknown';
    }
    if (activity.related_to.type === 'deal') {
      const deal = deals.find((d) => d.id === activity.related_to.id);
      return deal?.name || 'Unknown';
    }
    return 'Unknown';
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="h-4 w-4" />;
      case 'email': return <Activity className="h-4 w-4" />;
      case 'meeting': return <Clock className="h-4 w-4" />;
      case 'task': return <Target className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-primary/10 p-2">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {getRelatedName(activity)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {activity.due_date && formatDistanceToNow(new Date(activity.due_date), { addSuffix: true })}
                  </p>
                </div>
                <Badge variant={activity.status === 'completed' ? 'default' : 'outline'}>
                  {activity.status}
                </Badge>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function TopDeals({ deals }: { deals: Deal[] }) {
  const topDeals = [...deals]
    .filter((d) => d.stage !== 'closed-won' && d.stage !== 'closed-lost')
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Deals</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topDeals.map((deal) => (
            <div key={deal.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{deal.name}</p>
                <p className="text-xs text-muted-foreground">{deal.company_name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">€{deal.value.toLocaleString()}</p>
                <Badge variant="outline" className="text-xs">{deal.stage}</Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function LeaderboardWidget() {
  const { leaderboard } = useEnhancedStore();
  const topPerformers = leaderboard.slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Leaderboard</CardTitle>
          <CardDescription>Top performers this month</CardDescription>
        </div>
        <Trophy className="h-5 w-5 text-yellow-500" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topPerformers.map((entry, index) => (
            <div key={entry.user_id} className="flex items-center gap-3">
              <div className={`
                flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold
                ${index === 0 ? 'bg-yellow-500 text-white' : 
                  index === 1 ? 'bg-gray-400 text-white' : 
                  index === 2 ? 'bg-amber-600 text-white' : 'bg-muted'}
              `}>
                {entry.rank}
              </div>
              <Avatar className="h-8 w-8">
                <AvatarImage src={entry.avatar} />
                <AvatarFallback>{entry.user_name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">{entry.user_name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{entry.points.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">pts</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RecruitmentStats({
  candidates,
  jobs,
}: {
  candidates: Candidate[];
  jobs: Job[];
}) {
  const newCandidates = candidates.filter((c) => c.status === 'new').length;
  const activeJobs = jobs.filter((j) => j.status === 'published').length;
  const hiredThisMonth = candidates.filter((c) => 
    c.status === 'hired' && 
    new Date(c.updated_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ).length;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard
        title="New Candidates"
        value={newCandidates}
        description="Awaiting review"
        icon={Users}
        iconColor="text-blue-500"
      />
      <StatCard
        title="Active Jobs"
        value={activeJobs}
        description="Currently open"
        icon={Briefcase}
        iconColor="text-green-500"
      />
      <StatCard
        title="Hired This Month"
        value={hiredThisMonth}
        description="Successful placements"
        icon={GraduationCap}
        iconColor="text-purple-500"
      />
    </div>
  );
}

function ContactCenterStats() {
  const { todayStats } = useContactCenterStore();

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <StatCard
        title="Calls Made"
        value={todayStats.callsMade}
        description="Today's calls"
        icon={Phone}
        iconColor="text-blue-500"
      />
      <StatCard
        title="Completed"
        value={todayStats.callsCompleted}
        description="Successful calls"
        icon={Target}
        iconColor="text-green-500"
      />
      <StatCard
        title="Avg Duration"
        value={`${Math.floor(todayStats.avgDuration / 60)}:${String(todayStats.avgDuration % 60).padStart(2, '0')}`}
        description="Minutes per call"
        icon={Clock}
        iconColor="text-orange-500"
      />
      <StatCard
        title="Conversion"
        value={`${todayStats.conversionRate}%`}
        description="Interest rate"
        trend="up"
        trendValue="+5%"
        icon={TrendingUp}
        iconColor="text-purple-500"
      />
    </div>
  );
}

export function Dashboard() {
  const { deals, contacts, activities, pipelines, addActivity, addDeal } = useCRMStore();
  const { candidates, jobs } = useRecruitmentStore();
  const { campaigns, calls } = useContactCenterStore();
  const { user, adminCompanyFilter } = useAuthStore();

  const isCore = isCoreEcosystemCompany(user?.company_name);
  const isSuperAdmin =
    user?.email?.toLowerCase() === 'info@jamaldrenthe.com' ||
    user?.email?.toLowerCase() === 'info@crmos.one' ||
    user?.is_super_admin === true ||
    user?.role === 'admin';

  const defaultPipeline = pipelines[0];

  // Multi-Company Accessible Datasets
  const accessibleDeals = useMemo(
    () => filterRecordsForUser(user, deals, adminCompanyFilter),
    [user, deals, adminCompanyFilter]
  );
  const accessibleContacts = useMemo(
    () => filterRecordsForUser(user, contacts, adminCompanyFilter),
    [user, contacts, adminCompanyFilter]
  );
  const accessibleActivities = useMemo(
    () => filterRecordsForUser(user, activities, adminCompanyFilter),
    [user, activities, adminCompanyFilter]
  );
  const accessibleCandidates = useMemo(
    () => filterRecordsForUser(user, candidates, adminCompanyFilter),
    [user, candidates, adminCompanyFilter]
  );
  const accessibleJobs = useMemo(
    () => filterRecordsForUser(user, jobs, adminCompanyFilter),
    [user, jobs, adminCompanyFilter]
  );
  const accessibleCampaigns = useMemo(
    () => filterRecordsForUser(user, campaigns, adminCompanyFilter),
    [user, campaigns, adminCompanyFilter]
  );
  const accessibleCalls = useMemo(
    () => filterRecordsForUser(user, calls, adminCompanyFilter),
    [user, calls, adminCompanyFilter]
  );

  // Quick Actions modal states
  const [isLogCallOpen, setIsLogCallOpen] = useState(false);
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isNewDealOpen, setIsNewDealOpen] = useState(false);

  // Form states: Log Call
  const [callForm, setCallForm] = useState({
    contactId: '',
    title: '',
    outcome: 'connected',
    duration: '5',
    notes: '',
  });

  // Form states: Add Note
  const [noteForm, setNoteForm] = useState({
    contactId: '',
    title: '',
    content: '',
  });

  // Form states: Create Task
  const [taskForm, setTaskForm] = useState({
    title: '',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    priority: 'normal',
    contactId: '',
    description: '',
  });

  // Form states: New Deal
  const [dealForm, setDealForm] = useState({
    name: '',
    value: '',
    stage: 'lead',
    contactId: '',
    expectedClose: '',
    notes: '',
  });

  const handleSaveLogCall = (e: React.FormEvent) => {
    e.preventDefault();
    const contact = accessibleContacts.find((c) => c.id === callForm.contactId);
    const contactName = contact ? `${contact.first_name} ${contact.last_name}` : 'Algemeen contact';
    const title = callForm.title.trim() || `Gesprek met ${contactName}`;
    const outcomeMap: Record<string, string> = {
      connected: 'Gesproken / Bereikt',
      busy: 'In gesprek',
      left_voicemail: 'Voicemail ingesproken',
      no_answer: 'Niet opgenomen',
      callback_requested: 'Terugbelverzoek ontvangen',
    };
    const outcomeLabel = outcomeMap[callForm.outcome] || callForm.outcome;

    addActivity({
      type: 'call',
      title,
      description: `Resultaat: ${outcomeLabel} | Duur: ${callForm.duration || '0'} min\n${callForm.notes}`.trim(),
      status: 'completed',
      completed_at: new Date().toISOString(),
      assigned_to: user?.id || 'admin',
      related_to: {
        type: 'contact',
        id: callForm.contactId || 'general',
      },
      company_name: user?.company_name || 'CRMos',
      org_id: user?.org_id || 'default_org',
      is_crmos_core: isCore,
    });

    toast.success('Gesprek succesvol geregistreerd in het dossier!');
    setIsLogCallOpen(false);
    setCallForm({ contactId: '', title: '', outcome: 'connected', duration: '5', notes: '' });
  };

  const handleSaveAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteForm.content.trim()) {
      toast.error('Vul a.u.b. een notitiebeschrijving in.');
      return;
    }
    const contact = accessibleContacts.find((c) => c.id === noteForm.contactId);
    const contactName = contact ? `${contact.first_name} ${contact.last_name}` : 'Algemeen';
    const title = noteForm.title.trim() || `Notitie bij ${contactName}`;

    addActivity({
      type: 'note',
      title,
      description: noteForm.content.trim(),
      status: 'completed',
      completed_at: new Date().toISOString(),
      assigned_to: user?.id || 'admin',
      related_to: {
        type: 'contact',
        id: noteForm.contactId || 'general',
      },
      company_name: user?.company_name || 'CRMos',
      org_id: user?.org_id || 'default_org',
      is_crmos_core: isCore,
    });

    toast.success('Notitie succesvol toegevoegd aan het CRM!');
    setIsAddNoteOpen(false);
    setNoteForm({ contactId: '', title: '', content: '' });
  };

  const handleSaveCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim()) {
      toast.error('Vul een taaktitel in.');
      return;
    }

    addActivity({
      type: 'task',
      title: taskForm.title.trim(),
      description: `[Prioriteit: ${taskForm.priority.toUpperCase()}] ${taskForm.description}`.trim(),
      due_date: taskForm.dueDate ? new Date(taskForm.dueDate).toISOString() : new Date(Date.now() + 86400000).toISOString(),
      status: 'pending',
      assigned_to: user?.id || 'admin',
      related_to: {
        type: 'contact',
        id: taskForm.contactId || 'general',
      },
      company_name: user?.company_name || 'CRMos',
      org_id: user?.org_id || 'default_org',
      is_crmos_core: isCore,
    });

    toast.success('Taak succesvol aangemaakt!');
    setIsCreateTaskOpen(false);
    setTaskForm({
      title: '',
      dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      priority: 'normal',
      contactId: '',
      description: '',
    });
  };

  const handleSaveNewDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealForm.name.trim()) {
      toast.error('Vul een dealnaam in.');
      return;
    }
    const val = parseFloat(dealForm.value) || 0;
    const stageObj = defaultPipeline?.stages.find((s) => s.id === dealForm.stage);
    const contact = accessibleContacts.find((c) => c.id === dealForm.contactId);

    addDeal({
      name: dealForm.name.trim(),
      value: val,
      currency: 'EUR',
      stage: dealForm.stage || 'lead',
      pipeline_id: defaultPipeline?.id || '1',
      probability: stageObj?.probability ?? 20,
      expected_close_date: dealForm.expectedClose ? new Date(dealForm.expectedClose).toISOString() : undefined,
      source: 'Quick Action',
      assigned_to: user?.id || 'admin',
      assigned_name: user?.name || user?.email || 'Admin',
      company_id: contact?.company_id || '',
      contact_id: dealForm.contactId || '',
      contact_name: contact ? `${contact.first_name} ${contact.last_name}` : '',
      tags: ['Quick Action'],
      activities: [],
      notes: dealForm.notes.trim() || undefined,
      company_name: user?.company_name || 'CRMos',
      org_id: user?.org_id || 'default_org',
      is_crmos_core: isCore,
    });

    toast.success('Nieuwe deal succesvol aangemaakt in de pipeline!');
    setIsNewDealOpen(false);
    setDealForm({
      name: '',
      value: '',
      stage: 'lead',
      contactId: '',
      expectedClose: '',
      notes: '',
    });
  };

  // Calculate stats from accessible records
  const totalPipelineValue = accessibleDeals.reduce((sum, d) => sum + d.value, 0);
  const wonDeals = accessibleDeals.filter((d) => d.stage === 'closed-won');
  const wonRevenue = wonDeals.reduce((sum, d) => sum + d.value, 0);
  const activeDeals = accessibleDeals.filter((d) => d.stage !== 'closed-won' && d.stage !== 'closed-lost').length;

  return (
    <div className="space-y-6">
      {/* Header & Multi-Tenant Company Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welkom terug, {user?.name?.split(' ')[0] || 'Gebruiker'}!
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Overzicht van jouw commerciële operatie, deals en personeelspijplijn.
          </p>
        </div>

        {/* Company Isolation Status Pill */}
        <div className="flex items-center gap-2">
          {isCore ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-600 dark:text-emerald-400 font-medium shadow-xs">
              <Layers className="h-4 w-4" />
              <span>Core Ecosysteem ({user?.company_name || 'CRMos'})</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 text-xs text-indigo-500 font-medium shadow-xs">
              <ShieldCheck className="h-4 w-4" />
              <span>Geïsoleerd Bedrijf: {user?.company_name || 'Eigen Workspace'}</span>
            </div>
          )}

          {isSuperAdmin && adminCompanyFilter && adminCompanyFilter !== 'all' && (
            <Badge variant="outline" className="border-amber-500/40 text-amber-500 text-xs">
              Filter: {adminCompanyFilter === 'crmos_core' ? 'CRMos Core' : adminCompanyFilter}
            </Badge>
          )}
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Pipeline Value"
          value={`€${totalPipelineValue.toLocaleString()}`}
          trend="up"
          trendValue="+12%"
          icon={Euro}
          iconColor="text-green-500"
        />
        <StatCard
          title="Won Revenue"
          value={`€${wonRevenue.toLocaleString()}`}
          trend="up"
          trendValue="+8%"
          icon={TrendingUp}
          iconColor="text-blue-500"
        />
        <StatCard
          title="Active Deals"
          value={activeDeals}
          description="In progress"
          icon={Briefcase}
          iconColor="text-purple-500"
        />
        <StatCard
          title="Toegankelijke Contacten"
          value={accessibleContacts.length}
          trend="up"
          trendValue="+24"
          icon={Users}
          iconColor="text-orange-500"
        />
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">Sales &amp; Deals</TabsTrigger>
          <TabsTrigger value="recruitment">Recruitment</TabsTrigger>
          <TabsTrigger value="contact-center">Contact Center</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <PipelineOverview deals={accessibleDeals} />
            <RecentActivity
              activities={accessibleActivities}
              contacts={accessibleContacts}
              deals={accessibleDeals}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <TopDeals deals={accessibleDeals} />
            <LeaderboardWidget />
            <Card className="rounded-2xl border-border/60 shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
                  <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
                    1-klik acties
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Voer direct operationele CRM-acties uit met automatische dossiervastlegging.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsLogCallOpen(true)}
                    className="group relative flex flex-col justify-between rounded-xl border border-border/60 bg-card p-3.5 text-left transition-all duration-200 hover:border-blue-500/40 hover:bg-blue-500/5 hover:shadow-xs active:scale-[0.98] cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <div className="rounded-lg bg-blue-500/10 p-2 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                        <Phone className="h-4 w-4" />
                      </div>
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-blue-500 transition-colors" />
                    </div>
                    <div>
                      <p className="font-semibold text-xs tracking-tight">Log Call</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Gesprek registreren</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAddNoteOpen(true)}
                    className="group relative flex flex-col justify-between rounded-xl border border-border/60 bg-card p-3.5 text-left transition-all duration-200 hover:border-emerald-500/40 hover:bg-emerald-500/5 hover:shadow-xs active:scale-[0.98] cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                        <Activity className="h-4 w-4" />
                      </div>
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-emerald-500 transition-colors" />
                    </div>
                    <div>
                      <p className="font-semibold text-xs tracking-tight">Add Note</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Notitie toevoegen</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsCreateTaskOpen(true)}
                    className="group relative flex flex-col justify-between rounded-xl border border-border/60 bg-card p-3.5 text-left transition-all duration-200 hover:border-purple-500/40 hover:bg-purple-500/5 hover:shadow-xs active:scale-[0.98] cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <div className="rounded-lg bg-purple-500/10 p-2 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                        <Target className="h-4 w-4" />
                      </div>
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-purple-500 transition-colors" />
                    </div>
                    <div>
                      <p className="font-semibold text-xs tracking-tight">Create Task</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Taak inplannen</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsNewDealOpen(true)}
                    className="group relative flex flex-col justify-between rounded-xl border border-border/60 bg-card p-3.5 text-left transition-all duration-200 hover:border-amber-500/40 hover:bg-amber-500/5 hover:shadow-xs active:scale-[0.98] cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <div className="rounded-lg bg-amber-500/10 p-2 text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-amber-500 transition-colors" />
                    </div>
                    <div>
                      <p className="font-semibold text-xs tracking-tight">New Deal</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Nieuwe verkoopkans</p>
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recruitment" className="space-y-4">
          <RecruitmentStats
            candidates={accessibleCandidates}
            jobs={accessibleJobs}
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Candidate Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['new', 'screening', 'interview', 'offer', 'hired'].map((stage) => {
                    const count = accessibleCandidates.filter((c) => c.status === stage).length;
                    return (
                      <div key={stage} className="flex items-center justify-between">
                        <span className="capitalize text-xs font-medium">{stage}</span>
                        <div className="flex items-center gap-3">
                          <Progress value={count * 10} className="w-24" />
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Open Positions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {accessibleJobs
                    .filter((j) => j.status === 'published')
                    .map((job) => (
                      <div key={job.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{job.title}</p>
                          <p className="text-xs text-muted-foreground">{job.department} • {job.location}</p>
                        </div>
                        <Badge variant="secondary">{job.candidates_count} candidates</Badge>
                      </div>
                    ))}
                  {accessibleJobs.filter((j) => j.status === 'published').length === 0 && (
                    <p className="text-xs text-muted-foreground py-4 text-center">
                      Geen openstaande vacatures gevonden voor jouw bedrijf.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contact-center" className="space-y-4">
          <ContactCenterStats />
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Active Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {accessibleCampaigns
                    .filter((c) => c.status === 'active')
                    .map((campaign) => (
                      <div key={campaign.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">{campaign.name}</p>
                          <Badge>{campaign.type}</Badge>
                        </div>
                        <Progress 
                          value={campaign.target_contacts > 0 ? (campaign.completed_contacts / campaign.target_contacts) * 100 : 0} 
                          className="h-2" 
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{campaign.completed_contacts} / {campaign.target_contacts} contacts</span>
                          <span>{campaign.conversion_rate}% conversion</span>
                        </div>
                      </div>
                    ))}
                  {accessibleCampaigns.filter((c) => c.status === 'active').length === 0 && (
                    <p className="text-xs text-muted-foreground py-4 text-center">
                      Geen actieve belcampagnes gevonden voor jouw bedrijf.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Recent Calls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {accessibleCalls
                    .slice(0, 5)
                    .map((call) => (
                      <div key={call.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`rounded-full p-2 ${call.direction === 'inbound' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
                            <Phone className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{call.contact_name || call.to_number}</p>
                            <p className="text-xs text-muted-foreground">
                              {call.duration ? `${Math.floor(call.duration / 60)}:${String(call.duration % 60).padStart(2, '0')}` : 'Missed'}
                            </p>
                          </div>
                        </div>
                        <Badge variant={call.status === 'completed' ? 'default' : 'secondary'}>
                          {call.status}
                        </Badge>
                      </div>
                    ))}
                  {accessibleCalls.length === 0 && (
                    <p className="text-xs text-muted-foreground py-4 text-center">
                      Geen recente gesprekken gevonden voor jouw bedrijf.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Action Dialog: Log Call */}
      <Dialog open={isLogCallOpen} onOpenChange={setIsLogCallOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-blue-500" />
              <span>Telefoongesprek registreren</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Leg direct een gevoerd of gepland klantgesprek vast in het CRM-dossier.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveLogCall} className="space-y-3.5 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Contactpersoon / Relatie</Label>
              <select
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground font-medium"
                value={callForm.contactId}
                onChange={(e) => setCallForm({ ...callForm, contactId: e.target.value })}
              >
                <option value="">Algemeen (Geen specifiek contact)</option>
                {accessibleContacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name} {c.company ? `(${c.company})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Onderwerp / Titel</Label>
              <Input
                placeholder="bijv. Follow-up offerte of kennismakingsgesprek"
                value={callForm.title}
                onChange={(e) => setCallForm({ ...callForm, title: e.target.value })}
                className="rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Gespreksresultaat</Label>
                <select
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground font-medium"
                  value={callForm.outcome}
                  onChange={(e) => setCallForm({ ...callForm, outcome: e.target.value })}
                >
                  <option value="connected">Gesproken / Bereikt</option>
                  <option value="callback_requested">Terugbelverzoek</option>
                  <option value="left_voicemail">Voicemail ingesproken</option>
                  <option value="busy">In gesprek</option>
                  <option value="no_answer">Niet opgenomen</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Duur (minuten)</Label>
                <Input
                  type="number"
                  min="1"
                  value={callForm.duration}
                  onChange={(e) => setCallForm({ ...callForm, duration: e.target.value })}
                  className="rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Gespreksnotities &amp; Afspraken</Label>
              <Textarea
                rows={3}
                placeholder="Wat is er besproken? Welke vervolgacties zijn er afgesproken..."
                value={callForm.notes}
                onChange={(e) => setCallForm({ ...callForm, notes: e.target.value })}
                className="rounded-xl text-xs resize-none"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsLogCallOpen(false)}
                className="rounded-xl text-xs"
              >
                Annuleren
              </Button>
              <Button type="submit" size="sm" className="rounded-xl text-xs">
                Gesprek Opslaan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quick Action Dialog: Add Note */}
      <Dialog open={isAddNoteOpen} onOpenChange={setIsAddNoteOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-500" />
              <span>Notitie toevoegen</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Plaats een snelle memo, intern overlegpunt of klantdossier-notitie.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveAddNote} className="space-y-3.5 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Gekoppeld Contact (Optioneel)</Label>
              <select
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground font-medium"
                value={noteForm.contactId}
                onChange={(e) => setNoteForm({ ...noteForm, contactId: e.target.value })}
              >
                <option value="">Algemeen (Geen specifiek contact)</option>
                {accessibleContacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name} {c.company ? `(${c.company})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Onderwerp / Titel</Label>
              <Input
                placeholder="bijv. Notities kwartaalevaluatie of tariefafspraak"
                value={noteForm.title}
                onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                className="rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Inhoud van de notitie *</Label>
              <Textarea
                rows={4}
                required
                placeholder="Schrijf hier je gedetailleerde aantekeningen..."
                value={noteForm.content}
                onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                className="rounded-xl text-xs resize-none"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddNoteOpen(false)}
                className="rounded-xl text-xs"
              >
                Annuleren
              </Button>
              <Button type="submit" size="sm" className="rounded-xl text-xs">
                Notitie Opslaan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quick Action Dialog: Create Task */}
      <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-500" />
              <span>Nieuwe taak inplannen</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Wijs een to-do, opvolgtaak of deadline toe binnen jouw CRM-organisatie.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveCreateTask} className="space-y-3.5 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Taakomschrijving *</Label>
              <Input
                required
                placeholder="bijv. Offerte toesturen en telefonisch nabellen"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                className="rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Vervaldatum</Label>
                <Input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Prioriteit</Label>
                <select
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground font-medium"
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                >
                  <option value="normal">Normaal</option>
                  <option value="high">Hoog</option>
                  <option value="urgent">Dringend / Urgent</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Gekoppeld Contact (Optioneel)</Label>
              <select
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground font-medium"
                value={taskForm.contactId}
                onChange={(e) => setTaskForm({ ...taskForm, contactId: e.target.value })}
              >
                <option value="">Algemeen (Geen specifiek contact)</option>
                {accessibleContacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name} {c.company ? `(${c.company})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Toelichting &amp; Notities</Label>
              <Textarea
                rows={2}
                placeholder="Eventuele extra details over de taakuitvoering..."
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                className="rounded-xl text-xs resize-none"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateTaskOpen(false)}
                className="rounded-xl text-xs"
              >
                Annuleren
              </Button>
              <Button type="submit" size="sm" className="rounded-xl text-xs">
                Taak Inplannen
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quick Action Dialog: New Deal */}
      <Dialog open={isNewDealOpen} onOpenChange={setIsNewDealOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-amber-500" />
              <span>Nieuwe Deal aanmaken</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Voeg een nieuwe verkoopkans toe aan de actieve sales pipeline.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveNewDeal} className="space-y-3.5 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Dealnaam *</Label>
              <Input
                required
                placeholder="bijv. Jaarcontract CRMos Enterprise 2026"
                value={dealForm.name}
                onChange={(e) => setDealForm({ ...dealForm, name: e.target.value })}
                className="rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Waarde (€ EUR) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
                  <Input
                    type="number"
                    min="0"
                    step="50"
                    required
                    placeholder="5000"
                    value={dealForm.value}
                    onChange={(e) => setDealForm({ ...dealForm, value: e.target.value })}
                    className="rounded-xl pl-7 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Pipeline Fase</Label>
                <select
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground font-medium"
                  value={dealForm.stage}
                  onChange={(e) => setDealForm({ ...dealForm, stage: e.target.value })}
                >
                  {defaultPipeline?.stages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name} ({stage.probability}%)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Gekoppeld Contact / Relatie</Label>
              <select
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground font-medium"
                value={dealForm.contactId}
                onChange={(e) => setDealForm({ ...dealForm, contactId: e.target.value })}
              >
                <option value="">Geen specifiek contact gekoppeld</option>
                {accessibleContacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name} {c.company ? `(${c.company})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Verwachte Sluitdatum</Label>
              <Input
                type="date"
                value={dealForm.expectedClose}
                onChange={(e) => setDealForm({ ...dealForm, expectedClose: e.target.value })}
                className="rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Notities &amp; Verwachtingen</Label>
              <Textarea
                rows={2}
                placeholder="Informatie over budget, besluitvormer of vervolgstappen..."
                value={dealForm.notes}
                onChange={(e) => setDealForm({ ...dealForm, notes: e.target.value })}
                className="rounded-xl text-xs resize-none"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsNewDealOpen(false)}
                className="rounded-xl text-xs"
              >
                Annuleren
              </Button>
              <Button type="submit" size="sm" className="rounded-xl text-xs">
                Deal Aanmaken
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
