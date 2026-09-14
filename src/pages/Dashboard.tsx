// Dashboard page
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCRMStore } from '@/stores/crmStore';
import { useRecruitmentStore } from '@/stores/recruitmentStore';
import { useContactCenterStore } from '@/stores/contactCenterStore';
import { useEnhancedStore } from '@/stores/enhancedStore';
import { useAuthStore } from '@/stores/authStore';
import { formatDistanceToNow } from 'date-fns';
import {
  TrendingUp,
  Users,
  Briefcase,
  DollarSign,
  Phone,
  Target,
  Activity,
  GraduationCap,
  Trophy,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from 'lucide-react';
import type { Candidate } from '@/types';

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

function PipelineOverview() {
  const { pipelines, deals } = useCRMStore();
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
                  <span className="font-medium">${stats.value.toLocaleString()}</span>
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

function RecentActivity() {
  const { activities, contacts, deals } = useCRMStore();
  const recentActivities = activities.slice(0, 10);

  const getRelatedName = (activity: typeof activities[0]) => {
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

function TopDeals() {
  const { deals } = useCRMStore();
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
                <p className="text-sm font-medium">${deal.value.toLocaleString()}</p>
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

function RecruitmentStats() {
  const { candidates, jobs } = useRecruitmentStore();
  
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
  const { deals, contacts } = useCRMStore();
  const { user } = useAuthStore();

  // Calculate stats
  const totalPipelineValue = deals.reduce((sum, d) => sum + d.value, 0);
  const wonDeals = deals.filter((d) => d.stage === 'closed-won');
  const wonRevenue = wonDeals.reduce((sum, d) => sum + d.value, 0);
  const activeDeals = deals.filter((d) => d.stage !== 'closed-won' && d.stage !== 'closed-lost').length;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user?.name?.split(' ')[0] || 'User'}!</h1>
        <p className="text-muted-foreground">Here's what's happening with your business today.</p>
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Pipeline Value"
          value={`$${totalPipelineValue.toLocaleString()}`}
          trend="up"
          trendValue="+12%"
          icon={DollarSign}
          iconColor="text-green-500"
        />
        <StatCard
          title="Won Revenue"
          value={`$${wonRevenue.toLocaleString()}`}
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
          title="Total Contacts"
          value={contacts.length}
          trend="up"
          trendValue="+24"
          icon={Users}
          iconColor="text-orange-500"
        />
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="recruitment">Recruitment</TabsTrigger>
          <TabsTrigger value="contact-center">Contact Center</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <PipelineOverview />
            <RecentActivity />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <TopDeals />
            <LeaderboardWidget />
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <button className="rounded-lg border p-4 text-left transition-colors hover:bg-accent">
                    <Phone className="mb-2 h-5 w-5 text-blue-500" />
                    <p className="font-medium">Log Call</p>
                  </button>
                  <button className="rounded-lg border p-4 text-left transition-colors hover:bg-accent">
                    <Activity className="mb-2 h-5 w-5 text-green-500" />
                    <p className="font-medium">Add Note</p>
                  </button>
                  <button className="rounded-lg border p-4 text-left transition-colors hover:bg-accent">
                    <Target className="mb-2 h-5 w-5 text-purple-500" />
                    <p className="font-medium">Create Task</p>
                  </button>
                  <button className="rounded-lg border p-4 text-left transition-colors hover:bg-accent">
                    <Briefcase className="mb-2 h-5 w-5 text-orange-500" />
                    <p className="font-medium">New Deal</p>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recruitment" className="space-y-4">
          <RecruitmentStats />
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Candidate Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['new', 'screening', 'interview', 'offer', 'hired'].map((stage) => {
                    const count = useRecruitmentStore.getState().getCandidatesByStage(stage as Candidate['status']).length;
                    return (
                      <div key={stage} className="flex items-center justify-between">
                        <span className="capitalize">{stage}</span>
                        <div className="flex items-center gap-3">
                          <Progress value={count * 10} className="w-24" />
                          <Badge>{count}</Badge>
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
                  {useRecruitmentStore.getState().jobs
                    .filter((j) => j.status === 'published')
                    .map((job) => (
                      <div key={job.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{job.title}</p>
                          <p className="text-xs text-muted-foreground">{job.department} • {job.location}</p>
                        </div>
                        <Badge variant="secondary">{job.candidates_count} candidates</Badge>
                      </div>
                    ))}
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
                  {useContactCenterStore.getState().campaigns
                    .filter((c) => c.status === 'active')
                    .map((campaign) => (
                      <div key={campaign.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{campaign.name}</p>
                          <Badge>{campaign.type}</Badge>
                        </div>
                        <Progress 
                          value={(campaign.completed_contacts / campaign.target_contacts) * 100} 
                          className="h-2" 
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{campaign.completed_contacts} / {campaign.target_contacts} contacts</span>
                          <span>{campaign.conversion_rate}% conversion</span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Recent Calls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {useContactCenterStore.getState().calls
                    .slice(0, 5)
                    .map((call) => (
                      <div key={call.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`rounded-full p-2 ${call.direction === 'inbound' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
                            <Phone className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">{call.contact_name || call.to_number}</p>
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
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
