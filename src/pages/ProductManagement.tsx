import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { productsService } from '../services/api';
import { Package, Plus, Edit, Power, LogOut, Key, RefreshCw, BarChart3 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import ProductModal from '../components/ProductModal';
import ChangePasswordModal from '../components/ChangePasswordModal';
import ConfirmModal from '../components/ConfirmModal';
import Toast from '../components/Toast';

interface Product {
  id: string;
  name: string;
  price: number;
  type: 'bano' | 'ducha' | 'locker';
  active: boolean;
  created_at: string;
}

export default function ProductManagement() {
  const currentUser = useAuthStore((state) => state.user);
  const business = useAuthStore((state) => state.business);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Estados para confirmaciones y toasts
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await productsService.getAll();
      setProducts(response.data.data);
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

  const handleCreateProduct = () => {
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
      message: `¿Estás seguro de ${product.active ? 'desactivar' : 'activar'} ${product.name}?`,
      onConfirm: async () => {
        try {
          await productsService.toggleActive(product.id);
          setToast({
            message: `Producto ${product.active ? 'desactivado' : 'activado'} exitosamente`,
            type: 'success'
          });
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

  const handleProductSaved = () => {
    setShowProductModal(false);
    setEditingProduct(null);
    setToast({
      message: editingProduct ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente',
      type: 'success'
    });
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

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'bano': return 'bg-blue-100 text-blue-800';
      case 'ducha': return 'bg-cyan-100 text-cyan-800';
      case 'locker': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'bano': return '🚽 Baño';
      case 'ducha': return '🚿 Ducha';
      case 'locker': return '🔐 Locker';
      default: return type;
    }
  };

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
              <Package style={{ color: business?.primary_color || '#3B82F6' }} size={24} />
              <h2 className="text-lg font-bold text-gray-800">
                Productos/Servicios ({products.length})
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={loadProducts}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition disabled:opacity-50"
              >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                Actualizar
              </button>
              <button
                onClick={handleCreateProduct}
                className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition hover:opacity-90"
                style={{ backgroundColor: business?.primary_color || '#3B82F6' }}
              >
                <Plus size={20} />
                Nuevo Producto
              </button>
            </div>
          </div>
        </div>

        {/* Tabla de Productos */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto/Servicio
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
                {products.map((product) => (
                  <tr key={product.id} className={!product.active ? 'bg-gray-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeBadgeColor(product.type)}`}>
                        {getTypeLabel(product.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-green-600">${product.price.toFixed(2)}</div>
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
                              ? 'text-red-600 hover:text-red-900' 
                              : 'text-green-600 hover:text-green-900'
                          }`}
                          title={product.active ? 'Desactivar' : 'Activar'}
                        >
                          <Power size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {products.length === 0 && !loading && (
            <div className="text-center py-12">
              <Package className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500">No hay productos registrados</p>
            </div>
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