import { useState, useEffect } from 'react';
import type { Transaction } from '../types';
import { transactionsService, shiftsService } from '../services/api';
import { X, DollarSign, CreditCard } from 'lucide-react';

interface CloseShiftModalProps {
  shiftId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CloseShiftModal({ shiftId, onClose, onSuccess }: CloseShiftModalProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    loadShiftTransactions();
  }, []);

  const loadShiftTransactions = async () => {
    try {
      const response = await transactionsService.getByShift(shiftId);
      setTransactions(response.data.data.transactions);
    } catch (error) {
      console.error('Error al cargar transacciones:', error);
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

    return { total, count, byPaymentMethod };
  };

  const handleCloseShift = async () => {
    setClosing(true);
    try {
      await shiftsService.close(shiftId);
      alert('Turno cerrado exitosamente');
      onSuccess();
    } catch (error) {
      alert('Error al cerrar turno');
    } finally {
      setClosing(false);
    }
  };

  const stats = calculateStats();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Cerrar Turno</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
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
                  <div key={method} className="flex justify-between items-center border rounded-lg p-4">
                    <div>
                      <p className="font-medium text-gray-800 capitalize">{method}</p>
                      <p className="text-sm text-gray-500">{data.count} transacciones</p>
                    </div>
                    <p className="text-xl font-bold text-gray-800">
                      ${data.total.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
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
                disabled={closing}
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