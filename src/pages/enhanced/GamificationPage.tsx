import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEnhancedStore } from '@/stores/enhancedStore';
import { useAuthStore } from '@/stores/authStore';
import {
  Trophy,
  Star,
  Target,
  Zap,
  Crown,
  Medal,
  Award,
  Flame,
  Users,
  DollarSign,
  Phone,
  Briefcase,
} from 'lucide-react';

const badgeIcons: Record<string, React.ElementType> = {
  Trophy,
  Target,
  Zap,
  Crown,
  Medal,
  Award,
  Users,
};

export function GamificationPage() {
  const { gamificationProfiles, getLeaderboard } = useEnhancedStore();
  const { user } = useAuthStore();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  const userProfile = gamificationProfiles['user1'];
  const sortedLeaderboard = getLeaderboard(period);

  const nextLevelPoints = userProfile ? (userProfile.level * 1000) + 1000 : 1000;
  const currentLevelProgress = userProfile ? (userProfile.points % 1000) / 1000 * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gamification</h1>
        <p className="text-muted-foreground">Track your performance and earn rewards</p>
      </div>

      {/* User Profile Card */}
      {userProfile && (
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20 border-4 border-primary">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="text-2xl">{user?.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    {userProfile.level}
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{user?.name}</h2>
                  <p className="text-lg text-primary font-medium">{userProfile.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">{userProfile.streak_days} day streak</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold">{userProfile.points.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Points</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">{userProfile.rank}</p>
                  <p className="text-sm text-muted-foreground">Current Rank</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-500">
                    ${userProfile.total_commission_earned.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Commission Earned</p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span>Level {userProfile.level}</span>
                <span>Level {userProfile.level + 1}</span>
              </div>
              <Progress value={currentLevelProgress} className="h-3" />
              <p className="text-center text-sm text-muted-foreground mt-2">
                {nextLevelPoints - (userProfile.points % 1000)} points to next level
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      {userProfile && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-500/10 p-3">
                  <Trophy className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{userProfile.weekly_points}</p>
                  <p className="text-sm text-muted-foreground">Weekly Points</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-purple-500/10 p-3">
                  <Star className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{userProfile.monthly_points}</p>
                  <p className="text-sm text-muted-foreground">Monthly Points</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-500/10 p-3">
                  <DollarSign className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{(userProfile.commission_rate * 100).toFixed(0)}%</p>
                  <p className="text-sm text-muted-foreground">Commission Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-orange-500/10 p-3">
                  <Award className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{userProfile.badges.length}</p>
                  <p className="text-sm text-muted-foreground">Badges Earned</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="leaderboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button 
              variant={period === 'daily' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setPeriod('daily')}
            >
              Daily
            </Button>
            <Button 
              variant={period === 'weekly' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setPeriod('weekly')}
            >
              Weekly
            </Button>
            <Button 
              variant={period === 'monthly' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setPeriod('monthly')}
            >
              Monthly
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sortedLeaderboard.map((entry, index) => (
                  <div 
                    key={entry.user_id} 
                    className={`flex items-center gap-4 p-3 rounded-lg ${
                      entry.user_id === 'user1' ? 'bg-primary/5 border border-primary/20' : ''
                    }`}
                  >
                    <div className={`
                      flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold
                      ${index === 0 ? 'bg-yellow-500 text-white' : 
                        index === 1 ? 'bg-gray-400 text-white' : 
                        index === 2 ? 'bg-amber-600 text-white' : 'bg-muted'}
                    `}>
                      {entry.rank}
                    </div>
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={entry.avatar} />
                      <AvatarFallback>{entry.user_name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{entry.user_name}</p>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {entry.deals_closed} deals
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {entry.calls_made} calls
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">{entry.points.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">points</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="badges" className="space-y-4">
          {userProfile && (
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
              {userProfile.badges.map((badge) => {
                const Icon = badgeIcons[badge.icon] || Award;
                return (
                  <Card key={badge.id}>
                    <CardContent className="p-4 text-center">
                      <div 
                        className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full"
                        style={{ backgroundColor: `${badge.color}20` }}
                      >
                        <Icon className="h-8 w-8" style={{ color: badge.color }} />
                      </div>
                      <h3 className="font-bold">{badge.name}</h3>
                      <p className="text-sm text-muted-foreground">{badge.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Earned {new Date(badge.earned_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Coming Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">More achievements and challenges coming soon!</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
