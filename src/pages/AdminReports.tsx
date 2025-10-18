import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Transaction } from '../types';
import { useAuthStore } from '../store/authStore';
import { usePlanLimits } from '../hooks/usePlanLimits';
import { transactionsService, usersService } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { LogOut, TrendingUp, Users as UsersIcon, Package, Key, BarChart3, TrendingDown, Award, Lock, Crown, FileDown } from 'lucide-react';
import ChangePasswordModal from '../components/ChangePasswordModal';
import UpgradeModal from '../components/UpgradeModal';
import { SearchBar } from '../components/common/SearchBar';
import { FilterSelect } from '../components/common/FilterSelect';
import { DateRangeFilter } from '../components/common/DateRangeFilter';
import { FilterActions } from '../components/common/FilterActions';
import { Pagination } from '../components/common/Pagination';
import { useTableFilters } from '../hooks/useTableFilters';
import { generatePDF, formatDate } from '../utils/pdfExport';

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface EmployeeStats {
  name: string;
  sales: number;
  transactions: number;
  averageTicket: number;
}

export default function AdminReports() {
  const user = useAuthStore((state) => state.user);
  const business = useAuthStore((state) => state.business);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();

  // Plan limits
  const { 
    hasFeature,
    getRecommendedUpgrade,
    currentPlan
  } = usePlanLimits();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]); // Para estadísticas
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 0
  });
  const [loading, setLoading] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState('');
  
  // Estados para comparativas
  const [previousMonthSales, setPreviousMonthSales] = useState(0);
  const [salesGrowth, setSalesGrowth] = useState(0);

  // Hook de filtros y paginación
  const {
    filters,
    page,
    limit,
    updateFilter,
    debouncedFilters,
    clearFilters,
    changePage,
    changeLimit,
    getQueryParams,
    hasActiveFilters
  } = useTableFilters({
    initialLimit: 50,
    initialFilters: {
      search: '',
      payment_method: 'all',
      status: 'all',
      date_from: '',
      date_to: '',
      employee: 'all' // Nuevo filtro por empleado
    }
  });

  // Handler para features bloqueadas
  const handleBlockedFeature = (featureName: string) => {
    setUpgradeFeature(featureName);
    setShowUpgradeModal(true);
  };

  // Cargar usuarios (empleados)
  const loadUsers = async () => {
    try {
      const response = await usersService.getAll({ role: 'cajero', active: true });
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
    }
  };

  // Cargar todas las transacciones para estadísticas (sin paginación)
  const loadAllTransactions = async () => {
    try {
      const response = await transactionsService.getAll({ limit: 10000, status: 'completed' });
      if (response.data.success) {
        setAllTransactions(response.data.data);
        calculateComparatives(response.data.data);
      }
    } catch (err) {
      console.error('Error al cargar transacciones:', err);
    }
  };

  // Calcular comparativas mes actual vs anterior
  const calculateComparatives = (allTrans: Transaction[]) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Ventas del mes actual
    const currentMonthSales = allTrans
      .filter(t => {
        const date = new Date(t.created_at);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + Number(t.total), 0);
    
    // Ventas del mes anterior
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    const prevMonthSales = allTrans
      .filter(t => {
        const date = new Date(t.created_at);
        return date.getMonth() === previousMonth && date.getFullYear() === previousYear;
      })
      .reduce((sum, t) => sum + Number(t.total), 0);
    
    setPreviousMonthSales(prevMonthSales);
    
    // Calcular % de crecimiento
    if (prevMonthSales > 0) {
      const growth = ((currentMonthSales - prevMonthSales) / prevMonthSales) * 100;
      setSalesGrowth(growth);
    } else {
      setSalesGrowth(currentMonthSales > 0 ? 100 : 0);
    }
  };

  // Cargar transacciones con filtros
  const loadTransactions = async () => {
    setLoading(true);
    try {
      const params = getQueryParams();

      console.log('🔍 Filtros enviados:', params); 
      
      // Si hay filtro de empleado, agregarlo
      if (filters.employee !== 'all') {
        params.created_by = filters.employee;
      }
      
      const response = await transactionsService.getAll(params);
      
      if (response.data.success) {
        setTransactions(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      console.error('Error al cargar transacciones:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    loadUsers();
    loadAllTransactions();
  }, []);

  // Recargar cuando cambien los filtros o la página
useEffect(() => {
    loadTransactions();
  }, [page, limit, debouncedFilters.search, debouncedFilters.payment_method, debouncedFilters.status, debouncedFilters.date_from, debouncedFilters.date_to, debouncedFilters.employee]);

  const handlePasswordChanged = () => {
    alert('Contraseña actualizada. Por favor, inicia sesión nuevamente.');
    logout();
  };

  // Exportar reporte a PDF
  const handleExportPDF = () => {
    if (!hasFeature('advancedReports')) {
      handleBlockedFeature('Exportación de reportes a PDF');
      return;
    }

    // Calcular totales
    const totalSales = transactions.reduce((sum, t) => sum + Number(t.total), 0);
    const totalTransactions = transactions.length;
    const averageTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;

    // Preparar datos para la tabla
    const headers = ['Fecha', 'Empleado', 'Producto', 'Cantidad', 'Precio Unit.', 'Total', 'Método Pago', 'Estado'];
    
    const rows = transactions.map(t => [
      new Date(t.created_at).toLocaleDateString('es-MX', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      users.find(u => u.id === t.created_by)?.name || 'N/A',
      t.products?.name || 'N/A',
      t.quantity.toString(),
      `$${Number(t.unit_price).toFixed(2)}`,
      `$${Number(t.total).toFixed(2)}`,
      t.payment_method === 'card' ? 'Tarjeta' : t.payment_method === 'cash' ? 'Efectivo' : 'Transferencia',
      t.status === 'completed' ? 'Completado' : t.status === 'pending' ? 'Pendiente' : 'Fallido'
    ]);

    // Preparar resumen
    const summary = [
      { label: 'Total de Transacciones', value: totalTransactions.toString() },
      { label: 'Total de Ventas', value: `$${totalSales.toFixed(2)} MXN` },
      { label: 'Ticket Promedio', value: `$${averageTicket.toFixed(2)} MXN` }
    ];

    // Agregar filtros aplicados al subtítulo
    let subtitle = 'Reporte de Ventas';
    const appliedFilters = [];
    
    if (filters.date_from) appliedFilters.push(`Desde: ${filters.date_from}`);
    if (filters.date_to) appliedFilters.push(`Hasta: ${filters.date_to}`);
    if (filters.payment_method !== 'all') appliedFilters.push(`Método: ${filters.payment_method}`);
    if (filters.employee !== 'all') {
      const emp = users.find(u => u.id === filters.employee);
      if (emp) appliedFilters.push(`Empleado: ${emp.name}`);
    }
    
    if (appliedFilters.length > 0) {
      subtitle += ' - ' + appliedFilters.join(' | ');
    }

    // Generar PDF
    generatePDF({
      title: 'Reporte de Ventas',
      subtitle,
      business: {
        name: business?.name || 'Sistema POS',
        logo_url: business?.logo_url || undefined
      },
      date: formatDate(new Date()),
      headers,
      rows,
      summary
    });
  };

  // Calcular estadísticas por empleado
  const employeeStats: EmployeeStats[] = users.map(u => {
    const employeeTrans = allTransactions.filter(t => t.created_by === u.id && t.status === 'completed');
    const sales = employeeTrans.reduce((sum, t) => sum + Number(t.total), 0);
    const transCount = employeeTrans.length;
    
    return {
      name: u.name,
      sales,
      transactions: transCount,
      averageTicket: transCount > 0 ? sales / transCount : 0
    };
  }).sort((a, b) => b.sales - a.sales); // Ordenar por ventas descendente

  // Determinar qué transacciones usar según si hay filtros activos
  // Si hay filtro de empleado, usar transacciones filtradas para TODO
  const dataForStats = filters.employee !== 'all' ? transactions : allTransactions;

  // Calcular estadísticas de transacciones mostradas (con filtros)
  const totalSales = dataForStats.reduce((sum, t) => sum + Number(t.total), 0);
  const totalTransactions = filters.employee !== 'all' ? transactions.length : pagination.total;
  const averageTicket = dataForStats.length > 0 ? totalSales / dataForStats.length : 0;

  // Ventas por día (últimos 30 días) - usar transacciones según filtro
const salesByDay = () => {
    const last30Days = dataForStats.filter(t => {
      const date = new Date(t.created_at);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      return diff <= 30 * 24 * 60 * 60 * 1000 && t.status === 'completed';
    });

    const grouped: Record<string, number> = {};
    last30Days.forEach(t => {
      const date = new Date(t.created_at).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
      grouped[date] = (grouped[date] || 0) + Number(t.total);
    });

    return Object.entries(grouped)
      .map(([date, total]) => ({ date, total }))
      .slice(-15)
      .reverse(); // ← Invertir para mostrar el día más reciente a la derecha
  };

  // Ventas por producto - usar transacciones según filtro
  const salesByProduct = dataForStats.reduce((acc: any, t) => {
    const productName = t.products?.name || 'Desconocido';
    if (!acc[productName]) {
      acc[productName] = { name: productName, total: 0, count: 0 };
    }
    acc[productName].total += Number(t.total);
    acc[productName].count += t.quantity;
    return acc;
  }, {});

  const productData = Object.values(salesByProduct);

  // Ventas por método de pago - usar transacciones según filtro
  const salesByPaymentMethod = dataForStats.reduce((acc: any, t) => {
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
    const headers = ['Fecha', 'Producto', 'Cantidad', 'Precio Unit.', 'Total', 'Método Pago', 'Estado', 'Empleado'];
    const rows = transactions.map(t => [
      new Date(t.created_at).toLocaleString('es-MX'),
      t.products?.name || 'N/A',
      t.quantity,
      t.unit_price.toFixed(2),
      t.total.toFixed(2),
      t.payment_method,
      t.status,
      users.find(u => u.id === t.created_by)?.name || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reporte_transacciones_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Opciones para los filtros
  const paymentMethodOptions = [
    { value: 'all', label: 'Todos los métodos' },
    { value: 'card', label: '💳 Tarjeta' },
    { value: 'transfer', label: '🏦 Transferencia' },
    { value: 'cash', label: '💵 Efectivo' }
  ];

  const statusOptions = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'completed', label: '✅ Completado' },
    { value: 'pending', label: '⏳ Pendiente' },
    { value: 'failed', label: '❌ Fallido' },
    { value: 'refunded', label: '↩️ Reembolsado' }
  ];

  const employeeOptions = [
    { value: 'all', label: 'Todos los empleados' },
    ...users.map(u => ({ value: u.id, label: `👤 ${u.name}` }))
  ];

  // Verificar qué features están disponibles
  const canViewAdvancedReports = hasFeature('advancedReports');
  const canViewEmployeeRanking = hasFeature('employeeRanking');
  const canFilterByEmployee = hasFeature('employeeFilter');

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header con branding */}
      <header className="bg-white shadow-sm border-b" style={{ borderBottomColor: business?.primary_color || '#3B82F6', borderBottomWidth: '4px' }}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
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
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="space-y-4">
            {/* Primera fila: Búsqueda, empleado, método de pago y estado */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar
                </label>
                <SearchBar
                  value={filters.search}
                  onChange={(value) => updateFilter('search', value)}
                  placeholder="Buscar por producto..."
                />
              </div>

              {/* Filtro por empleado - Bloqueado si no tiene acceso */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <span>Empleado</span>
                  {!canFilterByEmployee && <Lock size={14} className="text-gray-400" />}
                </label>
                <select
                  value={canFilterByEmployee ? filters.employee : 'all'}
                  onChange={(e) => {
                    if (!canFilterByEmployee) {
                      handleBlockedFeature('Filtro por empleado');
                    } else {
                      updateFilter('employee', e.target.value);
                    }
                  }}
                  disabled={!canFilterByEmployee}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                    !canFilterByEmployee ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''
                  }`}
                >
                  {employeeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {!canFilterByEmployee && (
                  <div 
                    className="absolute inset-0 bg-transparent cursor-pointer"
                    onClick={() => handleBlockedFeature('Filtro por empleado')}
                  />
                )}
              </div>

              <FilterSelect
                label="Método de Pago"
                value={filters.payment_method}
                onChange={(value) => updateFilter('payment_method', value)}
                options={paymentMethodOptions}
              />

              <FilterSelect
                label="Estado"
                value={filters.status}
                onChange={(value) => updateFilter('status', value)}
                options={statusOptions}
              />
            </div>

            {/* Segunda fila: Rango de fechas */}
            <DateRangeFilter
              dateFrom={filters.date_from}
              dateTo={filters.date_to}
              onDateFromChange={(value) => updateFilter('date_from', value)}
              onDateToChange={(value) => updateFilter('date_to', value)}
            />

            {/* Acciones */}
<div className="flex justify-between items-center">
              <FilterActions
                onClearFilters={clearFilters}
                onExport={exportToCSV}
                hasActiveFilters={hasActiveFilters()}
              />
              
              {/* Botón Exportar PDF */}
              <button
                onClick={handleExportPDF}
                disabled={transactions.length === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                  hasFeature('advancedReports')
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                } ${transactions.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={!hasFeature('advancedReports') ? 'Requiere plan Premium o superior' : 'Exportar reporte a PDF'}
              >
                {!hasFeature('advancedReports') && <Lock size={18} />}
                <FileDown size={18} />
                Exportar PDF
              </button>
              </div>
          </div>
        </div>

        {/* KPIs con Comparativa */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ventas Totales</p>
                <p className="text-3xl font-bold text-gray-800">
                  ${totalSales.toFixed(2)}
                </p>
                {/* Comparativa - Solo en planes con advancedReports */}
                {canViewAdvancedReports && (
                  <div className="flex items-center gap-1 mt-2">
                    {salesGrowth >= 0 ? (
                      <TrendingUp size={16} className="text-green-600" />
                    ) : (
                      <TrendingDown size={16} className="text-red-600" />
                    )}
                    <span className={`text-sm font-semibold ${salesGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {salesGrowth >= 0 ? '+' : ''}{salesGrowth.toFixed(1)}%
                    </span>
                    <span className="text-xs text-gray-500">vs mes anterior</span>
                  </div>
                )}
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

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Mes Anterior</p>
                <p className="text-3xl font-bold text-gray-800">
                  ${previousMonthSales.toFixed(2)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-gray-100">
                <BarChart3 className="text-gray-600" size={32} />
              </div>
            </div>
          </div>
        </div>

        {/* Ranking de Empleados - Solo en plan Enterprise */}
        {canViewEmployeeRanking ? (
          employeeStats.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Award style={{ color: business?.primary_color || '#F59E0B' }} size={24} />
                Rendimiento por Empleado
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {employeeStats.slice(0, 5).map((emp, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border-2 ${
                      index === 0 ? 'border-yellow-400 bg-yellow-50' :
                      index === 1 ? 'border-gray-400 bg-gray-50' :
                      index === 2 ? 'border-orange-400 bg-orange-50' :
                      'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {index === 0 && <span className="text-2xl">🥇</span>}
                      {index === 1 && <span className="text-2xl">🥈</span>}
                      {index === 2 && <span className="text-2xl">🥉</span>}
                      <p className="font-semibold text-gray-800">{emp.name}</p>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-600">
                        Ventas: <span className="font-bold text-gray-800">${emp.sales.toFixed(2)}</span>
                      </p>
                      <p className="text-gray-600">
                        Transacciones: <span className="font-bold text-gray-800">{emp.transactions}</span>
                      </p>
                      <p className="text-gray-600">
                        Ticket Prom: <span className="font-bold text-gray-800">${emp.averageTicket.toFixed(2)}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ) : (
          <div 
            className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg shadow-md p-8 border-2 border-dashed border-gray-300 cursor-pointer hover:border-blue-400 transition"
            onClick={() => handleBlockedFeature('Ranking de empleados')}
          >
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-200 mb-4">
                <Lock className="text-gray-500" size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
                <Award className="text-gray-400" size={24} />
                Ranking de Empleados
              </h3>
              <p className="text-gray-600 mb-4">
                Esta función requiere el plan Enterprise
              </p>
              <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:opacity-90 transition">
                <Crown size={20} />
                Actualizar Plan
              </button>
            </div>
          </div>
        )}

        {/* Gráficas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tendencia de Ventas (Últimos 15 días) */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Tendencia de Ventas (Últimos 15 días)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesByDay()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke={business?.primary_color || '#3B82F6'} 
                  strokeWidth={2}
                  name="Ventas ($)" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

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

          {/* Comparativa Mes Actual vs Anterior - Solo con advancedReports */}
          {canViewAdvancedReports ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Comparativa Mensual</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: 'Mes Anterior', ventas: previousMonthSales },
                  { name: 'Mes Actual', ventas: allTransactions.filter(t => {
                    const date = new Date(t.created_at);
                    const now = new Date();
                    return date.getMonth() === now.getMonth() && 
                           date.getFullYear() === now.getFullYear() &&
                           t.status === 'completed';
                  }).reduce((sum, t) => sum + Number(t.total), 0) }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="ventas" fill={business?.primary_color || '#3B82F6'} name="Ventas ($)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div 
              className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg shadow-md p-8 border-2 border-dashed border-gray-300 cursor-pointer hover:border-blue-400 transition"
              onClick={() => handleBlockedFeature('Comparativas mensuales')}
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-200 mb-4">
                  <Lock className="text-gray-500" size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  Comparativa Mensual
                </h3>
                <p className="text-gray-600 mb-4">
                  Esta función requiere el plan Premium o superior
                </p>
                <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:opacity-90 transition">
                  <Crown size={20} />
                  Actualizar Plan
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tabla Detallada */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-lg font-bold text-gray-800">Detalle de Transacciones</h2>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500">No se encontraron transacciones</p>
            </div>
          ) : (
            <>
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empleado</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50">
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
                            {t.payment_method === 'card' ? '💳' : t.payment_method === 'transfer' ? '🏦' : '💵'} {t.payment_method}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {users.find(u => u.id === t.created_by)?.name || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            t.status === 'completed' ? 'bg-green-100 text-green-800' :
                            t.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            t.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
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

      {/* Modal de Cambio de Contraseña */}
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
          feature={upgradeFeature}
          message={`La función "${upgradeFeature}" requiere un plan superior.`}
        />
      )}
    </div>
  );
}