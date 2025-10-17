import { useState, useEffect } from 'react';
import { categoriesService } from '../services/api';
import { X, FolderOpen, FileText, Check, AlertCircle } from 'lucide-react';

interface CategoryModalProps {
  category: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CategoryModal({ category, onClose, onSuccess }: CategoryModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const [errors, setErrors] = useState({
    name: '',
    description: ''
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || ''
      });
    }
  }, [category]);

  // Validación del nombre
  const validateName = (value: string): string => {
    if (!value.trim()) {
      return 'El nombre es requerido';
    }
    if (value.trim().length < 3) {
      return 'El nombre debe tener al menos 3 caracteres';
    }
    if (value.length > 50) {
      return 'El nombre no puede exceder 50 caracteres';
    }
    return '';
  };

  // Validación de descripción
  const validateDescription = (value: string): string => {
    if (value && value.length > 200) {
      return 'La descripción no puede exceder 200 caracteres';
    }
    return '';
  };

  // Formatear nombre (capitalizar)
  const formatName = (value: string): string => {
    return value
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Manejar cambios en campos
  const handleChange = (field: 'name' | 'description', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validar en tiempo real
    if (field === 'name') {
      setErrors(prev => ({ ...prev, name: validateName(value) }));
    } else if (field === 'description') {
      setErrors(prev => ({ ...prev, description: validateDescription(value) }));
    }
  };

  // Manejar blur (formateo)
  const handleBlur = (field: 'name' | 'description') => {
    if (field === 'name' && formData.name) {
      const formatted = formatName(formData.name.trim());
      setFormData(prev => ({ ...prev, name: formatted }));
      setErrors(prev => ({ ...prev, name: validateName(formatted) }));
    }
  };

  // Verificar si el formulario es válido
  const isFormValid = () => {
    return (
      formData.name.trim() !== '' &&
      !errors.name &&
      !errors.description &&
      !loading
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar todo antes de enviar
    const nameError = validateName(formData.name);
    const descriptionError = validateDescription(formData.description);

    if (nameError || descriptionError) {
      setErrors({
        name: nameError,
        description: descriptionError
      });
      return;
    }

    setLoading(true);
    try {
      const formattedData = {
        name: formatName(formData.name.trim()),
        description: formData.description.trim() || undefined
      };

      if (category) {
        // Editar
        await categoriesService.update(category.id, formattedData);
      } else {
        // Crear
        await categoriesService.create(formattedData);
      }

      onSuccess();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al guardar categoría';
      setErrors(prev => ({ ...prev, name: errorMessage }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FolderOpen className="text-blue-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {category ? 'Editar Categoría' : 'Nueva Categoría'}
              </h2>
              <p className="text-sm text-gray-500">
                {category ? 'Modifica los datos de la categoría' : 'Completa los datos de la nueva categoría'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la Categoría *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FolderOpen className="text-gray-400" size={18} />
              </div>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                onBlur={() => handleBlur('name')}
                className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: Servicios de Baño"
                maxLength={50}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                {formData.name && !errors.name && (
                  <Check className="text-green-500" size={18} />
                )}
                {errors.name && (
                  <AlertCircle className="text-red-500" size={18} />
                )}
              </div>
            </div>
            {errors.name && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.name}
              </p>
            )}
            {!errors.name && formData.name && (
              <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                <Check size={12} />
                Nombre válido
              </p>
            )}
          </div>

          {/* Descripción (Opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción (Opcional)
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <FileText className="text-gray-400" size={18} />
              </div>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Breve descripción de la categoría..."
                rows={3}
                maxLength={200}
              />
            </div>
            <div className="flex justify-between items-center mt-1">
              <div>
                {errors.description && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.description}
                  </p>
                )}
              </div>
              <p className="text-xs text-gray-400">
                {formData.description.length}/200
              </p>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isFormValid()}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                isFormValid()
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {loading ? 'Guardando...' : category ? 'Actualizar' : 'Crear Categoría'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}