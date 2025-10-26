/**
 * Permission to Tab Mapping
 * Defines which permissions unlock which tabs and their configuration
 * This is the SOURCE OF TRUTH for tab generation
 */

export interface TabConfig {
  id: string
  label: string
  permission: string
  category: 'core' | 'data' | 'admin' | 'management'
  order: number
  icon?: any
}

/**
 * Master mapping: permission string → tab configuration
 * When a user has a permission, the corresponding tab becomes visible
 */
export const PERMISSION_TO_TAB_MAP: Record<string, TabConfig> = {
  // Core tabs - always available to authenticated users
  'dashboard.view': {
    id: 'dashboard',
    label: 'Dashboard',
    permission: 'dashboard.view',
    category: 'core',
    order: 0
  },

  // Data management tabs
  'athletes.view': {
    id: 'athletes',
    label: 'Atleți',
    permission: 'athletes.view',
    category: 'data',
    order: 10
  },
  'events.view': {
    id: 'events',
    label: 'Probe',
    permission: 'events.view',
    category: 'data',
    order: 20
  },

  // Communication tabs
  'access_requests.view': {
    id: 'requests',
    label: 'Cereri',
    permission: 'access_requests.view',
    category: 'data',
    order: 30
  },
  'messages.view': {
    id: 'messages',
    label: 'Mesaje',
    permission: 'messages.view',
    category: 'data',
    order: 40
  },

  // Admin tabs - typically superadmin only
  'users.view': {
    id: 'users',
    label: 'Utilizatori',
    permission: 'users.view',
    category: 'admin',
    order: 100
  },
  'roles.view': {
    id: 'roles',
    label: 'Roluri',
    permission: 'roles.view',
    category: 'admin',
    order: 110
  },
  'permissions.view': {
    id: 'permissions',
    label: 'Permisiuni',
    permission: 'permissions.view',
    category: 'admin',
    order: 120
  },

  // Management tabs
  'age_categories.view': {
    id: 'categories',
    label: 'Categorii',
    permission: 'age_categories.view',
    category: 'management',
    order: 50
  }
}

const PERMISSION_ALIASES: Record<string, string> = {
  'approval_requests.view': 'access_requests.view',
  'approval_requests.approve': 'access_requests.view',
  'requests.view.own': 'access_requests.view',
  'probes.view': 'events.view',
  'probes.manage': 'events.view',
  'probes.create': 'events.view',
  'probes.edit': 'events.view',
  'probes.delete': 'events.view'
}

/**
 * Generate tabs from user permissions
 * @param userPermissions Array of permission strings the user has
 * @returns Sorted array of tab configurations
 */
export function generateTabsFromPermissions(userPermissions: string[]): TabConfig[] {
  const tabs = new Map<string, TabConfig>()

  // Always include dashboard for logged-in users
  if (userPermissions.length > 0) {
    tabs.set('dashboard', PERMISSION_TO_TAB_MAP['dashboard.view'])
  }

  // Check if user has wildcard permission (superadmin)
  const hasAllPermissions = userPermissions.includes('*')
  
  if (hasAllPermissions) {
    // SuperAdmin gets all tabs
    return Object.values(PERMISSION_TO_TAB_MAP).sort((a, b) => a.order - b.order)
  }
  
  // For non-superadmin users, add tabs for each specific permission they have
  for (const permission of userPermissions) {
    const normalized = PERMISSION_ALIASES[permission] ?? permission
    if (PERMISSION_TO_TAB_MAP[normalized]) {
      const tabConfig = PERMISSION_TO_TAB_MAP[normalized]
      tabs.set(tabConfig.id, tabConfig)
    }
  }

  // Sort by order and return
  return Array.from(tabs.values()).sort((a, b) => a.order - b.order)
}

/**
 * Get which permission "unlocks" a tab
 */
export function getPermissionForTab(tabId: string): string | null {
  for (const [permission, config] of Object.entries(PERMISSION_TO_TAB_MAP)) {
    if (config.id === tabId) {
      return permission
    }
  }
  return null
}
