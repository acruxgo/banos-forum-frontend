import { useState, useEffect } from 'react';
import type { Product, Shift } from '../types';
import { useAuthStore } from '../store/authStore';
import { productsService, shiftsService, transactionsService } from '../services/api';
import { ShoppingCart, LogOut, DollarSign, Key, BarChart3 } from 'lucide-react';
import CloseShiftModal from '../components/CloseShiftModal';
import ChangePasswordModal from '../components/ChangePasswordModal';
import StartShiftModal from '../components/StartShiftModal';
import ConfirmModal from '../components/ConfirmModal';
import Toast from '../components/Toast';

export default function CajaPOS() {
  const user = useAuthStore((state) => state.user);
  const business = useAuthStore((state) => state.business);
  const logout = useAuthStore((state) => state.logout);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer' | 'cash'>('card');
  const [loading, setLoading] = useState(false);
  const [showStartShiftModal, setShowStartShiftModal] = useState(false);
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  // Estados para confirmaciones y toasts
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    loadProducts();
    checkActiveShift();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await productsService.getAll();
      setProducts(response.data.data.filter((p: Product) => p.active));
    } catch (err) {
      console.error('Error al cargar productos:', err);
      setToast({
        message: 'Error al cargar productos',
        type: 'error'
      });
    }
  };

  const checkActiveShift = async () => {
    try {
      const response = await shiftsService.getActive();
      const userShift = response.data.data.find((s: Shift) => s.user_id === user?.id);
      setCurrentShift(userShift || null);
    } catch (err) {
      console.error('Error al verificar turno:', err);
    }
  };

  const handleStartShift = (initialCash: number) => {
    if (!user) return;
    setLoading(true);
    
    shiftsService.start(user.id, initialCash)
      .then((response) => {
        setCurrentShift(response.data.data);
        setShowStartShiftModal(false);
        setToast({
          message: `Turno iniciado con $${initialCash.toFixed(2)} en caja`,
          type: 'success'
        });
      })
      .catch((err) => {
        console.error('Error al iniciar turno:', err);
        setToast({
          message: 'Error al iniciar turno',
          type: 'error'
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const addToCart = (product: Product) => {
    const existing = cart.find((item) => item.product.id === product.id);
    if (existing) {
      setCart(cart.map((item) =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
    setToast({
      message: `${product.name} agregado al carrito`,
      type: 'success'
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(cart.map((item) =>
      item.product.id === productId ? { ...item, quantity } : item
    ));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  };

  const processSale = async () => {
    if (!currentShift || cart.length === 0) return;

    setConfirmAction({
      title: 'Procesar Venta',
      message: `¿Confirmar venta por $${calculateTotal().toFixed(2)} con ${paymentMethod === 'card' ? 'tarjeta' : paymentMethod === 'transfer' ? 'transferencia' : 'efectivo'}?`,
      onConfirm: async () => {
        setLoading(true);
        try {
          for (const item of cart) {
            await transactionsService.create({
              shift_id: currentShift.id,
              product_id: item.product.id,
              quantity: item.quantity,
              unit_price: item.product.price,
              payment_method: paymentMethod,
              created_by: user?.id,
            });
          }
          
          setToast({
            message: '✅ Venta registrada exitosamente',
            type: 'success'
          });
          setCart([]);
        } catch (err) {
          console.error('Error al procesar venta:', err);
          setToast({
            message: 'Error al procesar la venta',
            type: 'error'
          });
        } finally {
          setLoading(false);
          setShowConfirm(false);
        }
      }
    });
    setShowConfirm(true);
  };

  const handleCloseShift = () => {
    setConfirmAction({
      title: 'Cerrar Turno',
      message: '¿Estás seguro de cerrar el turno? No podrás registrar más ventas.',
      onConfirm: () => {
        setShowCloseShiftModal(true);
        setShowConfirm(false);
      }
    });
    setShowConfirm(true);
  };

  const handleShiftClosed = () => {
    setShowCloseShiftModal(false);
    setCurrentShift(null);
    setCart([]);
    setToast({
      message: 'Turno cerrado exitosamente',
      type: 'success'
    });
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

  if (!currentShift) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          {business?.logo_url && (
            <img 
              src={business.logo_url} 
              alt={business.name}
              className="h-16 w-auto object-contain mx-auto mb-4"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Sin turno activo</h2>
          <p className="text-gray-600 mb-6">
            Debes iniciar un turno para comenzar a registrar ventas.
          </p>
          <button
            onClick={() => setShowStartShiftModal(true)}
            className="w-full text-white font-semibold py-3 rounded-lg transition hover:opacity-90"
            style={{ backgroundColor: business?.primary_color || '#3B82F6' }}
          >
            Iniciar Turno
          </button>
          <button
            onClick={logout}
            className="w-full mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition"
          >
            Cerrar Sesión
          </button>
        </div>

        {/* Modal de Inicio de Turno */}
        {showStartShiftModal && (
          <StartShiftModal
            onClose={() => setShowStartShiftModal(false)}
            onConfirm={handleStartShift}
            loading={loading}
          />
        )}

        {/* Toast */}
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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header con branding */}
      <header className="bg-white shadow-sm border-b" style={{ borderBottomColor: business?.primary_color || '#3B82F6', borderBottomWidth: '4px' }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
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
                {business?.name || 'Sistema POS'} - Caja
              </h1>
              <p className="text-sm text-gray-600">{user?.name} ({user?.role})</p>
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
              onClick={handleCloseShift}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition"
            >
              Cerrar Turno
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
      </header>

      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Productos */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Productos</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="border-2 rounded-lg p-4 text-center transition hover:opacity-90"
                  style={{ 
                    backgroundColor: `${business?.primary_color}10` || '#EFF6FF',
                    borderColor: business?.primary_color || '#3B82F6'
                  }}
                >
                  <p className="font-semibold text-gray-800">{product.name}</p>
                  <p className="text-2xl font-bold mt-2" style={{ color: business?.primary_color || '#3B82F6' }}>
                    ${product.price}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 capitalize">{product.type}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Carrito */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart size={24} style={{ color: business?.primary_color || '#3B82F6' }} />
              <h2 className="text-lg font-bold text-gray-800">Carrito</h2>
            </div>

            {cart.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No hay productos en el carrito
              </p>
            ) : (
              <>
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex justify-between items-center border-b pb-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{item.product.name}</p>
                        <p className="text-sm text-gray-500">${item.product.price} c/u</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold text-gray-800">Total:</span>
                    <span className="text-2xl font-bold" style={{ color: business?.primary_color || '#3B82F6' }}>
                      ${calculateTotal().toFixed(2)}
                    </span>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Método de pago
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 outline-none"
                      style={{ borderColor: business?.primary_color || '#3B82F6' }}
                    >
                      <option value="card">Tarjeta</option>
                      <option value="transfer">Transferencia</option>
                      <option value="cash">Efectivo</option>
                    </select>
                  </div>

                  <button
                    onClick={processSale}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <DollarSign size={20} />
                    {loading ? 'Procesando...' : 'Procesar Venta'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Cierre de Turno */}
      {showCloseShiftModal && (
        <CloseShiftModal
          shiftId={currentShift.id}
          onClose={() => setShowCloseShiftModal(false)}
          onSuccess={handleShiftClosed}
        />
      )}

      {/* Modal de Cambio de Contraseña */}
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
          type="info"
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