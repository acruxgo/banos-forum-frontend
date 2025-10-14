import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { productsService } from '../services/api';
import { Package, Plus, Edit, Power, LogOut, Key, RefreshCw } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import ProductModal from '../components/ProductModal';
import ChangePasswordModal from '../components/ChangePasswordModal';

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
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

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
      alert('Error al cargar productos');
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
    if (!confirm(`¿Estás seguro de ${product.active ? 'desactivar' : 'activar'} ${product.name}?`)) {
      return;
    }

    try {
      await productsService.toggleActive(product.id);
      alert(`Producto ${product.active ? 'desactivado' : 'activado'} exitosamente`);
      loadProducts();
    } catch (error) {
      alert('Error al cambiar estado del producto');
    }
  };

  const handleProductSaved = () => {
    setShowProductModal(false);
    setEditingProduct(null);
    loadProducts();
  };

  const handlePasswordChanged = () => {
    alert('Contraseña actualizada. Por favor, inicia sesión nuevamente.');
    logout();
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
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Gestión de Productos</h1>
              <p className="text-sm text-gray-600">{currentUser?.name} - Administrador</p>
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

          {/* Menú de navegación */}
          <div className="flex gap-2 mt-4 border-t pt-4">
            <button
              onClick={() => navigate('/reportes')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                location.pathname === '/reportes'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📊 Reportes
            </button>
            <button
              onClick={() => navigate('/usuarios')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                location.pathname === '/usuarios'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              👥 Usuarios
            </button>
            <button
              onClick={() => navigate('/productos')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                location.pathname === '/productos'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
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
              <Package className="text-blue-600" size={24} />
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
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
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
                          className="text-blue-600 hover:text-blue-900 transition"
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
    </div>
  );
}