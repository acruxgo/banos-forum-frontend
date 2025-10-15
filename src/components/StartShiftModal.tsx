import { useState } from 'react';
import { DollarSign, X } from 'lucide-react';

interface StartShiftModalProps {
  onClose: () => void;
  onConfirm: (initialCash: number) => void;
  loading: boolean;
}

export default function StartShiftModal({ onClose, onConfirm, loading }: StartShiftModalProps) {
  const [initialCash, setInitialCash] = useState('0');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(initialCash);
    
    if (isNaN(amount) || amount < 0) {
      alert('Por favor ingresa un monto válido');
      return;
    }
    
    onConfirm(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-6 flex justify-between items-center rounded-t-xl">
          <div className="flex items-center gap-3">
            <DollarSign size={28} />
            <h2 className="text-2xl font-bold">Iniciar Turno</h2>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-lg transition">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              💵 ¿Cuánto efectivo hay en caja?
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Cuenta el efectivo físico que hay en la caja al momento de abrir
            </p>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl font-bold">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={initialCash}
                onChange={(e) => setInitialCash(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-2xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center"
                placeholder="0.00"
                autoFocus
              />
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Puedes poner 0 si no hay efectivo inicial
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>📝 Importante:</strong> Este monto se usará para calcular el arqueo al cerrar el turno.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 transition font-medium disabled:opacity-50"
            >
              {loading ? 'Iniciando...' : 'Iniciar Turno'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}