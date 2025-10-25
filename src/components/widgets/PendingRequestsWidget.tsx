import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck } from '@phosphor-icons/react'
import type { AccountApprovalRequest } from '@/lib/types'

interface PendingRequestsWidgetProps {
  requests: AccountApprovalRequest[]
}

export function PendingRequestsWidget({ requests }: PendingRequestsWidgetProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <ShieldCheck size={20} className="text-muted-foreground" />
          <h3 className="font-semibold">Cereri în Așteptare</h3>
        </div>
        {requests.length > 0 && (
          <Badge variant="destructive" className="animate-pulse">{requests.length}</Badge>
        )}
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {requests.map(request => (
            <li key={request.id} className="text-sm p-3 border rounded hover:bg-accent/5">
              <div className="font-medium">
                {request.childName || 'Utilizator nou'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Rol solicitat: {request.requestedRole}
              </div>
            </li>
          ))}
          {requests.length === 0 && (
            <li className="text-sm text-muted-foreground text-center py-4">
              Nicio cerere în așteptare
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  )
}
