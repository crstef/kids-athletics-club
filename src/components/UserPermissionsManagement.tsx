import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Trash, UserCheck, MagnifyingGlass, Check, X, Clock, Warning, ShieldCheck, Users as UsersIcon } from '@phosphor-icons/react'
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
  onApproveAccount: (requestId: string) => void
  onRejectAccount: (requestId: string, reason?: string) => void
  onUpdateUser: (userId: string, updates: Partial<User>) => void
}

export function UserPermissionsManagement({
  users,
  permissions,
  userPermissions,
  athletes,
  approvalRequests,
  currentUserId,
  onGrantPermission,
  onRevokePermission,
  onApproveAccount,
  onRejectAccount,
  onUpdateUser
}: UserPermissionsManagementProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [resourceType, setResourceType] = useState<'athlete' | 'all'>('all')
  const [resourceId, setResourceId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false)
  const [selectedRequestForRejection, setSelectedRequestForRejection] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false)
  const [selectedRequestForApproval, setSelectedRequestForApproval] = useState<string | null>(null)
  const [associateDialogOpen, setAssociateDialogOpen] = useState(false)
  const [selectedAthleteUser, setSelectedAthleteUser] = useState<User | null>(null)
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('')
  const [manageUserDialogOpen, setManageUserDialogOpen] = useState(false)
  const [selectedUserForManage, setSelectedUserForManage] = useState<User | null>(null)
  const [viewRequestDialogOpen, setViewRequestDialogOpen] = useState(false)
  const [selectedRequestForView, setSelectedRequestForView] = useState<AccountApprovalRequest | null>(null)
  const [activeTab, setActiveTab] = useState<'pending' | 'processed'>('pending')

  const activePermissions = useMemo(() => 
    permissions.filter(p => p.isActive),
    [permissions]
  )

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

  const selectedUser = users.find(u => u.id === selectedUserId)

  const userPermissionsForSelected = useMemo(() => {
    if (!selectedUserId) return []
    return userPermissions.filter(up => up.userId === selectedUserId)
  }, [userPermissions, selectedUserId])

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users.filter(u => u.id !== currentUserId)
    const query = searchQuery.toLowerCase()
    return users.filter(u => 
      u.id !== currentUserId &&
      (u.firstName.toLowerCase().includes(query) ||
       u.lastName.toLowerCase().includes(query) ||
       u.email.toLowerCase().includes(query))
    )
  }, [users, searchQuery, currentUserId])

  const handleGrantPermissions = () => {
    if (!selectedUserId || selectedPermissions.length === 0) {
      toast.error('Selectează utilizator și cel puțin o permisiune')
      return
    }

    selectedPermissions.forEach(permId => {
      onGrantPermission({
        userId: selectedUserId,
        permissionId: permId,
        resourceType: resourceType === 'all' ? undefined : resourceType,
        resourceId: resourceType === 'all' ? undefined : resourceId,
        grantedBy: currentUserId
      })
    })

    toast.success('Permisiuni acordate cu succes')
    setDialogOpen(false)
    setSelectedPermissions([])
    setResourceType('all')
    setResourceId('')
  }

  const handleRevoke = (id: string) => {
    if (confirm('Sigur vrei să revoci această permisiune?')) {
      onRevokePermission(id)
      toast.success('Permisiune revocată')
    }
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

    setSelectedRequestForApproval(requestId)
    setApprovalDialogOpen(true)
  }

  const handleConfirmApproval = () => {
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

    onApproveAccount(selectedRequestForApproval)
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

  const handleReject = () => {
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
    
    onRejectAccount(selectedRequestForRejection, rejectionReason || undefined)
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

  const handleOpenAssociate = (user: User) => {
    setSelectedAthleteUser(user)
    setSelectedAthleteId((user as any).athleteId || '')
    setAssociateDialogOpen(true)
  }

  const getPermissionName = (permId: string) => {
    const perm = permissions.find(p => p.id === permId)
    return perm?.description || 'Necunoscut'
  }

  const getAthleteName = (athleteId?: string) => {
    if (!athleteId) return null
    const athlete = athletes.find(a => a.id === athleteId)
    return athlete ? `${athlete.firstName} ${athlete.lastName}` : null
  }

  const handleOpenManageDialog = (user: User) => {
    setSelectedUserForManage(user)
    setManageUserDialogOpen(true)
  }

  const handleViewRequest = (request: AccountApprovalRequest) => {
    setSelectedRequestForView(request)
    setViewRequestDialogOpen(true)
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
              <CardHeader className="bg-gradient-to-r from-accent/10 to-accent/5">
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

                    return (
                      <div key={request.id} className="flex flex-col sm:flex-row sm:items-start justify-between p-5 border-2 border-accent/20 rounded-xl gap-4 bg-gradient-to-br from-card to-accent/5 hover:shadow-md transition-all">
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
                            {athleteName && (
                              <span className="text-sm bg-primary/10 px-3 py-1 rounded-full font-medium">
                                👤 Copil: <strong>{athleteName}</strong>
                              </span>
                            )}
                            {coach && (
                              <span className="text-sm bg-secondary/10 px-3 py-1 rounded-full font-medium">
                                🎓 Antrenor: <strong>{coach.firstName} {coach.lastName}</strong>
                              </span>
                            )}
                          </div>
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
                <CardTitle className="flex items-center gap-2">
                  <Check size={24} weight="fill" className="text-primary" />
                  Istoric Cereri Procesate
                </CardTitle>
                <CardDescription>
                  Ultimele 10 cereri aprobate sau respinse
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {processedRequests.map((request) => {
                    const user = users.find(u => u.id === request.userId)
                    const athleteName = getAthleteName(request.athleteId)
                    const approver = request.approvedBy ? users.find(u => u.id === request.approvedBy) : null
                    
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
                          <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                            {athleteName && <span>👤 Copil: {athleteName}</span>}
                            {request.responseDate && <span>📅 {new Date(request.responseDate).toLocaleString('ro-RO')}</span>}
                            {approver && <span>👤 De: {approver.firstName} {approver.lastName}</span>}
                          </div>
                          {request.rejectionReason && (
                            <div className="text-xs text-destructive mt-1 bg-destructive/10 p-2 rounded">
                              <strong>Motiv respingere:</strong> {request.rejectionReason}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewRequest(request)}
                          className="ml-4"
                        >
                          <MagnifyingGlass size={16} />
                        </Button>
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserCheck size={24} weight="fill" className="text-primary" />
                Permisiuni Utilizatori
              </CardTitle>
              <CardDescription>
                Acordă și revocă permisiuni pentru utilizatori
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus size={16} className="mr-2" />
                  Acordă Permisiuni
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Acordă Permisiuni</DialogTitle>
                  <DialogDescription>
                    Selectează utilizatorul și permisiunile pe care vrei să le acorzi
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Utilizator *</Label>
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectează utilizator" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredUsers.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.firstName} {user.lastName} ({user.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tip Acces</Label>
                    <Select value={resourceType} onValueChange={(v) => setResourceType(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Acces General</SelectItem>
                        <SelectItem value="athlete">Acces Specific Atlet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {resourceType === 'athlete' && (
                    <div className="space-y-2">
                      <Label>Atlet *</Label>
                      <Select value={resourceId} onValueChange={setResourceId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selectează atlet" />
                        </SelectTrigger>
                        <SelectContent>
                          {athletes.map(athlete => (
                            <SelectItem key={athlete.id} value={athlete.id}>
                              {athlete.firstName} {athlete.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Permisiuni *</Label>
                    <div className="border rounded-md p-4 space-y-3 max-h-[300px] overflow-y-auto">
                      {activePermissions.length === 0 ? (
                        <div className="text-sm text-muted-foreground text-center py-4">
                          Nu există permisiuni active
                        </div>
                      ) : (
                        activePermissions.map((perm) => (
                          <div key={perm.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={perm.id}
                              checked={selectedPermissions.includes(perm.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedPermissions([...selectedPermissions, perm.id])
                                } else {
                                  setSelectedPermissions(selectedPermissions.filter(id => id !== perm.id))
                                }
                              }}
                            />
                            <label
                              htmlFor={perm.id}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {perm.description}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setDialogOpen(false)
                    setSelectedPermissions([])
                    setResourceType('all')
                    setResourceId('')
                  }}>
                    Anulează
                  </Button>
                  <Button onClick={handleGrantPermissions}>
                    Acordă Permisiuni
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <MagnifyingGlass 
              size={20} 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
            />
            <Input
              placeholder="Caută utilizatori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilizator</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Permisiuni</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Niciun utilizator găsit
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => {
                    const userPerms = userPermissions.filter(up => up.userId === user.id)
                    const associatedAthlete = user.role === 'athlete' && (user as any).athleteId 
                      ? athletes.find(a => a.id === (user as any).athleteId)
                      : null
                    
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {user.email}
                            </div>
                            {associatedAthlete && (
                              <div className="text-xs text-primary mt-1">
                                🏃 Asociat: {associatedAthlete.firstName} {associatedAthlete.lastName}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? 'default' : 'secondary'}>
                            {user.isActive ? 'Activ' : 'Inactiv'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {userPerms.length === 0 ? (
                              <span className="text-sm text-muted-foreground">Nicio permisiune</span>
                            ) : (
                              userPerms.slice(0, 3).map((up) => (
                                <Badge key={up.id} variant="secondary" className="text-xs">
                                  {getPermissionName(up.permissionId)}
                                </Badge>
                              ))
                            )}
                            {userPerms.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{userPerms.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenManageDialog(user)}
                          >
                            Gestionează
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {selectedUser && userPermissionsForSelected.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Permisiuni pentru {selectedUser.firstName} {selectedUser.lastName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {userPermissionsForSelected.map((up) => {
                    const athleteName = getAthleteName(up.resourceId)
                    return (
                      <div key={up.id} className="flex items-center justify-between p-3 border rounded-md">
                        <div className="space-y-1">
                          <div className="font-medium text-sm">
                            {getPermissionName(up.permissionId)}
                          </div>
                          {athleteName && (
                            <div className="text-xs text-muted-foreground">
                              Pentru: {athleteName}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevoke(up.id)}
                        >
                          <Trash size={16} className="text-destructive" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Dialog open={manageUserDialogOpen} onOpenChange={setManageUserDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UsersIcon size={24} weight="fill" />
              Gestionează Utilizator
            </DialogTitle>
            <DialogDescription>
              Vizualizează și gestionează permisiunile utilizatorului
            </DialogDescription>
          </DialogHeader>
          {selectedUserForManage && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Informații Utilizator</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Nume</Label>
                      <p className="font-medium">{selectedUserForManage.firstName} {selectedUserForManage.lastName}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <p className="font-medium text-sm">{selectedUserForManage.email}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Rol</Label>
                      <Badge variant="outline" className="mt-1">{selectedUserForManage.role}</Badge>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <Badge variant={selectedUserForManage.isActive ? 'default' : 'secondary'} className="mt-1">
                        {selectedUserForManage.isActive ? 'Activ' : 'Inactiv'}
                      </Badge>
                    </div>
                  </div>
                  {selectedUserForManage.role === 'athlete' && (selectedUserForManage as any).athleteId && (() => {
                    const athlete = athletes.find(a => a.id === (selectedUserForManage as any).athleteId)
                    return athlete ? (
                      <div className="pt-3 border-t">
                        <Label className="text-xs text-muted-foreground">Profil Atlet Asociat</Label>
                        <div className="mt-1 flex items-center gap-2 bg-primary/10 p-3 rounded-lg">
                          <div className="text-3xl">🏃</div>
                          <div>
                            <p className="font-semibold">{athlete.firstName} {athlete.lastName}</p>
                            <p className="text-sm text-muted-foreground">{athlete.category} • {athlete.age} ani</p>
                          </div>
                        </div>
                      </div>
                    ) : null
                  })()}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Permisiuni Acordate</CardTitle>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedUserId(selectedUserForManage.id)
                        setDialogOpen(true)
                      }}
                    >
                      <Plus size={14} className="mr-1" />
                      Adaugă
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const userPerms = userPermissions.filter(up => up.userId === selectedUserForManage.id)
                    if (userPerms.length === 0) {
                      return (
                        <div className="text-center py-8 text-muted-foreground">
                          <ShieldCheck size={48} className="mx-auto mb-2 opacity-30" />
                          <p className="text-sm">Nu există permisiuni acordate</p>
                          <p className="text-xs mt-1">Apasă butonul "Adaugă" pentru a acorda permisiuni</p>
                        </div>
                      )
                    }
                    return (
                      <div className="space-y-2">
                        {userPerms.map((up) => {
                          const athleteName = getAthleteName(up.resourceId)
                          const grantedBy = users.find(u => u.id === up.grantedBy)
                          return (
                            <div key={up.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors">
                              <div className="space-y-1 flex-1">
                                <div className="font-medium text-sm flex items-center gap-2">
                                  <ShieldCheck size={16} className="text-primary" />
                                  {getPermissionName(up.permissionId)}
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-2">
                                  {athleteName && <span>📍 Pentru: {athleteName}</span>}
                                  {grantedBy && <span>👤 De: {grantedBy.firstName} {grantedBy.lastName}</span>}
                                  <span>📅 {new Date(up.grantedAt).toLocaleDateString('ro-RO')}</span>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRevoke(up.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash size={16} />
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>

              {selectedUserForManage.role === 'athlete' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Asociere Profil Atlet</CardTitle>
                    <CardDescription className="text-xs">
                      Conectează acest cont de utilizator cu profilul unui atlet din sistem
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        handleOpenAssociate(selectedUserForManage)
                        setManageUserDialogOpen(false)
                      }}
                    >
                      <UsersIcon size={16} className="mr-2" />
                      Asociază sau Schimbă Atletul
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setManageUserDialogOpen(false)
                setSelectedUserForManage(null)
              }}
            >
              Închide
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            const athleteName = getAthleteName(selectedRequestForView.athleteId)
            const coach = selectedRequestForView.coachId ? users.find(u => u.id === selectedRequestForView.coachId) : null
            const approver = selectedRequestForView.approvedBy ? users.find(u => u.id === selectedRequestForView.approvedBy) : null
            
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
                            <Label className="text-xs text-muted-foreground">Copil</Label>
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
                      {athlete.firstName} {athlete.lastName} ({athlete.category})
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
