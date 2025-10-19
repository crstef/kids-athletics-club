import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Trophy, Target, ShieldCheck } from '@phosphor-icons/react'
import { StatWidget } from './StatWidget'
import type { User, Athlete, EventTypeCustom, Permission } from '@/lib/types'

interface SuperAdminDashboardProps {
  users: User[]
  athletes: Athlete[]
  events: EventTypeCustom[]
  permissions: Permission[]
}

export function SuperAdminDashboard({ users, athletes, events, permissions }: SuperAdminDashboardProps) {
  const stats = useMemo(() => {
    const coaches = users.filter(u => u.role === 'coach')
    const parents = users.filter(u => u.role === 'parent')
    const athleteUsers = users.filter(u => u.role === 'athlete')
    const totalUsers = coaches.length + parents.length + athleteUsers.length
    const activeUsers = users.filter(u => u.isActive).length
    const pendingApprovals = users.filter(u => u.needsApproval).length

    return {
      totalUsers,
      coaches,
      parents,
      athleteUsers,
      activeUsers,
      pendingApprovals,
      athletes: athletes.length,
      events: events.length,
      permissions: permissions.length
    }
  }, [users, athletes, events, permissions])

  const usersDetails = (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        Detalii despre utilizatorii din sistem
      </p>
      <div className="grid gap-3">
        <div className="p-4 border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Antrenori</span>
            <Badge variant="default">{stats.coaches.length}</Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            {stats.coaches.filter(c => c.isActive).length} activi
          </div>
        </div>
        <div className="p-4 border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Părinți</span>
            <Badge variant="default">{stats.parents.length}</Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            {stats.parents.filter(p => p.isActive).length} activi
          </div>
        </div>
        <div className="p-4 border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Atleți (utilizatori)</span>
            <Badge variant="default">{stats.athleteUsers.length}</Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            {stats.athleteUsers.filter(a => a.isActive).length} activi
          </div>
        </div>
        {stats.pendingApprovals > 0 && (
          <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/5">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Cereri Pending</span>
              <Badge variant="destructive">{stats.pendingApprovals}</Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              Necesită aprobare
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const athletesDetails = (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        Toți copiii înregistrați în sistem
      </p>
      <div className="space-y-2">
        {athletes
          .sort((a, b) => a.lastName.localeCompare(b.lastName))
          .map((athlete) => (
            <div key={athlete.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">{athlete.firstName} {athlete.lastName}</div>
                <div className="text-sm text-muted-foreground">
                  {athlete.age} ani • Categoria {athlete.category}
                </div>
              </div>
              <Badge variant="outline">{athlete.category}</Badge>
            </div>
          ))}
        {athletes.length === 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Niciun atlet înregistrat
          </div>
        )}
      </div>
    </div>
  )

  const eventsDetails = (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        Probe sportive configurate în sistem
      </p>
      <div className="space-y-2">
        {events.map((event) => (
          <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <div className="font-medium">{event.name}</div>
              <div className="text-sm text-muted-foreground">{event.category}</div>
            </div>
            <Badge variant="secondary">{event.unit}</Badge>
          </div>
        ))}
        {events.length === 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Nicio probă configurată
          </div>
        )}
      </div>
    </div>
  )

  const permissionsDetails = (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        Permisiuni active în sistem
      </p>
      <div className="space-y-2">
        {permissions.map((perm) => (
          <div key={perm.id} className="p-3 border rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <div className="font-medium">{perm.name}</div>
              <Badge variant={perm.isActive ? 'default' : 'secondary'}>
                {perm.isActive ? 'Activă' : 'Inactivă'}
              </Badge>
            </div>
            {perm.description && (
              <div className="text-sm text-muted-foreground">{perm.description}</div>
            )}
          </div>
        ))}
        {permissions.length === 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Nicio permisiune configurată
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Dashboard SuperAdmin</h2>
        <p className="text-muted-foreground">
          Statistici generale și management sistem
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatWidget
          title="Utilizatori"
          value={stats.totalUsers}
          icon={<Users size={20} weight="fill" />}
          iconColor="text-primary"
          subtitle={`${stats.activeUsers} activi`}
          detailsContent={usersDetails}
        />

        <StatWidget
          title="Atleți Înregistrați"
          value={stats.athletes}
          icon={<Trophy size={20} weight="fill" />}
          iconColor="text-accent"
          subtitle="Copii în sistem"
          detailsContent={athletesDetails}
        />

        <StatWidget
          title="Probe Sportive"
          value={stats.events}
          icon={<Target size={20} weight="fill" />}
          iconColor="text-secondary"
          subtitle="Probe configurate"
          detailsContent={eventsDetails}
        />

        <StatWidget
          title="Permisiuni Active"
          value={stats.permissions}
          icon={<ShieldCheck size={20} weight="fill" />}
          iconColor="text-green-500"
          subtitle="Drepturi acordate"
          detailsContent={permissionsDetails}
        />
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
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {user.role === 'coach' ? 'Antrenor' : user.role === 'parent' ? 'Părinte' : 'Atlet'}
                    </Badge>
                    {user.needsApproval && (
                      <Badge variant="destructive" className="text-xs">Pending</Badge>
                    )}
                  </div>
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
