import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, MapPin, FileText, Eye } from 'lucide-react';

const quarries = [
  { id: 1, name: 'Bataan Quarry Site A', location: 'Balanga City', status: 'Active', permit: 'PQ-2024-001', operator: 'ABC Mining Corp' },
  { id: 2, name: 'Mountain View Quarry', location: 'Orani', status: 'Active', permit: 'PQ-2024-002', operator: 'XYZ Aggregates Inc' },
  { id: 3, name: 'Coastal Quarry Site', location: 'Mariveles', status: 'Inactive', permit: 'PQ-2024-003', operator: 'Coastal Mining Ltd' },
  { id: 4, name: 'Highland Quarry', location: 'Hermosa', status: 'Active', permit: 'PQ-2024-004', operator: 'Highland Resources' },
  { id: 5, name: 'Valley Quarry Operations', location: 'Dinalupihan', status: 'Pending', permit: 'PQ-2024-005', operator: 'Valley Mining Co' },
];

export default function QuarryManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredQuarries = quarries.filter(
    (quarry) =>
      quarry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quarry.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Quarry Management</h2>
          <p className="text-sm text-slate-500">Manage all quarry sites and permits</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add New Quarry
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search Quarries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quarries Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Quarries ({filteredQuarries.length})</CardTitle>
          <CardDescription>Complete list of registered quarry sites</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quarry Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead>Permit No.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuarries.map((quarry) => (
                  <TableRow key={quarry.id}>
                    <TableCell className="font-medium">{quarry.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        {quarry.location}
                      </div>
                    </TableCell>
                    <TableCell>{quarry.operator}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3 text-slate-400" />
                        {quarry.permit}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          quarry.status === 'Active'
                            ? 'default'
                            : quarry.status === 'Inactive'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {quarry.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="gap-1">
                        <Eye className="h-3 w-3" />
                        View
                      </Button>
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
