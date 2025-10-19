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
import { Plus, Trash, UserCheck, MagnifyingGlass, Check, X, Clock } from '@phosphor-icons/react'
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
  onRejectAccount
}: UserPermissionsManagementProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [resourceType, setResourceType] = useState<'athlete' | 'all'>('all')
  const [resourceId, setResourceId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')

  const activePermissions = useMemo(() => 
    permissions.filter(p => p.isActive),
    [permissions]
  )

  const pendingRequests = useMemo(() =>
    approvalRequests.filter(r => r.status === 'pending'),
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
    onApproveAccount(requestId)
    toast.success('Cont aprobat cu succes')
  }

  const handleReject = (requestId: string) => {
    onRejectAccount(requestId, rejectionReason)
    toast.success('Cont respins')
    setRejectionReason('')
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

  return (
    <div className="space-y-6">
      {pendingRequests.length > 0 && (
        <Card className="border-accent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock size={24} weight="fill" className="text-accent" />
              Cereri de Aprobare Cont
              <Badge variant="default" className="ml-2">
                {pendingRequests.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              Noi utilizatori așteaptă aprobarea contului
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingRequests.map((request) => {
                const user = users.find(u => u.id === request.userId)
                const athleteName = getAthleteName(request.athleteId)
                
                if (!user) return null

                return (
                  <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {user.email}
                      </div>
                      <div className="flex gap-2 items-center">
                        <Badge variant="outline">{request.requestedRole}</Badge>
                        {athleteName && (
                          <span className="text-sm text-muted-foreground">
                            Copil: {athleteName}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <X size={16} className="mr-2" />
                            Respinge
                          </Button>
                        </DialogTrigger>
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
                                placeholder="Ex: Date incomplete..."
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setRejectionReason('')}>
                              Anulează
                            </Button>
                            <Button variant="destructive" onClick={() => handleReject(request.id)}>
                              Respinge
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button size="sm" onClick={() => handleApprove(request.id)}>
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
      )}

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
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedUserId(user.id)}
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
    </div>
  )
}
