import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, PencilSimple, Trash, Check, X, ShieldCheck, MagnifyingGlass } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Permission, PermissionName } from '@/lib/types'

interface PermissionsSystemProps {
  permissions: Permission[]
  currentUserId: string
  onAddPermission: (perm: Omit<Permission, 'id' | 'createdAt' | 'createdBy'>) => void
  onUpdatePermission: (id: string, updates: Partial<Permission>) => void
  onDeletePermission: (id: string) => void
}

const PERMISSION_NAMES: { value: PermissionName; label: string }[] = [
  { value: 'athletes.create', label: 'Creare Atleți' },
  { value: 'athletes.view', label: 'Vizualizare Atleți' },
  { value: 'athletes.edit', label: 'Editare Atleți' },
  { value: 'athletes.delete', label: 'Ștergere Atleți' },
  { value: 'athletes.avatar.view', label: 'Vizualizare Avatar Atleți' },
  { value: 'athletes.avatar.upload', label: 'Încărcare Avatar Atleți' },
  { value: 'results.create', label: 'Creare Rezultate' },
  { value: 'results.view', label: 'Vizualizare Rezultate' },
  { value: 'results.edit', label: 'Editare Rezultate' },
  { value: 'results.delete', label: 'Ștergere Rezultate' },
  { value: 'events.create', label: 'Creare Probe' },
  { value: 'events.view', label: 'Vizualizare Probe' },
  { value: 'events.edit', label: 'Editare Probe' },
  { value: 'events.delete', label: 'Ștergere Probe' },
  { value: 'coaches.create', label: 'Creare Antrenori' },
  { value: 'coaches.view', label: 'Vizualizare Antrenori' },
  { value: 'coaches.edit', label: 'Editare Antrenori' },
  { value: 'coaches.delete', label: 'Ștergere Antrenori' },
  { value: 'users.create', label: 'Creare Utilizatori' },
  { value: 'users.view', label: 'Vizualizare Utilizatori' },
  { value: 'users.edit', label: 'Editare Utilizatori' },
  { value: 'users.delete', label: 'Ștergere Utilizatori' },
  { value: 'permissions.create', label: 'Creare Permisiuni' },
  { value: 'permissions.view', label: 'Vizualizare Permisiuni' },
  { value: 'permissions.edit', label: 'Editare Permisiuni' },
  { value: 'permissions.delete', label: 'Ștergere Permisiuni' },
  { value: 'roles.create', label: 'Creare Roluri' },
  { value: 'roles.view', label: 'Vizualizare Roluri' },
  { value: 'roles.edit', label: 'Editare Roluri' },
  { value: 'roles.delete', label: 'Ștergere Roluri' },
  { value: 'messages.create', label: 'Trimitere Mesaje' },
  { value: 'messages.view', label: 'Vizualizare Mesaje' },
  { value: 'messages.edit', label: 'Editare Mesaje' },
  { value: 'messages.delete', label: 'Ștergere Mesaje' },
  { value: 'access_requests.create', label: 'Creare Cereri Acces' },
  { value: 'access_requests.view', label: 'Vizualizare Cereri Acces' },
  { value: 'access_requests.edit', label: 'Aprobare Cereri Acces' },
  { value: 'access_requests.delete', label: 'Ștergere Cereri Acces' },
  { value: 'approval_requests.view', label: 'Vizualizare Cereri Aprobare' },
  { value: 'approval_requests.view.own', label: 'Vizualizare Cereri Aprobare (Proprii)' },
  { value: 'approval_requests.approve', label: 'Aprobare/Respingere Conturi' },
  { value: 'approval_requests.approve.own', label: 'Aprobare/Respingere Conturi (Proprii)' },
  { value: 'age_categories.view', label: 'Vizualizare Categorii Vârstă' },
]

export function PermissionsSystem({
  permissions,
  currentUserId: _currentUserId,
  onAddPermission,
  onUpdatePermission,
  onDeletePermission
}: PermissionsSystemProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null)
  const [formData, setFormData] = useState({
    name: '' as PermissionName,
    description: '',
    isActive: true
  })

  const filteredPermissions = useMemo(() => {
    let filtered = permissions

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      )
    }

    if (filterActive !== 'all') {
      filtered = filtered.filter(p => 
        filterActive === 'active' ? p.isActive : !p.isActive
      )
    }

    return filtered.sort((a, b) => a.name.localeCompare(b.name))
  }, [permissions, searchQuery, filterActive])

  const handleSubmit = () => {
    if (!formData.name || !formData.description) {
      toast.error('Completează toate câmpurile obligatorii')
      return
    }

    if (editingPermission) {
      onUpdatePermission(editingPermission.id, {
        name: formData.name,
        description: formData.description,
        isActive: formData.isActive,
        updatedAt: new Date().toISOString()
      })
      toast.success('Permisiune actualizată')
    } else {
      onAddPermission({
        name: formData.name,
        description: formData.description,
        isActive: formData.isActive
      })
      toast.success('Permisiune creată')
    }

    resetForm()
  }

  const resetForm = () => {
    setFormData({
      name: '' as PermissionName,
      description: '',
      isActive: true
    })
    setEditingPermission(null)
    setDialogOpen(false)
  }

  const handleEdit = (perm: Permission) => {
    setEditingPermission(perm)
    setFormData({
      name: perm.name,
      description: perm.description,
      isActive: perm.isActive
    })
    setDialogOpen(true)
  }

  const handleToggleActive = (perm: Permission) => {
    onUpdatePermission(perm.id, {
      isActive: !perm.isActive,
      updatedAt: new Date().toISOString()
    })
    toast.success(perm.isActive ? 'Permisiune dezactivată' : 'Permisiune activată')
  }

  const handleDelete = (id: string) => {
    if (confirm('Sigur vrei să ștergi această permisiune? Aceasta va afecta toți utilizatorii care o au.')) {
      onDeletePermission(id)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck size={24} weight="fill" className="text-primary" />
                Sistem Permisiuni
              </CardTitle>
              <CardDescription>
                Gestionează permisiunile disponibile în sistem
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open)
              if (!open) resetForm()
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus size={16} className="mr-2" />
                  Permisiune Nouă
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingPermission ? 'Editare Permisiune' : 'Permisiune Nouă'}
                  </DialogTitle>
                  <DialogDescription>
                    Definește o permisiune nouă în sistem
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="permission-name">Tip Permisiune *</Label>
                    <Select
                      value={formData.name}
                      onValueChange={(value) => setFormData({ ...formData, name: value as PermissionName })}
                      disabled={!!editingPermission}
                    >
                      <SelectTrigger id="permission-name">
                        <SelectValue placeholder="Selectează tip" />
                      </SelectTrigger>
                      <SelectContent>
                        {PERMISSION_NAMES.map(p => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descriere *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descrie ce permite această permisiune..."
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is-active">Activă</Label>
                    <Switch
                      id="is-active"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={resetForm}>Anulează</Button>
                  <Button onClick={handleSubmit}>
                    {editingPermission ? 'Salvează' : 'Creează'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <MagnifyingGlass 
                size={20} 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
              />
              <Input
                placeholder="Caută permisiuni..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterActive} onValueChange={(v) => setFilterActive(v as any)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Permisiune</TableHead>
                  <TableHead>Descriere</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPermissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Nicio permisiune găsită
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPermissions.map((perm) => (
                    <TableRow key={perm.id}>
                      <TableCell className="font-medium">
                        {PERMISSION_NAMES.find(p => p.value === perm.name)?.label || perm.name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-md">
                        {perm.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant={perm.isActive ? 'default' : 'secondary'}>
                          {perm.isActive ? (
                            <>
                              <Check size={14} className="mr-1" />
                              Activă
                            </>
                          ) : (
                            <>
                              <X size={14} className="mr-1" />
                              Inactivă
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(perm)}
                          >
                            {perm.isActive ? 'Dezactivează' : 'Activează'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(perm)}
                          >
                            <PencilSimple size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(perm.id)}
                          >
                            <Trash size={16} className="text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
