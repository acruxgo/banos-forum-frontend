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

  // Super Admin Routes
  if (user?.role === 'super_admin') {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/empresas" replace />} />
          <Route path="/empresas" element={<BusinessManagement />} />
          <Route path="*" element={<Navigate to="/empresas" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  // Admin Routes
  if (user?.role === 'admin') {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/reportes" replace />} />
          <Route path="/reportes" element={<AdminReports />} />
          <Route path="/usuarios" element={<UserManagement />} />
          <Route path="/productos" element={<ProductManagement />} />
          <Route path="*" element={<Navigate to="/reportes" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  // Supervisor Routes
  if (user?.role === 'supervisor') {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<SupervisorDashboard />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  // Cajero Routes
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/caja" replace />} />
        <Route path="/caja" element={<CajaPOS />} />
        <Route path="*" element={<Navigate to="/caja" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;