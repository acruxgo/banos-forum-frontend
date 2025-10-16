import { useState, useEffect, useCallback } from 'react';

interface UseTableFiltersOptions {
  initialPage?: number;
  initialLimit?: number;
  initialFilters?: Record<string, any>;
}

export const useTableFilters = (options: UseTableFiltersOptions = {}) => {
  const {
    initialPage = 1,
    initialLimit = 10,
    initialFilters = {}
  } = options;

  // Estado de filtros
  const [filters, setFilters] = useState<Record<string, any>>(initialFilters);
  
  // Estado de paginación
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  // Debounce para búsqueda (esperar 500ms después de que el usuario deje de escribir)
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [filters]);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setPage(1);
  }, [debouncedFilters]);

  // Actualizar un filtro específico
  const updateFilter = useCallback((key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Limpiar todos los filtros
  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
    setPage(1);
  }, [initialFilters]);

  // Cambiar página
  const changePage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  // Cambiar items por página
  const changeLimit = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Resetear a la primera página
  }, []);

  // Construir query params para la API
  const getQueryParams = useCallback(() => {
    const params: Record<string, string> = {
      page: page.toString(),
      limit: limit.toString()
    };

    // Agregar filtros solo si tienen valor
    Object.keys(debouncedFilters).forEach((key) => {
      const value = debouncedFilters[key];
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        params[key] = value.toString();
      }
    });

    return params;
  }, [page, limit, debouncedFilters]);

  // Verificar si hay filtros activos
  const hasActiveFilters = useCallback(() => {
    return Object.keys(filters).some((key) => {
      const value = filters[key];
      return value !== undefined && value !== null && value !== '' && value !== 'all';
    });
  }, [filters]);

  return {
    // Estado
    filters,
    debouncedFilters,
    page,
    limit,

    // Acciones
    updateFilter,
    clearFilters,
    changePage,
    changeLimit,

    // Utilidades
    getQueryParams,
    hasActiveFilters
  };
};