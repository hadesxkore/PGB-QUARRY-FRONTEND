import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAdminStore } from '@/store/adminStore';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  LayoutDashboard,
  Mountain,
  Truck,
  Camera,
  FileText,
  Users,
  LogOut,
  Menu,
  ChevronLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'quarry', label: 'Quarry Management', icon: Mountain },
  { id: 'manual-truck-in', label: 'Manual Truck In', icon: ArrowDownToLine },
  { id: 'manual-truck-out', label: 'Manual Truck Out', icon: ArrowUpFromLine },
  { id: 'trucks', label: 'Users Truck Logs', icon: Truck, hasBadge: true },
  { id: 'admin-truck-logs', label: 'Admin Truck Logs', icon: FileText },
  { id: 'cctv', label: 'CCTV Snapshots', icon: Camera },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'users', label: 'User Management', icon: Users },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { sidebarOpen, currentPage, toggleSidebar, setCurrentPage } = useAdminStore();
  const { user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [newLogsCount, setNewLogsCount] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const handleMenuClick = (pageId: string) => {
    setCurrentPage(pageId);
    setIsMobileMenuOpen(false);
    
    // Clear badge count when clicking Users Truck Logs
    if (pageId === 'trucks') {
      setNewLogsCount(0);
      // Store in localStorage that user has viewed the logs
      localStorage.setItem('lastViewedTruckLogs', new Date().toISOString());
    }
  };

  // Fetch unread logs count on mount
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const authStorage = localStorage.getItem('auth-storage');
        const token = authStorage ? JSON.parse(authStorage).state.token : null;
        const lastViewed = localStorage.getItem('lastViewedTruckLogs') || new Date(0).toISOString();

        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/truck-logs/all?startDate=${lastViewed}`,
          {
            headers: { 'Authorization': `Bearer ${token}` },
          }
        );

        if (response.ok) {
          const result = await response.json();
          const count = result.data?.length || 0;
          setNewLogsCount(count);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      // Request permission with better error handling for production
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          console.log('Notification permission granted');
        } else {
          console.log('Notification permission denied');
        }
      }).catch((error) => {
        console.error('Error requesting notification permission:', error);
      });
    }
  }, []);

  // Function to show push notification
  const showPushNotification = (logData?: any) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      console.log('Push notification data:', logData); // Debug log
      
      let notificationBody = 'A new truck log has been added to the system';
      
      if (logData) {
        // Get the first log entry if logs array exists
        const logEntry = logData.logs?.[0] || logData;
        
        const logType = (logEntry.logType || logData.logType || 'IN/OUT').toUpperCase();
        // Try multiple possible paths for quarry name
        const quarryName = logEntry.company
          || logData.company
          || logData.quarry?.name 
          || logData.quarryName 
          || logData.truck?.quarry?.name
          || logData.quarryId?.name
          || 'a quarry';
        
        notificationBody = `Truck logged ${logType} at ${quarryName}`;
      }
      
      const notification = new Notification('New Truck Log Added', {
        body: notificationBody,
        icon: '/images/bataanlogo.png',
        badge: '/images/bataanlogo.png',
        tag: 'truck-log-notification',
        requireInteraction: false,
        silent: false,
      });

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);

      // Click handler to navigate to truck logs
      notification.onclick = () => {
        window.focus();
        setCurrentPage('trucks');
        notification.close();
      };
    }
  };

  // Initialize WebSocket for real-time notifications
  useEffect(() => {
    const BACKEND_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(BACKEND_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      console.log('✅ Admin Layout WebSocket connected');
    });

    newSocket.on('truckLog:created', (data?: any) => {
      // Only increment if not currently viewing the truck logs page
      if (currentPage !== 'trucks') {
        setNewLogsCount(prev => prev + 1);
        // Show push notification
        showPushNotification(data);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [currentPage]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen transition-all duration-300 bg-white border-r border-slate-200 shadow-lg',
          sidebarOpen ? 'w-64' : 'w-20',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200">
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-3">
                <img
                  src="/images/bataanlogo.png"
                  alt="Bataan Logo"
                  className="h-10 w-10 object-contain"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900">QuarryWeb</span>
                  <span className="text-xs text-slate-500">Admin Panel</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="hidden lg:flex"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="mx-auto"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* User Profile Section */}
        <div className={cn('p-4 border-b border-slate-200', !sidebarOpen && 'px-2')}>
          <div className={cn('flex items-center gap-3', !sidebarOpen && 'flex-col')}>
            <Avatar className={cn(sidebarOpen ? 'h-10 w-10' : 'h-8 w-8')}>
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-blue-500 text-white">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </AvatarFallback>
            </Avatar>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {user?.name || 'Admin'}
                </p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <Button
                key={item.id}
                variant={isActive ? 'default' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-3 transition-all relative',
                  !sidebarOpen && 'justify-center px-2',
                  isActive && 'bg-blue-500 text-white hover:bg-blue-600',
                  !isActive && 'text-slate-700 hover:bg-slate-100'
                )}
                onClick={() => handleMenuClick(item.id)}
              >
                <Icon className={cn('h-5 w-5', sidebarOpen ? 'mr-0' : 'mr-0')} />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                {item.hasBadge && newLogsCount > 0 && (
                  <Badge 
                    className={cn(
                      'absolute bg-red-500 text-white text-xs px-1.5 min-w-[20px] h-5 flex items-center justify-center',
                      sidebarOpen ? 'right-2' : 'top-0 right-0 -translate-y-1/4 translate-x-1/4'
                    )}
                  >
                    {newLogsCount > 99 ? '99+' : newLogsCount}
                  </Badge>
                )}
              </Button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-3 border-t border-slate-200">
          <Button
            variant="ghost"
            className={cn(
              'w-full justify-start gap-3 text-red-600 hover:bg-red-50 hover:text-red-700',
              !sidebarOpen && 'justify-center px-2'
            )}
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div
        className={cn(
          'transition-all duration-300',
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
        )}
      >
        {/* Top Header */}
        <header className="sticky top-0 z-20 h-16 bg-white border-b border-slate-200 shadow-sm">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-slate-900 capitalize">
                  {menuItems.find((item) => item.id === currentPage)?.label || 'Dashboard'}
                </h1>
                <p className="text-xs text-slate-500">
                  Provincial Government of Bataan
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-green-700">Online</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
