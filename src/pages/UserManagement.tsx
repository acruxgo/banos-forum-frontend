import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useCacheStore } from '../store/cacheStore';
import { usePlanLimits } from '../hooks/usePlanLimits';
import { usersService } from '../services/api';
import { Users, Plus, Edit, Power, LogOut, Key, RefreshCw, BarChart3, Lock, Trash2, RotateCcw } from 'lucide-react';
import UserModal from '../components/UserModal';
import ChangePasswordModal from '../components/ChangePasswordModal';
import ConfirmModal from '../components/ConfirmModal';
import UpgradeModal from '../components/UpgradeModal';
import Toast from '../components/Toast';
import { SearchBar } from '../components/common/SearchBar';
import { FilterSelect } from '../components/common/FilterSelect';
import { FilterActions } from '../components/common/FilterActions';
import { Pagination } from '../components/common/Pagination';
import { useTableFilters } from '../hooks/useTableFilters';
import AdminNavigation from '../components/AdminNavigation';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'supervisor' | 'cajero';
  active: boolean;
  created_at: string;
  deleted_at?: string | null;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function UserManagement() {
  const currentUser = useAuthStore((state) => state.user);
  const business = useAuthStore((state) => state.business);
  const logout = useAuthStore((state) => state.logout);


  // Caché
  const { invalidateUsers } = useCacheStore();

  // Plan limits
  const { 
    canAddUsers, 
    getUserLimitMessage, 
    getRecommendedUpgrade,
    currentPlan,
    planLimits
  } = usePlanLimits();

  const [users, setLocalUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });
  const [loading, setLoading] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

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
      role: 'all',
      active: 'all',
      show_deleted: 'false'
    }
  });

  // Cargar usuarios con caché
const loadUsers = async () => {
    setLoading(true);
    try {
      const params = getQueryParams();
      const response = await usersService.getAll(params);
      
      if (response.data.success) {
        setLocalUsers(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      setToast({
        message: 'Error al cargar usuarios',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

// Recargar cuando cambien los filtros o la página
  useEffect(() => {
    loadUsers();  // ← Sin parámetro
  }, [page, limit, filters.search, filters.role, filters.active, filters.show_deleted]);

  const handleCreateUser = () => {
    // Verificar si puede agregar más usuarios
    if (!canAddUsers(pagination.total)) {
      setToast({
        message: getUserLimitMessage(),
        type: 'warning'
      });
      setShowUpgradeModal(true);
      return;
    }

    setEditingUser(null);
    setShowUserModal(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowUserModal(true);
  };

  const handleToggleActive = async (user: User) => {
    setConfirmAction({
      title: user.active ? 'Desactivar Usuario' : 'Activar Usuario',
      message: `¿Estás seguro de ${user.active ? 'desactivar' : 'activar'} a ${user.name}?`,
      onConfirm: async () => {
        try {
          await usersService.toggleActive(user.id);
          setToast({
            message: `Usuario ${user.active ? 'desactivado' : 'activado'} exitosamente`,
            type: 'success'
          });
          // Invalidar caché y recargar
          invalidateUsers();
          loadUsers();  // ← Sin parámetro
        } catch (error) {
          setToast({
            message: 'Error al cambiar estado del usuario',
            type: 'error'
          });
        }
        setShowConfirm(false);
      }
    });
    setShowConfirm(true);
  };

  const handleDeleteUser = async (user: User) => {
    setConfirmAction({
      title: 'Eliminar Usuario',
      message: `¿Estás seguro de eliminar a ${user.name}? El usuario será marcado como eliminado pero podrá ser restaurado después.`,
      onConfirm: async () => {
        try {
          await usersService.delete(user.id);
          setToast({
            message: 'Usuario eliminado exitosamente',
            type: 'success'
          });
          invalidateUsers();
          loadUsers();  // ← Sin parámetro
        } catch (error) {
          setToast({
            message: 'Error al eliminar usuario',
            type: 'error'
          });
        }
        setShowConfirm(false);
      }
    });
    setShowConfirm(true);
  };

  const handleRestoreUser = async (user: User) => {
    setConfirmAction({
      title: 'Restaurar Usuario',
      message: `¿Estás seguro de restaurar a ${user.name}?`,
      onConfirm: async () => {
        try {
          await usersService.restore(user.id);
          setToast({
            message: 'Usuario restaurado exitosamente',
            type: 'success'
          });
          invalidateUsers();
          loadUsers();  // ← Sin parámetro
        } catch (error) {
          setToast({
            message: 'Error al restaurar usuario',
            type: 'error'
          });
        }
        setShowConfirm(false);
      }
    });
    setShowConfirm(true);
  };

  const handleUserSaved = () => {
    setShowUserModal(false);
    setEditingUser(null);
    setToast({
      message: editingUser ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente',
      type: 'success'
    });
    // Invalidar caché y recargar
    invalidateUsers();
    loadUsers();  // ← Sin parámetro
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
    invalidateUsers();
    loadUsers();  // ← Sin parámetro
    setToast({
      message: 'Datos actualizados',
      type: 'info'
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'supervisor': return 'bg-blue-100 text-blue-800';
      case 'cajero': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Verificar si el botón de crear usuario está deshabilitado
  const isCreateUserDisabled = !canAddUsers(pagination.total);

  // Opciones para los filtros
  const roleOptions = [
    { value: 'all', label: 'Todos los roles' },
    { value: 'admin', label: 'Administrador' },
    { value: 'supervisor', label: 'Supervisor' },
    { value: 'cajero', label: 'Cajero' }
  ];

  const activeOptions = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'true', label: 'Activos' },
    { value: 'false', label: 'Inactivos' }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header con branding */}
      <header className="bg-white shadow-sm border-b" style={{ borderBottomColor: business?.primary_color || '#3B82F6', borderBottomWidth: '4px' }}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {/* Logo de la empresa */}
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
                  Gestión de Usuarios
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
          <div className="mt-4 border-t pt-4">
            <AdminNavigation />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Acciones */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Users style={{ color: business?.primary_color || '#3B82F6' }} size={24} />
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Usuarios del Sistema ({pagination.total})
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Límite de tu plan: {planLimits.maxUsers === -1 ? 'Ilimitado' : `${pagination.total} / ${planLimits.maxUsers}`}
                </p>
              </div>
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
                onClick={handleCreateUser}
                className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition ${
                  isCreateUserDisabled 
                    ? 'bg-gray-400 cursor-not-allowed hover:bg-gray-500' 
                    : 'hover:opacity-90'
                }`}
                style={!isCreateUserDisabled ? { backgroundColor: business?.primary_color || '#3B82F6' } : {}}
                title={isCreateUserDisabled ? 'Límite alcanzado - Click para actualizar plan' : 'Crear nuevo usuario'}
              >
                {isCreateUserDisabled ? <Lock size={20} /> : <Plus size={20} />}
                Nuevo Usuario
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
                placeholder="Buscar por nombre o email..."
              />
            </div>

            {/* Filtro por rol */}
            <FilterSelect
              label="Rol"
              value={filters.role}
              onChange={(value) => updateFilter('role', value)}
              options={roleOptions}
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
       
        {/* Tabla de Usuarios */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500">No se encontraron usuarios</p>
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
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rol
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
                    {users.map((user) => {
                      const isDeleted = !!user.deleted_at;
                      return (
                        <tr 
                          key={user.id} 
                          className={
                            isDeleted 
                              ? 'bg-red-50 opacity-75' 
                              : !user.active 
                              ? 'bg-gray-50' 
                              : 'hover:bg-gray-50'
                          }
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              {isDeleted && (
                                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                  Eliminado
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">{user.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {user.active ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(user.created_at).toLocaleDateString('es-MX')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              {isDeleted ? (
                                <button
                                  onClick={() => handleRestoreUser(user)}
                                  className="text-green-600 hover:text-green-900 transition"
                                  title="Restaurar usuario"
                                >
                                  <RotateCcw size={18} />
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleEditUser(user)}
                                    className="hover:text-blue-900 transition"
                                    style={{ color: business?.primary_color || '#3B82F6' }}
                                    title="Editar"
                                  >
                                    <Edit size={18} />
                                  </button>
                                  <button
                                    onClick={() => handleToggleActive(user)}
                                    className={`transition ${
                                      user.active 
                                        ? 'text-orange-600 hover:text-orange-900' 
                                        : 'text-green-600 hover:text-green-900'
                                    }`}
                                    title={user.active ? 'Desactivar' : 'Activar'}
                                  >
                                    <Power size={18} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(user)}
                                    className="text-red-600 hover:text-red-900 transition"
                                    title="Eliminar"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
      {showUserModal && (
        <UserModal
          user={editingUser}
          onClose={() => {
            setShowUserModal(false);
            setEditingUser(null);
          }}
          onSuccess={handleUserSaved}
        />
      )}

      {showChangePasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowChangePasswordModal(false)}
          onSuccess={handlePasswordChanged}
        />
      )}

      {/* Modal de Upgrade */}
      {showUpgradeModal && (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          currentPlan={currentPlan}
          recommendedPlan={getRecommendedUpgrade() || 'premium'}
          feature="Límite de usuarios"
          message={getUserLimitMessage()}
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