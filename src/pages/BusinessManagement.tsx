import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { businessesService } from '../services/api';
import { Building2, Plus, Edit, Power, LogOut, Key, RefreshCw, Crown, TrendingUp, Package, Users, Trash2 } from 'lucide-react';
import BusinessModal from '../components/BusinessModal';
import ChangePasswordModal from '../components/ChangePasswordModal';
import ConfirmModal from '../components/ConfirmModal';
import Toast from '../components/Toast';
import { SearchBar } from '../components/common/SearchBar';
import { FilterSelect } from '../components/common/FilterSelect';
import { FilterActions } from '../components/common/FilterActions';
import { Pagination } from '../components/common/Pagination';
import { useTableFilters } from '../hooks/useTableFilters';

interface Business {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  address: string;
  plan: string;
  active: boolean;
  created_at: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function BusinessManagement() {
  const currentUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });
  const [loading, setLoading] = useState(false);
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  
  // Estados para estadísticas globales
  const [globalStats, setGlobalStats] = useState({
    totalBusinesses: 0,
    totalUsers: 0,
    totalProducts: 0,
    totalSales: 0,
    totalTransactions: 0
  });
  const [topBusinesses, setTopBusinesses] = useState<any[]>([]);

  // Estados para confirmaciones y toasts
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Hook de filtros y paginación
  const {
    filters,
    page,
    limit,
    updateFilter,
    clearFilters,
    changePage,
    changeLimit,
    getQueryParams,
    hasActiveFilters
  } = useTableFilters({
    initialLimit: 10,
    initialFilters: {
      search: '',
      plan: 'all',
      active: 'all'
    }
  });

  // Cargar empresas con filtros
  const loadBusinesses = async () => {
    setLoading(true);
    try {
      const params = getQueryParams();
      const [businessesRes, statsRes] = await Promise.all([
        businessesService.getAll(params),
        businessesService.getGlobalStats()
      ]);
      
      if (businessesRes.data.success) {
        setBusinesses(businessesRes.data.data);
        setPagination(businessesRes.data.pagination);
      }
      
      if (statsRes.data.success) {
        setGlobalStats(statsRes.data.data.overview);
        setTopBusinesses(statsRes.data.data.topBusinesses);
      }
    } catch (err) {
      console.error('Error al cargar empresas:', err);
      setToast({
        message: 'Error al cargar empresas',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Recargar cuando cambien los filtros o la página
  useEffect(() => {
    loadBusinesses();
  }, [page, limit, filters.search, filters.plan, filters.active]);

  const handleCreateBusiness = () => {
    setEditingBusiness(null);
    setShowBusinessModal(true);
  };

  const handleEditBusiness = (business: Business) => {
    setEditingBusiness(business);
    setShowBusinessModal(true);
  };

  const handleToggleActive = async (business: Business) => {
    setConfirmAction({
      title: business.active ? 'Desactivar Empresa' : 'Activar Empresa',
      message: `¿Estás seguro de ${business.active ? 'desactivar' : 'activar'} ${business.name}?`,
      onConfirm: async () => {
        try {
          await businessesService.toggleActive(business.id);
          setToast({
            message: `Empresa ${business.active ? 'desactivada' : 'activada'} exitosamente`,
            type: 'success'
          });
          loadBusinesses();
        } catch (err) {
          console.error('Error al cambiar estado:', err);
          setToast({
            message: 'Error al cambiar estado de la empresa',
            type: 'error'
          });
        }
        setShowConfirm(false);
      }
    });
    setShowConfirm(true);
  };

  const handleDeleteBusiness = async (business: Business) => {
    setConfirmAction({
      title: '⚠️ Eliminar Empresa',
      message: `¿Estás COMPLETAMENTE SEGURO de eliminar "${business.name}"? Esta acción eliminará TODOS los datos asociados: usuarios, productos, transacciones, etc. ESTA ACCIÓN NO SE PUEDE DESHACER.`,
      onConfirm: async () => {
        try {
          await businessesService.delete(business.id);
          setToast({
            message: `Empresa "${business.name}" eliminada exitosamente`,
            type: 'success'
          });
          loadBusinesses();
        } catch (err) {
          console.error('Error al eliminar empresa:', err);
          setToast({
            message: 'Error al eliminar empresa',
            type: 'error'
          });
        }
        setShowConfirm(false);
      }
    });
    setShowConfirm(true);
  };

  const handleBusinessSaved = () => {
    setShowBusinessModal(false);
    setEditingBusiness(null);
    setToast({
      message: editingBusiness ? 'Empresa actualizada exitosamente' : 'Empresa creada exitosamente',
      type: 'success'
    });
    loadBusinesses();
  };

  const handlePasswordChanged = () => {
    setToast({
      message: 'Contraseña actualizada. Por favor, inicia sesión nuevamente.',
      type: 'success'
    });
    setTimeout(() => {
      logout();
    }, 1500);
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      case 'premium': return 'bg-blue-100 text-blue-800';
      case 'basic': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanLabel = (plan: string) => {
    switch (plan) {
      case 'enterprise': return '💎 Enterprise';
      case 'premium': return '⭐ Premium';
      case 'basic': return '📦 Básico';
      default: return plan;
    }
  };

  // Opciones para los filtros
  const planOptions = [
    { value: 'all', label: 'Todos los planes' },
    { value: 'basic', label: '📦 Básico' },
    { value: 'premium', label: '⭐ Premium' },
    { value: 'enterprise', label: '💎 Enterprise' }
  ];

  const activeOptions = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'true', label: 'Activas' },
    { value: 'false', label: 'Inactivas' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b-4 border-purple-500">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Crown className="text-purple-600" size={32} />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Panel Super Admin</h1>
                <p className="text-sm text-gray-600">{currentUser?.name}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowChangePasswordModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition"
                title="Cambiar Contraseña"
              >
                <Key size={20} />
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
              >
                <LogOut size={20} />
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Estadísticas Globales Mejoradas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Total Empresas</p>
                <p className="text-3xl font-bold text-gray-800">{globalStats.totalBusinesses}</p>
              </div>
              <Building2 className="text-purple-500" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Total Usuarios</p>
                <p className="text-3xl font-bold text-gray-800">{globalStats.totalUsers}</p>
              </div>
              <Users className="text-blue-500" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Total Ventas</p>
                <p className="text-2xl font-bold text-gray-800">${globalStats.totalSales.toFixed(2)}</p>
              </div>
              <TrendingUp className="text-green-500" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Transacciones</p>
                <p className="text-3xl font-bold text-gray-800">{globalStats.totalTransactions}</p>
              </div>
              <RefreshCw className="text-orange-500" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-pink-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Total Productos</p>
                <p className="text-3xl font-bold text-gray-800">{globalStats.totalProducts}</p>
              </div>
              <Package className="text-pink-500" size={40} />
            </div>
          </div>
        </div>

        {/* Top 5 Empresas por Ventas */}
        {topBusinesses.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="text-green-500" size={24} />
              Top 5 Empresas por Ventas
            </h2>
            <div className="space-y-3">
              {topBusinesses.map((business, index) => (
                <div key={business.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-orange-600' : 
                      'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{business.name}</p>
                      <p className="text-xs text-gray-500">{business.transactionCount} transacciones</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600">${business.totalSales.toFixed(2)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${getPlanBadgeColor(business.plan)}`}>
                      {getPlanLabel(business.plan)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Building2 className="text-purple-600" size={24} />
              <h2 className="text-lg font-bold text-gray-800">
                Gestión de Empresas ({pagination.total})
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={loadBusinesses}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition disabled:opacity-50"
              >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                Actualizar
              </button>
              <button
                onClick={handleCreateBusiness}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
              >
                <Plus size={20} />
                Nueva Empresa
              </button>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Barra de búsqueda */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar
              </label>
              <SearchBar
                value={filters.search}
                onChange={(value) => updateFilter('search', value)}
                placeholder="Buscar por nombre, email o slug..."
              />
            </div>

            {/* Filtro por plan */}
            <FilterSelect
              label="Plan"
              value={filters.plan}
              onChange={(value) => updateFilter('plan', value)}
              options={planOptions}
            />

            {/* Filtro por estado */}
            <FilterSelect
              label="Estado"
              value={filters.active}
              onChange={(value) => updateFilter('active', value)}
              options={activeOptions}
            />
          </div>

          {/* Acciones de filtros */}
          <FilterActions
            onClearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters()}
          />
        </div>

        {/* Tabla de Empresas */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : businesses.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500">No se encontraron empresas</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Empresa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Slug
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha Creación
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {businesses.map((business) => (
                      <tr key={business.id} className={!business.active ? 'bg-gray-50' : 'hover:bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{business.name}</div>
                          <div className="text-xs text-gray-500">{business.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">{business.slug}</code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{business.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPlanBadgeColor(business.plan)}`}>
                            {getPlanLabel(business.plan)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            business.active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {business.active ? '✓ Activa' : '✗ Inactiva'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(business.created_at).toLocaleDateString('es-MX')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEditBusiness(business)}
                              className="text-blue-600 hover:text-blue-900 transition"
                              title="Editar"
                            >
                              <Edit size={18} />
                            </button>
<button
                              onClick={() => handleToggleActive(business)}
                              className={`transition ${
                                business.active 
                                  ? 'text-orange-600 hover:text-orange-900' 
                                  : 'text-green-600 hover:text-green-900'
                              }`}
                              title={business.active ? 'Desactivar' : 'Activar'}
                            >
                              <Power size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteBusiness(business)}
                              className="text-red-600 hover:text-red-900 transition"
                              title="Eliminar empresa permanentemente"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
                onPageChange={changePage}
                onItemsPerPageChange={changeLimit}
              />
            </>
          )}
        </div>
      </div>

      {/* Modales */}
      {showBusinessModal && (
        <BusinessModal
          business={editingBusiness}
          onClose={() => {
            setShowBusinessModal(false);
            setEditingBusiness(null);
          }}
          onSuccess={handleBusinessSaved}
        />
      )}

      {showChangePasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowChangePasswordModal(false)}
          onSuccess={handlePasswordChanged}
        />
      )}

      {/* Modal de Confirmación */}
      {showConfirm && confirmAction && (
        <ConfirmModal
          isOpen={showConfirm}
          title={confirmAction.title}
          message={confirmAction.message}
          onConfirm={confirmAction.onConfirm}
          onCancel={() => setShowConfirm(false)}
          type="warning"
        />
      )}

      {/* Toast de Notificación */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}