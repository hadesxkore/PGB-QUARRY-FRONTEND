import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, MapPin, FileText, Eye, RefreshCw, User, Calendar, Edit, Phone, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';
import { getMunicipalities, getBarangays } from '@/data/bataanLocations';

interface Quarry {
  _id: string;
  name: string;
  location: string;
  operator: string;
  permitNumber: string;
  status: 'Active' | 'Inactive' | 'Pending';
  quarryOwner: string;
  contactNumber?: string;
  description?: string;
  addedBy: {
    _id: string;
    name: string;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function QuarryManagementPage() {
  const [quarries, setQuarries] = useState<Quarry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedQuarry, setSelectedQuarry] = useState<Quarry | null>(null);
  const [associatedUser, setAssociatedUser] = useState<any>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    municipality: '',
    barangay: '',
    location: '',
    operator: '',
    permitNumber: '',
    status: 'Active' as 'Active' | 'Inactive' | 'Pending',
    quarryOwner: '',
    contactNumber: '',
    description: ''
  });

  // Initialize WebSocket
  useEffect(() => {
    const BACKEND_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(BACKEND_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      console.log('✅ Quarry Management WebSocket connected');
    });

    newSocket.on('quarry:created', () => {
      console.log('🏗️ New quarry added - refreshing list');
      fetchQuarries();
    });

    newSocket.on('quarry:updated', () => {
      console.log('🏗️ Quarry updated - refreshing list');
      fetchQuarries();
    });

    newSocket.on('quarry:deleted', () => {
      console.log('🏗️ Quarry deleted - refreshing list');
      fetchQuarries();
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Fetch quarries
  useEffect(() => {
    fetchQuarries();
  }, []);

  const fetchQuarries = async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddQuarry = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const authStorage = localStorage.getItem('auth-storage');
      const token = authStorage ? JSON.parse(authStorage).state.token : null;

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/quarries`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add quarry');
      }

      toast.success('Quarry added successfully!');
      setAddDialogOpen(false);
      setFormData({
        name: '',
        municipality: '',
        barangay: '',
        location: '',
        operator: '',
        permitNumber: '',
        status: 'Active',
        quarryOwner: '',
        contactNumber: '',
        description: ''
      });
      fetchQuarries();
    } catch (error: any) {
      console.error('Error adding quarry:', error);
      toast.error(error.message || 'Failed to add quarry');
    }
  };

  const handleViewQuarry = (quarry: Quarry) => {
    setSelectedQuarry(quarry);
    setViewDialogOpen(true);
  };

  const handleEditQuarry = async (quarry: Quarry) => {
    setSelectedQuarry(quarry);
    
    // Fetch associated user
    try {
      const authStorage = localStorage.getItem('auth-storage');
      const token = authStorage ? JSON.parse(authStorage).state.token : null;

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const result = await response.json();
        const user = result.data.find((u: any) => 
          u.name.toLowerCase() === quarry.quarryOwner.toLowerCase() && u.role === 'user'
        );
        setAssociatedUser(user || null);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }

    // Set form data
    const locationParts = quarry.location.split(', ');
    setFormData({
      name: quarry.name,
      municipality: locationParts[0] || '',
      barangay: locationParts[1] || '',
      location: quarry.location,
      operator: quarry.operator,
      permitNumber: quarry.permitNumber,
      status: quarry.status,
      quarryOwner: quarry.quarryOwner,
      contactNumber: quarry.contactNumber || '',
      description: quarry.description || ''
    });
    
    setEditDialogOpen(true);
  };

  const handleUpdateQuarry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuarry) return;

    try {
      const authStorage = localStorage.getItem('auth-storage');
      const token = authStorage ? JSON.parse(authStorage).state.token : null;

      // Update quarry
      const quarryResponse = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/quarries/${selectedQuarry._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: formData.name,
            location: formData.location,
            operator: formData.operator,
            permitNumber: formData.permitNumber,
            status: formData.status,
            quarryOwner: formData.quarryOwner,
            contactNumber: formData.contactNumber,
            description: formData.description,
          }),
        }
      );

      if (!quarryResponse.ok) throw new Error('Failed to update quarry');

      // Update associated user if exists
      if (associatedUser) {
        const userResponse = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users/${associatedUser._id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: formData.quarryOwner,
              contactNumber: formData.contactNumber,
              location: formData.location,
              company: formData.name,
            }),
          }
        );

        if (!userResponse.ok) {
          console.error('Failed to update user');
        }
      }

      toast.success('Quarry and user information updated successfully!');
      setEditDialogOpen(false);
      setFormData({
        name: '',
        municipality: '',
        barangay: '',
        location: '',
        operator: '',
        permitNumber: '',
        status: 'Active',
        quarryOwner: '',
        contactNumber: '',
        description: ''
      });
      setAssociatedUser(null);
      fetchQuarries();
    } catch (error: any) {
      console.error('Error updating quarry:', error);
      toast.error('Failed to update quarry');
    }
  };

  const handleDeleteQuarry = async () => {
    if (!selectedQuarry) return;

    try {
      const authStorage = localStorage.getItem('auth-storage');
      const token = authStorage ? JSON.parse(authStorage).state.token : null;

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/quarries/${selectedQuarry._id}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error('Failed to delete quarry');

      toast.success('Quarry deleted successfully!');
      setDeleteDialogOpen(false);
      setSelectedQuarry(null);
      fetchQuarries();
    } catch (error: any) {
      console.error('Error deleting quarry:', error);
      toast.error('Failed to delete quarry');
    }
  };

  const filteredQuarries = quarries.filter(
    (quarry) =>
      quarry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quarry.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quarry.operator.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Quarry Management</h2>
          <p className="text-sm text-slate-500">Manage all quarry sites and permits</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchQuarries} variant="outline" size="sm" className="gap-2 h-8 text-xs">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button onClick={() => setAddDialogOpen(true)} size="sm" className="gap-2 h-8 text-xs">
            <Plus className="h-3.5 w-3.5" />
            Add New Quarry
          </Button>
        </div>
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
                  <TableRow key={quarry._id}>
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
                        {quarry.permitNumber}
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
                      <div className="flex justify-end gap-2">
                        <Button 
                          onClick={() => handleEditQuarry(quarry)}
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 bg-blue-50 hover:bg-blue-100 text-blue-600"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          onClick={() => handleViewQuarry(quarry)}
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 bg-slate-50 hover:bg-slate-100 text-slate-600"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          onClick={() => {
                            setSelectedQuarry(quarry);
                            setDeleteDialogOpen(true);
                          }}
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 bg-red-50 hover:bg-red-100 text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Quarry Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Quarry</DialogTitle>
            <DialogDescription>
              Fill in the details to register a new quarry site
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddQuarry} className="space-y-4">
            {/* Row 1: Quarry Name + Operator */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Quarry Name <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Bataan Quarry Site A"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="operator">Operator <span className="text-red-500">*</span></Label>
                <Input
                  id="operator"
                  value={formData.operator}
                  onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                  placeholder="e.g., ABC Mining Corp"
                  required
                />
              </div>
            </div>

            {/* Row 2: Municipality + Barangay */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="municipality">Municipality <span className="text-red-500">*</span></Label>
                <Select 
                  value={formData.municipality} 
                  onValueChange={(value) => {
                    setFormData({ 
                      ...formData, 
                      municipality: value, 
                      barangay: '',
                      location: value
                    });
                  }}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select municipality" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {getMunicipalities().map((municipality) => (
                      <SelectItem key={municipality} value={municipality}>
                        {municipality}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="barangay">Barangay <span className="text-red-500">*</span></Label>
                <Select 
                  value={formData.barangay} 
                  onValueChange={(value) => {
                    setFormData({ 
                      ...formData, 
                      barangay: value,
                      location: `${value}, ${formData.municipality}`
                    });
                  }}
                  disabled={!formData.municipality}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.municipality ? "Select barangay" : "Select municipality first"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {formData.municipality && getBarangays(formData.municipality).map((barangay) => (
                      <SelectItem key={barangay} value={barangay}>
                        {barangay}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 3: Permit Number + Contact Person + Contact Number */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="permitNumber">Permit Number <span className="text-red-500">*</span></Label>
                <Input
                  id="permitNumber"
                  value={formData.permitNumber}
                  onChange={(e) => setFormData({ ...formData, permitNumber: e.target.value })}
                  placeholder="e.g., PQ-2024-001"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quarryOwner">Quarry Owner <span className="text-red-500">*</span></Label>
                <Input
                  id="quarryOwner"
                  value={formData.quarryOwner}
                  onChange={(e) => setFormData({ ...formData, quarryOwner: e.target.value })}
                  placeholder="e.g., Juan Dela Cruz"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactNumber">Contact Number (PH)</Label>
                <Input
                  id="contactNumber"
                  type="tel"
                  value={formData.contactNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                    if (value.length <= 11) {
                      setFormData({ ...formData, contactNumber: value });
                    }
                  }}
                  placeholder="09XXXXXXXXX (11 digits)"
                  maxLength={11}
                  pattern="09[0-9]{9}"
                />
                {formData.contactNumber && formData.contactNumber.length > 0 && formData.contactNumber.length !== 11 && (
                  <p className="text-xs text-red-500">Must be 11 digits starting with 09</p>
                )}
              </div>
            </div>

            {/* Row 4: Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: 'Active' | 'Inactive' | 'Pending') => 
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Row 5: Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional notes or description (optional)"
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Add Quarry
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Quarry Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quarry Details</DialogTitle>
            <DialogDescription>
              Complete information about this quarry site
            </DialogDescription>
          </DialogHeader>

          {selectedQuarry && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Quarry Name</Label>
                    <p className="font-medium">{selectedQuarry.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Location</Label>
                    <p className="font-medium flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {selectedQuarry.location}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Operator</Label>
                    <p className="font-medium">{selectedQuarry.operator}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Permit Number</Label>
                    <p className="font-medium flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {selectedQuarry.permitNumber}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div>
                      <Badge
                        variant={
                          selectedQuarry.status === 'Active'
                            ? 'default'
                            : selectedQuarry.status === 'Inactive'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {selectedQuarry.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              {(selectedQuarry.quarryOwner || selectedQuarry.contactNumber) && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedQuarry.quarryOwner && (
                      <div>
                        <Label className="text-muted-foreground">Quarry Owner</Label>
                        <p className="font-medium">{selectedQuarry.quarryOwner}</p>
                      </div>
                    )}
                    {selectedQuarry.contactNumber && (
                      <div>
                        <Label className="text-muted-foreground">Contact Number</Label>
                        <p className="font-medium">{selectedQuarry.contactNumber}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedQuarry.description && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg border-b pb-2">Description</h3>
                  <p className="text-sm text-muted-foreground">{selectedQuarry.description}</p>
                </div>
              )}

              {/* System Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">System Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Added By</Label>
                    <p className="font-medium flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {selectedQuarry.addedBy.name}
                    </p>
                    <p className="text-xs text-muted-foreground">@{selectedQuarry.addedBy.username}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Date Added</Label>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(selectedQuarry.createdAt), 'MMM dd, yyyy hh:mm a')}
                    </p>
                  </div>
                  {selectedQuarry.updatedAt !== selectedQuarry.createdAt && (
                    <div>
                      <Label className="text-muted-foreground">Last Updated</Label>
                      <p className="font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(selectedQuarry.updatedAt), 'MMM dd, yyyy hh:mm a')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Quarry Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Edit Quarry & User Information</DialogTitle>
            <DialogDescription className="text-sm">
              Update quarry details and associated user account information
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateQuarry} className="space-y-6">
            {/* Quarry Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">Quarry Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Quarry Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-operator">Operator <span className="text-red-500">*</span></Label>
                  <Input
                    id="edit-operator"
                    value={formData.operator}
                    onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-municipality">Municipality <span className="text-red-500">*</span></Label>
                  <Select 
                    value={formData.municipality} 
                    onValueChange={(value) => {
                      setFormData({ 
                        ...formData, 
                        municipality: value, 
                        barangay: '',
                        location: value
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select municipality" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {getMunicipalities().map((municipality) => (
                        <SelectItem key={municipality} value={municipality}>
                          {municipality}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-barangay">Barangay <span className="text-red-500">*</span></Label>
                  <Select 
                    value={formData.barangay} 
                    onValueChange={(value) => {
                      setFormData({ 
                        ...formData, 
                        barangay: value,
                        location: `${formData.municipality}, ${value}`
                      });
                    }}
                    disabled={!formData.municipality}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={formData.municipality ? "Select barangay" : "Select municipality first"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {formData.municipality && getBarangays(formData.municipality).map((barangay) => (
                        <SelectItem key={barangay} value={barangay}>
                          {barangay}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-permitNumber">Permit Number <span className="text-red-500">*</span></Label>
                  <Input
                    id="edit-permitNumber"
                    value={formData.permitNumber}
                    onChange={(e) => setFormData({ ...formData, permitNumber: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value: 'Active' | 'Inactive' | 'Pending') => 
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional notes or description (optional)"
                  rows={3}
                />
              </div>
            </div>

            {/* Owner & Contact Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700 border-b pb-2">
                Owner & Contact Information
                {associatedUser && <span className="text-xs text-blue-600 ml-2">(Will update user account)</span>}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-quarryOwner">Quarry Owner <span className="text-red-500">*</span></Label>
                  <Input
                    id="edit-quarryOwner"
                    value={formData.quarryOwner}
                    onChange={(e) => setFormData({ ...formData, quarryOwner: e.target.value })}
                    required
                  />
                  {associatedUser && (
                    <p className="text-xs text-blue-600">This will update the user's name</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-contactNumber">Contact Number (PH)</Label>
                  <Input
                    id="edit-contactNumber"
                    type="tel"
                    value={formData.contactNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 11) {
                        setFormData({ ...formData, contactNumber: value });
                      }
                    }}
                    placeholder="09XXXXXXXXX (11 digits)"
                    maxLength={11}
                  />
                  {formData.contactNumber && formData.contactNumber.length > 0 && formData.contactNumber.length !== 11 && (
                    <p className="text-xs text-red-500">Must be 11 digits starting with 09</p>
                  )}
                  {associatedUser && (
                    <p className="text-xs text-blue-600">This will update the user's contact number</p>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-3">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Update Information
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the quarry record for:
              <div className="mt-2 p-3 bg-slate-50 rounded-md border">
                <p className="font-semibold text-slate-900">{selectedQuarry?.name}</p>
                <p className="text-sm text-slate-600">{selectedQuarry?.location}</p>
                <p className="text-sm text-slate-600">Owner: {selectedQuarry?.quarryOwner}</p>
              </div>
              <p className="mt-2 text-red-600 font-medium">
                Note: This will NOT delete the associated user account if one exists.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteQuarry}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Quarry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
