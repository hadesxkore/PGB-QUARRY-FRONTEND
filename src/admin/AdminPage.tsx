import AdminLayout from './AdminLayout';
import { useAdminStore } from '@/store/adminStore';
import DashboardPage from './pages/DashboardPage';
import QuarryManagementPage from './pages/QuarryManagementPage';
import TruckLogsPage from './pages/TruckLogsPage';
import CCTVSnapshotsPage from './pages/CCTVSnapshotsPage';
import ReportsPage from './pages/ReportsPage';
import UserManagementPage from './pages/UserManagementPage';

export default function AdminPage() {
  const currentPage = useAdminStore((state) => state.currentPage);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'quarry':
        return <QuarryManagementPage />;
      case 'trucks':
        return <TruckLogsPage />;
      case 'cctv':
        return <CCTVSnapshotsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'users':
        return <UserManagementPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <AdminLayout>
      {renderPage()}
    </AdminLayout>
  );
}
