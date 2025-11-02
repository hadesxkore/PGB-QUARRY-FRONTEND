import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  TruckIcon,
  LogIn,
  LogOut as LogOutIcon,
  ClipboardList,
  FileText,
  User,
  Power,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';

const navigation = [
  {
    name: 'My Dashboard',
    href: '/user/dashboard',
    icon: LayoutDashboard,
    description: 'Overview & Statistics',
  },
  {
    name: 'Log Truck IN',
    href: '/user/log-in',
    icon: LogIn,
    description: 'Record truck entry',
    badge: 'Quick',
    badgeColor: 'bg-green-500',
  },
  {
    name: 'Log Truck OUT',
    href: '/user/log-out',
    icon: LogOutIcon,
    description: 'Record truck exit',
    badge: 'Quick',
    badgeColor: 'bg-red-500',
  },
  {
    name: 'Truck Logs',
    href: '/user/logs',
    icon: ClipboardList,
    description: 'View all logs',
  },
  {
    name: 'Truck Records',
    href: '/user/truck-records',
    icon: TruckIcon,
    description: 'All truck information',
  },
  {
    name: 'My Reports',
    href: '/user/reports',
    icon: FileText,
    description: 'Daily & weekly reports',
  },
];

export default function UserSidebar() {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  if (!user) return null;

  return (
    <div className="flex h-full w-72 flex-col border-r bg-background">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg border bg-primary/10 flex items-center justify-center">
            <TruckIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold">Quarry System</h1>
            <p className="text-xs text-muted-foreground">Staff Portal</p>
          </div>
        </div>

        {/* User Info Card */}
        <div className="rounded-lg border bg-card p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-primary/20">
              <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              <Badge variant="secondary" className="mt-1 text-xs">
                Quarry Staff
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink key={item.name} to={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  'w-full justify-start gap-3 h-auto py-2.5 px-3',
                  isActive && 'bg-secondary'
                )}
              >
                <item.icon className={cn(
                  "h-4 w-4 flex-shrink-0",
                  isActive && "text-primary"
                )} />
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{item.name}</span>
                    {item.badge && (
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs px-1.5 py-0 border-0",
                          item.badgeColor === 'bg-green-500' && "bg-green-500/10 text-green-700 dark:text-green-400",
                          item.badgeColor === 'bg-red-500' && "bg-red-500/10 text-red-700 dark:text-red-400"
                        )}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                </div>
              </Button>
            </NavLink>
          );
        })}
      </nav>

      <Separator />

      {/* Bottom Actions */}
      <div className="p-3 space-y-1">
        <NavLink to="/user/profile">
          <Button
            variant={location.pathname === '/user/profile' ? "secondary" : "ghost"}
            className="w-full justify-start gap-3"
          >
            <User className={cn(
              "h-4 w-4",
              location.pathname === '/user/profile' && "text-primary"
            )} />
            <span className="text-sm">My Profile</span>
          </Button>
        </NavLink>

        <Button
          variant="ghost"
          onClick={logout}
          className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Power className="h-4 w-4" />
          <span className="text-sm">Logout</span>
        </Button>
      </div>

      {/* Footer */}
      <div className="p-4 border-t">
        <p className="text-xs text-muted-foreground text-center">
          © 2025 Provincial Government of Bataan
        </p>
      </div>
    </div>
  );
}
