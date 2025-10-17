export type PlanType = 'basic' | 'premium' | 'enterprise';

export interface PlanLimits {
  maxUsers: number;
  maxProducts: number;
  features: {
    basicReports: boolean;
    advancedReports: boolean; // Comparativas mes a mes
    employeeRanking: boolean;
    employeeFilter: boolean;
    exportData: boolean;
  };
}

export const PLAN_CONFIG: Record<PlanType, PlanLimits> = {
  basic: {
    maxUsers: 5,
    maxProducts: 10,
    features: {
      basicReports: true,
      advancedReports: false,
      employeeRanking: false,
      employeeFilter: false,
      exportData: true,
    },
  },
  premium: {
    maxUsers: 15,
    maxProducts: 50,
    features: {
      basicReports: true,
      advancedReports: true,
      employeeRanking: false,
      employeeFilter: false,
      exportData: true,
    },
  },
  enterprise: {
    maxUsers: -1, // -1 = ilimitado
    maxProducts: 100,
    features: {
      basicReports: true,
      advancedReports: true,
      employeeRanking: true,
      employeeFilter: true,
      exportData: true,
    },
  },
};

export const PLAN_NAMES: Record<PlanType, string> = {
  basic: 'Básico',
  premium: 'Premium',
  enterprise: 'Enterprise',
};

export const PLAN_PRICES: Record<PlanType, number> = {
  basic: 400,
  premium: 800,
  enterprise: 1200,
};

export const PLAN_DESCRIPTIONS: Record<PlanType, string> = {
  basic: 'Ideal para pequeños negocios',
  premium: 'Para negocios en crecimiento',
  enterprise: 'Solución empresarial completa',
};

// Función helper para verificar si un feature está disponible
export function hasFeature(plan: PlanType, feature: keyof PlanLimits['features']): boolean {
  return PLAN_CONFIG[plan].features[feature];
}

// Función helper para verificar límites
export function canAddMore(plan: PlanType, type: 'users' | 'products', currentCount: number): boolean {
  const limit = type === 'users' ? PLAN_CONFIG[plan].maxUsers : PLAN_CONFIG[plan].maxProducts;
  
  // -1 significa ilimitado
  if (limit === -1) return true;
  
  return currentCount < limit;
}

// Función para obtener mensaje de límite alcanzado
export function getLimitMessage(plan: PlanType, type: 'users' | 'products'): string {
  const limit = type === 'users' ? PLAN_CONFIG[plan].maxUsers : PLAN_CONFIG[plan].maxProducts;
  const itemName = type === 'users' ? 'usuarios' : 'productos';
  
  return `Has alcanzado el límite de ${limit} ${itemName} de tu plan ${PLAN_NAMES[plan]}. Actualiza a un plan superior para agregar más.`;
}

// Función para obtener próximo plan recomendado
export function getRecommendedUpgrade(currentPlan: PlanType): PlanType | null {
  if (currentPlan === 'basic') return 'premium';
  if (currentPlan === 'premium') return 'enterprise';
  return null; // Ya está en el plan más alto
}