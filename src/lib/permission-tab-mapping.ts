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
  'probes.view': {
    id: 'probes',
    label: 'Probe',
    permission: 'probes.view',
    category: 'data',
    order: 20
  },

  // Communication tabs
  'approval_requests.view': {
    id: 'approvals',
    label: 'Aprobări',
    permission: 'approval_requests.view',
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

export const PERMISSION_ALIASES: Record<string, string> = {
  'approval_requests.view.own': 'approval_requests.view',
  'approval_requests.approve': 'approval_requests.view',
  'approval_requests.approve.own': 'approval_requests.view',
  'requests.view.all': 'approval_requests.view',
  'requests.view.own': 'approval_requests.view',
  'events.view': 'probes.view',
  'events.manage': 'probes.view',
  'events.create': 'probes.view',
  'events.edit': 'probes.view',
  'events.delete': 'probes.view'
}

const REVERSE_PERMISSION_ALIASES = Object.entries(PERMISSION_ALIASES).reduce<Record<string, string[]>>((acc, [alias, target]) => {
  if (!acc[target]) {
    acc[target] = []
  }
  acc[target].push(alias)
  return acc
}, {})

const PERMISSION_EQUIVALENTS: Record<string, string[]> = {
  'probes.view': ['events.view'],
  'events.view': ['probes.view'],
  'probes.create': ['events.create', 'events.manage'],
  'events.create': ['probes.create', 'events.manage'],
  'probes.edit': ['events.edit', 'events.manage'],
  'events.edit': ['probes.edit', 'events.manage'],
  'probes.delete': ['events.delete', 'events.manage'],
  'events.delete': ['probes.delete', 'events.manage'],
  'events.manage': ['probes.view', 'probes.create', 'probes.edit', 'probes.delete'],
  'dashboard.view': [
    'dashboard.view.superadmin',
    'dashboard.view.coach',
    'dashboard.view.parent',
    'dashboard.view.athlete'
  ],
  'dashboard.view.superadmin': ['dashboard.view'],
  'dashboard.view.coach': ['dashboard.view'],
  'dashboard.view.parent': ['dashboard.view'],
  'dashboard.view.athlete': ['dashboard.view']
}

const OWN_SUFFIX = '.own'
const ALL_SUFFIX = '.all'

const collectEquivalentPermissions = (permission: string): Set<string> => {
  const collected = new Set<string>()
  const stack: string[] = [permission]

  while (stack.length > 0) {
    const candidate = stack.pop()!
    if (!candidate || collected.has(candidate)) continue

    collected.add(candidate)

    if (candidate.endsWith(OWN_SUFFIX)) {
      stack.push(candidate.slice(0, -OWN_SUFFIX.length))
    }

    if (candidate.endsWith(ALL_SUFFIX)) {
      stack.push(candidate.slice(0, -ALL_SUFFIX.length))
    }

    const directAlias = PERMISSION_ALIASES[candidate]
    if (directAlias) stack.push(directAlias)

    const reverseAliases = REVERSE_PERMISSION_ALIASES[candidate]
    if (reverseAliases) {
      for (const reverseAlias of reverseAliases) {
        stack.push(reverseAlias)
      }
    }

    const equivalents = PERMISSION_EQUIVALENTS[candidate]
    if (equivalents) {
      for (const equivalent of equivalents) {
        stack.push(equivalent)
      }
    }
  }

  return collected
}

export function hasPermissionFromList(permission: string, userPermissions: string[]): boolean {
  if (!Array.isArray(userPermissions) || userPermissions.length === 0) return false
  if (userPermissions.includes('*')) return true

  const collected = collectEquivalentPermissions(permission)
  for (const candidate of collected) {
    if (userPermissions.includes(candidate)) {
      return true
    }
  }

  return false
}

export const userHasPermissionForTab = hasPermissionFromList

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
