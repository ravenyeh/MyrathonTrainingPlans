import { Plan } from '@/types';

const PLANS_KEY = 'marathon_planner_plans';
const ACTIVE_PLAN_KEY = 'marathon_planner_active_plan';

export function getLocalPlans(): Plan[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(PLANS_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveLocalPlan(plan: Plan): void {
  if (typeof window === 'undefined') return;

  const plans = getLocalPlans();
  const existingIndex = plans.findIndex(p => p.id === plan.id);

  if (existingIndex >= 0) {
    plans[existingIndex] = plan;
  } else {
    plans.push(plan);
  }

  localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
}

export function getLocalPlan(planId: string): Plan | null {
  const plans = getLocalPlans();
  return plans.find(p => p.id === planId) || null;
}

export function deleteLocalPlan(planId: string): void {
  if (typeof window === 'undefined') return;

  const plans = getLocalPlans().filter(p => p.id !== planId);
  localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
}

export function getActivePlanId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_PLAN_KEY);
}

export function setActivePlanId(planId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_PLAN_KEY, planId);
}

export function clearActivePlanId(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACTIVE_PLAN_KEY);
}

export function generateLocalId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
