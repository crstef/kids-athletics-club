import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users } from '@phosphor-icons/react'
import type { User } from '@/lib/types'

const SAFE_ROLES = new Set(['superadmin', 'coach', 'parent', 'athlete'])

const getRoleLabel = (role: string | null | undefined): string => {
  if (!role) return 'Utilizator'
  if (SAFE_ROLES.has(role)) {
    switch (role) {
      case 'superadmin':
        return 'Admin'
      case 'coach':
        return 'Antrenor'
      case 'parent':
        return 'Părinte'
      case 'athlete':
        return 'Atlet'
    }
  }
  try {
    const parsed = JSON.parse(role)
    if (parsed && typeof parsed === 'object') {
      const candidate = (parsed as any).name ?? (parsed as any).label ?? (parsed as any).role
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        return candidate.trim()
      }
    }
  } catch (_error) {
    // Ignore JSON errors, fall back below
  }

  return typeof role === 'string' && role.trim().length > 0
    ? role.replace(/_/g, ' ')
    : 'Utilizator'
}

interface RecentUsersWidgetProps {
  users: User[]
}

export function RecentUsersWidget({ users }: RecentUsersWidgetProps) {
  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <div className="p-1.5 bg-primary/10 rounded-lg">
          <Users size={18} weight="fill" className="text-primary" />
        </div>
        Utilizatori Recenți
      </h3>
      <div className="space-y-3">
        {users
          .slice()
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
          .map((user) => (
            <div key={user.id ?? user.email ?? Math.random().toString(36)} className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/50 transition-colors">
              <div>
                <div className="font-medium text-sm">
                  {[user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'Utilizator'}
                </div>
                {user.email && (
                  <div className="text-xs text-muted-foreground break-all">{user.email}</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {getRoleLabel((user as any).role ?? (user as any).role_id ?? (user as any).roleName)}
                </Badge>
                {user.needsApproval && (
                  <Badge variant="destructive" className="text-xs animate-pulse">Pending</Badge>
                )}
              </div>
            </div>
          ))}
        {users.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-8 border border-dashed rounded-lg">
            Niciun utilizator înregistrat
          </div>
        )}
      </div>
    </Card>
  )
}
