import { useState, useEffect } from 'react';
import type { Transaction } from '../types';
import { transactionsService, shiftsService } from '../services/api';
import { X, DollarSign, CreditCard, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

interface CloseShiftModalProps {
  shiftId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CloseShiftModal({ shiftId, onClose, onSuccess }: CloseShiftModalProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [shiftData, setShiftData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [finalCash, setFinalCash] = useState('');
  const [showArqueo, setShowArqueo] = useState(false);

  useEffect(() => {
    loadShiftData();
  }, []);

  const loadShiftData = async () => {
    try {
      const [transactionsResponse, shiftsResponse] = await Promise.all([
        transactionsService.getByShift(shiftId),
        shiftsService.getAll()
      ]);
      
      setTransactions(transactionsResponse.data.data.transactions);
      
      const currentShift = shiftsResponse.data.data.find((s: any) => s.id === shiftId);
      setShiftData(currentShift);
    } catch (error) {
      console.error('Error al cargar datos del turno:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const total = transactions.reduce((sum, t) => sum + Number(t.total), 0);
    const count = transactions.length;
    
    const byPaymentMethod = transactions.reduce((acc: any, t) => {
      const method = t.payment_method;
      if (!acc[method]) {
        acc[method] = { count: 0, total: 0 };
      }
      acc[method].count++;
      acc[method].total += Number(t.total);
      return acc;
    }, {});

    // Calcular ventas en efectivo
    const cashSales = byPaymentMethod['cash']?.total || 0;
    
    // Calcular efectivo esperado
    const initialCash = parseFloat(shiftData?.initial_cash || 0);
    const expectedCash = initialCash + cashSales;

    return { total, count, byPaymentMethod, cashSales, initialCash, expectedCash };
  };

  const calculateArqueo = () => {
    const stats = calculateStats();
    const finalCashAmount = parseFloat(finalCash) || 0;
    const difference = finalCashAmount - stats.expectedCash;
    
    return {
      initialCash: stats.initialCash,
      cashSales: stats.cashSales,
      expectedCash: stats.expectedCash,
      finalCash: finalCashAmount,
      difference: difference,
      status: difference === 0 ? 'exacto' : difference > 0 ? 'sobrante' : 'faltante'
    };
  };

  const handleCloseShift = async () => {
    if (!finalCash || finalCash === '') {
      alert('Por favor ingresa el efectivo final en caja');
      return;
    }

    const finalCashAmount = parseFloat(finalCash);
    if (isNaN(finalCashAmount) || finalCashAmount < 0) {
      alert('Por favor ingresa un monto válido');
      return;
    }

    setClosing(true);
    try {
      await shiftsService.close(shiftId, finalCashAmount);
      onSuccess();
    } catch (error) {
      alert('Error al cerrar turno');
    } finally {
      setClosing(false);
    }
  };

  const stats = calculateStats();
  const arqueo = showArqueo ? calculateArqueo() : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6 flex justify-between items-center rounded-t-lg">
          <h2 className="text-2xl font-bold">Cerrar Turno</h2>
          <button
            onClick={onClose}
            className="hover:bg-white/20 p-2 rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">Cargando resumen...</p>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Resumen General */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Resumen General</h3>
                <DollarSign className="text-blue-600" size={32} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total de Ventas</p>
                  <p className="text-3xl font-bold text-gray-800">
                    ${stats.total.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Transacciones</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.count}</p>
                </div>
              </div>
            </div>

            {/* Desglose por Método de Pago */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <CreditCard size={20} />
                Desglose por Método de Pago
              </h3>
              <div className="space-y-3">
                {Object.entries(stats.byPaymentMethod).map(([method, data]: [string, any]) => (
                  <div key={method} className="flex justify-between items-center border rounded-lg p-4 bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-800 capitalize">
                        {method === 'card' ? '💳 Tarjeta' : method === 'transfer' ? '🏦 Transferencia' : '💵 Efectivo'}
                      </p>
                      <p className="text-sm text-gray-500">{data.count} transacciones</p>
                    </div>
                    <p className="text-xl font-bold text-gray-800">
                      ${data.total.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Arqueo de Caja */}
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                💰 Arqueo de Caja
              </h3>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">💵 Efectivo inicial:</span>
                  <span className="font-semibold text-gray-800">${stats.initialCash.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">💸 Ventas en efectivo:</span>
                  <span className="font-semibold text-green-600">+${stats.cashSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t-2 border-yellow-300">
                  <span className="text-sm font-semibold text-gray-700">📊 Efectivo esperado:</span>
                  <span className="font-bold text-gray-800 text-lg">${stats.expectedCash.toFixed(2)}</span>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  💵 ¿Cuánto efectivo hay físicamente en caja?
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={finalCash}
                    onChange={(e) => {
                      setFinalCash(e.target.value);
                      setShowArqueo(e.target.value !== '');
                    }}
                    className="w-full pl-10 pr-4 py-3 text-2xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none text-center"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Cuenta todo el efectivo físico que hay en la caja
                </p>
              </div>

              {/* Resultado del Arqueo */}
              {showArqueo && arqueo && (
                <div className={`rounded-lg p-4 ${
                  arqueo.status === 'exacto' ? 'bg-green-100 border-2 border-green-300' :
                  arqueo.status === 'sobrante' ? 'bg-blue-100 border-2 border-blue-300' :
                  'bg-red-100 border-2 border-red-300'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    {arqueo.status === 'exacto' ? (
                      <CheckCircle className="text-green-600" size={28} />
                    ) : arqueo.status === 'sobrante' ? (
                      <TrendingUp className="text-blue-600" size={28} />
                    ) : (
                      <AlertTriangle className="text-red-600" size={28} />
                    )}
                    <div>
                      <p className="font-bold text-lg">
                        {arqueo.status === 'exacto' ? '✅ Cuadrado perfecto' :
                         arqueo.status === 'sobrante' ? '💰 Hay sobrante' :
                         '⚠️ Hay faltante'}
                      </p>
                      <p className="text-sm">
                        Diferencia: 
                        <span className={`font-bold ml-1 ${
                          arqueo.difference === 0 ? 'text-green-700' :
                          arqueo.difference > 0 ? 'text-blue-700' :
                          'text-red-700'
                        }`}>
                          {arqueo.difference >= 0 ? '+' : ''}${arqueo.difference.toFixed(2)}
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  {arqueo.status !== 'exacto' && (
                    <p className="text-xs text-gray-700">
                      {arqueo.status === 'sobrante' 
                        ? '💡 Hay más efectivo del esperado. Verifica que todas las ventas estén registradas.'
                        : '⚠️ Falta efectivo. Revisa las transacciones y verifica el conteo.'}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Lista de Transacciones */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Detalle de Transacciones
              </h3>
              <div className="max-h-64 overflow-y-auto border rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Producto</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Cant.</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Total</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Método</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {transactions.map((t) => (
                      <tr key={t.id}>
                        <td className="px-4 py-2 text-sm text-gray-800">
                          {t.products?.name || 'N/A'}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">{t.quantity}</td>
                        <td className="px-4 py-2 text-sm font-semibold text-gray-800">
                          ${t.total.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <span className="px-2 py-1 bg-gray-100 rounded text-xs capitalize">
                            {t.payment_method}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-4 pt-4 border-t">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleCloseShift}
                disabled={closing || !finalCash}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
              >
                {closing ? 'Cerrando...' : 'Cerrar Turno'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}