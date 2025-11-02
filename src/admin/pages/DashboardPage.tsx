import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { 
  Truck, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  FileText,
  Users,
  Mountain,
  TrendingUp,
  Activity,
  Clock,
  Maximize2
} from 'lucide-react';
import { format } from 'date-fns';
import { io, Socket } from 'socket.io-client';

interface Stats {
  totalTruckLogsToday: number;
  trucksInToday: number;
  trucksOutToday: number;
  overallTotal: number;
}

interface RecentActivity {
  _id: string;
  type: 'truck_in' | 'truck_out';
  plateNumber: string;
  brand: string;
  company: string;
  userName: string;
  timestamp: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalTruckLogsToday: 0,
    trucksInToday: 0,
    trucksOutToday: 0,
    overallTotal: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [allActivities, setAllActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showAllModal, setShowAllModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      const authStorage = localStorage.getItem('auth-storage');
      const token = authStorage ? JSON.parse(authStorage).state.token : null;

      // Fetch all truck logs
      const logsResponse = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/truck-logs/all`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (!logsResponse.ok) throw new Error('Failed to fetch logs');
      const logsData = await logsResponse.json();
      const allLogs = logsData.data || [];

      // Calculate today's logs
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayLogs = allLogs.filter((log: any) => {
        const logDate = new Date(log.createdAt);
        logDate.setHours(0, 0, 0, 0);
        return logDate.getTime() === today.getTime();
      });

      const trucksInToday = todayLogs.filter((log: any) => log.logType === 'IN').length;
      const trucksOutToday = todayLogs.filter((log: any) => log.logType === 'OUT').length;
      const totalTruckLogsToday = todayLogs.length;

      // Fetch users to get names
      const usersResponse = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      const usersMap = new Map();
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        const users = usersData.data || [];
        users.forEach((user: any) => {
          usersMap.set(user._id || user.id, user.name);
        });
      }

      // Build all activities
      const activities: RecentActivity[] = allLogs
        .map((log: any) => {
          // Try to get user name from multiple possible fields
          const userId = log.user?._id || log.user?.id || log.user || log.loggedBy?._id || log.loggedBy?.id || log.loggedBy;
          const userName = log.loggedBy?.name || log.user?.name || usersMap.get(userId) || 'Unknown User';
          
          return {
            _id: log._id,
            type: log.logType === 'IN' ? 'truck_in' : 'truck_out',
            plateNumber: log.plateNumber || 'N/A',
            brand: log.brand || 'N/A',
            company: log.company || 'Unknown',
            userName,
            timestamp: log.createdAt,
          };
        });

      setStats({
        totalTruckLogsToday,
        trucksInToday,
        trucksOutToday,
        overallTotal: allLogs.length,
      });

      console.log('Total activities:', activities.length);
      setAllActivities(activities);
      setRecentActivities(activities.slice(0, 20));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize WebSocket for real-time updates
  useEffect(() => {
    fetchDashboardData();

    const BACKEND_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(BACKEND_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      console.log('✅ Admin Dashboard WebSocket connected');
    });

    newSocket.on('truckLog:created', async (data?: any) => {
      console.log('New truck log received:', data);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalTruckLogsToday: prev.totalTruckLogsToday + 1,
        trucksInToday: data?.logType === 'IN' ? prev.trucksInToday + 1 : prev.trucksInToday,
        trucksOutToday: data?.logType === 'OUT' ? prev.trucksOutToday + 1 : prev.trucksOutToday,
        overallTotal: prev.overallTotal + 1,
      }));

      // Add to recent activities
      if (data?.logs?.[0]) {
        const log = data.logs[0];
        
        // Fetch user name if needed
        let userName = 'Unknown User';
        const userId = log.user?._id || log.user?.id || log.user;
        
        if (userId) {
          try {
            const authStorage = localStorage.getItem('auth-storage');
            const token = authStorage ? JSON.parse(authStorage).state.token : null;
            
            const userResponse = await fetch(
              `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users`,
              {
                headers: { 'Authorization': `Bearer ${token}` },
              }
            );
            
            if (userResponse.ok) {
              const usersData = await userResponse.json();
              const users = usersData.data || [];
              const user = users.find((u: any) => (u._id || u.id) === userId);
              if (user) {
                userName = user.name;
              }
            }
          } catch (error) {
            console.error('Error fetching user name:', error);
          }
        }
        
        const newActivity: RecentActivity = {
          _id: log._id,
          type: log.logType === 'IN' ? 'truck_in' : 'truck_out',
          plateNumber: log.plateNumber || 'N/A',
          brand: log.brand || 'N/A',
          company: log.company || 'Unknown',
          userName,
          timestamp: log.createdAt,
        };

        setAllActivities(prev => [newActivity, ...prev]);
        setRecentActivities(prev => [newActivity, ...prev].slice(0, 20));
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const statCards = [
    {
      title: 'Total Truck Logs Today',
      value: stats.totalTruckLogsToday,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Logged today',
    },
    {
      title: 'Trucks IN Today',
      value: stats.trucksInToday,
      icon: ArrowDownToLine,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Logged in today',
    },
    {
      title: 'Trucks OUT Today',
      value: stats.trucksOutToday,
      icon: ArrowUpFromLine,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'Logged out today',
    },
    {
      title: 'Overall Total',
      value: stats.overallTotal,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'All time records',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard Overview</h2>
          <p className="text-sm text-slate-500">Real-time system statistics and activity</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-medium text-green-700">Live Updates</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
                <p className="text-xs text-slate-500 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Recent Activity
              </CardTitle>
              <CardDescription>Last 20 truck log activities from all users</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {recentActivities.length} / {allActivities.length} activities
              </Badge>
              <Button 
                onClick={() => setShowAllModal(true)}
                size="sm"
                variant="outline"
                className="gap-1"
              >
                <Maximize2 className="h-3 w-3" />
                View All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2">
            {recentActivities.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Truck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            ) : (
              recentActivities.map((activity) => (
                <div
                  key={activity._id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <div
                    className={`p-2 rounded-lg ${
                      activity.type === 'truck_in' ? 'bg-green-50' : 'bg-orange-50'
                    }`}
                  >
                    {activity.type === 'truck_in' ? (
                      <ArrowDownToLine className="h-4 w-4 text-green-600" />
                    ) : (
                      <ArrowUpFromLine className="h-4 w-4 text-orange-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={activity.type === 'truck_in' ? 'default' : 'secondary'}
                        className={`text-xs ${
                          activity.type === 'truck_in'
                            ? 'bg-green-500 hover:bg-green-600'
                            : 'bg-orange-500 hover:bg-orange-600 text-white'
                        }`}
                      >
                        {activity.type === 'truck_in' ? 'IN' : 'OUT'}
                      </Badge>
                      <span className="font-semibold text-slate-900 text-sm">
                        {activity.plateNumber}
                      </span>
                      <span className="text-slate-500 text-xs">•</span>
                      <span className="text-slate-600 text-xs">{activity.brand}</span>
                    </div>
                    <p className="text-sm text-slate-600 truncate">
                      <span className="font-medium">{activity.company}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      <Users className="h-3 w-3" />
                      <span>{activity.userName}</span>
                      <span>•</span>
                      <Clock className="h-3 w-3" />
                      <span>{format(new Date(activity.timestamp), 'MMM dd, yyyy hh:mm a')}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* View All Activities Modal */}
      <Dialog open={showAllModal} onOpenChange={(open) => {
        setShowAllModal(open);
        if (open) setCurrentPage(1); // Reset to page 1 when opening
      }}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-6xl max-h-[90vh] overflow-hidden p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">All Recent Activities</DialogTitle>
            <DialogDescription>
              Complete list of all truck log activities ({allActivities.length} total)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="overflow-y-auto max-h-[calc(90vh-300px)]">
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow>
                    <TableHead className="w-[80px]">Type</TableHead>
                    <TableHead>Plate Number</TableHead>
                    <TableHead className="hidden md:table-cell">Brand</TableHead>
                    <TableHead>Quarry/Company</TableHead>
                    <TableHead className="hidden lg:table-cell">User</TableHead>
                    <TableHead>Date & Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allActivities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                        <Truck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No activities found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    allActivities
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((activity) => (
                        <TableRow key={activity._id} className="hover:bg-slate-50">
                          <TableCell>
                            <Badge
                              variant={activity.type === 'truck_in' ? 'default' : 'secondary'}
                              className={`text-xs ${
                                activity.type === 'truck_in'
                                  ? 'bg-green-500 hover:bg-green-600'
                                  : 'bg-orange-500 hover:bg-orange-600 text-white'
                              }`}
                            >
                              {activity.type === 'truck_in' ? 'IN' : 'OUT'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold">{activity.plateNumber}</TableCell>
                          <TableCell className="hidden md:table-cell text-slate-600">
                            {activity.brand}
                          </TableCell>
                          <TableCell className="font-medium">{activity.company}</TableCell>
                          <TableCell className="hidden lg:table-cell text-slate-600">
                            {activity.userName}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {format(new Date(activity.timestamp), 'MMM dd, yyyy hh:mm a')}
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {allActivities.length > itemsPerPage && (
              <div className="flex items-center justify-between border-t pt-4">
                <p className="text-sm text-slate-600">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, allActivities.length)} of {allActivities.length} activities
                </p>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: Math.ceil(allActivities.length / itemsPerPage) }, (_, i) => i + 1)
                      .filter(page => {
                        // Show first page, last page, current page, and pages around current
                        return page === 1 || 
                               page === Math.ceil(allActivities.length / itemsPerPage) ||
                               Math.abs(page - currentPage) <= 1;
                      })
                      .map((page, index, array) => (
                        <PaginationItem key={page}>
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <PaginationEllipsis />
                          )}
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(prev => Math.min(Math.ceil(allActivities.length / itemsPerPage), prev + 1))}
                        className={currentPage === Math.ceil(allActivities.length / itemsPerPage) ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
