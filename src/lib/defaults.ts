import { PermissionName, Role } from './types';

export const DEFAULT_PERMISSIONS: PermissionName[] = [
  'athletes.view',
  'results.view',
  'events.view',
  'messages.create',
  'messages.view',
  'access_requests.create',
  'access_requests.view',
];

export const DEFAULT_ROLES: Omit<Role, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>[] = [
    {
        name: 'superadmin',
        displayName: 'Super Admin',
        description: 'Are acces la toate funcționalitățile sistemului.',
        isSystem: true,
        isActive: true,
        permissions: ['*'] as any, // Super admin has all permissions
    },
    {
        name: 'coach',
        displayName: 'Antrenor',
        description: 'Gestionează sportivii, rezultatele și evenimentele.',
        isSystem: true,
        isActive: true,
        permissions: [
            'athletes.create', 'athletes.view', 'athletes.edit',
            'results.create', 'results.view', 'results.edit', 'results.delete',
            'events.view',
            'messages.create', 'messages.view',
            'access_requests.view', 'access_requests.edit',
            'approvals.view', 'approvals.edit',
            'dashboard.view.coach',
        ],
    },
    {
        name: 'parent',
        displayName: 'Părinte',
        description: 'Vizualizează progresul sportivilor asociați.',
        isSystem: true,
        isActive: true,
        permissions: [
            'athletes.view',
            'results.view',
            'events.view',
            'messages.create', 'messages.view',
            'access_requests.create', 'access_requests.view',
            'dashboard.view.parent',
        ],
    },
    {
        name: 'athlete',
        displayName: 'Sportiv',
        description: 'Își vizualizează propriul profil și performanțele.',
        isSystem: true,
        isActive: true,
        permissions: [
            'athletes.view', // Self
            'results.view', // Self
            'events.view',
            'messages.view',
            'dashboard.view.athlete',
        ],
    },
];
