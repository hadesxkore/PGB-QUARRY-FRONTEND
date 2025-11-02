import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useTruckStore } from '@/store/truckStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { TruckIcon, ArrowDownToLine, ArrowUpFromLine, Clock, Calendar, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Activity {
  _id: string;
  type: 'truck_log' | 'truck_added';
  action: string;
  details: string;
  timestamp: string;
  icon: 'IN' | 'OUT' | 'TRUCK';
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const { socket } = useTruckStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    trucksInToday: 0,
    trucksOutToday: 0,
    currentlyInside: 0,
  });
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  if (!user) return null;

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return;

    // Refresh dashboard when truck is added
    socket.on('truck:created', () => {
      console.log('📢 Truck created - refreshing dashboard');
      fetchDashboardData();
    });

    // Refresh dashboard when truck log is created
    socket.on('truckLog:created', () => {
      console.log('📢 Truck log created - refreshing dashboard');
      fetchDashboardData();
    });

    return () => {
      socket.off('truck:created');
      socket.off('truckLog:created');
    };
  }, [socket]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const authStorage = localStorage.getItem('auth-storage');
      const token = authStorage ? JSON.parse(authStorage).state.token : null;

      // Fetch today's stats
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const params = new URLSearchParams({
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString(),
      });

      // Fetch logs
      const logsResponse = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/truck-logs?${params}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (!logsResponse.ok) throw new Error('Failed to fetch logs');
      const logsData = await logsResponse.json();
      // Backend should already filter by user, but add extra safety check
      const allLogs = logsData.data || [];
      const logs = allLogs.filter((log: any) => {
        const loggedById = log.loggedBy?._id || log.loggedBy?.id || log.loggedBy;
        const userId = user?.id;
        // If no userId or if loggedBy matches, include it
        return !userId || loggedById === userId || log.user === userId || log.user?._id === userId || log.user?.id === userId;
      });

      // Fetch trucks to get currently inside count
      const trucksResponse = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/trucks`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (!trucksResponse.ok) throw new Error('Failed to fetch trucks');
      const trucksData = await trucksResponse.json();
      const trucks = trucksData.data || [];

      // Calculate stats
      const inCount = logs.filter((log: any) => log.logType === 'IN').length;
      const outCount = logs.filter((log: any) => log.logType === 'OUT').length;
      const currentlyInside = trucks.filter((truck: any) => truck.currentStatus === 'OUT').length;

      setStats({
        trucksInToday: inCount,
        trucksOutToday: outCount,
        currentlyInside: currentlyInside,
      });

      // Build recent activity from logs and trucks
      const activities: Activity[] = [];

      // Add recent logs (last 5)
      const recentLogs = logs.slice(0, 5);
      recentLogs.forEach((log: any) => {
        activities.push({
          _id: log._id,
          type: 'truck_log',
          action: log.logType === 'IN' ? 'Truck Logged IN' : 'Truck Logged OUT',
          details: `${log.plateNumber} - ${log.brand}`,
          timestamp: log.createdAt,
          icon: log.logType,
        });
      });

      // Add recently added trucks (created today)
      const todayTrucks = trucks.filter((truck: any) => {
        const createdDate = new Date(truck.createdAt);
        return createdDate >= startOfDay && createdDate <= endOfDay;
      });

      todayTrucks.forEach((truck: any) => {
        activities.push({
          _id: truck._id,
          type: 'truck_added',
          action: 'New Truck Added',
          details: `${truck.plateNumber} - ${truck.brand} ${truck.model}`,
          timestamp: truck.createdAt,
          icon: 'TRUCK',
        });
      });

      // Sort by timestamp (newest first)
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivity(activities);
      setCurrentPage(1); // Reset to first page when data changes

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Welcome back, {user.name}!
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <Badge variant="outline" className="w-fit">
            Quarry Staff
          </Badge>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trucks IN Today</CardTitle>
              <ArrowDownToLine className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '...' : stats.trucksInToday}</div>
              <p className="text-xs text-muted-foreground mt-1">Total entries</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trucks OUT Today</CardTitle>
              <ArrowUpFromLine className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '...' : stats.trucksOutToday}</div>
              <p className="text-xs text-muted-foreground mt-1">Total exits</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Currently Inside</CardTitle>
              <TruckIcon className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '...' : stats.currentlyInside}</div>
              <p className="text-xs text-muted-foreground mt-1">Trucks on transit</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Log truck movements quickly</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button 
              onClick={() => navigate('/user/log-in')}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <ArrowDownToLine className="h-4 w-4" />
              Log Truck IN
            </Button>
            <Button 
              onClick={() => navigate('/user/log-out')}
              className="gap-2 bg-red-600 hover:bg-red-700"
            >
              <ArrowUpFromLine className="h-4 w-4" />
              Log Truck OUT
            </Button>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => navigate('/user/logs')}
            >
              <Calendar className="h-4 w-4" />
              View Truck Logs
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>Latest truck movements and additions</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading activity...</div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <TruckIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">No recent activity</p>
                <p className="text-sm mt-1">Start logging truck movements to see activity here</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  {recentActivity
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((activity) => (
                  <div key={activity._id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <div className={`p-2 rounded-lg ${
                      activity.icon === 'IN' ? 'bg-green-100' :
                      activity.icon === 'OUT' ? 'bg-red-100' :
                      'bg-blue-100'
                    }`}>
                      {activity.icon === 'IN' ? (
                        <ArrowDownToLine className="h-4 w-4 text-green-600" />
                      ) : activity.icon === 'OUT' ? (
                        <ArrowUpFromLine className="h-4 w-4 text-red-600" />
                      ) : (
                        <Plus className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.details}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(activity.timestamp), 'h:mm a')}
                    </div>
                  </div>
                  ))}
                </div>
                
                {/* Pagination */}
                {recentActivity.length > itemsPerPage && (
                  <div className="flex justify-center pt-4 border-t">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        
                        {[...Array(Math.ceil(recentActivity.length / itemsPerPage))].map((_, index) => {
                          const pageNumber = index + 1;
                          const totalPages = Math.ceil(recentActivity.length / itemsPerPage);
                          
                          // Show first, last, current, and adjacent pages
                          if (
                            pageNumber === 1 ||
                            pageNumber === totalPages ||
                            (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                          ) {
                            return (
                              <PaginationItem key={pageNumber}>
                                <PaginationLink
                                  onClick={() => setCurrentPage(pageNumber)}
                                  isActive={currentPage === pageNumber}
                                  className="cursor-pointer"
                                >
                                  {pageNumber}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          } else if (
                            pageNumber === currentPage - 2 ||
                            pageNumber === currentPage + 2
                          ) {
                            return <PaginationItem key={pageNumber}><span className="px-4">...</span></PaginationItem>;
                          }
                          return null;
                        })}

                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setCurrentPage(prev => Math.min(Math.ceil(recentActivity.length / itemsPerPage), prev + 1))}
                            className={currentPage === Math.ceil(recentActivity.length / itemsPerPage) ? 'pointer-events-none opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
