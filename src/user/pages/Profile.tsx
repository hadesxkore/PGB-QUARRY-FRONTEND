import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Calendar,
  Edit,
  Save,
  X,
  Shield
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function Profile() {
  const { user, setUser } = useAuthStore();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    contactNumber: user?.contactNumber || '',
    location: user?.location || '',
    company: user?.company || '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        contactNumber: user.contactNumber || '',
        location: user.location || '',
        company: user.company || '',
      });
    }
  }, [user]);

  const handleSave = async (field: string) => {
    setIsLoading(true);
    try {
      const authStorage = localStorage.getItem('auth-storage');
      const token = authStorage ? JSON.parse(authStorage).state.token : null;

      // Validate contact number if saving that field
      if (field === 'contactNumber' && formData.contactNumber && formData.contactNumber.length !== 11) {
        toast.error('Contact number must be exactly 11 digits');
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users/${(user as any)?.id || (user as any)?._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ [field]: formData[field as keyof typeof formData] }),
        }
      );

      if (!response.ok) throw new Error('Failed to update profile');
      
      // Update user in auth store
      setUser({ ...user, [field]: formData[field as keyof typeof formData] } as any);
      
      toast.success('Profile updated successfully!');
      setEditingField(null);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = (field: string) => {
    setFormData({
      ...formData,
      [field]: (user as any)?.[field] || '',
    });
    setEditingField(null);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">My Profile</h2>
          <p className="text-sm text-slate-500">View and manage your personal information</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>Your account avatar</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <Avatar className="h-32 w-32">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-green-500 text-white text-4xl">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-900">{user.name}</h3>
              <p className="text-sm text-slate-500">@{(user as any).username}</p>
              <Badge className="mt-2 bg-green-500">
                {user.role === 'user' ? 'Quarry User' : user.role}
              </Badge>
            </div>
            <Separator />
            <div className="w-full space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="h-4 w-4" />
                <span>Joined {format(new Date((user as any).createdAt || new Date()), 'MMM dd, yyyy')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Click Edit to update individual fields
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Full Name */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name
                </Label>
                {editingField === 'name' ? (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleCancel('name')}>
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={() => handleSave('name')} disabled={isLoading}>
                      <Save className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => setEditingField('name')}>
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
              {editingField === 'name' ? (
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter your full name"
                />
              ) : (
                <p className="text-slate-900 font-medium">{user.name || 'Not provided'}</p>
              )}
            </div>

            <Separator />

            {/* Email */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                {editingField === 'email' ? (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleCancel('email')}>
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={() => handleSave('email')} disabled={isLoading}>
                      <Save className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => setEditingField('email')}>
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
              {editingField === 'email' ? (
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter your email"
                />
              ) : (
                <p className="text-slate-900 font-medium">{user.email || 'Not provided'}</p>
              )}
            </div>

            <Separator />

            {/* Contact Number */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="contactNumber" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Contact Number
                </Label>
                {editingField === 'contactNumber' ? (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleCancel('contactNumber')}>
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={() => handleSave('contactNumber')} disabled={isLoading}>
                      <Save className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => setEditingField('contactNumber')}>
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
              {editingField === 'contactNumber' ? (
                <div className="space-y-1">
                  <Input
                    id="contactNumber"
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
                </div>
              ) : (
                <p className="text-slate-900 font-medium">{user.contactNumber || 'Not provided'}</p>
              )}
            </div>

            <Separator />

            {/* Location */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </Label>
                {editingField === 'location' ? (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleCancel('location')}>
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={() => handleSave('location')} disabled={isLoading}>
                      <Save className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => setEditingField('location')}>
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
              {editingField === 'location' ? (
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Enter your location"
                />
              ) : (
                <p className="text-slate-900 font-medium">{user.location || 'Not provided'}</p>
              )}
            </div>

            <Separator />

            {/* Company/Quarry */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="company" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Company/Quarry
                </Label>
                {editingField === 'company' ? (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleCancel('company')}>
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={() => handleSave('company')} disabled={isLoading}>
                      <Save className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => setEditingField('company')}>
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
              {editingField === 'company' ? (
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Enter your company/quarry name"
                />
              ) : (
                <p className="text-slate-900 font-medium">{user.company || 'Not provided'}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Information (Read-only) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Security Information
          </CardTitle>
          <CardDescription>
            Your account security details (contact admin to change)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-slate-500">Username</Label>
              <div className="flex items-center gap-2">
                <p className="text-slate-900 font-medium">@{(user as any).username}</p>
                <Badge variant="secondary" className="text-xs">Read-only</Badge>
              </div>
              <p className="text-xs text-slate-500">Your unique username cannot be changed</p>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-500">Password</Label>
              <div className="flex items-center gap-2">
                <p className="text-slate-900 font-medium">••••••••</p>
                <Badge variant="secondary" className="text-xs">Protected</Badge>
              </div>
              <p className="text-xs text-slate-500">Contact admin to reset your password</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
