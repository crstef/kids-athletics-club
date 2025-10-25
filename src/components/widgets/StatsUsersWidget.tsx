import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, ArrowRight } from '@phosphor-icons/react'
import { StatWidget } from '../StatWidget'
import type { User } from '@/lib/types'

interface StatsUsersWidgetProps {
  users: User[]
  onNavigateToTab?: (tab: string) => void
}

export function StatsUsersWidget({ users, onNavigateToTab }: StatsUsersWidgetProps) {
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
      pendingApprovals
    }
  }, [users])

  const detailsContent = (
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

  return (
    <StatWidget
      title="Utilizatori"
      value={stats.totalUsers}
      icon={<Users size={24} weight="fill" />}
      iconColor="text-primary"
      subtitle={`${stats.activeUsers} ${stats.activeUsers === 1 ? 'activ' : 'activi'}`}
      detailsContent={detailsContent}
    />
  )
}
