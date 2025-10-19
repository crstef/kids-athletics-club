import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { MagnifyingGlass, Plus, PencilSimple, Trash, UserCircle, Eye, EyeSlash } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { hashPassword } from '@/lib/crypto'
import type { User, UserRole } from '@/lib/types'

interface UserManagementProps {
  users: User[]
  currentUserId: string
  onAddUser: (userData: Omit<User, 'id' | 'createdAt'>) => void
  onUpdateUser: (userId: string, userData: Partial<User>) => void
  onDeleteUser: (userId: string) => void
}

export function UserManagement({ users, currentUserId, onAddUser, onUpdateUser, onDeleteUser }: UserManagementProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
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

  const filteredUsers = useMemo(() => {
    let filtered = users

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(u =>
        u.firstName.toLowerCase().includes(query) ||
        u.lastName.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
      )
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter)
    }

    return filtered.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [users, searchQuery, roleFilter])

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setFirstName('')
    setLastName('')
    setRole('parent')
    setSpecialization('')
    setIsActive(true)
    setNeedsApproval(false)
    setShowPassword(false)
  }

  const handleOpenAdd = () => {
    resetForm()
    setAddDialogOpen(true)
  }

  const handleOpenEdit = (user: User) => {
    setSelectedUser(user)
    setEmail(user.email)
    setFirstName(user.firstName)
    setLastName(user.lastName)
    setRole(user.role)
    setSpecialization((user as any).specialization || '')
    setIsActive(user.isActive)
    setNeedsApproval(user.needsApproval || false)
    setEditDialogOpen(true)
  }

  const handleOpenDelete = (user: User) => {
    setSelectedUser(user)
    setDeleteDialogOpen(true)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim() || !password || !firstName.trim() || !lastName.trim()) {
      toast.error('Completează toate câmpurile obligatorii')
      return
    }

    if (password.length < 6) {
      toast.error('Parola trebuie să aibă minim 6 caractere')
      return
    }

    const emailExists = users.some(u => u.email.toLowerCase() === email.toLowerCase().trim())
    
    if (emailExists) {
      toast.error('Emailul este deja înregistrat')
      return
    }

    const hashedPassword = await hashPassword(password)

    const userData: any = {
      email: email.trim(),
      password: hashedPassword,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role,
      isActive,
      needsApproval
    }

    if (role === 'coach' && specialization.trim()) {
      userData.specialization = specialization.trim()
    }

    onAddUser(userData)
    toast.success('Utilizator adăugat cu succes!')
    setAddDialogOpen(false)
    resetForm()
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedUser || !email.trim() || !firstName.trim() || !lastName.trim()) {
      toast.error('Completează toate câmpurile obligatorii')
      return
    }

    if (password && password.length < 6) {
      toast.error('Parola trebuie să aibă minim 6 caractere')
      return
    }

    const emailExists = users.some(
      u => u.id !== selectedUser.id && u.email.toLowerCase() === email.toLowerCase().trim()
    )
    
    if (emailExists) {
      toast.error('Emailul este deja folosit de alt utilizator')
      return
    }

    const userData: any = {
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role,
      isActive,
      needsApproval
    }

    if (password) {
      userData.password = await hashPassword(password)
    }

    if (role === 'coach') {
      userData.specialization = specialization.trim() || undefined
    }

    onUpdateUser(selectedUser.id, userData)
    toast.success('Utilizator actualizat cu succes!')
    setEditDialogOpen(false)
    setSelectedUser(null)
    resetForm()
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
    toast.success('Utilizator șters cu succes!')
    setDeleteDialogOpen(false)
    setSelectedUser(null)
  }

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'superadmin':
        return <Badge variant="default">SuperAdmin</Badge>
      case 'coach':
        return <Badge variant="secondary">Antrenor</Badge>
      case 'parent':
        return <Badge variant="outline">Părinte</Badge>
      case 'athlete':
        return <Badge className="bg-accent text-accent-foreground">Atlet</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Management Utilizatori</h2>
          <p className="text-muted-foreground">Administrează utilizatorii și rolurile acestora</p>
        </div>
        <Button onClick={handleOpenAdd}>
          <Plus size={16} className="mr-2" />
          Adaugă Utilizator
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
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
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as UserRole | 'all')}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filtru Rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate Rolurile</SelectItem>
            <SelectItem value="superadmin">SuperAdmin</SelectItem>
            <SelectItem value="coach">Antrenor</SelectItem>
            <SelectItem value="parent">Părinte</SelectItem>
            <SelectItem value="athlete">Atlet</SelectItem>
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
              <TableHead>Data Înregistrare</TableHead>
              <TableHead className="text-right">Acțiuni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  {searchQuery || roleFilter !== 'all'
                    ? 'Niciun utilizator găsit cu filtrele curente'
                    : 'Niciun utilizator în sistem'}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <UserCircle size={32} weight="duotone" className="text-muted-foreground" />
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
                    <div className="flex gap-2 items-center">
                      {getRoleBadge(user.role)}
                      {!user.isActive && (
                        <Badge variant="destructive" className="text-xs">Inactiv</Badge>
                      )}
                      {user.needsApproval && (
                        <Badge variant="secondary" className="text-xs">Așteaptă Aprobare</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString('ro-RO', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(user)}
                        disabled={user.role === 'superadmin' && user.id !== currentUserId}
                      >
                        <PencilSimple size={16} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDelete(user)}
                        disabled={user.id === currentUserId || user.role === 'superadmin'}
                      >
                        <Trash size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adaugă Utilizator Nou</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-email">Email *</Label>
              <Input
                id="add-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplu@email.ro"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-password">Parolă *</Label>
              <div className="relative">
                <Input
                  id="add-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minim 6 caractere"
                  required
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlash size={18} className="text-muted-foreground" />
                  ) : (
                    <Eye size={18} className="text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-firstName">Prenume *</Label>
                <Input
                  id="add-firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ion"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-lastName">Nume *</Label>
                <Input
                  id="add-lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Popescu"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-role">Rol *</Label>
              <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger id="add-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parent">Părinte</SelectItem>
                  <SelectItem value="coach">Antrenor</SelectItem>
                  <SelectItem value="athlete">Atlet</SelectItem>
                  <SelectItem value="superadmin">SuperAdmin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {role === 'coach' && (
              <div className="space-y-2">
                <Label htmlFor="add-specialization">Specializare</Label>
                <Input
                  id="add-specialization"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="ex: Sprint, Sărituri, etc."
                />
              </div>
            )}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label>Cont Activ</Label>
                <div className="text-sm text-muted-foreground">
                  Utilizatorul poate să se autentifice
                </div>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label>Necesită Aprobare</Label>
                <div className="text-sm text-muted-foreground">
                  Contul așteaptă aprobare de la admin
                </div>
              </div>
              <Switch
                checked={needsApproval}
                onCheckedChange={setNeedsApproval}
              />
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

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editează Utilizator</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplu@email.ro"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">Parolă Nouă (opțional)</Label>
              <div className="relative">
                <Input
                  id="edit-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Lasă gol pentru a păstra parola actuală"
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlash size={18} className="text-muted-foreground" />
                  ) : (
                    <Eye size={18} className="text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Lasă câmpul gol dacă nu vrei să schimbi parola
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-firstName">Prenume *</Label>
                <Input
                  id="edit-firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ion"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastName">Nume *</Label>
                <Input
                  id="edit-lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Popescu"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Rol *</Label>
              <Select 
                value={role} 
                onValueChange={(v) => setRole(v as UserRole)}
                disabled={selectedUser?.role === 'superadmin' && selectedUser?.id !== currentUserId}
              >
                <SelectTrigger id="edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parent">Părinte</SelectItem>
                  <SelectItem value="coach">Antrenor</SelectItem>
                  <SelectItem value="athlete">Atlet</SelectItem>
                  <SelectItem value="superadmin">SuperAdmin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {role === 'coach' && (
              <div className="space-y-2">
                <Label htmlFor="edit-specialization">Specializare</Label>
                <Input
                  id="edit-specialization"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="ex: Sprint, Sărituri, etc."
                />
              </div>
            )}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label>Cont Activ</Label>
                <div className="text-sm text-muted-foreground">
                  Utilizatorul poate să se autentifice
                </div>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label>Necesită Aprobare</Label>
                <div className="text-sm text-muted-foreground">
                  Contul așteaptă aprobare de la admin
                </div>
              </div>
              <Switch
                checked={needsApproval}
                onCheckedChange={setNeedsApproval}
              />
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmare Ștergere</AlertDialogTitle>
            <AlertDialogDescription>
              Ești sigur că vrei să ștergi utilizatorul{' '}
              <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>?
              <br />
              <span className="text-destructive block mt-2">
                Această acțiune este permanentă și nu poate fi anulată.
              </span>
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
