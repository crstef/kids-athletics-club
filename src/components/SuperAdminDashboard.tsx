import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Trophy, Target, ShieldCheck } from '@phosphor-icons/react'
import type { User, Athlete, EventTypeCustom, Permission } from '@/lib/types'

interface SuperAdminDashboardProps {
  users: User[]
  athletes: Athlete[]
  events: EventTypeCustom[]
  permissions: Permission[]
}

export function SuperAdminDashboard({ users, athletes, events, permissions }: SuperAdminDashboardProps) {
  const stats = useMemo(() => {
    const coaches = users.filter(u => u.role === 'coach').length
    const parents = users.filter(u => u.role === 'parent').length
    const athleteUsers = users.filter(u => u.role === 'athlete').length
    const totalUsers = coaches + parents + athleteUsers

    return {
      totalUsers,
      coaches,
      parents,
      athleteUsers,
      athletes: athletes.length,
      events: events.length,
      permissions: permissions.length
    }
  }, [users, athletes, events, permissions])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Dashboard SuperAdmin</h2>
        <p className="text-muted-foreground">
          Statistici generale și management sistem
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-muted-foreground">Utilizatori</div>
            <Users size={20} className="text-primary" weight="duotone" />
          </div>
          <div className="text-3xl font-bold mb-3">{stats.totalUsers}</div>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {stats.coaches} Antrenori
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {stats.parents} Părinți
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {stats.athleteUsers} Atleți
            </Badge>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-muted-foreground">Atleți Înregistrați</div>
            <Trophy size={20} className="text-accent" weight="duotone" />
          </div>
          <div className="text-3xl font-bold">{stats.athletes}</div>
          <div className="text-sm text-muted-foreground mt-2">
            Copii în sistem
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-muted-foreground">Probe Sportive</div>
            <Target size={20} className="text-secondary" weight="duotone" />
          </div>
          <div className="text-3xl font-bold">{stats.events}</div>
          <div className="text-sm text-muted-foreground mt-2">
            Probe configurate
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-muted-foreground">Permisiuni Active</div>
            <ShieldCheck size={20} className="text-green-500" weight="duotone" />
          </div>
          <div className="text-3xl font-bold">{stats.permissions}</div>
          <div className="text-sm text-muted-foreground mt-2">
            Drepturi acordate
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Utilizatori Recenți</h3>
          <div className="space-y-3">
            {users
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 5)
              .map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {user.role === 'coach' ? 'Antrenor' : user.role === 'parent' ? 'Părinte' : 'Atlet'}
                  </Badge>
                </div>
              ))}
            {users.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-4">
                Niciun utilizator înregistrat
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Probe Recente</h3>
          <div className="space-y-3">
            {events
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 5)
              .map((event) => (
                <div key={event.id} className="flex items-center justify-between">
                  <div className="font-medium text-sm">{event.name}</div>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {event.category}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {event.unit}
                    </Badge>
                  </div>
                </div>
              ))}
            {events.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-4">
                Nicio probă configurată
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
