import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserCircle, Eye, PencilSimple, LockKey, MagnifyingGlass, ShieldCheck } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { User, Permission, PermissionType, Athlete } from '@/lib/types'

interface PermissionsManagementProps {
  users: User[]
  athletes: Athlete[]
  permissions: Permission[]
  currentUserId: string
  onGrantPermission: (permission: Omit<Permission, 'id' | 'grantedAt'>) => void
  onRevokePermission: (id: string) => void
  onUpdateUserRole: (userId: string, role: 'coach' | 'parent' | 'athlete') => void
}

export function PermissionsManagement({
  users,
  athletes,
  permissions,
  currentUserId,
  onGrantPermission,
  onRevokePermission,
  onUpdateUserRole
}: PermissionsManagementProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [permDialogOpen, setPermDialogOpen] = useState(false)
  const [permType, setPermType] = useState<PermissionType>('view')
  const [resourceType, setResourceType] = useState<'athlete' | 'event' | 'result' | 'all'>('all')
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('')

  const nonAdminUsers = useMemo(() => {
    return users.filter(u => u.role !== 'superadmin')
  }, [users])

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return nonAdminUsers
    const query = searchQuery.toLowerCase()
    return nonAdminUsers.filter(u =>
      u.firstName.toLowerCase().includes(query) ||
      u.lastName.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query)
    )
  }, [nonAdminUsers, searchQuery])

  const getUserPermissions = (userId: string) => {
    return permissions.filter(p => p.userId === userId)
  }

  const getPermissionIcon = (type: PermissionType) => {
    switch (type) {
      case 'view': return <Eye size={16} />
      case 'edit': return <PencilSimple size={16} />
      case 'full': return <LockKey size={16} />
    }
  }

  const getPermissionLabel = (type: PermissionType) => {
    switch (type) {
      case 'view': return 'Vizualizare'
      case 'edit': return 'Editare'
      case 'full': return 'Control Complet'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'coach': return 'Antrenor'
      case 'parent': return 'Părinte'
      case 'athlete': return 'Atlet'
      default: return role
    }
  }

  const handleGrantPermission = () => {
    if (!selectedUser) return

    if (resourceType === 'athlete' && !selectedAthleteId) {
      toast.error('Selectează un atlet')
      return
    }

    onGrantPermission({
      userId: selectedUser.id,
      resourceType,
      resourceId: resourceType === 'athlete' ? selectedAthleteId : undefined,
      permissionType: permType,
      grantedBy: currentUserId
    })

    toast.success('Permisiune acordată')
    setPermDialogOpen(false)
    setSelectedUser(null)
    resetPermForm()
  }

  const resetPermForm = () => {
    setPermType('view')
    setResourceType('all')
    setSelectedAthleteId('')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Management Permisiuni</h2>
          <p className="text-muted-foreground">Gestionează drepturile utilizatorilor</p>
        </div>
        <ShieldCheck size={32} className="text-accent" weight="duotone" />
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Utilizatori</TabsTrigger>
          <TabsTrigger value="permissions">Toate Permisiunile</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="relative">
            <MagnifyingGlass
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Caută utilizator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <UserCircle size={64} weight="duotone" className="mx-auto mb-4" />
              <p>Niciun utilizator găsit</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredUsers.map((user) => {
                const userPerms = getUserPermissions(user.id)
                return (
                  <Card key={user.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserCircle size={24} className="text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                      <Badge variant="secondary">{getRoleLabel(user.role)}</Badge>
                    </div>

                    <div className="space-y-2">
                      <Label>Rol Utilizator</Label>
                      <Select
                        value={user.role}
                        onValueChange={(v) => onUpdateUserRole(user.id, v as any)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="coach">Antrenor</SelectItem>
                          <SelectItem value="parent">Părinte</SelectItem>
                          <SelectItem value="athlete">Atlet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Permisiuni ({userPerms.length})</Label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user)
                            setPermDialogOpen(true)
                          }}
                        >
                          Acordă
                        </Button>
                      </div>
                      {userPerms.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {userPerms.map((perm) => (
                            <Badge
                              key={perm.id}
                              variant="outline"
                              className="gap-1 pr-1"
                            >
                              {getPermissionIcon(perm.permissionType)}
                              <span className="text-xs">
                                {perm.resourceType === 'athlete' && perm.resourceId
                                  ? athletes.find(a => a.id === perm.resourceId)?.firstName || 'Atlet'
                                  : perm.resourceType}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => {
                                  onRevokePermission(perm.id)
                                  toast.success('Permisiune revocată')
                                }}
                              >
                                ×
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          {permissions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <LockKey size={64} weight="duotone" className="mx-auto mb-4" />
              <p>Nicio permisiune acordată încă</p>
            </div>
          ) : (
            <div className="space-y-2">
              {permissions.map((perm) => {
                const user = users.find(u => u.id === perm.userId)
                if (!user) return null
                return (
                  <Card key={perm.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary">{getRoleLabel(user.role)}</Badge>
                      <div>
                        <div className="font-medium">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="gap-1">
                        {getPermissionIcon(perm.permissionType)}
                        {getPermissionLabel(perm.permissionType)}
                      </Badge>
                      <Badge>
                        {perm.resourceType === 'athlete' && perm.resourceId
                          ? athletes.find(a => a.id === perm.resourceId)?.firstName || 'Atlet'
                          : perm.resourceType}
                      </Badge>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          onRevokePermission(perm.id)
                          toast.success('Permisiune revocată')
                        }}
                      >
                        Revocă
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={permDialogOpen} onOpenChange={setPermDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Acordă Permisiune - {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Tip Permisiune</Label>
              <Select value={permType} onValueChange={(v) => setPermType(v as PermissionType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">Vizualizare</SelectItem>
                  <SelectItem value="edit">Editare</SelectItem>
                  <SelectItem value="full">Control Complet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Resursă</Label>
              <Select value={resourceType} onValueChange={(v) => setResourceType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate</SelectItem>
                  <SelectItem value="athlete">Atlet Specific</SelectItem>
                  <SelectItem value="event">Probe</SelectItem>
                  <SelectItem value="result">Rezultate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {resourceType === 'athlete' && (
              <div className="space-y-2">
                <Label>Selectează Atlet</Label>
                <Select value={selectedAthleteId} onValueChange={setSelectedAthleteId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alege atlet..." />
                  </SelectTrigger>
                  <SelectContent>
                    {athletes.map((athlete) => (
                      <SelectItem key={athlete.id} value={athlete.id}>
                        {athlete.firstName} {athlete.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setPermDialogOpen(false)}>
                Anulează
              </Button>
              <Button onClick={handleGrantPermission}>Acordă Permisiune</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
