import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { serviceTypesService } from '../services/api';
import type { ServiceType } from '../types';
import { Tag, Plus, Edit, Power, LogOut, Key, Trash2, Package } from 'lucide-react';
import ChangePasswordModal from '../components/ChangePasswordModal';

export default function ServiceTypeManagement() {
  const user = useAuthStore((state) => state.user);
  const business = useAuthStore((state) => state.business);
  const logout = useAuthStore((state) => state.logout);

  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<ServiceType | null>(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: ''
  });

  useEffect(() => {
    loadServiceTypes();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const loadServiceTypes = async () => {
    setLoading(true);
    try {
      const response = await serviceTypesService.getAll();
      setServiceTypes(response.data.data);
    } catch (error) {
      console.error('Error al cargar tipos de servicio:', error);
      setToast({
        message: 'Error al cargar tipos de servicio',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingType(null);
    setFormData({ name: '', description: '', icon: '' });
    setShowModal(true);
  };

  const handleEdit = (type: ServiceType) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      description: type.description || '',
      icon: type.icon || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setToast({
        message: 'El nombre es obligatorio',
        type: 'error'
      });
      return;
    }

    try {
      if (editingType) {
        await serviceTypesService.update(editingType.id, formData);
        setToast({
          message: 'Tipo de servicio actualizado exitosamente',
          type: 'success'
        });
      } else {
        await serviceTypesService.create(formData);
        setToast({
          message: 'Tipo de servicio creado exitosamente',
          type: 'success'
        });
      }
      setShowModal(false);
      loadServiceTypes();
    } catch (error) {
      setToast({
        message: 'Error al guardar tipo de servicio',
        type: 'error'
      });
    }
  };

  const handleToggleActive = async (type: ServiceType) => {
    setConfirmAction({
      title: type.active ? 'Desactivar Tipo' : 'Activar Tipo',
      message: `¿Estás seguro de ${type.active ? 'desactivar' : 'activar'} "${type.name}"?`,
      onConfirm: async () => {
        try {
          await serviceTypesService.toggleActive(type.id);
          setToast({
            message: `Tipo ${type.active ? 'desactivado' : 'activado'} exitosamente`,
            type: 'success'
          });
          loadServiceTypes();
        } catch (error) {
          setToast({
            message: 'Error al cambiar estado',
            type: 'error'
          });
        }
        setShowConfirm(false);
      }
    });
    setShowConfirm(true);
  };

  const handleDelete = async (type: ServiceType) => {
    setConfirmAction({
      title: 'Eliminar Tipo de Servicio',
      message: `¿Estás seguro de eliminar "${type.name}"? Esta acción no se puede deshacer. No podrás eliminar si hay productos usando este tipo.`,
      onConfirm: async () => {
        try {
          await serviceTypesService.delete(type.id);
          setToast({
            message: 'Tipo eliminado exitosamente',
            type: 'success'
          });
          loadServiceTypes();
        } catch (error: any) {
          setToast({
            message: error.response?.data?.message || 'Error al eliminar tipo',
            type: 'error'
          });
        }
        setShowConfirm(false);
      }
    });
    setShowConfirm(true);
  };

  const handlePasswordChanged = () => {
    setToast({
      message: 'Contraseña actualizada. Por favor, inicia sesión nuevamente.',
      type: 'success'
    });
    setTimeout(() => logout(), 1500);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b" style={{ borderBottomColor: business?.primary_color || '#3B82F6', borderBottomWidth: '4px' }}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Tipos de Servicio</h1>
              <p className="text-sm text-gray-600">{user?.name} - {business?.name}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => window.location.href = '/productos'}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition"
                title="Ver Productos"
              >
                <Package size={20} />
                Productos
              </button>
              <button
                onClick={() => setShowChangePasswordModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
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
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Botón Crear Nuevo */}
        <div className="mb-6">
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-6 py-3 text-white rounded-lg font-semibold transition shadow-lg"
            style={{ backgroundColor: business?.primary_color || '#3B82F6' }}
          >
            <Plus size={20} />
            Nuevo Tipo de Servicio
          </button>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo de Servicio
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      Cargando...
                    </td>
                  </tr>
                ) : serviceTypes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      No hay tipos de servicio registrados
                    </td>
                  </tr>
                ) : (
                  serviceTypes.map((type) => (
                    <tr key={type.id} className={!type.active ? 'bg-gray-50' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {type.icon && <span className="text-2xl">{type.icon}</span>}
                          <div className="text-sm font-medium text-gray-900">{type.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">{type.description || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          type.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {type.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(type)}
                            className="hover:text-blue-900 transition"
                            style={{ color: business?.primary_color || '#3B82F6' }}
                            title="Editar"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleToggleActive(type)}
                            className={`transition ${
                              type.active 
                                ? 'text-orange-600 hover:text-orange-900' 
                                : 'text-green-600 hover:text-green-900'
                            }`}
                            title={type.active ? 'Desactivar' : 'Activar'}
                          >
                            <Power size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(type)}
                            className="text-red-600 hover:text-red-900 transition"
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                {editingType ? 'Editar Tipo de Servicio' : 'Nuevo Tipo de Servicio'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Baño, Ducha, Locker"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Descripción del servicio"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ícono (Emoji)
                  </label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: 🚽 🚿 🔐"
                    maxLength={2}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 text-white rounded-lg transition"
                    style={{ backgroundColor: business?.primary_color || '#3B82F6' }}
                  >
                    {editingType ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación */}
      {showConfirm && confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">{confirmAction.title}</h3>
            <p className="text-gray-600 mb-6">{confirmAction.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmAction.onConfirm}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-50 ${
          toast.type === 'success' ? 'bg-green-500' :
          toast.type === 'error' ? 'bg-red-500' :
          toast.type === 'warning' ? 'bg-yellow-500' :
          'bg-blue-500'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Modal Cambiar Contraseña */}
      {showChangePasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowChangePasswordModal(false)}
          onSuccess={handlePasswordChanged}
        />
      )}
    </div>
  );
}