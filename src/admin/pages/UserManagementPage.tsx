import { useEffect, useState } from 'react';
import { useUserStore, type User } from '@/store/userStore';
import { userService, type CreateUserData } from '@/services/userService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Search, UserPlus, Edit, Trash2, Users, UserCheck, Shield, TrendingUp, MapPin, Phone, Mail, User as UserIcon, Lock, Building2 } from 'lucide-react';
import { toast } from 'sonner';

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

export default function UserManagementPage() {
  const { users, setUsers, addUser, updateUser, deleteUser, setLoading, isLoading } = useUserStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [newPassword, setNewPassword] = useState('');
  const usersPerPage = 8;
  
  // Quarries state
  const [quarries, setQuarries] = useState<Quarry[]>([]);
  const [selectedQuarryId, setSelectedQuarryId] = useState('');
  
  // Form state for new user
  const [formData, setFormData] = useState<CreateUserData>({
    username: '',
    name: '',
    email: '',
    password: '',
    contactNumber: '',
    location: '',
    company: '',
    role: 'user',
  });

  // Load users and quarries on mount
  useEffect(() => {
    loadUsers();
    loadQuarries();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (error: any) {
      toast.error('Failed to load users', {
        description: error.response?.data?.message || 'Something went wrong'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadQuarries = async () => {
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

  const handleAddUser = async () => {
    try {
      // Validation
      if (!formData.username || !formData.name || !formData.password || !formData.contactNumber || !formData.location || !formData.company) {
        toast.error('All required fields must be filled');
        return;
      }

      // Validate contact number (must be exactly 11 digits)
      if (formData.contactNumber && formData.contactNumber.length !== 11) {
        toast.error('Contact number must be exactly 11 digits');
        return;
      }

      setLoading(true);
      
      // Prepare user data without empty email field
      const userData = {
        username: formData.username,
        name: formData.name,
        password: formData.password,
        contactNumber: formData.contactNumber,
        location: formData.location,
        company: formData.company,
        role: formData.role,
      };
      
      console.log('Sending user data:', userData); // Debug log
      const newUser = await userService.createUser(userData as any);
      console.log('Received user data:', newUser); // Debug log
      addUser(newUser);
      
      toast.success('User created successfully', {
        description: `${newUser.name} has been added to the system`
      });
      
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user', {
        description: error.response?.data?.message || error.message || 'Something went wrong'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    try {
      // Validate contact number (must be exactly 11 digits)
      if (formData.contactNumber.length !== 11) {
        toast.error('Contact number must be exactly 11 digits');
        return;
      }

      setLoading(true);
      const updated = await userService.updateUser(selectedUser._id, {
        name: formData.name,
        email: formData.email,
        contactNumber: formData.contactNumber,
        location: formData.location,
        company: formData.company,
        role: formData.role,
      });
      
      updateUser(selectedUser._id, updated);
      
      toast.success('User updated successfully');
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      resetForm();
    } catch (error: any) {
      toast.error('Failed to update user', {
        description: error.response?.data?.message || 'Something went wrong'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setLoading(true);
      await userService.deleteUser(selectedUser._id);
      deleteUser(selectedUser._id);
      
      toast.success('User deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      toast.error('Failed to delete user', {
        description: error.response?.data?.message || 'Something went wrong'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const updated = await userService.toggleUserStatus(user._id, !user.isActive);
      updateUser(user._id, updated);
      toast.success(`User ${updated.isActive ? 'activated' : 'deactivated'}`);
    } catch (error: any) {
      toast.error('Failed to update status');
    }
  };

  const handleChangePassword = async () => {
    if (!selectedUser || !newPassword) {
      toast.error('Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      await userService.updateUser(selectedUser._id, { password: newPassword } as any);
      toast.success('Password changed successfully');
      setNewPassword('');
    } catch (error: any) {
      toast.error('Failed to change password', {
        description: error.response?.data?.message || 'Something went wrong'
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      name: user.name,
      email: user.email,
      password: '',
      contactNumber: user.contactNumber,
      location: user.location,
      company: user.company || '',
      role: user.role,
    });
    setNewPassword('');
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleQuarrySelect = (quarryId: string) => {
    setSelectedQuarryId(quarryId);
    const selectedQuarry = quarries.find(q => q._id === quarryId);
    
    if (selectedQuarry) {
      // Generate suggested username from owner name (lowercase, no spaces)
      const suggestedUsername = selectedQuarry.quarryOwner
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[^a-z0-9]/g, '');
      
      setFormData({
        ...formData,
        username: suggestedUsername, // Auto-fill suggested username
        name: selectedQuarry.quarryOwner,
        contactNumber: selectedQuarry.contactNumber || '',
        location: selectedQuarry.location,
        company: selectedQuarry.name,
        email: '' // Not used anymore
      });
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      name: '',
      email: '',
      password: '',
      contactNumber: '',
      location: '',
      company: '',
      role: 'user',
    });
    setSelectedQuarryId('');
    setNewPassword('');
  };

  // Filter out quarries whose owners already have user accounts
  const availableQuarries = quarries.filter(quarry => {
    // Check if any user has this quarry owner's name
    return !users.some(user => 
      user.name.toLowerCase() === quarry.quarryOwner.toLowerCase() && 
      user.role === 'user'
    );
  });

  // Show only users with 'user' role (hide admin and superadmin)
  const filteredUsers = users
    .filter((user) => user.role === 'user')
    .filter(
      (user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.company?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const stats = {
    total: users.filter(u => u.role === 'user').length,
    active: users.filter(u => u.isActive && u.role === 'user').length,
    admins: users.filter(u => u.role === 'admin').length,
    newThisWeek: users.filter(u => {
      if (u.role !== 'user') return false;
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(u.createdAt) > weekAgo;
    }).length,
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            User Management
          </h2>
          <p className="text-sm text-slate-500 mt-1">Manage system users and permissions</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            // Reset form when closing
            setTimeout(() => resetForm(), 100);
          } else {
            resetForm(); // Reset form when opening dialog
            setIsAddDialogOpen(true);
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
              <UserPlus className="h-4 w-4" />
              Add New User
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[calc(100%-2rem)] max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6" key={isAddDialogOpen ? 'open' : 'closed'}>
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Create New User</DialogTitle>
              <DialogDescription className="text-sm">
                Add a new user to the system. They will be able to login with their credentials.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col md:flex-row gap-6 py-2">
              {/* LEFT SIDE - Quarry & Personal Information */}
              <div className="flex-1 space-y-4">
                {/* Quarry Selection */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-slate-700 border-b pb-1.5">Quarry Information</h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="quarry" className="text-sm font-medium">
                        <Building2 className="h-3 w-3 inline mr-1" />
                        Select Quarry Owner <span className="text-red-500">*</span>
                      </Label>
                      <Select value={selectedQuarryId} onValueChange={handleQuarrySelect}>
                        <SelectTrigger className="h-10 text-base">
                          <SelectValue placeholder="Select Quarry Owner" />
                        </SelectTrigger>
                        <SelectContent position="popper" className="max-h-[400px] overflow-y-auto z-50">
                          {availableQuarries.length === 0 ? (
                            <div className="px-2 py-6 text-center text-sm text-slate-500">
                              All quarry owners already have accounts
                            </div>
                          ) : (
                            availableQuarries.map((quarry) => (
                              <SelectItem key={quarry._id} value={quarry._id}>
                                {quarry.quarryOwner} - {quarry.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-slate-500">This will auto-fill the information below</p>
                    </div>
                  </div>
                </div>

                {/* Auto-populated Information */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-slate-700 border-b pb-1.5">Auto-Populated Information</h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">
                        <UserIcon className="h-3 w-3 inline mr-1" />
                        Full Name (Owner)
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        disabled
                        className="h-10 text-base bg-slate-50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company" className="text-sm font-medium">
                        <Building2 className="h-3 w-3 inline mr-1" />
                        Quarry Name
                      </Label>
                      <Input
                        id="company"
                        value={formData.company}
                        disabled
                        className="h-10 text-base bg-slate-50"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-sm font-medium">
                        <MapPin className="h-3 w-3 inline mr-1" />
                        Location
                      </Label>
                      <Input
                        id="location"
                        value={formData.location}
                        disabled
                        className="h-10 text-base bg-slate-50"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contactNumber" className="text-sm font-medium">
                        <Phone className="h-3 w-3 inline mr-1" />
                        Contact Number
                      </Label>
                      <Input
                        id="contactNumber"
                        value={formData.contactNumber}
                        disabled
                        className="h-10 text-base bg-slate-50"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* VERTICAL DIVIDER - Only visible on medium screens and up */}
              <div className="hidden md:block w-px bg-slate-200"></div>

              {/* RIGHT SIDE - Account Security */}
              <div className="flex-1 space-y-2">
                <h3 className="text-sm font-semibold text-slate-700 border-b pb-1.5">Account Security</h3>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium">
                      <UserIcon className="h-3 w-3 inline mr-1" />
                      Username <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="username"
                      placeholder="juandelacruz"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      autoComplete="off"
                      className="h-10 text-base"
                    />
                    <p className="text-xs text-slate-500">Auto-generated from owner name. You can edit it if needed.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      <Lock className="h-3 w-3 inline mr-1" />
                      Password <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      autoComplete="new-password"
                      className="h-10 text-base"
                    />
                    <p className="text-xs text-slate-500">Minimum 6 characters</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm font-medium">
                      <Shield className="h-3 w-3 inline mr-1" />
                      Role <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.role} onValueChange={(value: 'user' | 'admin') => setFormData({ ...formData, role: value })}>
                      <SelectTrigger className="h-10 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter className="gap-3 mt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="w-full sm:w-auto h-10 text-base">
                Cancel
              </Button>
              <Button onClick={handleAddUser} disabled={isLoading} className="w-full sm:w-auto h-10 text-base">
                {isLoading ? 'Creating...' : 'Create User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.total}</div>
            <p className="text-xs text-slate-500 mt-1">Registered accounts</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">Active Users</CardTitle>
              <UserCheck className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-slate-500 mt-1">Currently active</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">Admins</CardTitle>
              <Shield className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats.admins}</div>
            <p className="text-xs text-slate-500 mt-1">Admin accounts</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">New This Week</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.newThisWeek}</div>
            <p className="text-xs text-slate-500 mt-1">Recent signups</p>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name, email, or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users ({filteredUsers.length})</CardTitle>
          <CardDescription>Manage user accounts and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No users found
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Quarry Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 bg-slate-200">
                            <AvatarFallback className="bg-slate-200 text-slate-700 font-semibold">
                              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-slate-900">{user.name}</div>
                            <div className="text-sm text-slate-500">@{user.username}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-600 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {user.contactNumber}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-600 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {user.location}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-600 flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {user.company || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(user)}
                          className="p-0 h-auto"
                        >
                          <Badge variant={user.isActive ? 'default' : 'outline'} className={user.isActive ? 'bg-green-500' : ''}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openEditDialog(user)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => openDeleteDialog(user)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700"
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
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-end mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
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
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog with Tabs */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Edit User</DialogTitle>
            <DialogDescription className="text-sm">Update user information or change password</DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">Profile Information</TabsTrigger>
              <TabsTrigger value="password">Change Password</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name" className="text-sm font-medium">
                    <UserIcon className="h-3 w-3 inline mr-1" />
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-10 text-base"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-email" className="text-sm font-medium">
                    <Mail className="h-3 w-3 inline mr-1" />
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-10 text-base"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-contact" className="text-sm font-medium">
                    <Phone className="h-3 w-3 inline mr-1" />
                    Contact Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-contact"
                    type="tel"
                    maxLength={11}
                    placeholder="09123456789"
                    value={formData.contactNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setFormData({ ...formData, contactNumber: value });
                    }}
                    className="h-10 text-base"
                  />
                  <p className="text-xs text-slate-500">11 digits</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-location" className="text-sm font-medium">
                    <MapPin className="h-3 w-3 inline mr-1" />
                    Location <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="h-10 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-company" className="text-sm font-medium">
                    <Building2 className="h-3 w-3 inline mr-1" />
                    Quarry Name
                  </Label>
                  <Input
                    id="edit-company"
                    placeholder="ABC Mining Corp."
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="h-10 text-base"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-role" className="text-sm font-medium">
                    <Shield className="h-3 w-3 inline mr-1" />
                    Role <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.role} onValueChange={(value: 'user' | 'admin' | 'superadmin') => setFormData({ ...formData, role: value })}>
                    <SelectTrigger className="h-10 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter className="gap-3 mt-4">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="w-full sm:w-auto h-10 text-base">
                  Cancel
                </Button>
                <Button onClick={handleEditUser} disabled={isLoading} className="w-full sm:w-auto h-10 text-base">
                  {isLoading ? 'Updating...' : 'Update Profile'}
                </Button>
              </DialogFooter>
            </TabsContent>
            
            <TabsContent value="password" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <Lock className="h-4 w-4 inline mr-2" />
                    As a superadmin, you can change this user's password without requiring their old password.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-sm font-medium">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter new password (min 6 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-10 text-base"
                  />
                  <p className="text-xs text-slate-500">Password must be at least 6 characters long</p>
                </div>
              </div>
              
              <DialogFooter className="gap-3 mt-4">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="w-full sm:w-auto h-10 text-base">
                  Cancel
                </Button>
                <Button onClick={handleChangePassword} disabled={isLoading || !newPassword} className="w-full sm:w-auto h-10 text-base">
                  {isLoading ? 'Changing...' : 'Change Password'}
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{selectedUser?.name}</strong> from the system.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
