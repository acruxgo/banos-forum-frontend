import { useState, useEffect } from 'react';
import { usersService } from '../services/api';
import { X, User, Mail, Shield, Lock, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { validateEmail, validateName, validatePassword, formatName, formatEmail } from '../utils/validators';

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
  const [checkingEmail, setCheckingEmail] = useState(false);
  
  // Estados de validación en tiempo real
  const [validationErrors, setValidationErrors] = useState({
    name: '',
    email: '',
    password: ''
  });

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false
  });

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

  // Validación en tiempo real
  const handleNameChange = (value: string) => {
    setFormData({ ...formData, name: value });
    
    if (touched.name) {
      const validation = validateName(value);
      setValidationErrors(prev => ({ 
        ...prev, 
        name: validation.valid ? '' : validation.error || '' 
      }));
    }
  };

  // Validación de email con verificación de duplicados
  const handleEmailChange = (value: string) => {
    setFormData({ ...formData, email: value });
    
    if (touched.email) {
      const validation = validateEmail(value);
      setValidationErrors(prev => ({ 
        ...prev, 
        email: validation.valid ? '' : validation.error || '' 
      }));
    }
  };

  // Verificar email duplicado al perder foco (solo si no estamos editando o el email cambió)
  const checkEmailDuplicate = async (email: string) => {
    if (!email || (user && user.email === email)) return;

    const validation = validateEmail(email);
    if (!validation.valid) return;

    setCheckingEmail(true);
    try {
      const response = await usersService.getAll({ search: email });
      if (response.data.success && response.data.data.length > 0) {
        // Si encontró usuarios con ese email
        const existingUser = response.data.data.find((u: any) => 
          u.email.toLowerCase() === email.toLowerCase() && u.id !== user?.id
        );
        
        if (existingUser) {
          setValidationErrors(prev => ({ 
            ...prev, 
            email: 'Este email ya está registrado' 
          }));
        }
      }
    } catch (err) {
      console.error('Error al verificar email:', err);
    } finally {
      setCheckingEmail(false);
    }
  };

  const handlePasswordChange = (value: string) => {
    setFormData({ ...formData, password: value });
    
    if (touched.password) {
      const validation = validatePassword(value, !user);
      setValidationErrors(prev => ({ 
        ...prev, 
        password: validation.valid ? '' : validation.error || '' 
      }));
    }
  };

  const handleBlur = (field: 'name' | 'email' | 'password') => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validar al perder foco
    if (field === 'name') {
      const validation = validateName(formData.name);
      setValidationErrors(prev => ({ 
        ...prev, 
        name: validation.valid ? '' : validation.error || '' 
      }));
    } else if (field === 'email') {
      const validation = validateEmail(formData.email);
      setValidationErrors(prev => ({ 
        ...prev, 
        email: validation.valid ? '' : validation.error || '' 
      }));
      // Verificar duplicado
      if (validation.valid) {
        checkEmailDuplicate(formData.email);
      }
    } else if (field === 'password') {
      const validation = validatePassword(formData.password, !user);
      setValidationErrors(prev => ({ 
        ...prev, 
        password: validation.valid ? '' : validation.error || '' 
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Marcar todos como touched
    setTouched({ name: true, email: true, password: true });

    // Validar nombre
    const nameValidation = validateName(formData.name);
    if (!nameValidation.valid) {
      setValidationErrors(prev => ({ ...prev, name: nameValidation.error || '' }));
      return;
    }

    // Validar email
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.valid) {
      setValidationErrors(prev => ({ ...prev, email: emailValidation.error || '' }));
      return;
    }

    // Validar contraseña
    const passwordValidation = validatePassword(formData.password, !user);
    if (!passwordValidation.valid) {
      setValidationErrors(prev => ({ ...prev, password: passwordValidation.error || '' }));
      return;
    }

    setLoading(true);
    try {
      if (user) {
        // Editar usuario - password es opcional
        const updateData: any = {
          name: formatName(formData.name),
          email: formatEmail(formData.email),
          role: formData.role,
        };
        
        if (formData.password) {
          updateData.password = formData.password;
        }
        
        await usersService.update(user.id, updateData);
      } else {
        // Crear nuevo usuario - password es obligatorio
        const createData = {
          name: formatName(formData.name),
          email: formatEmail(formData.email),
          role: formData.role,
          password: formData.password
        };
        
        await usersService.create(createData);
      }
      
      onSuccess();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al guardar usuario';
      // Detectar error de duplicado del backend
      if (errorMsg.toLowerCase().includes('email') && errorMsg.toLowerCase().includes('existe')) {
        setValidationErrors(prev => ({ ...prev, email: 'Este email ya está registrado' }));
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Verificar si hay errores de validación
  const hasValidationErrors = Object.values(validationErrors).some(err => err !== '');
  const isFormValid = formData.name && formData.email && (user || formData.password) && !hasValidationErrors && !checkingEmail;

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
            <div className="relative">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                onBlur={() => handleBlur('name')}
                className={`w-full px-4 py-3 pr-10 border rounded-lg outline-none transition ${
                  touched.name && validationErrors.name
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500'
                    : touched.name && !validationErrors.name && formData.name
                    ? 'border-green-500 focus:ring-2 focus:ring-green-500'
                    : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                }`}
                placeholder="Juan Pérez"
                required
              />
              {touched.name && formData.name && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {validationErrors.name ? (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <Check className="h-5 w-5 text-green-500" />
                  )}
                </div>
              )}
            </div>
            {touched.name && validationErrors.name && (
              <p className="text-xs text-red-600 mt-1">{validationErrors.name}</p>
            )}
            {touched.name && !validationErrors.name && formData.name && (
              <p className="text-xs text-green-600 mt-1">✓ Nombre válido</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Mail size={16} />
                Email
              </div>
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.email}
                onChange={(e) => handleEmailChange(e.target.value)}
                onBlur={() => handleBlur('email')}
                className={`w-full px-4 py-3 pr-10 border rounded-lg outline-none transition ${
                  touched.email && validationErrors.email
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500'
                    : touched.email && !validationErrors.email && formData.email && !checkingEmail
                    ? 'border-green-500 focus:ring-2 focus:ring-green-500'
                    : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                }`}
                placeholder="usuario@empresa.com"
                required
              />
              {touched.email && formData.email && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {checkingEmail ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  ) : validationErrors.email ? (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <Check className="h-5 w-5 text-green-500" />
                  )}
                </div>
              )}
            </div>
            {touched.email && validationErrors.email && (
              <p className="text-xs text-red-600 mt-1">{validationErrors.email}</p>
            )}
            {touched.email && !validationErrors.email && formData.email && !checkingEmail && (
              <p className="text-xs text-green-600 mt-1">✓ Email válido y disponible</p>
            )}
            {checkingEmail && (
              <p className="text-xs text-blue-600 mt-1">Verificando disponibilidad...</p>
            )}
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
                onChange={(e) => handlePasswordChange(e.target.value)}
                onBlur={() => handleBlur('password')}
                className={`w-full px-4 py-3 pr-20 border rounded-lg outline-none transition ${
                  touched.password && validationErrors.password
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500'
                    : touched.password && !validationErrors.password && formData.password
                    ? 'border-green-500 focus:ring-2 focus:ring-green-500'
                    : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                }`}
                placeholder="••••••••"
                required={!user}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                {touched.password && formData.password && (
                  validationErrors.password ? (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <Check className="h-5 w-5 text-green-500" />
                  )
                )}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            {touched.password && validationErrors.password && (
              <p className="text-xs text-red-600 mt-1">{validationErrors.password}</p>
            )}
            {!user && (
              <p className="text-xs text-gray-500 mt-1">
                Mínimo 6 caracteres, debe incluir letras y números
              </p>
            )}
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
              disabled={loading || !isFormValid}
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