import { useState } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'quarry', label: 'Quarry Management', icon: Mountain },
  { id: 'trucks', label: 'Truck Logs', icon: Truck },
  { id: 'cctv', label: 'CCTV Snapshots', icon: Camera },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'users', label: 'User Management', icon: Users },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { sidebarOpen, currentPage, toggleSidebar, setCurrentPage } = useAdminStore();
  const { user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const handleMenuClick = (pageId: string) => {
    setCurrentPage(pageId);
    setIsMobileMenuOpen(false);
  };

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
                  'w-full justify-start gap-3 transition-all',
                  !sidebarOpen && 'justify-center px-2',
                  isActive && 'bg-blue-500 text-white hover:bg-blue-600',
                  !isActive && 'text-slate-700 hover:bg-slate-100'
                )}
                onClick={() => handleMenuClick(item.id)}
              >
                <Icon className={cn('h-5 w-5', sidebarOpen ? 'mr-0' : 'mr-0')} />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
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
