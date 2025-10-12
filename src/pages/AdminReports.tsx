import { useState, useEffect } from 'react';
import type { Transaction } from '../types';
import { useAuthStore } from '../store/authStore';
import { transactionsService } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, LogOut, Calendar, TrendingUp, Users as UsersIcon, Package } from 'lucide-react';

export default function AdminReports() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, [dateRange]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const response = await transactionsService.getAll();
      setTransactions(response.data.data);
    } catch (error) {
      console.error('Error al cargar transacciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactionsByDate = (transactions: Transaction[]) => {
    const now = new Date();
    const filtered = transactions.filter((t) => {
      const transactionDate = new Date(t.created_at);
      
      if (dateRange === 'today') {
        return transactionDate.toDateString() === now.toDateString();
      } else if (dateRange === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return transactionDate >= weekAgo;
      } else {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return transactionDate >= monthAgo;
      }
    });
    
    return filtered;
  };

  const filteredTransactions = filterTransactionsByDate(transactions);

  // Calcular estadísticas
  const totalSales = filteredTransactions.reduce((sum, t) => sum + Number(t.total), 0);
  const totalTransactions = filteredTransactions.length;
  const averageTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;

  // Ventas por producto
  const salesByProduct = filteredTransactions.reduce((acc: any, t) => {
    const productName = t.products?.name || 'Desconocido';
    if (!acc[productName]) {
      acc[productName] = { name: productName, total: 0, count: 0 };
    }
    acc[productName].total += Number(t.total);
    acc[productName].count += t.quantity;
    return acc;
  }, {});

  const productData = Object.values(salesByProduct);

  // Ventas por método de pago
  const salesByPaymentMethod = filteredTransactions.reduce((acc: any, t) => {
    const method = t.payment_method;
    if (!acc[method]) {
      acc[method] = { name: method, value: 0 };
    }
    acc[method].value += Number(t.total);
    return acc;
  }, {});

  const paymentMethodData = Object.values(salesByPaymentMethod) as Array<{ name: string; value: number }>;

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const exportToCSV = () => {
    const headers = ['Fecha', 'Producto', 'Cantidad', 'Precio Unit.', 'Total', 'Método Pago', 'Estado'];
    const rows = filteredTransactions.map(t => [
      new Date(t.created_at).toLocaleString('es-MX'),
      t.products?.name || 'N/A',
      t.quantity,
      t.unit_price.toFixed(2),
      t.total.toFixed(2),
      t.payment_method,
      t.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reporte_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Panel de Reportes</h1>
            <p className="text-sm text-gray-600">{user?.name} - Administrador</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
          >
            <LogOut size={20} />
            Salir
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="text-blue-600" size={24} />
              <h2 className="text-lg font-bold text-gray-800">Período</h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDateRange('today')}
                className={`px-4 py-2 rounded-lg transition ${
                  dateRange === 'today'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Hoy
              </button>
              <button
                onClick={() => setDateRange('week')}
                className={`px-4 py-2 rounded-lg transition ${
                  dateRange === 'week'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Última Semana
              </button>
              <button
                onClick={() => setDateRange('month')}
                className={`px-4 py-2 rounded-lg transition ${
                  dateRange === 'month'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Último Mes
              </button>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
              >
                <Download size={20} />
                Exportar CSV
              </button>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ventas Totales</p>
                <p className="text-3xl font-bold text-gray-800">
                  ${totalSales.toFixed(2)}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="text-green-600" size={32} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Transacciones</p>
                <p className="text-3xl font-bold text-gray-800">{totalTransactions}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <UsersIcon className="text-blue-600" size={32} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ticket Promedio</p>
                <p className="text-3xl font-bold text-gray-800">
                  ${averageTicket.toFixed(2)}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Package className="text-purple-600" size={32} />
              </div>
            </div>
          </div>
        </div>

        {/* Gráficas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ventas por Producto */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Ventas por Producto</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#3B82F6" name="Total ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Ventas por Método de Pago */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Métodos de Pago</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentMethodData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                    label={(entry: any) => `${entry.name}: $${entry.value.toFixed(2)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentMethodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabla Detallada */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Detalle de Transacciones</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cant.</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Método</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTransactions.map((t) => (
                  <tr key={t.id}>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(t.created_at).toLocaleString('es-MX')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {t.products?.name || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{t.quantity}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      ${t.unit_price.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">
                      ${t.total.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs capitalize">
                        {t.payment_method}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}