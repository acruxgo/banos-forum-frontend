import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import CajaPOS from './pages/CajaPOS';
import SupervisorDashboard from './pages/SupervisorDashboard';
import AdminReports from './pages/AdminReports';
import UserManagement from './pages/UserManagement';
import ProductManagement from './pages/ProductManagement';
import BusinessManagement from './pages/BusinessManagement';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas del Super Admin */}
        {user?.role === 'super_admin' && (
          <>
            <Route path="/" element={<Navigate to="/empresas" replace />} />
            <Route path="/empresas" element={<BusinessManagement />} />
          </>
        )}

        {/* Rutas del Admin */}
        {user?.role === 'admin' && (
          <>
            <Route path="/" element={<Navigate to="/reportes" replace />} />
            <Route path="/reportes" element={<AdminReports />} />
            <Route path="/usuarios" element={<UserManagement />} />
            <Route path="/productos" element={<ProductManagement />} />
          </>
        )}

        {/* Rutas del Supervisor */}
        {user?.role === 'supervisor' && (
          <>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<SupervisorDashboard />} />
          </>
        )}

        {/* Rutas del Cajero */}
        {user?.role === 'cajero' && (
          <>
            <Route path="/" element={<Navigate to="/caja" replace />} />
            <Route path="/caja" element={<CajaPOS />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;