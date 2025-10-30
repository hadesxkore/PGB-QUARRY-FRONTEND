import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import AdminPage from './admin/AdminPage';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Simple routing based on authentication
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <AdminPage />;
}

export default App
