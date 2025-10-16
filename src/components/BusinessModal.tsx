import { useState, useEffect } from 'react';
import { businessesService } from '../services/api';
import { X, Building2, Mail, Phone, MapPin, Tag, User, Lock, Eye, EyeOff, Crown, Palette, Check, AlertCircle } from 'lucide-react';
import { validateEmail, validateName, validatePassword, validateSlug, validatePhone, formatName, formatEmail, generateSlug } from '../utils/validators';

interface BusinessModalProps {
  business: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BusinessModal({ business, onClose, onSuccess }: BusinessModalProps) {
  const isEditing = !!business;

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    email: '',
    phone: '',
    address: '',
    plan: 'basic',
    primary_color: '#3B82F6',
    logo_url: '',
    adminName: '',
    adminEmail: '',
    adminPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados de validación
  const [validationErrors, setValidationErrors] = useState({
    name: '',
    slug: '',
    email: '',
    phone: '',
    adminName: '',
    adminEmail: '',
    adminPassword: ''
  });

  const [touched, setTouched] = useState({
    name: false,
    slug: false,
    email: false,
    phone: false,
    adminName: false,
    adminEmail: false,
    adminPassword: false
  });

  useEffect(() => {
    if (business) {
      setFormData({
        name: business.name || '',
        slug: business.slug || '',
        email: business.email || '',
        phone: business.phone || '',
        address: business.address || '',
        plan: business.plan || 'basic',
        primary_color: business.primary_color || '#3B82F6',
        logo_url: business.logo_url || '',
        adminName: '',
        adminEmail: '',
        adminPassword: ''
      });
    }
  }, [business]);

  // Validación en tiempo real
  const handleNameChange = (value: string) => {
    const newFormData = { ...formData, name: value };
    setFormData(newFormData);
    
    // Auto-generar slug si no estamos editando y no hay slug manual
    if (!isEditing && !touched.slug) {
      const autoSlug = generateSlug(value);
      setFormData(prev => ({ ...prev, slug: autoSlug }));
    }

    if (touched.name) {
      const validation = validateName(value);
      setValidationErrors(prev => ({ 
        ...prev, 
        name: validation.valid ? '' : validation.error || '' 
      }));
    }
  };

  const handleSlugChange = (value: string) => {
    const cleanSlug = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setFormData({ ...formData, slug: cleanSlug });
    
    if (touched.slug) {
      const validation = validateSlug(cleanSlug);
      setValidationErrors(prev => ({ 
        ...prev, 
        slug: validation.valid ? '' : validation.error || '' 
      }));
    }
  };

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

  const handlePhoneChange = (value: string) => {
    setFormData({ ...formData, phone: value });
    
    if (touched.phone) {
      const validation = validatePhone(value, false);
      setValidationErrors(prev => ({ 
        ...prev, 
        phone: validation.valid ? '' : validation.error || '' 
      }));
    }
  };

  const handleAdminNameChange = (value: string) => {
    setFormData({ ...formData, adminName: value });
    
    if (touched.adminName) {
      const validation = validateName(value);
      setValidationErrors(prev => ({ 
        ...prev, 
        adminName: validation.valid ? '' : validation.error || '' 
      }));
    }
  };

  const handleAdminEmailChange = (value: string) => {
    setFormData({ ...formData, adminEmail: value });
    
    if (touched.adminEmail) {
      const validation = validateEmail(value);
      setValidationErrors(prev => ({ 
        ...prev, 
        adminEmail: validation.valid ? '' : validation.error || '' 
      }));
    }
  };

  const handleAdminPasswordChange = (value: string) => {
    setFormData({ ...formData, adminPassword: value });
    
    if (touched.adminPassword) {
      const validation = validatePassword(value, !isEditing);
      setValidationErrors(prev => ({ 
        ...prev, 
        adminPassword: validation.valid ? '' : validation.error || '' 
      }));
    }
  };

  const handleBlur = (field: keyof typeof touched) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validar según el campo
    if (field === 'name') {
      const validation = validateName(formData.name);
      setValidationErrors(prev => ({ ...prev, name: validation.valid ? '' : validation.error || '' }));
    } else if (field === 'slug') {
      const validation = validateSlug(formData.slug);
      setValidationErrors(prev => ({ ...prev, slug: validation.valid ? '' : validation.error || '' }));
    } else if (field === 'email') {
      const validation = validateEmail(formData.email);
      setValidationErrors(prev => ({ ...prev, email: validation.valid ? '' : validation.error || '' }));
    } else if (field === 'phone' && formData.phone) {
      const validation = validatePhone(formData.phone, false);
      setValidationErrors(prev => ({ ...prev, phone: validation.valid ? '' : validation.error || '' }));
      // Auto-formatear teléfono
      if (validation.valid && validation.formatted) {
        setFormData(prev => ({ ...prev, phone: validation.formatted! }));
      }
    } else if (field === 'adminName') {
      const validation = validateName(formData.adminName);
      setValidationErrors(prev => ({ ...prev, adminName: validation.valid ? '' : validation.error || '' }));
    } else if (field === 'adminEmail') {
      const validation = validateEmail(formData.adminEmail);
      setValidationErrors(prev => ({ ...prev, adminEmail: validation.valid ? '' : validation.error || '' }));
    } else if (field === 'adminPassword') {
      const validation = validatePassword(formData.adminPassword, !isEditing);
      setValidationErrors(prev => ({ ...prev, adminPassword: validation.valid ? '' : validation.error || '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Marcar todos como touched
    setTouched({
      name: true,
      slug: true,
      email: true,
      phone: true,
      adminName: !isEditing,
      adminEmail: !isEditing,
      adminPassword: !isEditing
    });

    // Validaciones
    const nameValidation = validateName(formData.name);
    if (!nameValidation.valid) {
      setValidationErrors(prev => ({ ...prev, name: nameValidation.error || '' }));
      setLoading(false);
      return;
    }

    if (!isEditing) {
      const slugValidation = validateSlug(formData.slug);
      if (!slugValidation.valid) {
        setValidationErrors(prev => ({ ...prev, slug: slugValidation.error || '' }));
        setLoading(false);
        return;
      }
    }

    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.valid) {
      setValidationErrors(prev => ({ ...prev, email: emailValidation.error || '' }));
      setLoading(false);
      return;
    }

    if (formData.phone) {
      const phoneValidation = validatePhone(formData.phone, false);
      if (!phoneValidation.valid) {
        setValidationErrors(prev => ({ ...prev, phone: phoneValidation.error || '' }));
        setLoading(false);
        return;
      }
    }

    if (!isEditing) {
      const adminNameValidation = validateName(formData.adminName);
      if (!adminNameValidation.valid) {
        setValidationErrors(prev => ({ ...prev, adminName: adminNameValidation.error || '' }));
        setLoading(false);
        return;
      }

      const adminEmailValidation = validateEmail(formData.adminEmail);
      if (!adminEmailValidation.valid) {
        setValidationErrors(prev => ({ ...prev, adminEmail: adminEmailValidation.error || '' }));
        setLoading(false);
        return;
      }

      const adminPasswordValidation = validatePassword(formData.adminPassword, true);
      if (!adminPasswordValidation.valid) {
        setValidationErrors(prev => ({ ...prev, adminPassword: adminPasswordValidation.error || '' }));
        setLoading(false);
        return;
      }
    }

    try {
      if (isEditing) {
        // EDITAR empresa existente
        await businessesService.update(business.id, {
          name: formatName(formData.name),
          email: formatEmail(formData.email),
          phone: formData.phone,
          address: formData.address,
          plan: formData.plan,
          primary_color: formData.primary_color,
          logo_url: formData.logo_url
        });
      } else {
        // CREAR nueva empresa
        await businessesService.create({
          name: formatName(formData.name),
          slug: formData.slug,
          email: formatEmail(formData.email),
          phone: formData.phone,
          address: formData.address,
          plan: formData.plan,
          adminName: formatName(formData.adminName),
          adminEmail: formatEmail(formData.adminEmail),
          adminPassword: formData.adminPassword
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || `Error al ${isEditing ? 'actualizar' : 'crear'} empresa`);
    } finally {
      setLoading(false);
    }
  };

  const hasValidationErrors = Object.values(validationErrors).some(err => err !== '');
  const isFormValid = isEditing 
    ? formData.name && formData.email && !hasValidationErrors
    : formData.name && formData.slug && formData.email && formData.adminName && formData.adminEmail && formData.adminPassword && !hasValidationErrors;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Building2 size={28} />
            <h2 className="text-2xl font-bold">
              {isEditing ? 'Editar Empresa' : 'Nueva Empresa'}
            </h2>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-lg transition">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información de la Empresa */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Building2 size={20} />
              Información de la Empresa
            </h3>

            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Empresa *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onBlur={() => handleBlur('name')}
                  className={`w-full px-4 py-2 pr-10 border rounded-lg outline-none transition ${
                    touched.name && validationErrors.name
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500'
                      : touched.name && !validationErrors.name && formData.name
                      ? 'border-green-500 focus:ring-2 focus:ring-green-500'
                      : 'border-gray-300 focus:ring-2 focus:ring-purple-500'
                  }`}
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
            </div>

            {/* Slug (solo al crear) */}
            {!isEditing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug (URL única) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    onBlur={() => handleBlur('slug')}
                    className={`w-full px-4 py-2 pr-10 border rounded-lg outline-none transition ${
                      touched.slug && validationErrors.slug
                        ? 'border-red-500 focus:ring-2 focus:ring-red-500'
                        : touched.slug && !validationErrors.slug && formData.slug
                        ? 'border-green-500 focus:ring-2 focus:ring-green-500'
                        : 'border-gray-300 focus:ring-2 focus:ring-purple-500'
                    }`}
                    placeholder="mi-empresa"
                    required
                  />
                  {touched.slug && formData.slug && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {validationErrors.slug ? (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <Check className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                  )}
                </div>
                {touched.slug && validationErrors.slug && (
                  <p className="text-xs text-red-600 mt-1">{validationErrors.slug}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Solo letras minúsculas, números y guiones
                </p>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail size={16} className="inline mr-1" />
                Email de Contacto *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  onBlur={() => handleBlur('email')}
                  className={`w-full px-4 py-2 pr-10 border rounded-lg outline-none transition ${
                    touched.email && validationErrors.email
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500'
                      : touched.email && !validationErrors.email && formData.email
                      ? 'border-green-500 focus:ring-2 focus:ring-green-500'
                      : 'border-gray-300 focus:ring-2 focus:ring-purple-500'
                  }`}
                  required
                />
                {touched.email && formData.email && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {validationErrors.email ? (
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
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone size={16} className="inline mr-1" />
                Teléfono
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  onBlur={() => handleBlur('phone')}
                  className={`w-full px-4 py-2 pr-10 border rounded-lg outline-none transition ${
                    touched.phone && validationErrors.phone
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500'
                      : touched.phone && !validationErrors.phone && formData.phone
                      ? 'border-green-500 focus:ring-2 focus:ring-green-500'
                      : 'border-gray-300 focus:ring-2 focus:ring-purple-500'
                  }`}
                  placeholder="9981234567"
                />
                {touched.phone && formData.phone && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {validationErrors.phone ? (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <Check className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                )}
              </div>
              {touched.phone && validationErrors.phone && (
                <p className="text-xs text-red-600 mt-1">{validationErrors.phone}</p>
              )}
              {touched.phone && !validationErrors.phone && formData.phone && (
                <p className="text-xs text-green-600 mt-1">✓ Teléfono válido</p>
              )}
            </div>

            {/* Dirección */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin size={16} className="inline mr-1" />
                Dirección
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={2}
              />
            </div>

            {/* Plan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag size={16} className="inline mr-1" />
                Plan
              </label>
              <select
                value={formData.plan}
                onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="basic">Básico</option>
                <option value="premium">Premium</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            {/* Branding */}
            <div className="grid grid-cols-2 gap-4">
              {/* Color Principal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Palette size={16} className="inline mr-1" />
                  Color Principal
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>

              {/* Logo URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo URL
                </label>
                <input
                  type="url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          {/* Datos del Administrador (solo al crear) */}
          {!isEditing && (
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Crown size={20} className="text-yellow-500" />
                Administrador de la Empresa
              </h3>

              {/* Nombre Admin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User size={16} className="inline mr-1" />
                  Nombre Completo *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.adminName}
                    onChange={(e) => handleAdminNameChange(e.target.value)}
                    onBlur={() => handleBlur('adminName')}
                    className={`w-full px-4 py-2 pr-10 border rounded-lg outline-none transition ${
                      touched.adminName && validationErrors.adminName
                        ? 'border-red-500 focus:ring-2 focus:ring-red-500'
                        : touched.adminName && !validationErrors.adminName && formData.adminName
                        ? 'border-green-500 focus:ring-2 focus:ring-green-500'
                        : 'border-gray-300 focus:ring-2 focus:ring-purple-500'
                    }`}
                    required={!isEditing}
                  />
                  {touched.adminName && formData.adminName && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {validationErrors.adminName ? (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <Check className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                  )}
                </div>
                {touched.adminName && validationErrors.adminName && (
                  <p className="text-xs text-red-600 mt-1">{validationErrors.adminName}</p>
                )}
              </div>

              {/* Email Admin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail size={16} className="inline mr-1" />
                  Email del Administrador *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.adminEmail}
                    onChange={(e) => handleAdminEmailChange(e.target.value)}
                    onBlur={() => handleBlur('adminEmail')}
                    className={`w-full px-4 py-2 pr-10 border rounded-lg outline-none transition ${
                      touched.adminEmail && validationErrors.adminEmail
                        ? 'border-red-500 focus:ring-2 focus:ring-red-500'
                        : touched.adminEmail && !validationErrors.adminEmail && formData.adminEmail
                        ? 'border-green-500 focus:ring-2 focus:ring-green-500'
                        : 'border-gray-300 focus:ring-2 focus:ring-purple-500'
                    }`}
                    required={!isEditing}
                  />
                  {touched.adminEmail && formData.adminEmail && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {validationErrors.adminEmail ? (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <Check className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                  )}
                </div>
                {touched.adminEmail && validationErrors.adminEmail && (
                  <p className="text-xs text-red-600 mt-1">{validationErrors.adminEmail}</p>
                )}
              </div>

              {/* Contraseña Admin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock size={16} className="inline mr-1" />
                  Contraseña *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.adminPassword}
                    onChange={(e) => handleAdminPasswordChange(e.target.value)}
                    onBlur={() => handleBlur('adminPassword')}
                    className={`w-full px-4 py-2 pr-20 border rounded-lg outline-none transition ${
                      touched.adminPassword && validationErrors.adminPassword
                        ? 'border-red-500 focus:ring-2 focus:ring-red-500'
                        : touched.adminPassword && !validationErrors.adminPassword && formData.adminPassword
                        ? 'border-green-500 focus:ring-2 focus:ring-green-500'
                        : 'border-gray-300 focus:ring-2 focus:ring-purple-500'
                    }`}
                    placeholder="Mínimo 6 caracteres"
                    required={!isEditing}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {touched.adminPassword && formData.adminPassword && (
                      validationErrors.adminPassword ? (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <Check className="h-5 w-5 text-green-500" />
                      )
                    )}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                {touched.adminPassword && validationErrors.adminPassword && (
                  <p className="text-xs text-red-600 mt-1">{validationErrors.adminPassword}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Mínimo 6 caracteres, debe incluir letras y números
                </p>
              </div>
            </div>
          )}

          {/* Error */}
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
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : isEditing ? 'Actualizar Empresa' : 'Crear Empresa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}