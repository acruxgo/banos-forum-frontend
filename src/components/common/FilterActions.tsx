import React from 'react';
import { RotateCcw, Download } from 'lucide-react';

interface FilterActionsProps {
  onClearFilters: () => void;
  onExport?: () => void;
  hasActiveFilters: boolean;
  className?: string;
}

export const FilterActions: React.FC<FilterActionsProps> = ({
  onClearFilters,
  onExport,
  hasActiveFilters,
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Limpiar filtros */}
      <button
        onClick={onClearFilters}
        disabled={!hasActiveFilters}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
          ${hasActiveFilters
            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            : 'bg-gray-50 text-gray-400 cursor-not-allowed'
          }
        `}
      >
        <RotateCcw className="h-4 w-4" />
        Limpiar filtros
      </button>

      {/* Exportar (opcional) */}
      {onExport && (
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
        >
          <Download className="h-4 w-4" />
          Exportar
        </button>
      )}
    </div>
  );
};