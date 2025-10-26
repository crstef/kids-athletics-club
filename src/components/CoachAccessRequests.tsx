import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Envelope } from '@phosphor-icons/react'
import type { Athlete, AccessRequest, User } from '@/lib/types'

interface CoachAccessRequestsProps {
  coachId: string
  mode?: 'coach' | 'admin'
  users: User[]
  athletes: Athlete[]
  parents: User[]
  accessRequests: AccessRequest[]
  onUpdateRequest: (id: string, status: 'approved' | 'rejected') => Promise<void> | void
}

export function CoachAccessRequests({ 
  coachId, 
  mode = 'coach',
  users,
  athletes,
  parents,
  accessRequests,
  onUpdateRequest 
}: CoachAccessRequestsProps) {
  const pendingRequests = useMemo(() => {
    const list = accessRequests.filter(r => r.status === 'pending')
    return mode === 'admin' ? list : list.filter(r => r.coachId === coachId)
  }, [accessRequests, coachId, mode])

  const processedRequests = useMemo(() => {
    const list = accessRequests.filter(r => r.status !== 'pending')
    return mode === 'admin' ? list : list.filter(r => r.coachId === coachId)
  }, [accessRequests, coachId, mode])

  const getCoachName = (coachIdValue?: string) => {
    if (!coachIdValue) return null
    const coach = users.find(u => u.id === coachIdValue)
    if (!coach) return null
    return `${coach.firstName} ${coach.lastName}`
  }

  const handleApprove = async (requestId: string) => {
    const request = accessRequests.find(r => r.id === requestId)
    if (!request) return
    await onUpdateRequest(requestId, 'approved')
  }

  const handleReject = async (requestId: string) => {
    const request = accessRequests.find(r => r.id === requestId)
    if (!request) return
    await onUpdateRequest(requestId, 'rejected')
  }

  if (pendingRequests.length === 0 && processedRequests.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          <Envelope size={48} className="mx-auto mb-2 opacity-50" />
          <p>Nu există cereri de acces</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Envelope size={24} />
              Cereri în Așteptare ({pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingRequests.map((request) => {
                const athlete = athletes.find(a => a.id === request.athleteId)
                const parent = parents.find(p => p.id === request.parentId)
                
                return (
                  <div key={request.id} className="p-4 border rounded-lg space-y-3">
                    <div className="space-y-1">
                      <div className="font-medium">
                        {parent?.firstName} {parent?.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Cere acces la datele: {athlete?.firstName} {athlete?.lastName}
                      </div>
                      {mode === 'admin' && request.coachId && (
                        <div className="text-xs text-muted-foreground">
                          Antrenor: {getCoachName(request.coachId) || '—'}
                        </div>
                      )}
                      {request.message && (
                        <div className="text-sm text-muted-foreground italic bg-muted p-2 rounded">
                          "{request.message}"
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Trimis: {new Date(request.requestDate).toLocaleDateString('ro-RO')}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(request.id)}
                        className="gap-1"
                      >
                        <CheckCircle size={16} />
                        Aprobă
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(request.id)}
                        className="gap-1"
                      >
                        <XCircle size={16} />
                        Respinge
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {processedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Istoric Cereri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {processedRequests.map((request) => {
                const athlete = athletes.find(a => a.id === request.athleteId)
                const parent = parents.find(p => p.id === request.parentId)
                
                return (
                  <div key={request.id} className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">
                        {parent?.firstName} {parent?.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Atlet: {athlete?.firstName} {athlete?.lastName}
                      </div>
                      {mode === 'admin' && request.coachId && (
                        <div className="text-xs text-muted-foreground">
                          Antrenor: {getCoachName(request.coachId) || '—'}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {new Date(request.requestDate).toLocaleDateString('ro-RO')}
                      </div>
                    </div>
                    <div>
                      {request.status === 'approved' ? (
                        <Badge className="gap-1 bg-secondary text-secondary-foreground">
                          <CheckCircle size={14} />Aprobat
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle size={14} />Respins
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
