import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEnhancedStore } from '@/stores/enhancedStore';
import { useCRMStore } from '@/stores/crmStore';
import { useContactCenterStore } from '@/stores/contactCenterStore';
import { useRecruitmentStore } from '@/stores/recruitmentStore';
import {
  Plus,
  BarChart3,
  TrendingUp,
  Users,
  Briefcase,
  Target,
  Phone,
  DollarSign,
  Activity,
  GripVertical,
  X,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

const widgetTypes = [
  { type: 'stats', name: 'Key Metrics', icon: BarChart3 },
  { type: 'pipeline', name: 'Pipeline', icon: TrendingUp },
  { type: 'list', name: 'Top Deals', icon: Briefcase },
  { type: 'activity', name: 'Recent Activity', icon: Activity },
  { type: 'tasks', name: 'My Tasks', icon: Target },
  { type: 'calls', name: 'Call Stats', icon: Phone },
  { type: 'leaderboard', name: 'Leaderboard', icon: Users },
  { type: 'performance', name: 'Performance', icon: DollarSign },
];

export function DashboardBuilderPage() {
  const { dashboards, currentDashboard, addWidget, removeWidget } = useEnhancedStore();
  const { deals, contacts } = useCRMStore();
  const { todayStats } = useContactCenterStore();
  const { candidates } = useRecruitmentStore();
  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false);

  const renderWidget = (widget: any) => {
    switch (widget?.type) {
      case 'stats':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-primary/5 p-3">
              <p className="text-sm text-muted-foreground">Pipeline</p>
              <p className="text-xl font-bold">${deals.reduce((sum, d) => sum + d.value, 0).toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-green-500/5 p-3">
              <p className="text-sm text-muted-foreground">Contacts</p>
              <p className="text-xl font-bold text-green-500">{contacts.length}</p>
            </div>
            <div className="rounded-lg bg-blue-500/5 p-3">
              <p className="text-sm text-muted-foreground">Deals</p>
              <p className="text-xl font-bold text-blue-500">{deals.length}</p>
            </div>
            <div className="rounded-lg bg-purple-500/5 p-3">
              <p className="text-sm text-muted-foreground">Candidates</p>
              <p className="text-xl font-bold text-purple-500">{candidates.length}</p>
            </div>
          </div>
        );
      case 'pipeline':
        return (
          <div className="space-y-3">
            {['lead', 'qualified', 'proposal', 'negotiation'].map((stage) => {
              const stageDeals = deals.filter((d) => d.stage === stage);
              return (
                <div key={stage} className="flex items-center justify-between">
                  <span className="capitalize text-sm">{stage}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${Math.min(100, stageDeals.length * 10)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{stageDeals.length}</span>
                  </div>
                </div>
              );
            })}
          </div>
        );
      case 'calls':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold">{todayStats.callsMade}</p>
              <p className="text-sm text-muted-foreground">Calls Made</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-500">{todayStats.callsCompleted}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-500">
                {Math.floor(todayStats.avgDuration / 60)}:{String(todayStats.avgDuration % 60).padStart(2, '0')}
              </p>
              <p className="text-sm text-muted-foreground">Avg Duration</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-500">{todayStats.conversionRate}%</p>
              <p className="text-sm text-muted-foreground">Conversion</p>
            </div>
          </div>
        );
      case 'leaderboard':
        return (
          <div className="space-y-2">
            {useEnhancedStore.getState().leaderboard.slice(0, 3).map((entry, index) => (
              <div key={entry.user_id} className="flex items-center gap-3">
                <div className={`
                  flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold
                  ${index === 0 ? 'bg-yellow-500 text-white' : 
                    index === 1 ? 'bg-gray-400 text-white' : 
                    'bg-amber-600 text-white'}
                `}>
                  {entry.rank}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{entry.user_name}</p>
                </div>
                <span className="text-sm font-bold">{entry.points.toLocaleString()}</span>
              </div>
            ))}
          </div>
        );
      default:
        return <p className="text-muted-foreground text-center py-8">Widget content</p>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Builder</h1>
          <p className="text-muted-foreground">Customize your dashboard with widgets</p>
        </div>
        <Dialog open={isAddWidgetOpen} onOpenChange={setIsAddWidgetOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Widget
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Widget</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 py-4">
              {widgetTypes.map((widget) => (
                <button
                  key={widget.type}
                  className="flex items-center gap-3 rounded-lg border p-4 hover:bg-accent transition-colors text-left"
                  onClick={() => {
                    if (currentDashboard) {
                      addWidget(currentDashboard.id, {
                        type: widget.type as any,
                        title: widget.name,
                        config: {},
                        position: { x: 0, y: 0, w: 2, h: 2 },
                      });
                      toast.success('Widget added');
                    }
                    setIsAddWidgetOpen(false);
                  }}
                >
                  <widget.icon className="h-5 w-5 text-primary" />
                  <span>{widget.name}</span>
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue={currentDashboard?.id}>
        <TabsList>
          {dashboards.map((dashboard) => (
            <TabsTrigger key={dashboard.id} value={dashboard.id}>
              {dashboard.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {dashboards.map((dashboard) => (
          <TabsContent key={dashboard.id} value={dashboard.id}>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {dashboard.widgets.map((widget) => (
                <Card key={widget.id} className="relative group">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-6 w-6 cursor-move">
                        <GripVertical className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => { removeWidget(dashboard.id, widget.id); toast.success('Widget removed'); }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {renderWidget(widget)}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
