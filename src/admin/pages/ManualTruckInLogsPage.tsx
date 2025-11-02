import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Search, MapPin, User, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';

interface Quarry {
  _id: string;
  name: string;
  location: string;
  quarryOwner: string;
  operator: string;
}

interface AdminTruckLog {
  _id: string;
  quarryId: {
    _id: string;
    name: string;
    location: string;
    quarryOwner: string;
  };
  logType: 'in' | 'out';
  truckCount: number;
  notes?: string;
  loggedBy: {
    _id: string;
    name: string;
    username: string;
  };
  logDate: string;
  createdAt: string;
  updatedAt: string;
}

export default function ManualTruckInLogsPage() {
  const [logs, setLogs] = useState<AdminTruckLog[]>([]);
  const [quarries, setQuarries] = useState<Quarry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countingQuarry, setCountingQuarry] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; quarry: Quarry | null }>({ open: false, quarry: null });

  // Initialize WebSocket
  useEffect(() => {
    const BACKEND_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(BACKEND_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected for Manual Truck In Logs');
    });

    newSocket.on('adminTruckLog:created', (newLog: AdminTruckLog) => {
      if (newLog.logType === 'in') {
        setLogs(prev => [newLog, ...prev]);
      }
    });

    newSocket.on('adminTruckLog:updated', (updatedLog: AdminTruckLog) => {
      if (updatedLog.logType === 'in') {
        setLogs(prev => prev.map(log => log._id === updatedLog._id ? updatedLog : log));
      }
    });

    newSocket.on('adminTruckLog:deleted', (data: { id: string }) => {
      setLogs(prev => prev.filter(log => log._id !== data.id));
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Load data on mount
  useEffect(() => {
    fetchLogs();
    fetchQuarries();
  }, []);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const authStorage = localStorage.getItem('auth-storage');
      const token = authStorage ? JSON.parse(authStorage).state.token : null;

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin-truck-logs?logType=in`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch logs');

      const result = await response.json();
      setLogs(result.data || []);
    } catch (error: any) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to load logs');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQuarries = async () => {
    try {
      const authStorage = localStorage.getItem('auth-storage');
      const token = authStorage ? JSON.parse(authStorage).state.token : null;

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/quarries`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch quarries');

      const result = await response.json();
      setQuarries(result.data || []);
    } catch (error: any) {
      console.error('Error fetching quarries:', error);
      toast.error('Failed to load quarries');
    }
  };

  const handleQuickCount = async (quarryId: string) => {
    try {
      setCountingQuarry(quarryId);
      setConfirmDialog({ open: false, quarry: null });
      const authStorage = localStorage.getItem('auth-storage');
      const token = authStorage ? JSON.parse(authStorage).state.token : null;

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin-truck-logs`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            quarryId,
            logType: 'in',
            truckCount: 1,
            logDate: new Date().toISOString()
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add count');
      }

      toast.success('Truck counted!');
      fetchLogs();
    } catch (error: any) {
      console.error('Error counting truck:', error);
      toast.error(error.message || 'Failed to count truck');
    } finally {
      setCountingQuarry(null);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!confirm('Are you sure you want to delete this log?')) return;

    try {
      const authStorage = localStorage.getItem('auth-storage');
      const token = authStorage ? JSON.parse(authStorage).state.token : null;

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin-truck-logs/${logId}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error('Failed to delete log');

      toast.success('Log deleted successfully');
      fetchLogs();
    } catch (error: any) {
      console.error('Error deleting log:', error);
      toast.error('Failed to delete log');
    }
  };

  const filteredQuarries = quarries.filter(quarry =>
    quarry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quarry.quarryOwner.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quarry.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLogs = logs.filter(log =>
    log.quarryId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.quarryId.quarryOwner.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.quarryId.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalTrucks = logs.reduce((sum, log) => sum + log.truckCount, 0);

  const getQuarryTodayCount = (quarryId: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return logs
      .filter(log => 
        log.quarryId._id === quarryId && 
        format(new Date(log.logDate), 'yyyy-MM-dd') === today
      )
      .reduce((sum, log) => sum + log.truckCount, 0);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-900 to-green-600 bg-clip-text text-transparent">
            Manual Truck In Counter
          </h2>
          <p className="text-sm text-slate-500 mt-1">Click + button to count each truck entering</p>
        </div>

        <Button 
          onClick={() => fetchLogs()}
          variant="outline"
          className="gap-2 w-full sm:w-auto"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Total Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{filteredLogs.length}</div>
            <p className="text-xs text-slate-500 mt-1">Manual entries</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Total Trucks In</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{totalTrucks}</div>
            <p className="text-xs text-slate-500 mt-1">Counted trucks</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Active Quarries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{quarries.length}</div>
            <p className="text-xs text-slate-500 mt-1">Registered</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="quarries" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="quarries">Quarry List</TabsTrigger>
          <TabsTrigger value="logs">Count History</TabsTrigger>
        </TabsList>

        {/* Tab 1: Quarry Counter List */}
        <TabsContent value="quarries" className="space-y-4">
          {/* Search Bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by quarry name, owner, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Click + to Count Trucks In</CardTitle>
              <CardDescription>Each click records 1 truck entering</CardDescription>
            </CardHeader>
            <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : filteredQuarries.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No quarries found
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredQuarries.map((quarry) => {
                const todayCount = getQuarryTodayCount(quarry._id);
                const isCountingThis = countingQuarry === quarry._id;
                
                return (
                  <div
                    key={quarry._id}
                    className="flex flex-col items-start justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors gap-2"
                  >
                    <div className="w-full space-y-1">
                      <h3 className="font-semibold text-slate-900 text-base">{quarry.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-slate-600">
                        <User className="h-3 w-3" />
                        <span>{quarry.quarryOwner}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-600">
                        <MapPin className="h-3 w-3" />
                        <span>{quarry.location}</span>
                      </div>
                      <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 text-xs">
                        Today: {todayCount} trucks
                      </Badge>
                    </div>
                    
                    <Button
                      onClick={() => setConfirmDialog({ open: true, quarry })}
                      disabled={isCountingThis}
                      className="bg-green-600 hover:bg-green-700 text-white w-full h-10 text-sm font-semibold"
                    >
                      {isCountingThis ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Counting...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Count +1
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Recent Logs */}
        <TabsContent value="logs">
          <Card>
        <CardHeader>
          <CardTitle>Count History ({filteredLogs.length})</CardTitle>
          <CardDescription>Last 20 truck entries recorded</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No logs yet. Start counting trucks above!
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.slice(0, 20).map((log) => (
                <div
                  key={log._id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg text-sm gap-2"
                >
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">{log.quarryId.name}</div>
                    <div className="text-xs text-slate-600">Owner: {log.quarryId.quarryOwner}</div>
                    <div className="text-xs text-slate-500">
                      {format(new Date(log.logDate), 'MMM dd, yyyy hh:mm a')} • by {log.loggedBy.name}
                    </div>
                  </div>
                  <Badge className="bg-green-500 hover:bg-green-600 w-fit">
                    +1 truck
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ open, quarry: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Truck Count</DialogTitle>
            <DialogDescription>
              Are you sure you want to count 1 truck entering this quarry?
            </DialogDescription>
          </DialogHeader>
          {confirmDialog.quarry && (
            <div className="space-y-2 py-4">
              <div className="font-semibold text-slate-900">{confirmDialog.quarry.name}</div>
              <div className="text-sm text-slate-600">Owner: {confirmDialog.quarry.quarryOwner}</div>
              <div className="text-sm text-slate-600">Location: {confirmDialog.quarry.location}</div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDialog({ open: false, quarry: null })}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => confirmDialog.quarry && handleQuickCount(confirmDialog.quarry._id)}
              className="bg-green-600 hover:bg-green-700"
            >
              Confirm Count
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
