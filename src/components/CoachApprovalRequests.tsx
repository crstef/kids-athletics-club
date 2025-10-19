import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Clock, Check, X } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { User, Athlete, AccountApprovalRequest } from '@/lib/types'

interface CoachApprovalRequestsProps {
  coachId: string
  users: User[]
  athletes: Athlete[]
  approvalRequests: AccountApprovalRequest[]
  onApproveAccount: (requestId: string) => void
  onRejectAccount: (requestId: string, reason?: string) => void
}

export function CoachApprovalRequests({
  coachId,
  users,
  athletes,
  approvalRequests,
  onApproveAccount,
  onRejectAccount
}: CoachApprovalRequestsProps) {
  const [rejectionReason, setRejectionReason] = useState('')
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedRequestId, setSelectedRequestId] = useState<string>('')

  const pendingRequests = useMemo(() => {
    return approvalRequests.filter(
      r => r.status === 'pending' && r.coachId === coachId && r.requestedRole === 'parent'
    )
  }, [approvalRequests, coachId])

  const getAthleteName = (athleteId?: string) => {
    if (!athleteId) return null
    const athlete = athletes.find(a => a.id === athleteId)
    return athlete ? `${athlete.firstName} ${athlete.lastName}` : null
  }

  const handleApprove = (requestId: string) => {
    const request = approvalRequests.find(r => r.id === requestId)
    if (!request) {
      toast.error('Cererea nu a fost găsită')
      return
    }

    if (request.status !== 'pending') {
      toast.error('Această cerere a fost deja procesată')
      return
    }

    onApproveAccount(requestId)
  }

  const handleOpenReject = (requestId: string) => {
    const request = approvalRequests.find(r => r.id === requestId)
    if (!request) {
      toast.error('Cererea nu a fost găsită')
      return
    }

    if (request.status !== 'pending') {
      toast.error('Această cerere a fost deja procesată')
      return
    }

    setSelectedRequestId(requestId)
    setRejectDialogOpen(true)
  }

  const handleReject = () => {
    if (!selectedRequestId) return

    const request = approvalRequests.find(r => r.id === selectedRequestId)
    if (!request) {
      toast.error('Cererea nu a fost găsită')
      setRejectDialogOpen(false)
      setRejectionReason('')
      setSelectedRequestId('')
      return
    }

    if (request.status !== 'pending') {
      toast.error('Această cerere a fost deja procesată')
      setRejectDialogOpen(false)
      setRejectionReason('')
      setSelectedRequestId('')
      return
    }

    onRejectAccount(selectedRequestId, rejectionReason)
    setRejectDialogOpen(false)
    setRejectionReason('')
    setSelectedRequestId('')
  }

  if (pendingRequests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock size={24} weight="fill" className="text-muted-foreground" />
            Cereri de Aprobare
          </CardTitle>
          <CardDescription>
            Cereri de acces de la părinți pentru copiii lor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock size={48} className="mx-auto mb-2 opacity-50" />
            <p>Nu există cereri în așteptare</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border-accent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock size={24} weight="fill" className="text-accent" />
            Cereri de Aprobare
            <Badge variant="default" className="ml-2">
              {pendingRequests.length}
            </Badge>
          </CardTitle>
          <CardDescription>
            Părinți care solicită acces la datele copiilor lor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingRequests.map((request) => {
              const user = users.find(u => u.id === request.userId)
              const athleteName = getAthleteName(request.athleteId)
              
              if (!user) return null

              return (
                <div key={request.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4 bg-card">
                  <div className="space-y-1 flex-1">
                    <div className="font-medium text-lg">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      📧 {user.email}
                    </div>
                    {athleteName && (
                      <div className="text-sm font-medium text-primary mt-2">
                        👤 Solicită acces pentru: <strong>{athleteName}</strong>
                      </div>
                    )}
                    {request.approvalNotes && (
                      <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded mt-2">
                        <strong>Mesaj:</strong> {request.approvalNotes}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-2">
                      📅 Cerere trimisă: {new Date(request.requestDate).toLocaleString('ro-RO')}
                    </div>
                  </div>
                  <div className="flex gap-2 sm:flex-col lg:flex-row">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleOpenReject(request.id)}
                    >
                      <X size={16} className="mr-2" />
                      Respinge
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleApprove(request.id)}
                    >
                      <Check size={16} className="mr-2" />
                      Aprobă
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Respinge Cerere</DialogTitle>
            <DialogDescription>
              Opțional, adaugă un motiv pentru respingere
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Motiv (opțional)</Label>
              <Input
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex: Vă rugăm să contactați direct..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setRejectDialogOpen(false)
                setRejectionReason('')
                setSelectedRequestId('')
              }}
            >
              Anulează
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Respinge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
