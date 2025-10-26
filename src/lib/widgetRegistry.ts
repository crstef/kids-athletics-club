/**
 * Widget Registry
 * Maps widget IDs from database to actual React components
 * ALL widgets available to ALL roles - visibility controlled by role_dashboards table
 */

import { StatsUsersWidget } from '@/components/widgets/StatsUsersWidget'
import { StatsAthletesWidget } from '@/components/widgets/StatsAthletesWidget'
import { StatsEventsWidget } from '@/components/widgets/StatsEventsWidget'
import { StatsPermissionsWidget } from '@/components/widgets/StatsPermissionsWidget'
import { RecentUsersWidget } from '@/components/widgets/RecentUsersWidget'
import { RecentEventsWidget } from '@/components/widgets/RecentEventsWidget'
import { PerformanceChartWidget } from '@/components/widgets/PerformanceChartWidget'
import { RecentResultsWidget } from '@/components/widgets/RecentResultsWidget'
import { PendingRequestsWidget } from '@/components/widgets/PendingRequestsWidget'
import AgeDistributionWidget from '@/components/widgets/AgeDistributionWidget'
import PersonalBestWidget from '@/components/widgets/PersonalBestWidget'

export interface WidgetConfig {
  id: string
  name: string
  component: React.ComponentType<any>
  requiredPermission?: string
  defaultSize?: 'small' | 'medium' | 'large' | 'xlarge'
  description?: string
}

/**
 * Available widgets registry
 * These are ALL widgets available in the system
 * Database role_dashboards table controls which ones each role sees
 */
export const WIDGET_REGISTRY: Record<string, WidgetConfig> = {
  'stats-users': {
    id: 'stats-users',
    name: 'Utilizatori',
    component: StatsUsersWidget,
    requiredPermission: 'users.view',
    defaultSize: 'small',
    description: 'Statistici despre utilizatori din sistem'
  },
  'stats-athletes': {
    id: 'stats-athletes',
    name: 'Atleți',
    component: StatsAthletesWidget,
    requiredPermission: 'athletes.view',
    defaultSize: 'small',
    description: 'Numărul total de atleți înregistrați'
  },
  'stats-events': {
    id: 'stats-events',
    name: 'Probe Sportive',
    component: StatsEventsWidget,
    requiredPermission: 'events.view',
    defaultSize: 'small',
    description: 'Probe sportive configurate'
  },
  'stats-permissions': {
    id: 'stats-permissions',
    name: 'Permisiuni',
    component: StatsPermissionsWidget,
    requiredPermission: 'permissions.view',
    defaultSize: 'small',
    description: 'Permisiuni active în sistem'
  },
  'recent-users': {
    id: 'recent-users',
    name: 'Utilizatori Recenți',
    component: RecentUsersWidget,
    requiredPermission: 'users.view',
    defaultSize: 'medium',
    description: 'Ultimii utilizatori înregistrați'
  },
  'recent-events': {
    id: 'recent-events',
    name: 'Probe Recente',
    component: RecentEventsWidget,
    requiredPermission: 'events.view',
    defaultSize: 'medium',
    description: 'Ultimele probe configurate'
  },
  'performance-chart': {
    id: 'performance-chart',
    name: 'Evoluție Performanțe',
    component: PerformanceChartWidget,
    requiredPermission: 'results.view',
    defaultSize: 'large',
    description: 'Grafic cu evoluția performanțelor'
  },
  'recent-results': {
    id: 'recent-results',
    name: 'Rezultate Recente',
    component: RecentResultsWidget,
    requiredPermission: 'results.view',
    defaultSize: 'medium',
    description: 'Ultimele rezultate înregistrate'
  },
  'personal-bests': {
    id: 'personal-bests',
    name: 'Recorduri Personale',
    component: PersonalBestWidget,
    requiredPermission: 'results.view',
    defaultSize: 'medium',
    description: 'Recorduri personale recente pe probe'
  },
  'age-distribution': {
    id: 'age-distribution',
    name: 'Distribuție pe Vârste',
    component: AgeDistributionWidget,
    requiredPermission: 'athletes.view',
    defaultSize: 'medium',
    description: 'Număr atleți pe categorii de vârstă'
  },
  'pending-requests': {
    id: 'pending-requests',
    name: 'Cereri în Așteptare',
    component: PendingRequestsWidget,
    requiredPermission: 'access_requests.view',
    defaultSize: 'medium',
    description: 'Cereri de aprobare în așteptare'
  }
}

/**
 * Get widget component by ID
 */
export function getWidgetComponent(widgetId: string): React.ComponentType<any> | null {
  const widget = WIDGET_REGISTRY[widgetId]
  return widget?.component || null
}

/**
 * Get all available widgets (for admin configuration UI)
 */
export function getAllWidgets(): WidgetConfig[] {
  return Object.values(WIDGET_REGISTRY)
}

/**
 * Check if user has permission for a widget
 */
export function userCanAccessWidget(widgetId: string, userPermissions: string[]): boolean {
  const widget = WIDGET_REGISTRY[widgetId]
  if (!widget) return false
  
  // If no permission required, widget is accessible to all
  if (!widget.requiredPermission) return true
  
  // Check if user has the required permission or wildcard
  return userPermissions.includes('*') || userPermissions.includes(widget.requiredPermission)
}
