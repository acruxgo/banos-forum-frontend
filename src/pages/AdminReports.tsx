import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Transaction } from '../types';
import { useAuthStore } from '../store/authStore';
import { transactionsService } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, LogOut, Calendar, TrendingUp, Users as UsersIcon, Package, Key, BarChart3 } from 'lucide-react';
import ChangePasswordModal from '../components/ChangePasswordModal';

export default function AdminReports() {
  const user = useAuthStore((state) => state.user);
  const business = useAuthStore((state) => state.business);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today');
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, [dateRange]);

  const loadTransactions = async () => {
    try {
      const response = await transactionsService.getAll();
      setTransactions(response.data.data);
    } catch (error) {
      console.error('Error al cargar transacciones:', error);
    }
  };

  const handlePasswordChanged = () => {
    alert('Contraseña actualizada. Por favor, inicia sesión nuevamente.');
    logout();
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
                  {business?.name || 'Panel de Administración'}
                </h1>
                <p className="text-sm text-gray-600">{user?.name} - Administrador</p>
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
        {/* Filtros con color de la empresa */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar style={{ color: business?.primary_color || '#3B82F6' }} size={24} />
              <h2 className="text-lg font-bold text-gray-800">Período</h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDateRange('today')}
                className={`px-4 py-2 rounded-lg transition ${
                  dateRange === 'today'
                    ? 'text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                style={
                  dateRange === 'today'
                    ? { backgroundColor: business?.primary_color || '#3B82F6' }
                    : {}
                }
              >
                Hoy
              </button>
              <button
                onClick={() => setDateRange('week')}
                className={`px-4 py-2 rounded-lg transition ${
                  dateRange === 'week'
                    ? 'text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                style={
                  dateRange === 'week'
                    ? { backgroundColor: business?.primary_color || '#3B82F6' }
                    : {}
                }
              >
                Última Semana
              </button>
              <button
                onClick={() => setDateRange('month')}
                className={`px-4 py-2 rounded-lg transition ${
                  dateRange === 'month'
                    ? 'text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                style={
                  dateRange === 'month'
                    ? { backgroundColor: business?.primary_color || '#3B82F6' }
                    : {}
                }
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
              <div className="p-3 rounded-full" style={{ backgroundColor: `${business?.primary_color}20` || '#10B98120' }}>
                <TrendingUp style={{ color: business?.primary_color || '#10B981' }} size={32} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Transacciones</p>
                <p className="text-3xl font-bold text-gray-800">{totalTransactions}</p>
              </div>
              <div className="p-3 rounded-full" style={{ backgroundColor: `${business?.primary_color}20` || '#3B82F620' }}>
                <UsersIcon style={{ color: business?.primary_color || '#3B82F6' }} size={32} />
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
              <div className="p-3 rounded-full" style={{ backgroundColor: `${business?.primary_color}20` || '#8B5CF620' }}>
                <Package style={{ color: business?.primary_color || '#8B5CF6' }} size={32} />
              </div>
            </div>
          </div>
        </div>

        {/* Gráficas con color de la empresa */}
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
                <Bar dataKey="total" fill={business?.primary_color || '#3B82F6'} name="Total ($)" />
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
                  label={(props: any) => `${props.name}: $${props.value.toFixed(2)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentMethodData.map((_entry, index) => (
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

      {/* Modal de Cambio de Contraseña */}
      {showChangePasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowChangePasswordModal(false)}
          onSuccess={handlePasswordChanged}
        />
      )}
    </div>
  );
}