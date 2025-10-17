import { X, Crown, Check } from 'lucide-react';
import { PLAN_NAMES, PLAN_PRICES, PLAN_CONFIG } from '../config/planConfig';
import type { PlanType } from '../config/planConfig';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: PlanType;
  recommendedPlan: PlanType;
  feature?: string;
  message?: string;
}

export default function UpgradeModal({
  isOpen,
  onClose,
  currentPlan,
  recommendedPlan,
  feature,
  message
}: UpgradeModalProps) {
  if (!isOpen) return null;

  const currentConfig = PLAN_CONFIG[currentPlan];
  const recommendedConfig = PLAN_CONFIG[recommendedPlan];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition"
          >
            <X size={24} />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <Crown size={32} />
            <h2 className="text-2xl font-bold">Actualiza tu Plan</h2>
          </div>
          
          {feature && (
            <p className="text-blue-100">
              Esta función requiere el plan {PLAN_NAMES[recommendedPlan]}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {message && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800">{message}</p>
            </div>
          )}

          {/* Comparación de planes */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {/* Plan actual */}
            <div className="border-2 border-gray-300 rounded-xl p-6">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  Plan {PLAN_NAMES[currentPlan]}
                </h3>
                <p className="text-sm text-gray-600">Tu plan actual</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  ${PLAN_PRICES[currentPlan]}
                  <span className="text-sm font-normal">/mes</span>
                </p>
              </div>

              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                  <span>
                    {currentConfig.maxUsers === -1 ? 'Usuarios ilimitados' : `Hasta ${currentConfig.maxUsers} usuarios`}
                  </span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                  <span>
                    Hasta {currentConfig.maxProducts} productos
                  </span>
                </li>
                {currentConfig.features.basicReports && (
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                    <span>Reportes básicos</span>
                  </li>
                )}
                {currentConfig.features.advancedReports && (
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                    <span>Comparativas mes a mes</span>
                  </li>
                )}
                {currentConfig.features.employeeRanking && (
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                    <span>Ranking de empleados</span>
                  </li>
                )}
                {currentConfig.features.employeeFilter && (
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                    <span>Filtro por empleado</span>
                  </li>
                )}
                {currentConfig.features.exportData && (
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                    <span>Exportar datos</span>
                  </li>
                )}
              </ul>
            </div>

            {/* Plan recomendado */}
            <div className="border-2 border-blue-600 rounded-xl p-6 relative bg-gradient-to-br from-blue-50 to-purple-50">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  RECOMENDADO
                </span>
              </div>

              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  Plan {PLAN_NAMES[recommendedPlan]}
                </h3>
                <p className="text-sm text-blue-600">Desbloquea más funciones</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  ${PLAN_PRICES[recommendedPlan]}
                  <span className="text-sm font-normal">/mes</span>
                </p>
              </div>

              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                  <span className="font-semibold">
                    {recommendedConfig.maxUsers === -1 ? 'Usuarios ilimitados' : `Hasta ${recommendedConfig.maxUsers} usuarios`}
                  </span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                  <span className="font-semibold">
                    Hasta {recommendedConfig.maxProducts} productos
                  </span>
                </li>
                {recommendedConfig.features.basicReports && (
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                    <span>Reportes básicos</span>
                  </li>
                )}
                {recommendedConfig.features.advancedReports && (
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                    <span className="font-semibold">Comparativas mes a mes</span>
                  </li>
                )}
                {recommendedConfig.features.employeeRanking && (
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                    <span className="font-semibold">Ranking de empleados</span>
                  </li>
                )}
                {recommendedConfig.features.employeeFilter && (
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                    <span className="font-semibold">Filtro por empleado</span>
                  </li>
                )}
                {recommendedConfig.features.exportData && (
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                    <span>Exportar datos</span>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Beneficios adicionales */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-gray-800 mb-2">
              ✨ Al actualizar también obtienes:
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Soporte prioritario</li>
              <li>• Actualizaciones automáticas</li>
              <li>• Backups diarios</li>
              <li>• Sin permanencia, cancela cuando quieras</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Ahora no
            </button>
            <button
              onClick={() => {
                // TODO: Implementar lógica de contacto o upgrade
                alert('Por favor contacta al administrador para actualizar tu plan.');
                onClose();
              }}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:opacity-90 transition"
            >
              Contactar para Actualizar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}