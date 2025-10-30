import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Download, Eye, Calendar } from 'lucide-react';

const snapshots = [
  { id: 1, camera: 'Camera 01 - Main Gate', location: 'Bataan Quarry Site A', timestamp: '2024-10-30 14:30:25', status: 'Active' },
  { id: 2, camera: 'Camera 02 - Loading Area', location: 'Mountain View Quarry', timestamp: '2024-10-30 14:28:15', status: 'Active' },
  { id: 3, camera: 'Camera 03 - Exit Point', location: 'Coastal Quarry Site', timestamp: '2024-10-30 14:25:40', status: 'Active' },
  { id: 4, camera: 'Camera 04 - Weighbridge', location: 'Highland Quarry', timestamp: '2024-10-30 14:20:10', status: 'Active' },
  { id: 5, camera: 'Camera 05 - Parking Area', location: 'Valley Quarry Operations', timestamp: '2024-10-30 14:15:55', status: 'Offline' },
  { id: 6, camera: 'Camera 06 - Processing Zone', location: 'Bataan Quarry Site A', timestamp: '2024-10-30 14:10:30', status: 'Active' },
];

export default function CCTVSnapshotsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">CCTV Snapshots</h2>
          <p className="text-sm text-slate-500">Monitor all camera feeds and snapshots</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            Filter by Date
          </Button>
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            Download All
          </Button>
        </div>
      </div>

      {/* Camera Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Total Cameras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">24</div>
            <p className="text-xs text-slate-500 mt-1">Across all sites</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Active Cameras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">23</div>
            <p className="text-xs text-slate-500 mt-1">Currently recording</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Offline Cameras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">1</div>
            <p className="text-xs text-slate-500 mt-1">Needs attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Today's Snapshots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">1,248</div>
            <p className="text-xs text-slate-500 mt-1">Captured images</p>
          </CardContent>
        </Card>
      </div>

      {/* Snapshots Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Snapshots</CardTitle>
          <CardDescription>Latest camera captures from all quarry sites</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {snapshots.map((snapshot) => (
              <Card key={snapshot.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-slate-200 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Camera className="h-16 w-16 text-slate-400" />
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge variant={snapshot.status === 'Active' ? 'default' : 'destructive'}>
                      {snapshot.status}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm mb-1">{snapshot.camera}</h3>
                  <p className="text-xs text-slate-500 mb-2">{snapshot.location}</p>
                  <p className="text-xs text-slate-400 mb-3">{snapshot.timestamp}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 gap-1">
                      <Eye className="h-3 w-3" />
                      View
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 gap-1">
                      <Download className="h-3 w-3" />
                      Save
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
