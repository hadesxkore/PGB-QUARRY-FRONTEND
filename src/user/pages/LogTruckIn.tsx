import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowDownToLine, Plus, Minus, Save, TruckIcon, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { useTruckStore } from '@/store/truckStore';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TruckCount {
  truckId: string;
  plateNumber: string;
  brand: string;
  count: number;
}

export default function LogTruckIn() {
  const { trucks, initializeSocket, disconnectSocket } = useTruckStore();
  const [date, setDate] = useState<Date>(new Date());
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [truckCounts, setTruckCounts] = useState<TruckCount[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize WebSocket connection
  useEffect(() => {
    initializeSocket();
    return () => {
      disconnectSocket();
    };
  }, [initializeSocket, disconnectSocket]);

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Initialize truck counts when trucks are loaded
  // Only show trucks that are currently OUT (to log them back IN)
  useEffect(() => {
    if (trucks.length > 0) {
      const trucksToLogIn = trucks.filter(truck => truck.currentStatus === 'OUT');
      const initialCounts = trucksToLogIn.map(truck => ({
        truckId: truck._id,
        plateNumber: truck.plateNumber,
        brand: truck.brand,
        count: 0,
      }));
      setTruckCounts(initialCounts);
    }
  }, [trucks]);

  const handleIncrement = (truckId: string) => {
    setTruckCounts(prev =>
      prev.map(tc =>
        tc.truckId === truckId && tc.count === 0 ? { ...tc, count: 1 } : tc
      )
    );
  };

  const handleDecrement = (truckId: string) => {
    setTruckCounts(prev =>
      prev.map(tc =>
        tc.truckId === truckId ? { ...tc, count: 0 } : tc
      )
    );
  };

  const handleInputChange = (truckId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setTruckCounts(prev =>
      prev.map(tc =>
        tc.truckId === truckId ? { ...tc, count: numValue > 0 ? 1 : 0 } : tc
      )
    );
  };

  const handleSave = async () => {
    if (totalCount === 0) {
      toast.error('No entries to save', {
        description: 'Please add at least one truck entry before saving',
      });
      return;
    }

    setIsSaving(true);
    
    try {
      const authStorage = localStorage.getItem('auth-storage');
      const token = authStorage ? JSON.parse(authStorage).state.token : null;
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/truck-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          logs: truckCounts,
          logType: 'IN',
          logDate: date.toISOString(),
          logTime: format(currentTime, 'hh:mm:ss a'),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save entries');
      }

      const result = await response.json();
      
      toast.success('Entries saved successfully!', {
        description: `Saved ${result.count} truck ${result.count === 1 ? 'entry' : 'entries'} for ${format(date, 'PPP')}`,
      });
      
      // Reset counts after successful save
      handleReset();
    } catch (error: any) {
      console.error('Error saving entries:', error);
      toast.error('Failed to save entries', {
        description: error.message || 'Something went wrong',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setTruckCounts(prev => prev.map(tc => ({ ...tc, count: 0 })));
  };

  const totalCount = truckCounts.reduce((sum, tc) => sum + tc.count, 0);

  return (
    <div className="min-h-screen bg-white p-4 md:p-6 lg:p-8">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              <ArrowDownToLine className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
              Log Truck IN
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Count trucks entering the quarry on {format(date, 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, 'PPP') : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => newDate && setDate(newDate)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Summary Card */}
        <Card className="border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">Total Entries Today</CardTitle>
                <CardDescription>Trucks logged entering the quarry</CardDescription>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-4xl font-bold text-green-600">{totalCount}</div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-700">{format(date, 'MMM dd, yyyy')}</div>
                  <div className="text-lg font-mono font-bold text-green-600">{format(currentTime, 'hh:mm:ss a')}</div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:justify-end flex-wrap gap-3">
          <Button onClick={handleReset} variant="outline" className="gap-2 w-full sm:w-auto">
            Reset All Counts
          </Button>
          <Button onClick={handleSave} disabled={isSaving || totalCount === 0} className="gap-2 bg-green-600 hover:bg-green-700 w-full sm:w-auto">
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Entry Log'}
          </Button>
        </div>

        {/* Status Tabs */}
        <Tabs defaultValue="counter" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="counter">Log Counter</TabsTrigger>
            <TabsTrigger value="status" className="gap-2">
              <TruckIcon className="h-4 w-4 text-red-600" />
              On Transit ({trucks.filter(t => t.currentStatus === 'OUT').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="counter" className="space-y-4">
            {/* Truck Count Cards - Mobile */}
        <div className="md:hidden space-y-4">
          {truckCounts.map((tc) => (
            <Card key={tc.truckId} className="border-l-4 border-l-green-400">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{tc.plateNumber}</CardTitle>
                    <CardDescription>{tc.brand}</CardDescription>
                  </div>
                  <Badge variant={tc.count > 0 ? "default" : "outline"} className={tc.count > 0 ? "bg-green-500" : ""}>
                    {tc.count} entries
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-green-600">Entry Count</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDecrement(tc.truckId)}
                      className="h-12 w-12 p-0"
                    >
                      <Minus className="h-5 w-5" />
                    </Button>
                    <Input
                      type="number"
                      value={tc.count}
                      onChange={(e) => handleInputChange(tc.truckId, e.target.value)}
                      className="h-12 text-center text-xl font-semibold"
                      min="0"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleIncrement(tc.truckId)}
                      className="h-12 w-12 p-0 border-green-500 text-green-600 hover:bg-green-50"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Truck Count Table - Desktop */}
        <Card className="hidden md:block">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TruckIcon className="h-5 w-5 text-green-600" />
              Truck Entry Counter
            </CardTitle>
            <CardDescription>Count how many times each truck entered today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {truckCounts.map((tc) => (
                <div key={tc.truckId} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex-1">
                    <div className="font-semibold text-lg">{tc.plateNumber}</div>
                    <div className="text-sm text-muted-foreground">{tc.brand}</div>
                  </div>

                  <Separator orientation="vertical" className="h-12" />

                  {/* Counter */}
                  <div className="flex flex-col items-center gap-2">
                    <Label className="text-xs font-medium text-green-600">ENTRIES</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDecrement(tc.truckId)}
                        className="h-9 w-9 p-0"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        value={tc.count}
                        onChange={(e) => handleInputChange(tc.truckId, e.target.value)}
                        className="h-9 w-20 text-center font-bold text-lg"
                        min="0"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleIncrement(tc.truckId)}
                        className="h-9 w-9 p-0 border-green-500 text-green-600 hover:bg-green-50"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Badge variant={tc.count > 0 ? "default" : "secondary"} className={tc.count > 0 ? "bg-green-500" : ""}>
                    {tc.count} {tc.count === 1 ? 'entry' : 'entries'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
          </TabsContent>

          {/* On Transit Status Tab */}
          <TabsContent value="status" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TruckIcon className="h-5 w-5 text-red-600" />
                  Trucks Currently On Transit
                </CardTitle>
                <CardDescription>Trucks that have logged OUT and not yet returned</CardDescription>
              </CardHeader>
              <CardContent>
                {trucks.filter(t => t.currentStatus === 'OUT').length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No trucks currently on transit</p>
                ) : (
                  <div className="space-y-3">
                    {trucks.filter(t => t.currentStatus === 'OUT').map((truck) => (
                      <div key={truck._id} className="flex items-center justify-between p-4 border rounded-lg bg-red-50">
                        <div className="flex-1">
                          <div className="font-semibold text-lg">{truck.plateNumber}</div>
                          <div className="text-sm text-muted-foreground">{truck.brand} - {truck.model}</div>
                        </div>
                        <div className="text-right">
                          <Badge variant="destructive" className="mb-2">OUT</Badge>
                          {truck.lastLogTime && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(truck.lastLogTime), 'MMM dd, hh:mm a')}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
