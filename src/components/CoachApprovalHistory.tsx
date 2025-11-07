import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Clock } from '@phosphor-icons/react'
import type { User, Athlete, AccountApprovalRequest } from '@/lib/types'

interface CoachApprovalHistoryProps {
  coachId: string
  users: User[]
  athletes: Athlete[]
  approvalRequests: AccountApprovalRequest[]
  requestsOverride?: AccountApprovalRequest[]
}

export function CoachApprovalHistory({
  coachId,
  users,
  athletes,
  approvalRequests,
  requestsOverride
}: CoachApprovalHistoryProps) {
  const processedRequests = useMemo(() => {
    if (requestsOverride) {
      return requestsOverride
    }

    return approvalRequests
      .filter((request) => {
        if (request.status === 'pending') return false
        return request.coachId === coachId && (request.requestedRole === 'parent' || request.requestedRole === 'athlete')
      })
      .sort((a, b) => {
        const dateA = a.responseDate ? new Date(a.responseDate).getTime() : 0
        const dateB = b.responseDate ? new Date(b.responseDate).getTime() : 0
        return dateB - dateA
      })
      .slice(0, 15)
  }, [approvalRequests, coachId, requestsOverride])

  const getAthleteName = (athleteId?: string, fallbackName?: string | null) => {
    if (athleteId) {
      const athlete = athletes.find(a => a.id === athleteId)
      if (athlete) {
        return `${athlete.firstName} ${athlete.lastName}`
      }
    }
    return fallbackName || null
  }

  if (processedRequests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Istoric cereri procesate</CardTitle>
          <CardDescription>Ultimele 15 cereri de aprobare procesate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock size={48} className="mx-auto mb-2 opacity-50" weight="duotone" />
            <p>Nu există cereri procesate încă</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Istoric cereri procesate</CardTitle>
        <CardDescription>
          Ultimele 15 cereri de aprobare procesate (afișând {processedRequests.length})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {processedRequests.map((request) => {
            const user = users.find(u => u.id === request.userId)
            const isAthleteRequest = request.requestedRole === 'athlete'
            const athleteName = getAthleteName(request.athleteId, request.childName)

            const applicantName = user
              ? `${user.firstName} ${user.lastName}`
              : athleteName ?? 'Cont șters'

            return (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
              >
                <div className="flex items-center gap-3 flex-1">
                  {request.status === 'approved' ? (
                    <CheckCircle size={24} weight="fill" className="text-green-600 shrink-0" />
                  ) : (
                    <XCircle size={24} weight="fill" className="text-red-600 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{applicantName}</div>
                    <div className="text-sm text-muted-foreground">
                      {isAthleteRequest ? (
                        <>🏃 Atlet nou: {athleteName ?? applicantName}</>
                      ) : athleteName ? (
                        <>👤 Acces pentru: {athleteName}</>
                      ) : (
                        <>📋 Cerere de acces</>
                      )}
                    </div>
                    {request.responseDate && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(request.responseDate).toLocaleString('ro-RO', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <Badge
                  variant={request.status === 'approved' ? 'default' : 'destructive'}
                  className="shrink-0 ml-2"
                >
                  {request.status === 'approved' ? 'Aprobat' : 'Respins'}
                </Badge>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
