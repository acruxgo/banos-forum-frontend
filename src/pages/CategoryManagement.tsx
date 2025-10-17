import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { categoriesService } from '../services/api';
import { FolderOpen, Plus, Edit, Power, LogOut, Key, RefreshCw, BarChart3, Trash2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import ChangePasswordModal from '../components/ChangePasswordModal';
import CategoryModal from '../components/CategoryModal';
import ConfirmModal from '../components/ConfirmModal';
import Toast from '../components/Toast';
import { SearchBar } from '../components/common/SearchBar';
import { FilterSelect } from '../components/common/FilterSelect';
import { FilterActions } from '../components/common/FilterActions';
import { Pagination } from '../components/common/Pagination';
import { useTableFilters } from '../hooks/useTableFilters';


interface Category {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  created_at: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function CategoryManagement() {
  const currentUser = useAuthStore((state) => state.user);
  const business = useAuthStore((state) => state.business);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();

  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });
  const [loading, setLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Estados para confirmaciones y toasts
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

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
      active: 'all'
    }
  });

  // Cargar categorías con filtros
  const loadCategories = async () => {
    setLoading(true);
    try {
      const params = getQueryParams();
      const response = await categoriesService.getAll(params);
      
      if (response.data.success) {
        setCategories(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      setToast({
        message: 'Error al cargar categorías',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Recargar cuando cambien los filtros o la página
  useEffect(() => {
    loadCategories();
  }, [page, limit, filters.search, filters.active]);

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setShowCategoryModal(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setShowCategoryModal(true);
  };

  const handleToggleActive = async (category: Category) => {
    setConfirmAction({
      title: category.active ? 'Desactivar Categoría' : 'Activar Categoría',
      message: `¿Estás seguro de ${category.active ? 'desactivar' : 'activar'} "${category.name}"?`,
      onConfirm: async () => {
        try {
          await categoriesService.toggleActive(category.id);
          setToast({
            message: `Categoría ${category.active ? 'desactivada' : 'activada'} exitosamente`,
            type: 'success'
          });
          loadCategories();
        } catch (error: any) {
          setToast({
            message: error.response?.data?.message || 'Error al cambiar estado de la categoría',
            type: 'error'
          });
        }
        setShowConfirm(false);
      }
    });
    setShowConfirm(true);
  };

  const handleDeleteCategory = async (category: Category) => {
    setConfirmAction({
      title: 'Eliminar Categoría',
      message: `¿Estás seguro de eliminar "${category.name}"? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        try {
          await categoriesService.delete(category.id);
          setToast({
            message: 'Categoría eliminada exitosamente',
            type: 'success'
          });
          loadCategories();
        } catch (error: any) {
          setToast({
            message: error.response?.data?.message || 'Error al eliminar categoría',
            type: 'error'
          });
        }
        setShowConfirm(false);
      }
    });
    setShowConfirm(true);
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

  const handleRefresh = () => {
    loadCategories();
    setToast({
      message: 'Datos actualizados',
      type: 'info'
    });
  };

  // Opciones para los filtros
  const activeOptions = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'true', label: 'Activas' },
    { value: 'false', label: 'Inactivas' }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header con branding */}
      <header className="bg-white shadow-sm border-b" style={{ borderBottomColor: business?.primary_color || '#3B82F6', borderBottomWidth: '4px' }}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {business?.logo_url ? (
                <img 
                  src={business.logo_url} 
                  alt={business.name}
                  className="h-12 w-auto object-contain"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <BarChart3 size={32} style={{ color: business?.primary_color || '#3B82F6' }} />
              )}
              
              <div>
                <h1 className="text-xl font-bold" style={{ color: business?.primary_color || '#1F2937' }}>
                  Gestión de Categorías
                </h1>
                <p className="text-sm text-gray-600">{currentUser?.name} - Administrador</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowChangePasswordModal(true)}
                className="px-4 py-2 text-white rounded-lg transition hover:opacity-90"
                style={{ backgroundColor: business?.primary_color || '#3B82F6' }}
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

          {/* Menú de navegación */}
          <div className="flex gap-2 mt-4 border-t pt-4">
            <button
              onClick={() => navigate('/reportes')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                location.pathname === '/reportes'
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={
                location.pathname === '/reportes'
                  ? { backgroundColor: business?.primary_color || '#3B82F6' }
                  : {}
              }
            >
              📊 Reportes
            </button>
            <button
              onClick={() => navigate('/usuarios')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                location.pathname === '/usuarios'
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={
                location.pathname === '/usuarios'
                  ? { backgroundColor: business?.primary_color || '#3B82F6' }
                  : {}
              }
            >
              👥 Usuarios
            </button>
            <button
              onClick={() => navigate('/categorias')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                location.pathname === '/categorias'
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={
                location.pathname === '/categorias'
                  ? { backgroundColor: business?.primary_color || '#3B82F6' }
                  : {}
              }
            >
              📁 Categorías
            </button>
            <button
              onClick={() => navigate('/productos')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                location.pathname === '/productos'
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={
                location.pathname === '/productos'
                  ? { backgroundColor: business?.primary_color || '#3B82F6' }
                  : {}
              }
            >
              📦 Productos
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Acciones */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FolderOpen style={{ color: business?.primary_color || '#3B82F6' }} size={24} />
              <h2 className="text-lg font-bold text-gray-800">
                Categorías de Productos ({pagination.total})
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition disabled:opacity-50"
              >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                Actualizar
              </button>
              <button
                onClick={handleCreateCategory}
                className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition hover:opacity-90"
                style={{ backgroundColor: business?.primary_color || '#3B82F6' }}
              >
                <Plus size={20} />
                Nueva Categoría
              </button>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar
              </label>
              <SearchBar
                value={filters.search}
                onChange={(value) => updateFilter('search', value)}
                placeholder="Buscar por nombre..."
              />
            </div>

            <FilterSelect
              label="Estado"
              value={filters.active}
              onChange={(value) => updateFilter('active', value)}
              options={activeOptions}
            />
          </div>

          <FilterActions
            onClearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters()}
          />
        </div>

        {/* Tabla de Categorías */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500">No se encontraron categorías</p>
              <button
                onClick={handleCreateCategory}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg transition hover:opacity-90"
                style={{ backgroundColor: business?.primary_color || '#3B82F6' }}
              >
                <Plus size={20} />
                Crear primera categoría
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descripción
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
                    {categories.map((category) => (
                      <tr key={category.id} className={!category.active ? 'bg-gray-50' : 'hover:bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <FolderOpen size={18} style={{ color: business?.primary_color || '#3B82F6' }} />
                            <span className="text-sm font-medium text-gray-900">{category.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 max-w-md truncate">
                            {category.description || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            category.active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {category.active ? 'Activa' : 'Inactiva'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(category.created_at).toLocaleDateString('es-MX')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEditCategory(category)}
                              className="hover:text-blue-900 transition"
                              style={{ color: business?.primary_color || '#3B82F6' }}
                              title="Editar"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleToggleActive(category)}
                              className={`transition ${
                                category.active 
                                  ? 'text-red-600 hover:text-red-900' 
                                  : 'text-green-600 hover:text-green-900'
                              }`}
                              title={category.active ? 'Desactivar' : 'Activar'}
                            >
                              <Power size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category)}
                              className="text-red-600 hover:text-red-900 transition"
                              title="Eliminar"
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

      {/* Modal de Categoría */}
        {showCategoryModal && (
        <CategoryModal
            category={editingCategory}
            onClose={() => {
            setShowCategoryModal(false);
            setEditingCategory(null);
            }}
            onSuccess={() => {
            setShowCategoryModal(false);
            setEditingCategory(null);
            setToast({
                message: editingCategory ? 'Categoría actualizada exitosamente' : 'Categoría creada exitosamente',
                type: 'success'
            });
            loadCategories();
            }}
        />
        )}

      {showChangePasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowChangePasswordModal(false)}
          onSuccess={handlePasswordChanged}
        />
      )}

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