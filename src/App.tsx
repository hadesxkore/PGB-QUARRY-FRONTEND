import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import AdminPage from './admin/AdminPage';
import UserPage from './user/UserPage';

// User Pages
import Dashboard from './user/pages/Dashboard';
import LogTruckIn from './user/pages/LogTruckIn';
import LogTruckOut from './user/pages/LogTruckOut';
import TruckLogs from './user/pages/TruckLogs';
import TruckRecords from './user/pages/TruckRecords';
import Reports from './user/pages/Reports';
import Profile from './user/pages/Profile';

function App() {
  const { isAuthenticated, user } = useAuthStore();

  // Not authenticated - show login
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Admin/Superadmin users see AdminPage (existing admin sidebar)
  if (user?.role === 'admin' || user?.role === 'superadmin') {
    return <AdminPage />;
  }

  // Regular users see UserPage with routing
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/user" element={<UserPage />}>
          <Route index element={<Navigate to="/user/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="log-in" element={<LogTruckIn />} />
          <Route path="log-out" element={<LogTruckOut />} />
          <Route path="logs" element={<TruckLogs />} />
          <Route path="truck-records" element={<TruckRecords />} />
          <Route path="reports" element={<Reports />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/user/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
