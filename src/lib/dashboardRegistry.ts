/**
 * Dashboard Component Registry
 * Maps component names from database to actual React components
 * 
 * UNIFIED SYSTEM: All users now use UnifiedLayout regardless of role.
 * Permissions control what they see, not separate layouts.
 */

import UnifiedLayout from '@/layouts/UnifiedLayout'
import AthletePerformanceDashboard from '@/components/dashboards/AthletePerformanceDashboard'
import CoachTeamDashboard from '@/components/dashboards/CoachTeamDashboard'
import ParentProgressDashboard from '@/components/dashboards/ParentProgressDashboard'
import type { Dashboard } from '@/lib/types'

export const DASHBOARD_REGISTRY: Record<string, React.ComponentType<any>> = {
  // Unified layout for ALL users (permission-based visibility)
  'UnifiedLayout': UnifiedLayout,
  
  // Legacy names - all map to UnifiedLayout now
  'SuperAdminLayout': UnifiedLayout,
  'CoachLayout': UnifiedLayout,
  'ParentLayout': UnifiedLayout,
  'AthleteLayout': UnifiedLayout,
  'SuperAdminDashboard': UnifiedLayout,
  'CoachDashboard': UnifiedLayout,
  'ParentDashboard': UnifiedLayout,
  'AthleteDashboard': UnifiedLayout,
  
  // Alternative dashboards (can still be assigned)
  'AthletePerformanceDashboard': AthletePerformanceDashboard,
  'CoachTeamDashboard': CoachTeamDashboard,
  'ParentProgressDashboard': ParentProgressDashboard,
}

/**
 * Get dashboard component by name
 */
export function getDashboardComponent(componentName: string): React.ComponentType<any> | null {
  return DASHBOARD_REGISTRY[componentName] || null
}

// Fallback resolver used when a user has no dashboards assigned
export const FALLBACK_DASHBOARD: Dashboard = {
  id: 'fallback-unified-layout',
  name: 'UnifiedLayout',
  displayName: 'Unified Layout',
  componentName: 'UnifiedLayout',
  isActive: true,
  isSystem: true,
  createdAt: new Date().toISOString()
}
