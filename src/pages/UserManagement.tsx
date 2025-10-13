import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { usersService } from '../services/api';
import { Users, Plus, Edit, Power, LogOut, Key, RefreshCw } from 'lucide-react';
import UserModal from '../components/UserModal';
import ChangePasswordModal from '../components/ChangePasswordModal';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'supervisor' | 'cajero';
  active: boolean;
  created_at: string;
}

export default function UserManagement() {
  const currentUser = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await usersService.getAll();
      setUsers(response.data.data);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      alert('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setShowUserModal(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowUserModal(true);
  };

  const handleToggleActive = async (user: User) => {
    if (!confirm(`¿Estás seguro de ${user.active ? 'desactivar' : 'activar'} a ${user.name}?`)) {
      return;
    }

    try {
      await usersService.toggleActive(user.id);
      alert(`Usuario ${user.active ? 'desactivado' : 'activado'} exitosamente`);
      loadUsers();
    } catch (error) {
      alert('Error al cambiar estado del usuario');
    }
  };

  const handleUserSaved = () => {
    setShowUserModal(false);
    setEditingUser(null);
    loadUsers();
  };

  const handlePasswordChanged = () => {
    alert('Contraseña actualizada. Por favor, inicia sesión nuevamente.');
    logout();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'supervisor': return 'bg-blue-100 text-blue-800';
      case 'cajero': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Gestión de Usuarios</h1>
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
      </header>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Acciones */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Users className="text-blue-600" size={24} />
              <h2 className="text-lg font-bold text-gray-800">
                Usuarios del Sistema ({users.length})
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={loadUsers}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition disabled:opacity-50"
              >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                Actualizar
              </button>
              <button
                onClick={handleCreateUser}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                <Plus size={20} />
                Nuevo Usuario
              </button>
            </div>
          </div>
        </div>

        {/* Tabla de Usuarios */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
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
                {users.map((user) => (
                  <tr key={user.id} className={!user.active ? 'bg-gray-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(user.created_at).toLocaleDateString('es-MX')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-blue-600 hover:text-blue-900 transition"
                          title="Editar"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(user)}
                          className={`transition ${
                            user.active 
                              ? 'text-red-600 hover:text-red-900' 
                              : 'text-green-600 hover:text-green-900'
                          }`}
                          title={user.active ? 'Desactivar' : 'Activar'}
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

          {users.length === 0 && !loading && (
            <div className="text-center py-12">
              <Users className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500">No hay usuarios registrados</p>
            </div>
          )}
        </div>
      </div>

      {/* Modales */}
      {showUserModal && (
        <UserModal
          user={editingUser}
          onClose={() => {
            setShowUserModal(false);
            setEditingUser(null);
          }}
          onSuccess={handleUserSaved}
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