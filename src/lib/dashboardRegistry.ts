/**
 * Dashboard Component Registry
 * Maps component names from database to actual React components
 */

import SuperAdminLayout from '@/layouts/SuperAdminLayout'
import CoachLayout from '@/layouts/CoachLayout'
import ParentLayout from '@/layouts/ParentLayout'
import AthleteLayout from '@/layouts/AthleteLayout'

export const DASHBOARD_REGISTRY: Record<string, React.ComponentType<any>> = {
  'SuperAdminLayout': SuperAdminLayout,
  'CoachLayout': CoachLayout,
  'ParentLayout': ParentLayout,
  'AthleteLayout': AthleteLayout,
  
  // Legacy names support (from migration)
  'SuperAdminDashboard': SuperAdminLayout,
  'CoachDashboard': CoachLayout,
  'ParentDashboard': ParentLayout,
  'AthleteDashboard': AthleteLayout,
}

/**
 * Get dashboard component by name
 */
export function getDashboardComponent(componentName: string): React.ComponentType<any> | null {
  return DASHBOARD_REGISTRY[componentName] || null
}
