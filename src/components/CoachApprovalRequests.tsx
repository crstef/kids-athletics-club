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
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <Check size={24} weight="fill" />
            Cereri de Aprobare
          </CardTitle>
          <CardDescription>
            Cereri de acces de la părinți pentru copiii lor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Check size={48} className="mx-auto mb-2 opacity-50" weight="duotone" />
            <p>Toate cererile au fost procesate</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border-accent shadow-lg">
        <CardHeader className="bg-gradient-to-r from-accent/10 to-accent/5">
          <CardTitle className="flex items-center gap-2">
            <Clock size={24} weight="fill" className="text-accent" />
            Cereri de Aprobare
            <Badge variant="default" className="ml-2 animate-pulse">
              {pendingRequests.length} {pendingRequests.length === 1 ? 'cerere' : 'cereri'}
            </Badge>
          </CardTitle>
          <CardDescription>
            Părinți care solicită acces la datele copiilor lor
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {pendingRequests.map((request) => {
              const user = users.find(u => u.id === request.userId)
              const athleteName = getAthleteName(request.athleteId)
              
              if (!user) return null

              return (
                <div key={request.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-2 border-accent/20 rounded-xl gap-4 bg-gradient-to-br from-card to-accent/5 hover:shadow-md transition-all">
                  <div className="space-y-2 flex-1">
                    <div className="font-semibold text-lg">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                      📧 {user.email}
                    </div>
                    {athleteName && (
                      <div className="text-sm font-medium bg-primary/10 px-3 py-1.5 rounded-full inline-block mt-2">
                        👤 Solicită acces pentru: <strong>{athleteName}</strong>
                      </div>
                    )}
                    {request.approvalNotes && (
                      <div className="text-sm bg-muted p-3 rounded-lg border-l-4 border-accent mt-2">
                        <strong className="text-accent">Mesaj de la părinte:</strong>
                        <p className="mt-1 text-muted-foreground">{request.approvalNotes}</p>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-2">
                      📅 Cerere trimisă: <strong>{new Date(request.requestDate).toLocaleString('ro-RO')}</strong>
                    </div>
                  </div>
                  <div className="flex gap-2 sm:flex-col lg:flex-row shrink-0">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleOpenReject(request.id)}
                      className="gap-2"
                    >
                      <X size={16} />
                      Respinge
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleApprove(request.id)}
                      className="gap-2 bg-accent hover:bg-accent/90"
                    >
                      <Check size={16} weight="bold" />
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
