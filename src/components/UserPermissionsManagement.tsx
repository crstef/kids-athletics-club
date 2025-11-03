import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
 
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trash, MagnifyingGlass, Check, X, Clock, Warning } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { User, Permission, UserPermission, Athlete, AccountApprovalRequest } from '@/lib/types'

interface UserPermissionsManagementProps {
  users: User[]
  permissions: Permission[]
  userPermissions: UserPermission[]
  athletes: Athlete[]
  approvalRequests: AccountApprovalRequest[]
  currentUserId: string
  onGrantPermission: (perm: Omit<UserPermission, 'id' | 'grantedAt'>) => void
  onRevokePermission: (id: string) => void
  onApproveAccount: (requestId: string) => Promise<void>
  onRejectAccount: (requestId: string, reason?: string) => Promise<void>
  onUpdateUser: (userId: string, updates: Partial<User> & { currentPassword?: string }) => void
  onDeleteRequest?: (requestId: string) => Promise<void>
}

export function UserPermissionsManagement({
  users,
  permissions: _permissions,
  userPermissions: _userPermissions,
  athletes,
  approvalRequests,
  currentUserId: _currentUserId,
  onGrantPermission: _onGrantPermission,
  onRevokePermission: _onRevokePermission,
  onApproveAccount,
  onRejectAccount,
  onUpdateUser,
  onDeleteRequest
}: UserPermissionsManagementProps) {
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false)
  const [selectedRequestForRejection, setSelectedRequestForRejection] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false)
  const [selectedRequestForApproval, setSelectedRequestForApproval] = useState<string | null>(null)
  const [associateDialogOpen, setAssociateDialogOpen] = useState(false)
  const [selectedAthleteUser, setSelectedAthleteUser] = useState<User | null>(null)
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('')
  const [viewRequestDialogOpen, setViewRequestDialogOpen] = useState(false)
  const [selectedRequestForView, setSelectedRequestForView] = useState<AccountApprovalRequest | null>(null)
  const [activeTab, setActiveTab] = useState<'pending' | 'processed'>('pending')

  const pendingRequests = useMemo(() =>
    approvalRequests.filter(r => r.status === 'pending'),
    [approvalRequests]
  )

  const processedRequests = useMemo(() =>
    approvalRequests.filter(r => r.status !== 'pending').sort((a, b) => {
      const dateA = a.responseDate ? new Date(a.responseDate).getTime() : 0
      const dateB = b.responseDate ? new Date(b.responseDate).getTime() : 0
      return dateB - dateA
    }).slice(0, 10),
    [approvalRequests]
  )

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

    setSelectedRequestForApproval(requestId)
    setApprovalDialogOpen(true)
  }

  const handleConfirmApproval = async () => {
    if (!selectedRequestForApproval) return
    
    const request = approvalRequests.find(r => r.id === selectedRequestForApproval)
    if (!request) {
      toast.error('Cererea nu a fost găsită')
      setApprovalDialogOpen(false)
      setSelectedRequestForApproval(null)
      return
    }

    if (request.status !== 'pending') {
      toast.error('Această cerere a fost deja procesată')
      setApprovalDialogOpen(false)
      setSelectedRequestForApproval(null)
      return
    }

    await onApproveAccount(selectedRequestForApproval)
    setApprovalDialogOpen(false)
    setSelectedRequestForApproval(null)
  }

  const handleCancelApproval = () => {
    setApprovalDialogOpen(false)
    setSelectedRequestForApproval(null)
  }

  const handleOpenRejectDialog = (requestId: string) => {
    const request = approvalRequests.find(r => r.id === requestId)
    if (!request) {
      toast.error('Cererea nu a fost găsită')
      return
    }

    if (request.status !== 'pending') {
      toast.error('Această cerere a fost deja procesată')
      return
    }

    setSelectedRequestForRejection(requestId)
    setRejectionDialogOpen(true)
    setRejectionReason('')
  }

  const handleReject = async () => {
    if (!selectedRequestForRejection) return

    const request = approvalRequests.find(r => r.id === selectedRequestForRejection)
    if (!request) {
      toast.error('Cererea nu a fost găsită')
      setRejectionDialogOpen(false)
      setSelectedRequestForRejection(null)
      return
    }

    if (request.status !== 'pending') {
      toast.error('Această cerere a fost deja procesată')
      setRejectionDialogOpen(false)
      setSelectedRequestForRejection(null)
      return
    }
    
    await onRejectAccount(selectedRequestForRejection, rejectionReason || undefined)
    setRejectionDialogOpen(false)
    setSelectedRequestForRejection(null)
    setRejectionReason('')
  }

  const handleCancelReject = () => {
    setRejectionDialogOpen(false)
    setSelectedRequestForRejection(null)
    setRejectionReason('')
  }

  const handleAssociateAthlete = () => {
    if (!selectedAthleteUser || !selectedAthleteId) {
      toast.error('Selectează un atlet pentru asociere')
      return
    }

    onUpdateUser(selectedAthleteUser.id, {
      athleteId: selectedAthleteId
    } as any)

    toast.success('Atlet asociat cu succes')
    setAssociateDialogOpen(false)
    setSelectedAthleteUser(null)
    setSelectedAthleteId('')
  }

  

  const getAthleteName = (athleteId?: string, fallbackName?: string | null) => {
    if (athleteId) {
      const athlete = athletes.find(a => a.id === athleteId)
      if (athlete) {
        return `${athlete.firstName} ${athlete.lastName}`
      }
    }
    return fallbackName || null
  }

  const handleViewRequest = (request: AccountApprovalRequest) => {
    setSelectedRequestForView(request)
    setViewRequestDialogOpen(true)
  }

  const handleDeleteRequest = async (requestId: string) => {
    if (confirm('Sigur vrei să ștergi această cerere din istoric?')) {
      await onDeleteRequest?.(requestId)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'pending' | 'processed')} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="pending" className="gap-2">
              <Clock size={16} />
              Cereri de Aprobare
              {pendingRequests.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 rounded-full animate-pulse">
                  {pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="processed" className="gap-2">
              <Check size={16} />
              Istoric Procesate
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.length > 0 ? (
            <Card className="border-accent shadow-lg">
              <CardHeader className="bg-linear-to-r from-accent/10 to-accent/5">
                <CardTitle className="flex items-center gap-2">
                  <Warning size={24} weight="fill" className="text-accent" />
                  Cereri de Aprobare Cont
                  <Badge variant="default" className="ml-2 animate-pulse">
                    {pendingRequests.length} {pendingRequests.length === 1 ? 'cerere' : 'cereri'}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Noi utilizatori așteaptă aprobarea contului pentru a accesa sistemul
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {pendingRequests.map((request) => {
                    const user = users.find(u => u.id === request.userId)
                    const athleteName = getAthleteName(request.athleteId)
                    const coach = request.coachId ? users.find(u => u.id === request.coachId) : null
                    
                    if (!user) return null

                    const isProcessed = request.status !== 'pending'
                    const isUserActive = user.isActive && !user.needsApproval
                    const isAthleteRequest = request.requestedRole === 'athlete'

                    return (
                      <div key={request.id} className="flex flex-col sm:flex-row sm:items-start justify-between p-5 border-2 border-accent/20 rounded-xl gap-4 bg-linear-to-br from-card to-accent/5 hover:shadow-md transition-all">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="font-semibold text-lg">
                              {user.firstName} {user.lastName}
                            </div>
                            {isUserActive ? (
                              <Badge variant="default" className="ml-2">✓ Deja Activ</Badge>
                            ) : (
                              <Badge variant="secondary" className="ml-2">⏳ În Așteptare</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                            📧 {user.email}
                          </div>
                          <div className="flex gap-2 items-center flex-wrap">
                            <Badge variant="secondary" className="font-medium">
                              Rol: {request.requestedRole === 'coach' ? 'Antrenor' : request.requestedRole === 'parent' ? 'Părinte' : request.requestedRole === 'athlete' ? 'Atlet' : request.requestedRole}
                            </Badge>
                            {athleteName && !isAthleteRequest && (
                              <span className="text-sm bg-primary/10 px-3 py-1 rounded-full font-medium">
                                👤 Copil: <strong>{athleteName}</strong>
                              </span>
                            )}
                            {isAthleteRequest && (
                              <span className="text-sm bg-primary/10 px-3 py-1 rounded-full font-medium">
                                🏃 Atlet nou: <strong>{request.childName || `${user.firstName} ${user.lastName}`}</strong>
                              </span>
                            )}
                            {coach && (
                              <span className="text-sm bg-secondary/10 px-3 py-1 rounded-full font-medium">
                                🎓 Antrenor: <strong>{coach.firstName} {coach.lastName}</strong>
                              </span>
                            )}
                          </div>
                          {request.athleteProfile && (
                            <div className="text-sm bg-muted p-3 rounded-lg border-l-4 border-accent mt-2">
                              <strong className="text-accent">Detalii atlet:</strong>
                              <div className="mt-2 space-y-1 text-muted-foreground">
                                {request.athleteProfile.dateOfBirth && <p>📅 Data nașterii: {new Date(request.athleteProfile.dateOfBirth).toLocaleDateString('ro-RO')}</p>}
                                {request.athleteProfile.age !== undefined && <p>🎂 Vârstă estimată: {request.athleteProfile.age} ani</p>}
                                {request.athleteProfile.category && <p>🏷️ Categoria propusă: {request.athleteProfile.category}</p>}
                                <p>⚧ Gen: {request.athleteProfile.gender === 'F' ? 'Feminin' : 'Masculin'}</p>
                              </div>
                            </div>
                          )}
                          {request.approvalNotes && (
                            <div className="text-sm bg-muted p-3 rounded-lg border-l-4 border-accent mt-2">
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
                            onClick={() => handleViewRequest(request)}
                            className="gap-2"
                          >
                            <MagnifyingGlass size={16} />
                            Detalii
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleOpenRejectDialog(request.id)}
                            disabled={isProcessed || isUserActive}
                            className="gap-2 text-destructive hover:text-destructive"
                          >
                            <X size={16} />
                            Respinge
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => handleApprove(request.id)}
                            disabled={isProcessed || isUserActive}
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
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-muted-foreground">
                  <Check size={24} weight="fill" />
                  Cereri de Aprobare Cont
                </CardTitle>
                <CardDescription>
                  Nu există cereri de aprobare în așteptare
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Check size={64} className="mx-auto mb-4 opacity-30" weight="duotone" />
                  <p className="text-lg font-medium mb-2">Toate cererile au fost procesate</p>
                  <p className="text-sm">Când vor apărea cereri noi, le vei vedea aici</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="processed" className="space-y-4">
          {processedRequests.length > 0 ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Check size={24} weight="fill" className="text-primary" />
                      Istoric Cereri Procesate
                    </CardTitle>
                    <CardDescription>
                      Ultimele 10 cereri aprobate sau respinse
                    </CardDescription>
                  </div>
                  {onDeleteRequest && processedRequests.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Sigur vrei să ștergi toate cele ${processedRequests.length} cereri procesate din istoric?`)) {
                          processedRequests.forEach(req => onDeleteRequest(req.id))
                        }
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash size={16} className="mr-2" />
                      Șterge Istoric
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {processedRequests.map((request) => {
                    const user = users.find(u => u.id === request.userId)
                    const athleteName = getAthleteName(request.athleteId, request.childName)
                    const approver = request.approvedBy ? users.find(u => u.id === request.approvedBy) : null
                    const coach = request.coachId ? users.find(u => u.id === request.coachId) : null
                    const isAthleteRequest = request.requestedRole === 'athlete'
                    const roleLabel = request.requestedRole === 'coach' ? 'Antrenor' : request.requestedRole === 'parent' ? 'Părinte' : request.requestedRole === 'athlete' ? 'Atlet' : request.requestedRole

                    if (!user) return null

                    return (
                      <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="space-y-1 flex-1">
                          <div className="font-medium text-sm flex items-center gap-2">
                            {user.firstName} {user.lastName}
                            <Badge 
                              variant={request.status === 'approved' ? 'default' : 'destructive'} 
                              className="ml-2"
                            >
                              {request.status === 'approved' ? '✓ Aprobat' : '✗ Respins'}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {user.email}
                          </div>
                          <div className="text-xs flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" className="font-medium">
                              Rol: {roleLabel}
                            </Badge>
                            {isAthleteRequest && (
                              <span className="bg-primary/10 px-2 py-1 rounded-full font-medium">
                                🏃 Atlet nou: {request.childName || `${user.firstName} ${user.lastName}`}
                              </span>
                            )}
                            {!isAthleteRequest && athleteName && (
                              <span className="bg-primary/10 px-2 py-1 rounded-full font-medium">
                                👤 Copil: {athleteName}
                              </span>
                            )}
                            {coach && (
                              <span className="bg-secondary/10 px-2 py-1 rounded-full font-medium">
                                🎓 Antrenor: {coach.firstName} {coach.lastName}
                              </span>
                            )}
                          </div>
                          {request.athleteProfile && (
                            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg border-l-4 border-primary mt-2 space-y-1">
                              <p className="font-medium text-primary">Detalii atlet</p>
                              {request.athleteProfile.dateOfBirth && (
                                <p>📅 Data nașterii: {new Date(request.athleteProfile.dateOfBirth).toLocaleDateString('ro-RO')}</p>
                              )}
                              {request.athleteProfile.age !== undefined && (
                                <p>🎂 Vârstă estimată: {request.athleteProfile.age} ani</p>
                              )}
                              {request.athleteProfile.category && (
                                <p>🏷️ Categoria atribuită: {request.athleteProfile.category}</p>
                              )}
                              <p>⚧ Gen: {request.athleteProfile.gender === 'F' ? 'Feminin' : 'Masculin'}</p>
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap mt-2">
                            {request.responseDate && <span>📅 {new Date(request.responseDate).toLocaleString('ro-RO')}</span>}
                            {approver && <span>👤 De: {approver.firstName} {approver.lastName}</span>}
                          </div>
                          {request.rejectionReason && (
                            <div className="text-xs text-destructive mt-1 bg-destructive/10 p-2 rounded">
                              <strong>Motiv respingere:</strong> {request.rejectionReason}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewRequest(request)}
                          >
                            <MagnifyingGlass size={16} />
                          </Button>
                          {onDeleteRequest && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRequest(request.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash size={16} />
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-muted-foreground">
                  <Check size={24} weight="fill" />
                  Istoric Cereri
                </CardTitle>
                <CardDescription>
                  Nicio cerere procesată încă
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Clock size={64} className="mx-auto mb-4 opacity-30" weight="duotone" />
                  <p className="text-sm">Când vei procesa cereri, istoricul lor va apărea aici</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={viewRequestDialogOpen} onOpenChange={setViewRequestDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MagnifyingGlass size={24} />
              Detalii Cerere
            </DialogTitle>
          </DialogHeader>
          {selectedRequestForView && (() => {
            const user = users.find(u => u.id === selectedRequestForView.userId)
            const athleteName = getAthleteName(selectedRequestForView.athleteId, selectedRequestForView.childName)
            const coach = selectedRequestForView.coachId ? users.find(u => u.id === selectedRequestForView.coachId) : null
            const approver = selectedRequestForView.approvedBy ? users.find(u => u.id === selectedRequestForView.approvedBy) : null
            const isAthleteRequest = selectedRequestForView.requestedRole === 'athlete'
            
            if (!user) return <p className="text-muted-foreground">Utilizator negăsit</p>

            return (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Informații Utilizator</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Nume Complet</Label>
                        <p className="font-medium">{user.firstName} {user.lastName}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Email</Label>
                        <p className="font-medium text-sm">{user.email}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Rol Solicitat</Label>
                        <Badge variant="outline" className="mt-1">
                          {selectedRequestForView.requestedRole === 'coach' ? 'Antrenor' : 
                           selectedRequestForView.requestedRole === 'parent' ? 'Părinte' : 
                           selectedRequestForView.requestedRole === 'athlete' ? 'Atlet' : 
                           selectedRequestForView.requestedRole}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Status Cerere</Label>
                        <Badge 
                          variant={selectedRequestForView.status === 'approved' ? 'default' : 
                                 selectedRequestForView.status === 'rejected' ? 'destructive' : 
                                 'secondary'}
                          className="mt-1"
                        >
                          {selectedRequestForView.status === 'approved' ? '✓ Aprobat' : 
                           selectedRequestForView.status === 'rejected' ? '✗ Respins' : 
                           '⏳ În Așteptare'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {(athleteName || coach) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Relații</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {athleteName && (
                        <div className="flex items-center gap-2 bg-primary/10 p-3 rounded-lg">
                          <span className="text-2xl">👤</span>
                          <div>
                            <Label className="text-xs text-muted-foreground">{isAthleteRequest ? 'Atlet Nou' : 'Copil'}</Label>
                            <p className="font-medium">{athleteName}</p>
                          </div>
                        </div>
                      )}
                      {coach && (
                        <div className="flex items-center gap-2 bg-secondary/10 p-3 rounded-lg">
                          <span className="text-2xl">🎓</span>
                          <div>
                            <Label className="text-xs text-muted-foreground">Antrenor</Label>
                            <p className="font-medium">{coach.firstName} {coach.lastName}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {selectedRequestForView.athleteProfile && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Detalii Profil Atlet</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                      {selectedRequestForView.athleteProfile.dateOfBirth && (
                        <p>📅 Data nașterii: {new Date(selectedRequestForView.athleteProfile.dateOfBirth).toLocaleDateString('ro-RO')}</p>
                      )}
                      {selectedRequestForView.athleteProfile.age !== undefined && (
                        <p>🎂 Vârstă estimată: {selectedRequestForView.athleteProfile.age} ani</p>
                      )}
                      {selectedRequestForView.athleteProfile.category && (
                        <p>🏷️ Categoria propusă: {selectedRequestForView.athleteProfile.category}</p>
                      )}
                      <p>⚧ Gen: {selectedRequestForView.athleteProfile.gender === 'F' ? 'Feminin' : 'Masculin'}</p>
                    </CardContent>
                  </Card>
                )}

                {selectedRequestForView.approvalNotes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Mesaj Utilizator</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm bg-muted p-3 rounded-lg">{selectedRequestForView.approvalNotes}</p>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Cronologie</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Cerere Trimisă</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(selectedRequestForView.requestDate).toLocaleString('ro-RO')}
                        </p>
                      </div>
                    </div>
                    {selectedRequestForView.responseDate && (
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          selectedRequestForView.status === 'approved' ? 'bg-green-500' : 'bg-destructive'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {selectedRequestForView.status === 'approved' ? 'Aprobat' : 'Respins'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(selectedRequestForView.responseDate).toLocaleString('ro-RO')}
                            {approver && ` • De: ${approver.firstName} ${approver.lastName}`}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {selectedRequestForView.rejectionReason && (
                  <Card className="border-destructive">
                    <CardHeader>
                      <CardTitle className="text-base text-destructive">Motiv Respingere</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm bg-destructive/10 p-3 rounded-lg">
                        {selectedRequestForView.rejectionReason}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {selectedRequestForView.status === 'pending' && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      className="flex-1 text-destructive hover:text-destructive"
                      onClick={() => {
                        setViewRequestDialogOpen(false)
                        handleOpenRejectDialog(selectedRequestForView.id)
                      }}
                    >
                      <X size={16} className="mr-2" />
                      Respinge
                    </Button>
                    <Button
                      className="flex-1 bg-accent hover:bg-accent/90"
                      onClick={() => {
                        setViewRequestDialogOpen(false)
                        handleApprove(selectedRequestForView.id)
                      }}
                    >
                      <Check size={16} className="mr-2" />
                      Aprobă
                    </Button>
                  </div>
                )}
              </div>
            )
          })()}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setViewRequestDialogOpen(false)
                setSelectedRequestForView(null)
              }}
            >
              Închide
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={associateDialogOpen} onOpenChange={setAssociateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asociază Profil Atlet</DialogTitle>
            <DialogDescription>
              Selectează profilul de atlet din sistem pe care vrei să-l asociezi cu acest utilizator
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedAthleteUser && (
              <div className="bg-muted p-3 rounded-lg">
                <div className="font-medium">
                  Utilizator: {selectedAthleteUser.firstName} {selectedAthleteUser.lastName}
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedAthleteUser.email}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Selectează Profil Atlet *</Label>
              <Select value={selectedAthleteId} onValueChange={setSelectedAthleteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectează atlet..." />
                </SelectTrigger>
                <SelectContent>
                  {athletes.map((athlete) => (
                    <SelectItem key={athlete.id} value={athlete.id}>
                      {`${athlete.firstName} ${athlete.lastName} (${athlete.category})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Acest utilizator va avea acces la datele atletului selectat
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAssociateDialogOpen(false)
                setSelectedAthleteUser(null)
                setSelectedAthleteId('')
              }}
            >
              Anulează
            </Button>
            <Button onClick={handleAssociateAthlete}>
              Asociază
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmă Aprobarea</DialogTitle>
            <DialogDescription>
              Ești sigur că vrei să aprobi această cerere?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedRequestForApproval && (() => {
              const request = approvalRequests.find(r => r.id === selectedRequestForApproval)
              const user = request ? users.find(u => u.id === request.userId) : null
              const athleteName = request ? getAthleteName(request.athleteId) : null
              const coach = request?.coachId ? users.find(u => u.id === request.coachId) : null
              
              return (
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  {user && (
                    <>
                      <div className="font-medium">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Email: {user.email}
                      </div>
                      <div className="text-sm">
                        Rol: <Badge variant="outline">{request?.requestedRole}</Badge>
                      </div>
                      {athleteName && (
                        <div className="text-sm text-muted-foreground">
                          👤 Copil: <strong>{athleteName}</strong>
                        </div>
                      )}
                      {coach && (
                        <div className="text-sm text-muted-foreground">
                          🎓 Antrenor: <strong>{coach.firstName} {coach.lastName}</strong>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })()}
            <p className="text-sm text-muted-foreground">
              Utilizatorul va primi acces complet la sistem și va putea să se autentifice.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelApproval}>
              Anulează
            </Button>
            <Button onClick={handleConfirmApproval}>
              <Check size={16} className="mr-2" />
              Aprobă Contul
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
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
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex: Date incomplete, informații lipsă..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelReject}>
              Anulează
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Respinge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
