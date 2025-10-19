import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function AdminNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const business = useAuthStore((state) => state.business);

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/reportes', label: '📊 Reportes' },
    { path: '/usuarios', label: '👥 Usuarios' },
    { path: '/categorias', label: '📁 Categorías' },
    { path: '/productos', label: '📦 Productos' },
    { path: '/tipos-servicio', label: '🏷️ Tipos de Servicio' },
  ];

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {navItems.map((item) => (
        <button
          key={item.path}
          onClick={() => navigate(item.path)}
          className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
            isActive(item.path)
              ? 'text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          style={
            isActive(item.path)
              ? { backgroundColor: business?.primary_color || '#3B82F6' }
              : {}
          }
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}