import { useState, useEffect } from 'react';
import { usersService } from '../services/api';
import { X, User, Mail, Shield, Lock, Eye, EyeOff } from 'lucide-react';

interface UserModalProps {
  user: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserModal({ user, onClose, onSuccess }: UserModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'cajero',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        password: '' // Dejar vacío al editar
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (!formData.name.trim()) {
      setError('El nombre es requerido');
      return;
    }

    if (!formData.email.trim()) {
      setError('El email es requerido');
      return;
    }

    if (!user && !formData.password) {
      setError('La contraseña es requerida para nuevos usuarios');
      return;
    }

    if (formData.password && formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      if (user) {
        // Editar usuario
        const updateData: any = {
          name: formData.name,
          email: formData.email,
          role: formData.role
        };
        
        // Solo incluir password si se proporcionó uno nuevo
        if (formData.password.trim() !== '') {
          updateData.password = formData.password;
        }

        await usersService.update(user.id, updateData);
      } else {
        // Crear nuevo usuario
        await usersService.create({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          password: formData.password
        });
      }
      
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <User className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold text-gray-800">
              {user ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <User size={16} />
                Nombre Completo
              </div>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Juan Pérez"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Mail size={16} />
                Email
              </div>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="usuario@banosforum.com"
              required
            />
          </div>

          {/* Rol */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Shield size={16} />
                Rol
              </div>
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="cajero">Cajero</option>
              <option value="supervisor">Supervisor</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Lock size={16} />
                Contraseña {user && <span className="text-xs text-gray-500">(dejar vacío para no cambiar)</span>}
              </div>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="••••••••"
                required={!user}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : (user ? 'Actualizar' : 'Crear Usuario')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}