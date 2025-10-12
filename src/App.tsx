import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import CajaPOS from './pages/CajaPOS';
import SupervisorDashboard from './pages/SupervisorDashboard';
import AdminReports from './pages/AdminReports';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated) {
    return <Login />;
  }

  // Admin ve reportes completos
  if (user?.role === 'admin') {
    return <AdminReports />;
  }

  // Supervisor ve dashboard de monitoreo
  if (user?.role === 'supervisor') {
    return <SupervisorDashboard />;
  }

  // Cajero ve la interfaz POS
  return <CajaPOS />;
}

export default App;