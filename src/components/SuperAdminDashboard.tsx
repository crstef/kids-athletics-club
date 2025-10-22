import { useMemo, useState } from 'react'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Users, Trophy, Target, ShieldCheck, ArrowRight, Gear } from '@phosphor-icons/react'
import { StatWidget } from './StatWidget'
import type { User, Athlete, EventTypeCustom, Permission } from '@/lib/types'

type WidgetType = 
  | 'stats-users'
  | 'stats-athletes'
  | 'stats-events'
  | 'stats-permissions'

interface Widget {
  id: string
  type: WidgetType
  title: string
  size: 'small' | 'medium' | 'large' | 'xlarge'
  enabled: boolean
}

interface SuperAdminDashboardProps {
  users: User[]
  athletes: Athlete[]
  events: EventTypeCustom[]
  permissions: Permission[]
  onNavigateToTab?: (tab: string) => void
  onViewAthleteDetails?: (athlete: Athlete) => void
}

export function SuperAdminDashboard({ users, athletes, events, permissions, onNavigateToTab, onViewAthleteDetails }: SuperAdminDashboardProps) {
  const [widgets, setWidgets] = useLocalStorage<Widget[]>('superadmin-dashboard-widgets', [
    { id: 'w1', type: 'stats-users', title: 'Utilizatori', size: 'small', enabled: true },
    { id: 'w2', type: 'stats-athletes', title: 'Atleți Înregistrați', size: 'small', enabled: true },
    { id: 'w3', type: 'stats-events', title: 'Probe Sportive', size: 'small', enabled: true },
    { id: 'w4', type: 'stats-permissions', title: 'Permisiuni Active', size: 'small', enabled: true }
  ])
  const [customizeOpen, setCustomizeOpen] = useState(false)
  
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
      {onNavigateToTab && (
        <Button onClick={() => onNavigateToTab('users')} className="w-full mt-4">
          Mergi la Utilizatori <ArrowRight size={16} className="ml-2" />
        </Button>
      )}
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
            <div 
              key={athlete.id} 
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/5 hover:border-accent/50 transition-all cursor-pointer"
              onClick={() => onViewAthleteDetails?.(athlete)}
            >
              <div>
                <div className="font-medium">{athlete.firstName} {athlete.lastName}</div>
                <div className="text-sm text-muted-foreground">
                  {athlete.age} ani • Categoria {athlete.category}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{athlete.category}</Badge>
                <ArrowRight size={16} className="text-muted-foreground" />
              </div>
            </div>
          ))}
        {athletes.length === 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Niciun atlet înregistrat
          </div>
        )}
      </div>
      {onNavigateToTab && (
        <Button onClick={() => onNavigateToTab('athletes')} className="w-full mt-4">
          Mergi la Atleți <ArrowRight size={16} className="ml-2" />
        </Button>
      )}
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
      {onNavigateToTab && (
        <Button onClick={() => onNavigateToTab('events')} className="w-full mt-4">
          Mergi la Evenimente <ArrowRight size={16} className="ml-2" />
        </Button>
      )}
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
      {onNavigateToTab && (
        <Button onClick={() => onNavigateToTab('permissions')} className="w-full mt-4">
          Mergi la Permisiuni <ArrowRight size={16} className="ml-2" />
        </Button>
      )}
    </div>
  )

  const toggleWidget = (widgetId: string) => {
    setWidgets((current) => 
      (current || []).map(w => w.id === widgetId ? { ...w, enabled: !w.enabled } : w)
    )
  }

  const changeWidgetSize = (widgetId: string, size: Widget['size']) => {
    setWidgets((current) => 
      (current || []).map(w => w.id === widgetId ? { ...w, size } : w)
    )
  }

  const renderWidget = (widget: Widget) => {
    if (!widget.enabled) return null

    const sizeClasses = {
      small: 'col-span-1',
      medium: 'col-span-1 lg:col-span-2',
      large: 'col-span-1 lg:col-span-3',
      xlarge: 'col-span-1 lg:col-span-4'
    }

    switch (widget.type) {
      case 'stats-users':
        return (
          <div key={widget.id} className={sizeClasses[widget.size]}>
            <StatWidget
              title="Utilizatori"
              value={stats.totalUsers}
              icon={<Users size={24} weight="fill" />}
              iconColor="text-primary"
              subtitle={`${stats.activeUsers} ${stats.activeUsers === 1 ? 'activ' : 'activi'}`}
              detailsContent={usersDetails}
            />
          </div>
        )

      case 'stats-athletes':
        return (
          <div key={widget.id} className={sizeClasses[widget.size]}>
            <StatWidget
              title="Atleți Înregistrați"
              value={stats.athletes}
              icon={<Trophy size={24} weight="fill" />}
              iconColor="text-accent"
              subtitle={`${stats.athletes} ${stats.athletes === 1 ? 'copil în sistem' : 'copii în sistem'}`}
              detailsContent={athletesDetails}
            />
          </div>
        )

      case 'stats-events':
        return (
          <div key={widget.id} className={sizeClasses[widget.size]}>
            <StatWidget
              title="Probe Sportive"
              value={stats.events}
              icon={<Target size={24} weight="fill" />}
              iconColor="text-secondary"
              subtitle={`${stats.events} ${stats.events === 1 ? 'probă configurată' : 'probe configurate'}`}
              detailsContent={eventsDetails}
            />
          </div>
        )

      case 'stats-permissions':
        return (
          <div key={widget.id} className={sizeClasses[widget.size]}>
            <StatWidget
              title="Permisiuni Active"
              value={stats.permissions}
              icon={<ShieldCheck size={24} weight="fill" />}
              iconColor="text-green-500"
              subtitle={`${stats.permissions} ${stats.permissions === 1 ? 'drept acordat' : 'drepturi acordate'}`}
              detailsContent={permissionsDetails}
            />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 blur-3xl -z-10" />
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent" style={{ fontFamily: 'Outfit', letterSpacing: '-0.02em' }}>
              Dashboard SuperAdmin
            </h2>
            <p className="text-muted-foreground">
              Statistici generale și management sistem
            </p>
          </div>
          <Button variant="outline" onClick={() => setCustomizeOpen(true)}>
            <Gear size={16} className="mr-2" />
            Personalizează
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-auto">
        {(widgets || []).map(renderWidget)}
      </div>

      <Dialog open={customizeOpen} onOpenChange={setCustomizeOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Personalizează Dashboard</DialogTitle>
            <DialogDescription>
              Activează sau dezactivează widget-urile și ajustează dimensiunile
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {(widgets || []).map((widget) => (
              <div key={widget.id} className="flex items-center gap-4 p-4 border rounded-lg">
                <Checkbox
                  id={`widget-${widget.id}`}
                  checked={widget.enabled}
                  onCheckedChange={() => toggleWidget(widget.id)}
                />
                <Label htmlFor={`widget-${widget.id}`} className="flex-1 cursor-pointer">
                  <div className="font-medium">{widget.title}</div>
                  <div className="text-sm text-muted-foreground">{widget.type}</div>
                </Label>
                <Select
                  value={widget.size}
                  onValueChange={(value) => changeWidgetSize(widget.id, value as Widget['size'])}
                  disabled={!widget.enabled}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Mic</SelectItem>
                    <SelectItem value="medium">Mediu</SelectItem>
                    <SelectItem value="large">Mare</SelectItem>
                    <SelectItem value="xlarge">Foarte Mare</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <Users size={18} weight="fill" className="text-primary" />
            </div>
            Utilizatori Recenți
          </h3>
          <div className="space-y-3">
            {users
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 5)
              .map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/50 transition-colors">
                  <div>
                    <div className="font-medium text-sm">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {user.role === 'coach' ? 'Antrenor' : user.role === 'parent' ? 'Părinte' : user.role === 'athlete' ? 'Atlet' : 'Admin'}
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

        <Card className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <div className="p-1.5 bg-secondary/10 rounded-lg">
              <Target size={18} weight="fill" className="text-secondary" />
            </div>
            Probe Recente
          </h3>
          <div className="space-y-3">
            {events
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 5)
              .map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg hover:border-secondary/50 transition-colors">
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
              <div className="text-sm text-muted-foreground text-center py-8 border border-dashed rounded-lg">
                Nicio probă configurată
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
