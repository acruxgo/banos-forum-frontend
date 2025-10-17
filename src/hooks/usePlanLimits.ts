import { useAuthStore } from '../store/authStore';
import { 
  PLAN_CONFIG, 
  hasFeature, 
  canAddMore, 
  getLimitMessage, 
  getRecommendedUpgrade
} from '../config/planConfig';
import type { PlanType } from '../config/planConfig';

export function usePlanLimits() {
  const business = useAuthStore((state) => state.business);
  
  // Si no hay empresa, asumir plan básico por defecto
  const currentPlan: PlanType = (business?.plan as PlanType) || 'basic';
  const planLimits = PLAN_CONFIG[currentPlan];

  return {
    // Plan actual
    currentPlan,
    planLimits,
    
    // Verificar si tiene acceso a un feature
    hasFeature: (feature: keyof typeof planLimits.features) => {
      return hasFeature(currentPlan, feature);
    },
    
    // Verificar si puede agregar más items
    canAddUsers: (currentCount: number) => {
      return canAddMore(currentPlan, 'users', currentCount);
    },
    
    canAddProducts: (currentCount: number) => {
      return canAddMore(currentPlan, 'products', currentCount);
    },
    
    // Obtener mensajes de límite
    getUserLimitMessage: () => {
      return getLimitMessage(currentPlan, 'users');
    },
    
    getProductLimitMessage: () => {
      return getLimitMessage(currentPlan, 'products');
    },
    
    // Obtener plan recomendado para upgrade
    getRecommendedUpgrade: () => {
      return getRecommendedUpgrade(currentPlan);
    },
    
    // Helpers útiles
    isBasic: currentPlan === 'basic',
    isPremium: currentPlan === 'premium',
    isEnterprise: currentPlan === 'enterprise',
  };
}