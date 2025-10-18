import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useCacheStore } from '../store/cacheStore';
import { usePlanLimits } from '../hooks/usePlanLimits';
import { productsService, serviceTypesService } from '../services/api';
import type { ServiceType } from '../types';
import { Package, Plus, Edit, Power, LogOut, Key, RefreshCw, BarChart3, Lock, Trash2, RotateCcw } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import ProductModal from '../components/ProductModal';
import ChangePasswordModal from '../components/ChangePasswordModal';
import ConfirmModal from '../components/ConfirmModal';
import UpgradeModal from '../components/UpgradeModal';
import Toast from '../components/Toast';
import { SearchBar } from '../components/common/SearchBar';
import { FilterSelect } from '../components/common/FilterSelect';
import { Pagination } from '../components/common/Pagination';
import { useTableFilters } from '../hooks/useTableFilters';

interface Product {
  id: string;
  name: string;
  price: number;
  service_type_id: string;
  service_types?: {
    id: string;
    name: string;
    icon?: string;
  };
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

export default function ProductManagement() {
  const currentUser = useAuthStore((state) => state.user);
  const business = useAuthStore((state) => state.business);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();

  // Caché
  const { invalidateProducts } = useCacheStore();

  // Plan limits
  const { 
    canAddProducts, 
    getProductLimitMessage, 
    getRecommendedUpgrade,
    currentPlan,
    planLimits
  } = usePlanLimits();

  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [products, setProductsLocal] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });
  const [loading, setLoading] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

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
    changePage,
    changeLimit,
    getQueryParams,
  } = useTableFilters({
    initialLimit: 10,
    initialFilters: {
      search: '',
      service_type_id: 'all',
      active: 'all',
      show_deleted: 'false'
    }
  });

const loadProducts = async () => {

    setLoading(true);
    try {
      // CACHÉ DESACTIVADO TEMPORALMENTE
      // if (!forceRefresh && !hasActiveFilters() && page === 1 && limit === 10 && filters.show_deleted === 'false') {
      //   const cachedProducts = getProducts();
      //   if (cachedProducts) {
      //     console.log('✨ Productos cargados desde caché');
      //     setProductsLocal(cachedProducts);
      //     setPagination({
      //       total: cachedProducts.length,
      //       page: 1,
      //       limit: 10,
      //       totalPages: Math.ceil(cachedProducts.length / 10)
      //     });
      //     setLoading(false);
      //     return;
      //   }
      // }

      // Si hay filtros o no hay caché, hacer petición
      const params = getQueryParams();
      const response = await productsService.getAll(params);
      
      if (response.data.success) {
        setProductsLocal(response.data.data);
        setPagination(response.data.pagination);
        
        // CACHÉ DESACTIVADO TEMPORALMENTE
        // if (!hasActiveFilters() && page === 1 && limit === 10 && filters.show_deleted === 'false') {
        //   setProductsLocal(response.data.data);
        //   console.log('💾 Productos guardados en caché');
        // }
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
      setToast({
        message: 'Error al cargar productos',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar tipos de servicio
  const loadServiceTypes = async () => {
    try {
      const response = await serviceTypesService.getAll();
      if (response.data.success) {
        const activeTypes = response.data.data.filter((t: ServiceType) => t.active);
        setServiceTypes(activeTypes);
      }
    } catch (error) {
      console.error('Error al cargar tipos de servicio:', error);
    }
  };

    // Recargar cuando cambien los filtros o la página
  useEffect(() => {
    loadProducts();
    loadServiceTypes();
  }, [page, limit, filters.search, filters.service_type_id, filters.active, filters.show_deleted]);

  const handleCreateProduct = () => {
    // Verificar si puede agregar más productos
    if (!canAddProducts(pagination.total)) {
      setToast({
        message: getProductLimitMessage(),
        type: 'warning'
      });
      setShowUpgradeModal(true);
      return;
    }

    setEditingProduct(null);
    setShowProductModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductModal(true);
  };

  const handleToggleActive = async (product: Product) => {
    setConfirmAction({
      title: product.active ? 'Desactivar Producto' : 'Activar Producto',
      message: `¿Estás seguro de ${product.active ? 'desactivar' : 'activar'} "${product.name}"?`,
      onConfirm: async () => {
        try {
          await productsService.toggleActive(product.id);
          setToast({
            message: `Producto ${product.active ? 'desactivado' : 'activado'} exitosamente`,
            type: 'success'
          });
          invalidateProducts(); // Invalidar caché
          loadProducts();
        } catch (error) {
          setToast({
            message: 'Error al cambiar estado del producto',
            type: 'error'
          });
        }
        setShowConfirm(false);
      }
    });
    setShowConfirm(true);
  };

  const handleDeleteProduct = async (product: Product) => {
    setConfirmAction({
      title: 'Eliminar Producto',
      message: `¿Estás seguro de eliminar "${product.name}"? El producto será marcado como eliminado pero podrá ser restaurado después.`,
      onConfirm: async () => {
        try {
          await productsService.delete(product.id);
          setToast({
            message: 'Producto eliminado exitosamente',
            type: 'success'
          });
          invalidateProducts();
          loadProducts();
        } catch (error) {
          setToast({
            message: 'Error al eliminar producto',
            type: 'error'
          });
        }
        setShowConfirm(false);
      }
    });
    setShowConfirm(true);
  };

  const handleRestoreProduct = async (product: Product) => {
    setConfirmAction({
      title: 'Restaurar Producto',
      message: `¿Estás seguro de restaurar "${product.name}"?`,
      onConfirm: async () => {
        try {
          await productsService.restore(product.id);
          setToast({
            message: 'Producto restaurado exitosamente',
            type: 'success'
          });
          invalidateProducts();
          loadProducts();
        } catch (error) {
          setToast({
            message: 'Error al restaurar producto',
            type: 'error'
          });
        }
        setShowConfirm(false);
      }
    });
    setShowConfirm(true);
  };

  const handleProductSaved = () => {
    setShowProductModal(false);
    setEditingProduct(null);
    setToast({
      message: editingProduct ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente',
      type: 'success'
    });
    invalidateProducts(); // Invalidar caché
    loadProducts();
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

  // Función para refrescar forzando recarga desde servidor
  const handleRefresh = () => {
    invalidateProducts();
    loadProducts();
    setToast({
      message: 'Productos actualizados',
      type: 'info'
    });
  };

  // Verificar si el botón de crear producto está deshabilitado
  const isCreateProductDisabled = !canAddProducts(pagination.total);

  // Opciones para los filtros
  const typeOptions = [
    { value: 'all', label: 'Todos los tipos' },
    ...serviceTypes.map(type => ({
      value: type.id,
      label: type.icon ? `${type.icon} ${type.name}` : type.name
    }))
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
                  Gestión de Productos
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

          {/* Menú de navegación con color de la empresa */}
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
            <button
              onClick={() => navigate('/tipos-servicio')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                location.pathname === '/tipos-servicio'
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={
                location.pathname === '/tipos-servicio'
                  ? { backgroundColor: business?.primary_color || '#3B82F6' }
                  : {}
              }
            >
              🏷️ Tipos de Servicio
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Acciones */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Package style={{ color: business?.primary_color || '#3B82F6' }} size={24} />
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Productos y Servicios ({pagination.total})
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Límite de tu plan: {pagination.total} / {planLimits.maxProducts === -1 ? 'Ilimitado' : planLimits.maxProducts}
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
                onClick={handleCreateProduct}
                className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition ${
                  isCreateProductDisabled 
                    ? 'bg-gray-400 cursor-not-allowed hover:bg-gray-500' 
                    : 'hover:opacity-90'
                }`}
                style={!isCreateProductDisabled ? { backgroundColor: business?.primary_color || '#3B82F6' } : {}}
                title={isCreateProductDisabled ? 'Límite alcanzado - Click para actualizar plan' : 'Crear nuevo producto'}
              >
                {isCreateProductDisabled ? <Lock size={20} /> : <Plus size={20} />}
                Nuevo Producto
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
                placeholder="Buscar por nombre..."
              />
            </div>

            {/* Filtro por tipo */}
            <FilterSelect
              label="Tipo de Servicio"
              value={filters.service_type_id}
              onChange={(value) => updateFilter('service_type_id', value)}
              options={typeOptions}
            />

            {/* Filtro por estado */}
            <FilterSelect
              label="Estado"
              value={filters.active}
              onChange={(value) => updateFilter('active', value)}
              options={activeOptions}
            />
          </div>

              </div>
          {/* Tabla de Productos */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500">No se encontraron productos</p>
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
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Precio
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
                    {products.map((product) => {
                      const isDeleted = !!product.deleted_at;
                      return (
                        <tr 
                          key={product.id} 
                          className={
                            isDeleted 
                              ? 'bg-red-50 opacity-75' 
                              : !product.active 
                              ? 'bg-gray-50' 
                              : 'hover:bg-gray-50'
                          }
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-medium text-gray-900">{product.name}</div>
                              {isDeleted && (
                                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                  Eliminado
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {product.service_types?.icon && (
                                <span className="text-lg">{product.service_types.icon}</span>
                              )}
                              <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                {product.service_types?.name || 'N/A'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 font-semibold">
                              ${product.price.toFixed(2)} MXN
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              product.active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {product.active ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(product.created_at).toLocaleDateString('es-MX')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              {isDeleted ? (
                                <button
                                  onClick={() => handleRestoreProduct(product)}
                                  className="text-green-600 hover:text-green-900 transition"
                                  title="Restaurar producto"
                                >
                                  <RotateCcw size={18} />
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleEditProduct(product)}
                                    className="hover:text-blue-900 transition"
                                    style={{ color: business?.primary_color || '#3B82F6' }}
                                    title="Editar"
                                  >
                                    <Edit size={18} />
                                  </button>
                                  <button
                                    onClick={() => handleToggleActive(product)}
                                    className={`transition ${
                                      product.active 
                                        ? 'text-orange-600 hover:text-orange-900' 
                                        : 'text-green-600 hover:text-green-900'
                                    }`}
                                    title={product.active ? 'Desactivar' : 'Activar'}
                                  >
                                    <Power size={18} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(product)}
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
      {showProductModal && (
        <ProductModal
          product={editingProduct}
          onClose={() => {
            setShowProductModal(false);
            setEditingProduct(null);
          }}
          onSuccess={handleProductSaved}
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
          feature="Límite de productos"
          message={getProductLimitMessage()}
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