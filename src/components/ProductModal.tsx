import { useState, useEffect } from 'react';
import { productsService, categoriesService, serviceTypesService } from '../services/api';
import { X, Package, DollarSign, Tag, Check, AlertCircle, FolderOpen } from 'lucide-react';
import { validateProductName, validatePrice } from '../utils/validators';
import type { ServiceType } from '../types';

interface ProductModalProps {
  product: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProductModal({ product, onClose, onSuccess }: ProductModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    service_type_id: '',
    category_id: ''
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingServiceTypes, setLoadingServiceTypes] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingName, setCheckingName] = useState(false);

  // Estados de validación en tiempo real
  const [validationErrors, setValidationErrors] = useState({
    name: '',
    price: '',
    service_type_id: '',
    category_id: ''
  });

  const [touched, setTouched] = useState({
    name: false,
    price: false,
    service_type_id: false,
    category_id: false
  });

  // Cargar categorías y tipos de servicio
  useEffect(() => {
    loadCategories();
    loadServiceTypes();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await categoriesService.getAll({ active: true });
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (err) {
      console.error('Error al cargar categorías:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadServiceTypes = async () => {
    try {
      const response = await serviceTypesService.getAll();
      if (response.data.success) {
        const activeTypes = response.data.data.filter((t: ServiceType) => t.active);
        setServiceTypes(activeTypes);
      }
    } catch (err) {
      console.error('Error al cargar tipos de servicio:', err);
    } finally {
      setLoadingServiceTypes(false);
    }
  };

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        price: product.price.toString(),
        service_type_id: product.service_type_id || '',
        category_id: product.category_id || ''
      });
    }
  }, [product]);

  // Verificar nombre duplicado
  const checkNameDuplicate = async (name: string) => {
    if (!name || (product && product.name === name)) return;

    const validation = validateProductName(name);
    if (!validation.valid) return;

    setCheckingName(true);
    try {
      const response = await productsService.getAll({ search: name });
      if (response.data.success && response.data.data.length > 0) {
        const existingProduct = response.data.data.find((p: any) => 
          p.name.toLowerCase() === name.trim().toLowerCase() && p.id !== product?.id
        );
        
        if (existingProduct) {
          setValidationErrors(prev => ({ 
            ...prev, 
            name: 'Ya existe un producto con este nombre' 
          }));
        }
      }
    } catch (err) {
      console.error('Error al verificar nombre:', err);
    } finally {
      setCheckingName(false);
    }
  };

  // Validación en tiempo real - Nombre
  const handleNameChange = (value: string) => {
    setFormData({ ...formData, name: value });
    
    if (touched.name) {
      const validation = validateProductName(value);
      setValidationErrors(prev => ({ 
        ...prev, 
        name: validation.valid ? '' : validation.error || '' 
      }));
    }
  };

  // Validación en tiempo real - Precio
  const handlePriceChange = (value: string) => {
    setFormData({ ...formData, price: value });
    
    if (touched.price) {
      const validation = validatePrice(value);
      setValidationErrors(prev => ({ 
        ...prev, 
        price: validation.valid ? '' : validation.error || '' 
      }));
    }
  };

  // Validación en tiempo real - Tipo de Servicio
  const handleServiceTypeChange = (value: string) => {
    setFormData({ ...formData, service_type_id: value });
    
    if (touched.service_type_id) {
      setValidationErrors(prev => ({ 
        ...prev, 
        service_type_id: value ? '' : 'Debes seleccionar un tipo de servicio' 
      }));
    }
  };

  // Validación en tiempo real - Categoría
  const handleCategoryChange = (value: string) => {
    setFormData({ ...formData, category_id: value });
    
    if (touched.category_id) {
      setValidationErrors(prev => ({ 
        ...prev, 
        category_id: value ? '' : 'Debes seleccionar una categoría' 
      }));
    }
  };

  const handleBlur = (field: 'name' | 'price' | 'service_type_id' | 'category_id') => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validar al perder foco
    if (field === 'name') {
      const validation = validateProductName(formData.name);
      setValidationErrors(prev => ({ 
        ...prev, 
        name: validation.valid ? '' : validation.error || '' 
      }));
      if (validation.valid) {
        checkNameDuplicate(formData.name);
      }
    } else if (field === 'price') {
      const validation = validatePrice(formData.price);
      setValidationErrors(prev => ({ 
        ...prev, 
        price: validation.valid ? '' : validation.error || '' 
      }));

      if (validation.valid && validation.value) {
        setFormData(prev => ({ ...prev, price: validation.value!.toFixed(2) }));
      }
    } else if (field === 'service_type_id') {
      setValidationErrors(prev => ({ 
        ...prev, 
        service_type_id: formData.service_type_id ? '' : 'Debes seleccionar un tipo de servicio' 
      }));
    } else if (field === 'category_id') {
      setValidationErrors(prev => ({ 
        ...prev, 
        category_id: formData.category_id ? '' : 'Debes seleccionar una categoría' 
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Marcar todos como touched
    setTouched({ name: true, price: true, service_type_id: true, category_id: true });

    // Validar nombre
    const nameValidation = validateProductName(formData.name);
    if (!nameValidation.valid) {
      setValidationErrors(prev => ({ ...prev, name: nameValidation.error || '' }));
      return;
    }

    // Validar precio
    const priceValidation = validatePrice(formData.price);
    if (!priceValidation.valid) {
      setValidationErrors(prev => ({ ...prev, price: priceValidation.error || '' }));
      return;
    }

    // Validar tipo de servicio
    if (!formData.service_type_id) {
      setValidationErrors(prev => ({ ...prev, service_type_id: 'Debes seleccionar un tipo de servicio' }));
      return;
    }

    // Validar categoría
    if (!formData.category_id) {
      setValidationErrors(prev => ({ ...prev, category_id: 'Debes seleccionar una categoría' }));
      return;
    }

    setLoading(true);
    try {
      const productData = {
        name: formData.name.trim(),
        price: priceValidation.value!,
        service_type_id: formData.service_type_id,
        category_id: formData.category_id
      };

      if (product) {
        await productsService.update(product.id, productData);
      } else {
        await productsService.create(productData);
      }
      
      onSuccess();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al guardar producto';
      if (errorMsg.toLowerCase().includes('nombre') && errorMsg.toLowerCase().includes('existe')) {
        setValidationErrors(prev => ({ ...prev, name: 'Ya existe un producto con este nombre' }));
      } else if (errorMsg.toLowerCase().includes('categoría')) {
        setValidationErrors(prev => ({ ...prev, category_id: errorMsg }));
      } else if (errorMsg.toLowerCase().includes('tipo')) {
        setValidationErrors(prev => ({ ...prev, service_type_id: errorMsg }));
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Verificar si hay errores de validación
  const hasValidationErrors = Object.values(validationErrors).some(err => err !== '');
  const isFormValid = formData.name && formData.price && formData.service_type_id && formData.category_id && !hasValidationErrors && !checkingName;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Package className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold text-gray-800">
              {product ? 'Editar Producto' : 'Nuevo Producto'}
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
          {/* Categoría - PRIMERO Y OBLIGATORIO */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <FolderOpen size={16} />
                Categoría <span className="text-red-500">*</span>
              </div>
            </label>
            <div className="relative">
              <select
                value={formData.category_id}
                onChange={(e) => handleCategoryChange(e.target.value)}
                onBlur={() => handleBlur('category_id')}
                className={`w-full px-4 py-3 pr-10 border rounded-lg outline-none transition ${
                  touched.category_id && validationErrors.category_id
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500'
                    : touched.category_id && formData.category_id
                    ? 'border-green-500 focus:ring-2 focus:ring-green-500'
                    : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                }`}
                disabled={loadingCategories}
              >
                <option value="">
                  {loadingCategories ? 'Cargando categorías...' : 'Selecciona una categoría'}
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {touched.category_id && formData.category_id && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  {validationErrors.category_id ? (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <Check className="h-5 w-5 text-green-500" />
                  )}
                </div>
              )}
            </div>
            {touched.category_id && validationErrors.category_id && (
              <p className="text-xs text-red-600 mt-1">{validationErrors.category_id}</p>
            )}
            {touched.category_id && !validationErrors.category_id && formData.category_id && (
              <p className="text-xs text-green-600 mt-1">✓ Categoría seleccionada</p>
            )}
            {categories.length === 0 && !loadingCategories && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ No hay categorías activas. Crea una primero en Gestión de Categorías.
              </p>
            )}
          </div>

          {/* Tipo de Servicio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Package size={16} />
                Tipo de Servicio <span className="text-red-500">*</span>
              </div>
            </label>
            <div className="relative">
              <select
                value={formData.service_type_id}
                onChange={(e) => handleServiceTypeChange(e.target.value)}
                onBlur={() => handleBlur('service_type_id')}
                className={`w-full px-4 py-3 pr-10 border rounded-lg outline-none transition ${
                  touched.service_type_id && validationErrors.service_type_id
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500'
                    : touched.service_type_id && formData.service_type_id
                    ? 'border-green-500 focus:ring-2 focus:ring-green-500'
                    : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                }`}
                disabled={loadingServiceTypes}
              >
                <option value="">
                  {loadingServiceTypes ? 'Cargando tipos...' : 'Selecciona un tipo de servicio'}
                </option>
                {serviceTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.icon ? `${type.icon} ${type.name}` : type.name}
                  </option>
                ))}
              </select>
              {touched.service_type_id && formData.service_type_id && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  {validationErrors.service_type_id ? (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <Check className="h-5 w-5 text-green-500" />
                  )}
                </div>
              )}
            </div>
            {touched.service_type_id && validationErrors.service_type_id && (
              <p className="text-xs text-red-600 mt-1">{validationErrors.service_type_id}</p>
            )}
            {touched.service_type_id && !validationErrors.service_type_id && formData.service_type_id && (
              <p className="text-xs text-green-600 mt-1">✓ Tipo seleccionado</p>
            )}
            {serviceTypes.length === 0 && !loadingServiceTypes && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ No hay tipos de servicio activos. Crea uno primero en Tipos de Servicio.
              </p>
            )}
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Tag size={16} />
                Nombre del Producto/Servicio <span className="text-red-500">*</span>
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
                    : touched.name && !validationErrors.name && formData.name && !checkingName
                    ? 'border-green-500 focus:ring-2 focus:ring-green-500'
                    : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                }`}
                placeholder="Ej: Baño VIP, Ducha Deluxe, Locker 2 horas"
                required
              />
              {touched.name && formData.name && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {checkingName ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  ) : validationErrors.name ? (
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
            {touched.name && !validationErrors.name && formData.name && !checkingName && (
              <p className="text-xs text-green-600 mt-1">✓ Nombre válido y disponible</p>
            )}
            {checkingName && (
              <p className="text-xs text-blue-600 mt-1">Verificando disponibilidad...</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Entre 3 y 50 caracteres
            </p>
          </div>

          {/* Precio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <DollarSign size={16} />
                Precio (MXN) <span className="text-red-500">*</span>
              </div>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="999999"
                value={formData.price}
                onChange={(e) => handlePriceChange(e.target.value)}
                onBlur={() => handleBlur('price')}
                className={`w-full pl-8 pr-10 py-3 border rounded-lg outline-none transition ${
                  touched.price && validationErrors.price
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500'
                    : touched.price && !validationErrors.price && formData.price
                    ? 'border-green-500 focus:ring-2 focus:ring-green-500'
                    : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                }`}
                placeholder="15.00"
                required
              />
              {touched.price && formData.price && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {validationErrors.price ? (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <Check className="h-5 w-5 text-green-500" />
                  )}
                </div>
              )}
            </div>
            {touched.price && validationErrors.price && (
              <p className="text-xs text-red-600 mt-1">{validationErrors.price}</p>
            )}
            {touched.price && !validationErrors.price && formData.price && (
              <p className="text-xs text-green-600 mt-1">✓ Precio válido</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Entre $0.01 y $999,999.00
            </p>
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
              disabled={loading || !isFormValid || categories.length === 0 || serviceTypes.length === 0}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : (product ? 'Actualizar' : 'Crear Producto')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}