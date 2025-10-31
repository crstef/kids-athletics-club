import { FormEvent, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MagnifyingGlass, Plus, PencilSimple, Trash, Eye, EyeSlash, CheckCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Role, User, UserRole } from '@/lib/types'
import { resolveMediaUrl } from '@/lib/media'
import { getAvatarColor, getInitials } from '@/lib/constants'
import { AvatarUploadControl, type AvatarUploadChangePayload } from './AvatarUploadControl'

interface UserManagementProps {
  users: User[]
  roles: Role[]
  currentUserId: string
  onAddUser: (userData: Omit<User, 'id' | 'createdAt'> & { avatarDataUrl?: string }) => void
  onUpdateUser: (userId: string, userData: Partial<User> & { avatarDataUrl?: string }) => void
  onDeleteUser: (userId: string) => void
}

export function UserManagement({ users, roles, currentUserId, onAddUser, onUpdateUser, onDeleteUser }: UserManagementProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [role, setRole] = useState<UserRole>('parent')
  const [specialization, setSpecialization] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [needsApproval, setNeedsApproval] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [deleteAvatar, setDeleteAvatar] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')

  const preferredRole = useMemo(() => {
    const activeRoles = roles.filter((r) => r.isActive)
    const parentRole = activeRoles.find((r) => r.name === 'parent')
    return (parentRole?.name || activeRoles[0]?.name || 'parent') as UserRole
  }, [roles])

  const filteredUsers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    const list = users.filter((user) => {
      const matchesQuery = !normalizedQuery
        ? true
        : [user.email, user.firstName, user.lastName, user.role]
            .filter(Boolean)
            .some((token) => token.toLowerCase().includes(normalizedQuery))

      const matchesRole = roleFilter === 'all' ? true : user.role === roleFilter

      return matchesQuery && matchesRole
    })

    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [users, searchQuery, roleFilter])

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setFirstName('')
    setLastName('')
    setRole(preferredRole)
    setSpecialization('')
    setIsActive(true)
    setNeedsApproval(false)
    setShowPassword(false)
    setAvatarDataUrl(null)
    setAvatarPreview(null)
    setDeleteAvatar(false)
    setSelectedUser(null)
  }

  const handleAvatarChange = ({ dataUrl, previewUrl }: AvatarUploadChangePayload) => {
    setAvatarDataUrl(dataUrl)
    setAvatarPreview(previewUrl)
    setDeleteAvatar(selectedUser ? !previewUrl : false)
  }

  const handleOpenAdd = () => {
    resetForm()
    setAddDialogOpen(true)
  }

  const handleOpenEdit = (user: User) => {
    setSelectedUser(user)
    setEmail(user.email)
    setPassword('')
    setFirstName(user.firstName)
    setLastName(user.lastName)
    setRole(user.role)
    setSpecialization((user as any).specialization || '')
    setIsActive(user.isActive)
    setNeedsApproval(Boolean(user.needsApproval))
    setShowPassword(false)
    setAvatarDataUrl(null)
    setAvatarPreview(user.avatar ? resolveMediaUrl(user.avatar) : null)
    setDeleteAvatar(false)
    setEditDialogOpen(true)
  }

  const handleOpenDelete = (user: User) => {
    setSelectedUser(user)
    setDeleteDialogOpen(true)
  }

  const handleAdd = (event: FormEvent) => {
    event.preventDefault()

    if (!email.trim() || !password || !firstName.trim() || !lastName.trim()) {
      toast.error('Completează toate câmpurile obligatorii')
      return
    }

    if (password.length < 6) {
      toast.error('Parola trebuie să aibă minim 6 caractere')
      return
    }

    const emailExists = users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())
    if (emailExists) {
      toast.error('Emailul este deja înregistrat')
      return
    }

    const payload: Omit<User, 'id' | 'createdAt'> & { avatarDataUrl?: string } = {
      email: email.trim(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role,
      isActive,
      needsApproval,
    }

    if (avatarDataUrl) {
      payload.avatarDataUrl = avatarDataUrl
    }

    if (role === 'coach' && specialization.trim()) {
      ;(payload as any).specialization = specialization.trim()
    }

    onAddUser(payload)
    setAddDialogOpen(false)
    resetForm()
  }

  const handleEdit = (event: FormEvent) => {
    event.preventDefault()

    if (!selectedUser) {
      toast.error('Nu există utilizator selectat')
      return
    }

    if (!email.trim() || !firstName.trim() || !lastName.trim()) {
      toast.error('Completează toate câmpurile obligatorii')
      return
    }

    if (password && password.length < 6) {
      toast.error('Parola trebuie să aibă minim 6 caractere')
      return
    }

    const emailExists = users.some(
      (u) => u.id !== selectedUser.id && u.email.toLowerCase() === email.trim().toLowerCase()
    )

    if (emailExists) {
      toast.error('Emailul este deja folosit de alt utilizator')
      return
    }

    const payload: Partial<User> & { avatarDataUrl?: string } = {
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role,
      isActive,
      needsApproval,
    }

    if (password) {
      payload.password = password
    }

    if (role === 'coach') {
      ;(payload as any).specialization = specialization.trim() || undefined
    }

    if (avatarDataUrl) {
      payload.avatarDataUrl = avatarDataUrl
    } else if (deleteAvatar) {
      payload.avatar = ''
    }

    onUpdateUser(selectedUser.id, payload)
    setEditDialogOpen(false)
    resetForm()
  }

  const handleActivate = (user: User) => {
    if (!user.isActive) {
      onUpdateUser(user.id, { isActive: true, needsApproval: false })
    }
  }

  const handleDelete = () => {
    if (!selectedUser) return

    if (selectedUser.id === currentUserId) {
      toast.error('Nu te poți șterge pe tine însuți!')
      return
    }

    if (selectedUser.role === 'superadmin') {
      toast.error('Nu poți șterge un cont de SuperAdmin!')
      return
    }

    onDeleteUser(selectedUser.id)
    setDeleteDialogOpen(false)
    resetForm()
  }

  const getRoleBadge = (roleName: UserRole) => {
    if (roleName.toLowerCase().includes('admin')) {
      return <Badge variant="default">{roleName}</Badge>
    }

    if (roleName.toLowerCase().includes('coach') || roleName.toLowerCase().includes('antrenor')) {
      return <Badge variant="secondary">{roleName}</Badge>
    }

    if (roleName.toLowerCase().includes('parent') || roleName.toLowerCase().includes('părinte')) {
      return <Badge variant="outline">{roleName}</Badge>
    }

    if (roleName.toLowerCase().includes('athlete') || roleName.toLowerCase().includes('atlet')) {
      return <Badge className="bg-accent text-accent-foreground">{roleName}</Badge>
    }

    return <Badge className="bg-blue-500 text-white">{roleName}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Management Utilizatori</h2>
          <p className="text-muted-foreground">Administrează utilizatorii și rolurile acestora</p>
        </div>
        <Button onClick={handleOpenAdd} className="gap-2">
          <Plus size={16} />
          Adaugă Utilizator
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <MagnifyingGlass
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Caută utilizator..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as UserRole | 'all')}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filtru rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate rolurile</SelectItem>
            {roles
              .filter((role) => role.isActive)
              .map((role) => (
                <SelectItem key={role.id} value={role.name}>
                  {role.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utilizator</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Data Înregistrării</TableHead>
              <TableHead className="text-right">Acțiuni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  {searchQuery || roleFilter !== 'all'
                    ? 'Niciun utilizator găsit cu filtrele curente'
                    : 'Niciun utilizator în sistem'}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => {
                const avatarSrc = user.avatar ? resolveMediaUrl(user.avatar) : null
                const initials = getInitials(user.firstName, user.lastName)
                const fallbackColor = getAvatarColor(user.id)

                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          {avatarSrc ? (
                            <AvatarImage src={avatarSrc} alt={`${user.firstName} ${user.lastName}`} />
                          ) : (
                            <AvatarFallback
                              className="font-semibold text-white"
                              style={{ backgroundColor: fallbackColor }}
                            >
                              {initials}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {user.firstName} {user.lastName}
                          </div>
                          {(user as any).specialization && (
                            <div className="text-xs text-muted-foreground">
                              {(user as any).specialization}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getRoleBadge(user.role)}
                        {!user.isActive && (
                          <Badge variant="destructive" className="text-xs">
                            Inactiv
                          </Badge>
                        )}
                        {user.needsApproval && (
                          <Badge variant="secondary" className="text-xs">
                            Așteaptă aprobare
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString('ro-RO', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {!user.isActive && (
                          <Button
                            variant="default"
                            size="sm"
                            className="gap-1"
                            onClick={() => handleActivate(user)}
                          >
                            <CheckCircle size={14} weight="bold" />
                            Activează
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(user)}
                          disabled={user.role === 'superadmin' && user.id !== currentUserId}
                          className="gap-1"
                        >
                          <PencilSimple size={16} />
                          <span className="sr-only">Editează</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDelete(user)}
                          disabled={user.id === currentUserId || user.role === 'superadmin'}
                          className="gap-1"
                        >
                          <Trash size={16} />
                          <span className="sr-only">Șterge</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog
        open={addDialogOpen}
        onOpenChange={(open) => {
          setAddDialogOpen(open)
          if (!open) {
            resetForm()
          }
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Adaugă utilizator nou</DialogTitle>
            <DialogDescription>
              Completează detaliile pentru a crea un cont. Dacă contul este marcat inactiv, utilizatorul nu se poate autentifica.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-email">Email *</Label>
              <Input
                id="add-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="utilizator@email.ro"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-password">Parolă *</Label>
              <div className="relative">
                <Input
                  id="add-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Minim 6 caractere"
                  required
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:bg-transparent"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </Button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="add-firstName">Prenume *</Label>
                <Input
                  id="add-firstName"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="Ion"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-lastName">Nume *</Label>
                <Input
                  id="add-lastName"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Popescu"
                  required
                />
              </div>
            </div>
            <AvatarUploadControl
              id="add-user-avatar"
              label="Poză de profil (opțional)"
              value={avatarPreview}
              onChange={handleAvatarChange}
              description="Încarcă o fotografie clară a persoanei. Poți ajusta încadrerea înainte de salvare."
              fallbackId={email || `${firstName}${lastName}` || 'new-user-avatar'}
            />
            <div className="space-y-2">
              <Label htmlFor="add-role">Rol *</Label>
              <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                <SelectTrigger id="add-role">
                  <SelectValue placeholder="Alege rolul" />
                </SelectTrigger>
                <SelectContent>
                  {roles
                    .filter((role) => role.isActive)
                    .map((role) => (
                      <SelectItem key={role.id} value={role.name}>
                        {role.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {role === 'coach' && (
              <div className="space-y-2">
                <Label htmlFor="add-specialization">Specializare</Label>
                <Input
                  id="add-specialization"
                  value={specialization}
                  onChange={(event) => setSpecialization(event.target.value)}
                  placeholder="ex: Sprint, Rezistență"
                />
              </div>
            )}
            <div
              className={`flex items-center justify-between rounded-lg border p-3 ${
                !isActive ? 'border-destructive/40 bg-destructive/10' : 'bg-muted/40'
              }`}
            >
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  Cont activ
                  {!isActive && (
                    <Badge variant="destructive" className="text-xs">
                      Inactiv
                    </Badge>
                  )}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {isActive
                    ? 'Utilizatorul se poate autentifica imediat după creare.'
                    : 'Contul este creat dar nu are acces până este activat.'}
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label>Necesită aprobare</Label>
                <p className="text-sm text-muted-foreground">
                  Marchează dacă utilizatorul trebuie aprobat înainte de acces.
                </p>
              </div>
              <Switch checked={needsApproval} onCheckedChange={setNeedsApproval} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                Anulează
              </Button>
              <Button type="submit">Adaugă</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open)
          if (!open) {
            resetForm()
          }
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Editează utilizator</DialogTitle>
            <DialogDescription>
              Actualizează detaliile contului. Lăsă parola goală dacă nu dorești să o schimbi.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="utilizator@email.ro"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">Parolă nouă (opțional)</Label>
              <div className="relative">
                <Input
                  id="edit-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Lasă gol pentru a păstra parola actuală"
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:bg-transparent"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Min. 6 caractere. Lasă gol dacă nu dorești modificarea parolei.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-firstName">Prenume *</Label>
                <Input
                  id="edit-firstName"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastName">Nume *</Label>
                <Input
                  id="edit-lastName"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  required
                />
              </div>
            </div>
            <AvatarUploadControl
              id={`edit-user-avatar-${selectedUser?.id ?? 'unknown'}`}
              label="Poză de profil"
              value={avatarPreview}
              onChange={handleAvatarChange}
              description="Reajustează încadrerea sau elimină imaginea existentă."
              fallbackId={selectedUser?.id || email || `${firstName}${lastName}` || 'user-avatar'}
            />
            <div className="space-y-2">
              <Label htmlFor="edit-role">Rol *</Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as UserRole)}
                disabled={selectedUser?.role === 'superadmin' && selectedUser?.id !== currentUserId}
              >
                <SelectTrigger id="edit-role">
                  <SelectValue placeholder="Alege rolul" />
                </SelectTrigger>
                <SelectContent>
                  {roles
                    .filter((role) => role.isActive)
                    .map((role) => (
                      <SelectItem key={role.id} value={role.name}>
                        {role.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {role === 'coach' && (
              <div className="space-y-2">
                <Label htmlFor="edit-specialization">Specializare</Label>
                <Input
                  id="edit-specialization"
                  value={specialization}
                  onChange={(event) => setSpecialization(event.target.value)}
                  placeholder="ex: Sprint, Rezistență"
                />
              </div>
            )}
            <div
              className={`flex items-center justify-between rounded-lg border p-3 ${
                !isActive ? 'border-destructive/40 bg-destructive/10' : 'bg-muted/40'
              }`}
            >
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  Cont activ
                  {!isActive && (
                    <Badge variant="destructive" className="text-xs">
                      Inactiv
                    </Badge>
                  )}
                </Label>
                <p className="text-sm text-muted-foreground">
                  Controlează dacă utilizatorul poate accesa platforma.
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label>Necesită aprobare</Label>
                <p className="text-sm text-muted-foreground">
                  Dacă este activat, utilizatorul apare în lista de aprobare.
                </p>
              </div>
              <Switch checked={needsApproval} onCheckedChange={setNeedsApproval} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Anulează
              </Button>
              <Button type="submit">Salvează</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open)
          if (!open) {
            setSelectedUser(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmare ștergere</AlertDialogTitle>
            <AlertDialogDescription>
              Ești sigur că vrei să ștergi utilizatorul{' '}
              <strong>
                {selectedUser?.firstName} {selectedUser?.lastName}
              </strong>
              ? Această acțiune este permanentă.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Șterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
