import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import CajaPOS from './pages/CajaPOS';
import SupervisorDashboard from './pages/SupervisorDashboard';
import AdminReports from './pages/AdminReports';
import UserManagement from './pages/UserManagement';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas del Admin */}
        {user?.role === 'admin' && (
          <>
            <Route path="/reportes" element={<AdminReports />} />
            <Route path="/usuarios" element={<UserManagement />} />
            <Route path="*" element={<Navigate to="/reportes" replace />} />
          </>
        )}

        {/* Rutas del Supervisor */}
        {user?.role === 'supervisor' && (
          <>
            <Route path="/dashboard" element={<SupervisorDashboard />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </>
        )}

        {/* Rutas del Cajero */}
        {user?.role === 'cajero' && (
          <>
            <Route path="/caja" element={<CajaPOS />} />
            <Route path="*" element={<Navigate to="/caja" replace />} />
          </>
        )}

        {/* Ruta por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;