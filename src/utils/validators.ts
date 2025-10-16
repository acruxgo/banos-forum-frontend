// src/utils/validators.ts

/**
 * Validación de email/username
 * Formato flexible: algo@algo.algo (no verifica si el dominio existe)
 */
export const validateEmail = (email: string): { valid: boolean; error?: string } => {
  if (!email || email.trim() === '') {
    return { valid: false, error: 'El email es requerido' };
  }

  const trimmed = email.trim();

  // Verificar formato básico (tiene @ y punto)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(trimmed)) {
    return { 
      valid: false, 
      error: 'Formato de email inválido (ej: usuario@empresa.com)' 
    };
  }

  // Verificar que no tenga espacios
  if (trimmed.includes(' ')) {
    return { valid: false, error: 'El email no puede contener espacios' };
  }

  return { valid: true };
};

/**
 * Validación de nombre de persona
 * Solo letras, mínimo 2 caracteres
 */
export const validateName = (name: string): { valid: boolean; error?: string } => {
  if (!name || name.trim() === '') {
    return { valid: false, error: 'El nombre es requerido' };
  }

  const trimmed = name.trim();

  // Mínimo 2 caracteres
  if (trimmed.length < 2) {
    return { valid: false, error: 'El nombre debe tener al menos 2 caracteres' };
  }

  // Solo letras y espacios (permite acentos)
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  if (!nameRegex.test(trimmed)) {
    return { valid: false, error: 'El nombre solo debe contener letras' };
  }

  return { valid: true };
};

/**
 * Validación de contraseña
 */
export const validatePassword = (password: string, isRequired: boolean = true): { valid: boolean; error?: string } => {
  // Si no es requerida y está vacía, es válida
  if (!isRequired && (!password || password === '')) {
    return { valid: true };
  }

  if (!password || password === '') {
    return { valid: false, error: 'La contraseña es requerida' };
  }

  if (password.length < 6) {
    return { valid: false, error: 'La contraseña debe tener al menos 6 caracteres' };
  }

  // Opcional: verificar que tenga letras y números
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  if (!hasLetter || !hasNumber) {
    return { 
      valid: false, 
      error: 'La contraseña debe contener letras y números' 
    };
  }

  return { valid: true };
};

/**
 * Validación de precio
 */
export const validatePrice = (price: string | number): { valid: boolean; error?: string; value?: number } => {
  const priceNum = typeof price === 'string' ? parseFloat(price) : price;

  if (isNaN(priceNum)) {
    return { valid: false, error: 'El precio debe ser un número válido' };
  }

  if (priceNum <= 0) {
    return { valid: false, error: 'El precio debe ser mayor a $0' };
  }

  if (priceNum > 999999) {
    return { valid: false, error: 'El precio no puede ser mayor a $999,999' };
  }

  // Redondear a 2 decimales
  const rounded = Math.round(priceNum * 100) / 100;

  return { valid: true, value: rounded };
};

/**
 * Validación de nombre de producto
 */
export const validateProductName = (name: string): { valid: boolean; error?: string } => {
  if (!name || name.trim() === '') {
    return { valid: false, error: 'El nombre del producto es requerido' };
  }

  const trimmed = name.trim();

  if (trimmed.length < 3) {
    return { valid: false, error: 'El nombre debe tener al menos 3 caracteres' };
  }

  if (trimmed.length > 50) {
    return { valid: false, error: 'El nombre no puede exceder 50 caracteres' };
  }

  // Permitir letras, números, espacios y algunos caracteres especiales comunes
  const nameRegex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-().]+$/;
  if (!nameRegex.test(trimmed)) {
    return { 
      valid: false, 
      error: 'El nombre contiene caracteres no permitidos' 
    };
  }

  return { valid: true };
};

/**
 * Validación de slug (URL amigable)
 */
export const validateSlug = (slug: string): { valid: boolean; error?: string } => {
  if (!slug || slug.trim() === '') {
    return { valid: false, error: 'El slug es requerido' };
  }

  const trimmed = slug.trim().toLowerCase();

  // Solo letras minúsculas, números y guiones
  const slugRegex = /^[a-z0-9-]+$/;
  if (!slugRegex.test(trimmed)) {
    return { 
      valid: false, 
      error: 'El slug solo puede contener letras minúsculas, números y guiones' 
    };
  }

  if (trimmed.length < 3) {
    return { valid: false, error: 'El slug debe tener al menos 3 caracteres' };
  }

  return { valid: true };
};

/**
 * Validación de teléfono (México)
 */
export const validatePhone = (phone: string, isRequired: boolean = false): { valid: boolean; error?: string; formatted?: string } => {
  // Si no es requerido y está vacío, es válido
  if (!isRequired && (!phone || phone.trim() === '')) {
    return { valid: true };
  }

  if (isRequired && (!phone || phone.trim() === '')) {
    return { valid: false, error: 'El teléfono es requerido' };
  }

  // Limpiar el teléfono (quitar espacios, paréntesis, guiones)
  const cleaned = phone.replace(/[\s()-]/g, '');

  // Verificar que solo tenga números (permitir +52 al inicio)
  const phoneRegex = /^(\+52)?[0-9]{10}$/;
  if (!phoneRegex.test(cleaned)) {
    return { 
      valid: false, 
      error: 'El teléfono debe tener 10 dígitos (ej: 9981234567)' 
    };
  }

  // Formatear: 9981234567 → (998) 123-4567
  const numbers = cleaned.replace('+52', '');
  const formatted = `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6)}`;

  return { valid: true, formatted };
};

/**
 * Formatear nombre (capitalizar primera letra de cada palabra)
 */
export const formatName = (name: string): string => {
  return name
    .trim()
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Formatear email (convertir a minúsculas y limpiar espacios)
 */
export const formatEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

/**
 * Generar slug desde nombre
 */
export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/[^a-z0-9\s-]/g, '') // Quitar caracteres especiales
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/-+/g, '-') // Múltiples guiones a uno
    .replace(/^-|-$/g, ''); // Quitar guiones al inicio/fin
};