import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Clock, Check, X } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { User, Athlete, AccountApprovalRequest } from '@/lib/types'

interface CoachApprovalRequestsProps {
  coachId: string
  mode?: 'coach' | 'admin'
  users: User[]
  athletes: Athlete[]
  approvalRequests: AccountApprovalRequest[]
  onApproveAccount: (requestId: string) => Promise<void>
  onRejectAccount: (requestId: string, reason?: string) => Promise<void>
}

export function CoachApprovalRequests({
  coachId,
  mode = 'coach',
  users,
  athletes,
  approvalRequests,
  onApproveAccount,
  onRejectAccount
}: CoachApprovalRequestsProps) {
  const [rejectionReason, setRejectionReason] = useState('')
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedRequestId, setSelectedRequestId] = useState<string>('')
  const isCoachMode = mode === 'coach'

  const pendingRequests = useMemo(() => {
    return approvalRequests.filter((request) => {
      if (request.status !== 'pending') return false

      if (mode === 'admin') {
        return true
      }

      return request.coachId === coachId && (request.requestedRole === 'parent' || request.requestedRole === 'athlete')
    })
  }, [approvalRequests, coachId, mode])

  const getAthleteName = (athleteId?: string, fallbackName?: string | null) => {
    if (athleteId) {
      const athlete = athletes.find(a => a.id === athleteId)
      if (athlete) {
        return `${athlete.firstName} ${athlete.lastName}`
      }
    }
    return fallbackName || null
  }

  const getCoachName = (coachIdValue?: string) => {
    if (!coachIdValue) return null
    const coach = users.find(u => u.id === coachIdValue)
    if (!coach) return null
    return `${coach.firstName} ${coach.lastName}`
  }

  const handleApprove = async (requestId: string) => {
    const request = approvalRequests.find(r => r.id === requestId)
    if (!request) {
      toast.error('Cererea nu a fost găsită')
      return
    }

    if (request.status !== 'pending') {
      toast.error('Această cerere a fost deja procesată')
      return
    }

    await onApproveAccount(requestId)
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

  const handleReject = async () => {
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

    await onRejectAccount(selectedRequestId, rejectionReason)
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
            {mode === 'admin'
              ? 'Nu există cereri de aprobare în așteptare'
              : 'Nu există cereri de aprobare în așteptare de la părinți sau atleți'}
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
      <Card className={cn('shadow-sm', isCoachMode ? 'border border-border bg-card/95' : 'border-accent shadow-lg')}>
        <CardHeader className={cn(isCoachMode ? 'bg-transparent pb-4' : 'bg-linear-to-r from-accent/10 to-accent/5')}>
          <CardTitle className={cn('flex items-center gap-2', isCoachMode ? 'text-lg' : '')}>
            <Clock size={22} weight="fill" className={cn(isCoachMode ? 'text-primary' : 'text-accent')} />
            {mode === 'admin' ? 'Cereri de Aprobare' : 'Cereri în așteptare'}
            <Badge variant={isCoachMode ? 'secondary' : 'default'} className="ml-2">
              {pendingRequests.length} {pendingRequests.length === 1 ? 'cerere' : 'cereri'}
            </Badge>
          </CardTitle>
          <CardDescription className={isCoachMode ? 'text-sm text-muted-foreground/90' : undefined}>
            {mode === 'admin'
              ? 'Cereri de aprobare trimise de utilizatori în așteptarea procesării'
              : 'Solicitări de la părinți sau atleți care necesită aprobarea ta'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            {pendingRequests.map((request) => {
              const user = users.find(u => u.id === request.userId)
              const isAthleteRequest = request.requestedRole === 'athlete'
              const athleteName = getAthleteName(request.athleteId, request.childName)
              const coachName = getCoachName(request.coachId)
              const profile = request.athleteProfile

              const applicantName = user
                ? `${user.firstName} ${user.lastName}`
                : athleteName ?? 'Cont nou înregistrat'

              const applicantEmail = user?.email ?? 'Cerere în curs de confirmare'

              return (
                <div
                  key={request.id}
                  className={cn(
                    'flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl p-5 transition-colors',
                    isCoachMode
                      ? 'border border-border bg-background/60 hover:border-accent/60'
                      : 'border-2 border-accent/20 bg-linear-to-br from-card to-accent/5 hover:shadow-md'
                  )}
                >
                  <div className="space-y-2 flex-1">
                    <div className="font-semibold text-lg leading-tight">
                      {applicantName}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                      � {applicantEmail}
                    </div>
                    {athleteName && !isAthleteRequest && (
                      <div className="text-sm font-medium bg-primary/10 px-3 py-1.5 rounded-full inline-block mt-1">
                        👤 Solicită acces pentru: <strong>{athleteName}</strong>
                      </div>
                    )}
                    {isAthleteRequest && (
                      <div className="text-sm font-medium bg-primary/10 px-3 py-1.5 rounded-full inline-block mt-1">
                        🏃 Atlet nou: <strong>{athleteName ?? applicantName}</strong>
                      </div>
                    )}
                    {mode === 'admin' && coachName && (
                      <div className="text-sm text-muted-foreground">
                        🧑‍🏫 Antrenor: <strong>{coachName}</strong>
                      </div>
                    )}
                    {profile && (
                      <div className="text-sm bg-muted/60 p-3 rounded-lg border border-dashed border-accent/40 mt-2">
                        <strong className="text-accent">Detalii atlet:</strong>
                        <div className="mt-2 space-y-1 text-muted-foreground">
                          {profile.dateOfBirth && <p>📅 Data nașterii: {new Date(profile.dateOfBirth).toLocaleDateString('ro-RO')}</p>}
                          {profile.age !== undefined && <p>🎂 Vârstă estimată: {profile.age} ani</p>}
                          {profile.category && <p>🏷️ Categoria propusă: {profile.category}</p>}
                          <p>⚧ Gen: {profile.gender === 'F' ? 'Feminin' : 'Masculin'}</p>
                        </div>
                      </div>
                    )}
                    {request.approvalNotes && (
                      <div className="text-sm bg-muted/60 p-3 rounded-lg border border-dashed border-accent/40 mt-2">
                        <strong className="text-accent">Mesaj de la utilizator:</strong>
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
