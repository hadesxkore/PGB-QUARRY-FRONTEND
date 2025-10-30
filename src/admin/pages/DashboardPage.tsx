import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mountain, Truck, Camera, Users, TrendingUp, Activity } from 'lucide-react';

const stats = [
  {
    title: 'Active Quarries',
    value: '12',
    change: '+2 from last month',
    icon: Mountain,
    color: 'bg-blue-500',
  },
  {
    title: 'Truck Logs Today',
    value: '48',
    change: '+12% from yesterday',
    icon: Truck,
    color: 'bg-green-500',
  },
  {
    title: 'CCTV Cameras',
    value: '24',
    change: 'All operational',
    icon: Camera,
    color: 'bg-purple-500',
  },
  {
    title: 'Total Users',
    value: '156',
    change: '+8 this week',
    icon: Users,
    color: 'bg-orange-500',
  },
];

const recentActivity = [
  { action: 'New truck entry logged', time: '5 minutes ago', type: 'truck' },
  { action: 'Quarry permit approved', time: '1 hour ago', type: 'quarry' },
  { action: 'CCTV snapshot captured', time: '2 hours ago', type: 'cctv' },
  { action: 'New user registered', time: '3 hours ago', type: 'user' },
  { action: 'Monthly report generated', time: '5 hours ago', type: 'report' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome to QuarryWebSystem</h2>
        <p className="text-blue-100">
          Monitor and manage all quarry operations in the Province of Bataan
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {stat.title}
                </CardTitle>
                <div className={`${stat.color} p-2 rounded-lg`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest system activities and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                  <div className="h-2 w-2 bg-blue-500 rounded-full mt-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{activity.action}</p>
                    <p className="text-xs text-slate-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Current system health and performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Database</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-green-600">Operational</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">API Server</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-green-600">Operational</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">CCTV Network</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-green-600">Operational</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Storage</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-yellow-500 rounded-full" />
                <span className="text-sm text-yellow-600">78% Used</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
