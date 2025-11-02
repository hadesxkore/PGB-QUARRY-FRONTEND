import { useState, useEffect } from 'react';
import { Search, Filter, TruckIcon, MapPin, Plus, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/store/authStore';
import { useTruckStore } from '@/store/truckStore';
import { toast } from 'sonner';

export default function TruckRecords() {
  const { user } = useAuthStore();
  const { trucks, isLoading, initializeSocket, disconnectSocket, addTruck } = useTruckStore();
  
  // Debug: Check user data
  console.log('Current user data:', user);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    plateNumber: '',
    brand: '',
    model: '',
    capacity: '',
    status: 'Active' as 'Active' | 'Inactive',
  });

  // Initialize WebSocket connection
  useEffect(() => {
    initializeSocket();
    return () => {
      disconnectSocket();
    };
  }, [initializeSocket, disconnectSocket]);

  const filteredTrucks = trucks.filter(truck => {
    const matchesSearch = 
      truck.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      truck.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      truck.company.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || truck.status.toLowerCase() === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.plateNumber || !formData.brand || !formData.model || !formData.capacity) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await addTruck({
        ...formData,
        capacity: `${formData.capacity} tons`, // Automatically add "tons"
        company: user?.company || 'Unknown Quarry',
      });

      toast.success('Truck added successfully!', {
        description: `${formData.plateNumber} has been added to the records`,
      });

      // Reset form and close dialog
      setFormData({
        plateNumber: '',
        brand: '',
        model: '',
        capacity: '',
        status: 'Active',
      });
      setDialogOpen(false);
    } catch (error: any) {
      toast.error('Failed to add truck', {
        description: error.message || 'Something went wrong',
      });
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Truck Records</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage and view all registered truck information
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm">
              {filteredTrucks.length} Trucks
            </Badge>
            <Button className="gap-2" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Truck
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Trucks</CardTitle>
              <TruckIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{trucks.length}</div>
              <p className="text-xs text-muted-foreground">Registered vehicles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Trucks</CardTitle>
              <TruckIcon className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {trucks.filter(t => t.status === 'Active').length}
              </div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive Trucks</CardTitle>
              <TruckIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">
                {trucks.filter(t => t.status === 'Inactive').length}
              </div>
              <p className="text-xs text-muted-foreground">Not in use</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search & Filter</CardTitle>
            <CardDescription>Find trucks by plate number, driver, or company</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by plate number, driver, or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Truck List - Desktop Table */}
        <Card className="hidden md:block">
          <CardHeader>
            <CardTitle className="text-lg">Truck List</CardTitle>
            <CardDescription>Complete information of all registered trucks</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plate Number</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Quarry Name</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrucks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No trucks found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTrucks.map((truck) => (
                    <TableRow key={truck._id}>
                      <TableCell className="font-medium">{truck.plateNumber}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{truck.brand}</div>
                          <div className="text-muted-foreground">{truck.model}</div>
                        </div>
                      </TableCell>
                      <TableCell>{truck.capacity}</TableCell>
                      <TableCell>{truck.company}</TableCell>
                      <TableCell>
                        <Badge
                          variant={truck.status === 'Active' ? 'default' : 'secondary'}
                          className={truck.status === 'Active' ? 'bg-green-500/10 text-green-700 border-0' : ''}
                        >
                          {truck.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Truck List - Mobile Cards */}
        <div className="md:hidden space-y-4">
          {filteredTrucks.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No trucks found
              </CardContent>
            </Card>
          ) : (
            filteredTrucks.map((truck) => (
              <Card key={truck._id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{truck.plateNumber}</CardTitle>
                      <CardDescription className="mt-1">
                        {truck.brand} {truck.model}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={truck.status === 'Active' ? 'default' : 'secondary'}
                      className={truck.status === 'Active' ? 'bg-green-500/10 text-green-700 border-0' : ''}
                    >
                      {truck.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <TruckIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Capacity:</span>
                      <span className="font-medium">{truck.capacity}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-medium">{truck.company}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Add Truck Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[500px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Add New Truck</DialogTitle>
            <DialogDescription className="text-sm">
              Enter the truck information below. Quarry name is automatically set from your account.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-3 sm:gap-4 py-3 sm:py-4">
              <div className="grid gap-2">
                <Label htmlFor="plateNumber" className="text-sm font-medium">
                  Plate Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="plateNumber"
                  placeholder="e.g., ABC 1234"
                  value={formData.plateNumber}
                  onChange={(e) => handleChange('plateNumber', e.target.value.toUpperCase())}
                  required
                  className="h-10 text-base"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="brand" className="text-sm font-medium">
                  Brand <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="brand"
                  placeholder="e.g., Isuzu, Mitsubishi, Hino"
                  value={formData.brand}
                  onChange={(e) => handleChange('brand', e.target.value)}
                  required
                  className="h-10 text-base"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="model" className="text-sm font-medium">
                  Model <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="model"
                  placeholder="e.g., Forward, Fuso, Ranger"
                  value={formData.model}
                  onChange={(e) => handleChange('model', e.target.value)}
                  required
                  className="h-10 text-base"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="capacity" className="text-sm font-medium">
                  Capacity (tons) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="capacity"
                  type="number"
                  placeholder="e.g., 10, 8, 15"
                  value={formData.capacity}
                  onChange={(e) => handleChange('capacity', e.target.value)}
                  required
                  className="h-10 text-base"
                />
                <p className="text-xs text-muted-foreground">Enter number only. System will automatically add "tons"</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="company" className="text-sm font-medium">Quarry Name</Label>
                <Input
                  id="company"
                  value={user?.company || 'Not Set'}
                  disabled
                  className="bg-muted h-10 text-base"
                />
                <p className="text-xs text-muted-foreground">
                  {user?.company ? 'Automatically set from your account' : 'Please log out and log back in to update your quarry info'}
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange('status', value)}
                >
                  <SelectTrigger className="h-10 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isLoading}
                className="w-full sm:w-auto h-10 text-base"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto h-10 text-base">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Truck
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
