import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users } from '@phosphor-icons/react'
import type { User } from '@/lib/types'

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
  )
}
