import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Users, 
  Truck, 
  TrendingUp,
  TrendingDown,
  Activity,
  Download,
  RefreshCw,
  ArrowDownToLine,
  ArrowUpFromLine,
  Clock,
  Building2
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';
import * as XLSX from 'xlsx';

interface DashboardStats {
  totalUsers: number;
  totalTrucks: number;
  todayLogsIn: number;
  todayLogsOut: number;
  totalLogsToday: number;
}

interface RecentLog {
  _id: string;
  plateNumber: string;
  company: string;
  logType: 'IN' | 'OUT';
  logTime: string;
  user: {
    name: string;
  };
  createdAt: string;
}

interface User {
  _id: string;
  name: string;
  username: string;
  company: string;
  role: string;
  createdAt: string;
}

export default function ReportsPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalTrucks: 0,
    todayLogsIn: 0,
    todayLogsOut: 0,
    totalLogsToday: 0
  });
  const [recentLogs, setRecentLogs] = useState<RecentLog[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Initialize WebSocket
  useEffect(() => {
    const BACKEND_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(BACKEND_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      console.log('✅ Dashboard WebSocket connected');
    });

    newSocket.on('truckLog:created', () => {
      console.log('📋 New truck log - refreshing dashboard');
      fetchDashboardData();
    });

    newSocket.on('user:created', () => {
      console.log('👤 New user - refreshing dashboard');
      fetchDashboardData();
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const authStorage = localStorage.getItem('auth-storage');
      const token = authStorage ? JSON.parse(authStorage).state.token : null;

      const headers = { 'Authorization': `Bearer ${token}` };
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      // Fetch all data in parallel
      const [usersRes, trucksRes, logsRes] = await Promise.all([
        fetch(`${API_URL}/users`, { headers }),
        fetch(`${API_URL}/trucks/all`, { headers }),
        fetch(`${API_URL}/truck-logs/all`, { headers })
      ]);

      const usersData = await usersRes.json();
      const trucksData = await trucksRes.json();
      const logsData = await logsRes.json();

      // Calculate stats
      const today = new Date().toDateString();
      const todayLogs = logsData.data?.filter((log: RecentLog) => 
        new Date(log.createdAt).toDateString() === today
      ) || [];

      setStats({
        totalUsers: usersData.data?.filter((u: User) => u.role === 'user').length || 0,
        totalTrucks: trucksData.data?.length || 0,
        todayLogsIn: todayLogs.filter((log: RecentLog) => log.logType === 'IN').length,
        todayLogsOut: todayLogs.filter((log: RecentLog) => log.logType === 'OUT').length,
        totalLogsToday: todayLogs.length
      });

      // Recent logs (last 10)
      setRecentLogs((logsData.data || []).slice(0, 10));

      // Recent users (last 5)
      setRecentUsers((usersData.data || []).filter((u: User) => u.role === 'user').slice(0, 5));

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // Export summary to Excel
  const handleExportSummary = () => {
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['Provincial Government of Bataan'],
      ['System Summary Report'],
      [''],
      ['Generated:', format(new Date(), 'MMM dd, yyyy hh:mm a')],
      [''],
      ['System Statistics'],
      ['Total Users:', stats.totalUsers],
      ['Total Trucks:', stats.totalTrucks],
      ['Today\'s Total Logs:', stats.totalLogsToday],
      ['Today\'s Trucks IN:', stats.todayLogsIn],
      ['Today\'s Trucks OUT:', stats.todayLogsOut],
    ];

    const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary');

    // Recent Logs sheet
    const logsData = recentLogs.map(log => ({
      'Type': log.logType,
      'Plate Number': log.plateNumber,
      'Quarry': log.company,
      'Time': log.logTime,
      'Logged By': log.user?.name || 'Unknown',
      'Date': format(new Date(log.createdAt), 'MMM dd, yyyy')
    }));

    const logsWS = XLSX.utils.json_to_sheet(logsData);
    XLSX.utils.book_append_sheet(wb, logsWS, 'Recent Logs');

    // Recent Users sheet
    const usersData = recentUsers.map(user => ({
      'Name': user.name,
      'Username': user.username,
      'Quarry': user.company,
      'Registered': format(new Date(user.createdAt), 'MMM dd, yyyy')
    }));

    const usersWS = XLSX.utils.json_to_sheet(usersData);
    XLSX.utils.book_append_sheet(wb, usersWS, 'Recent Users');

    // Download
    const filename = `System_Summary_${format(new Date(), 'MMM_dd_yyyy')}.xlsx`;
    XLSX.writeFile(wb, filename);
    toast.success('Summary exported successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">System Reports & Analytics</h2>
          <p className="text-sm text-slate-500">Overview of system activity and statistics</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchDashboardData} variant="outline" size="sm" className="gap-2 h-8 text-xs">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button onClick={handleExportSummary} variant="outline" size="sm" className="gap-2 h-8 text-xs">
            <Download className="h-3.5 w-3.5" />
            Export Summary
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Users */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.totalUsers}</div>
            <p className="text-xs text-slate-500 mt-1">Registered quarry users</p>
          </CardContent>
        </Card>

        {/* Total Trucks */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Truck className="h-4 w-4 text-purple-600" />
              Total Trucks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats.totalTrucks}</div>
            <p className="text-xs text-slate-500 mt-1">Registered vehicles</p>
          </CardContent>
        </Card>

        {/* Today's Total Logs */}
        <Card className="border-l-4 border-l-slate-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Activity className="h-4 w-4 text-slate-600" />
              Today's Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.totalLogsToday}</div>
            <p className="text-xs text-slate-500 mt-1">Total movements</p>
          </CardContent>
        </Card>

        {/* Today's IN */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <ArrowDownToLine className="h-4 w-4 text-green-600" />
              Trucks IN
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.todayLogsIn}</div>
            <p className="text-xs text-slate-500 mt-1">Today's entries</p>
          </CardContent>
        </Card>

        {/* Today's OUT */}
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <ArrowUpFromLine className="h-4 w-4 text-red-600" />
              Trucks OUT
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.todayLogsOut}</div>
            <p className="text-xs text-slate-500 mt-1">Today's exits</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Truck Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-slate-600" />
              Recent Truck Logs
            </CardTitle>
            <CardDescription>Latest 10 truck movements</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading...</div>
            ) : recentLogs.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">No recent logs</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">Type</TableHead>
                      <TableHead>Plate</TableHead>
                      <TableHead className="hidden sm:table-cell">Quarry</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentLogs.map((log) => (
                      <TableRow key={log._id}>
                        <TableCell>
                          <Badge 
                            variant={log.logType === 'IN' ? 'default' : 'destructive'}
                            className={log.logType === 'IN' ? 'bg-green-600' : ''}
                          >
                            {log.logType}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{log.plateNumber}</TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {log.company}
                        </TableCell>
                        <TableCell className="text-sm">{log.logTime}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-slate-600" />
              Recent Users
            </CardTitle>
            <CardDescription>Latest 5 registered users</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading...</div>
            ) : recentUsers.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">No recent users</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden sm:table-cell">Quarry</TableHead>
                      <TableHead>Registered</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentUsers.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {user.company}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Trends (Placeholder for future charts) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-slate-600" />
            Activity Trends
          </CardTitle>
          <CardDescription>System activity over time (Coming Soon)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg">
            <div className="text-center">
              <TrendingDown className="h-12 w-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500">Charts and graphs coming soon</p>
              <p className="text-xs text-slate-400 mt-1">Will display daily/weekly/monthly trends</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
