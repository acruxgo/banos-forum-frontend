import { useState, useEffect } from 'react';
import type { Shift, Transaction } from '../types';
import { useAuthStore } from '../store/authStore';
import { shiftsService, transactionsService } from '../services/api';
import { Users, DollarSign, TrendingUp, Clock, LogOut, RefreshCw } from 'lucide-react';

export default function SupervisorDashboard() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  
  const [activeShifts, setActiveShifts] = useState<Shift[]>([]);
  const [todayStats, setTodayStats] = useState<any>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
    // Actualizar cada 30 segundos
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadActiveShifts(),
        loadTodayStats(),
        loadRecentTransactions()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveShifts = async () => {
    try {
      const response = await shiftsService.getActive();
      setActiveShifts(response.data.data);
    } catch (error) {
      console.error('Error al cargar turnos activos:', error);
    }
  };

  const loadTodayStats = async () => {
    try {
      const response = await transactionsService.getStatsToday();
      setTodayStats(response.data.data);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const loadRecentTransactions = async () => {
    try {
      const response = await transactionsService.getAll();
      setRecentTransactions(response.data.data.slice(0, 10));
    } catch (error) {
      console.error('Error al cargar transacciones:', error);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Dashboard - Supervisor</h1>
            <p className="text-sm text-gray-600">{user?.name}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition disabled:opacity-50"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              Actualizar
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

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ventas Hoy</p>
                <p className="text-2xl font-bold text-gray-800">
                  ${todayStats?.total_sales?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Transacciones</p>
                <p className="text-2xl font-bold text-gray-800">
                  {todayStats?.transaction_count || 0}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <TrendingUp className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Turnos Activos</p>
                <p className="text-2xl font-bold text-gray-800">
                  {activeShifts.length}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Users className="text-purple-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Promedio/Venta</p>
                <p className="text-2xl font-bold text-gray-800">
                  ${todayStats?.transaction_count 
                    ? (todayStats.total_sales / todayStats.transaction_count).toFixed(2)
                    : '0.00'}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <DollarSign className="text-orange-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Turnos Activos */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Clock size={24} className="text-blue-600" />
            Turnos Activos
          </h2>
          {activeShifts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay turnos activos</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Empleado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Rol
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Inicio
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Duración
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {activeShifts.map((shift) => {
                    const duration = Math.floor(
                      (new Date().getTime() - new Date(shift.start_time).getTime()) / (1000 * 60)
                    );
                    return (
                      <tr key={shift.id}>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {shift.users?.name || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {shift.users?.role || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatTime(shift.start_time)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {duration} min
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Ventas por Método de Pago */}
        {todayStats?.by_payment_method && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Ventas por Método de Pago
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(todayStats.by_payment_method).map(([method, data]: [string, any]) => (
                <div key={method} className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600 capitalize">{method}</p>
                  <p className="text-xl font-bold text-gray-800">
                    ${data.total?.toFixed(2) || '0.00'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {data.count} transacciones
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transacciones Recientes */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            Transacciones Recientes
          </h2>
          {recentTransactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay transacciones</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Producto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Cantidad
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Total
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Método
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(transaction.created_at)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {transaction.products?.name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {transaction.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-800">
                        ${transaction.total.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs capitalize">
                          {transaction.payment_method}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          transaction.status === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}