import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Truck, Clock } from 'lucide-react';

const truckLogs = [
  { id: 1, plateNo: 'ABC-1234', driver: 'Juan Dela Cruz', quarry: 'Bataan Quarry Site A', time: '08:30 AM', date: '2024-10-30', status: 'In' },
  { id: 2, plateNo: 'XYZ-5678', driver: 'Maria Santos', quarry: 'Mountain View Quarry', time: '09:15 AM', date: '2024-10-30', status: 'Out' },
  { id: 3, plateNo: 'DEF-9012', driver: 'Pedro Garcia', quarry: 'Coastal Quarry Site', time: '10:00 AM', date: '2024-10-30', status: 'In' },
  { id: 4, plateNo: 'GHI-3456', driver: 'Ana Reyes', quarry: 'Highland Quarry', time: '10:45 AM', date: '2024-10-30', status: 'In' },
  { id: 5, plateNo: 'JKL-7890', driver: 'Carlos Lopez', quarry: 'Valley Quarry Operations', time: '11:30 AM', date: '2024-10-30', status: 'Out' },
];

export default function TruckLogsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Truck Logs</h2>
          <p className="text-sm text-slate-500">Monitor all truck entries and exits</p>
        </div>
        <Button className="gap-2" variant="outline">
          <Download className="h-4 w-4" />
          Export Logs
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Today's Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">48</div>
            <p className="text-xs text-slate-500 mt-1">+12% from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Currently Inside</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">23</div>
            <p className="text-xs text-slate-500 mt-1">Active trucks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Total Exits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">25</div>
            <p className="text-xs text-slate-500 mt-1">Completed trips</p>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Truck Logs</CardTitle>
          <CardDescription>Real-time tracking of truck movements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plate Number</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Quarry Site</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {truckLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-slate-400" />
                        {log.plateNo}
                      </div>
                    </TableCell>
                    <TableCell>{log.driver}</TableCell>
                    <TableCell>{log.quarry}</TableCell>
                    <TableCell>{log.date}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {log.time}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={log.status === 'In' ? 'default' : 'secondary'}>
                        {log.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
