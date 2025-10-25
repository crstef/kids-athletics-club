import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Plus, Pencil, Trash, ShieldCheck, MagnifyingGlass } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import type { Permission, ResourceType } from '@/lib/types'

interface PermissionsManagementProps {
  permissions: Permission[]
  onRefresh: () => void
}

export function PermissionsManagement({ permissions, onRefresh }: PermissionsManagementProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)

  const groupedPermissions = useMemo(() => {
    const filtered = searchQuery
      ? permissions.filter(p => 
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : permissions

    return filtered.reduce((acc, perm) => {
      const [resource] = perm.name.split('.') as [ResourceType, string]
      if (!acc[resource]) acc[resource] = []
      acc[resource].push(perm)
      return acc
    }, {} as Record<ResourceType, Permission[]>)
  }, [permissions, searchQuery])

  const resetForm = () => {
    setName('')
    setDescription('')
    setIsActive(true)
  }

  const handleOpenAdd = () => {
    resetForm()
    setAddDialogOpen(true)
  }

  const handleOpenEdit = (permission: Permission) => {
    setSelectedPermission(permission)
    setName(permission.name)
    setDescription(permission.description)
    setIsActive(permission.isActive)
    setEditDialogOpen(true)
  }

  const handleOpenDelete = (permission: Permission) => {
    setSelectedPermission(permission)
    setDeleteDialogOpen(true)
  }

  const handleAdd = async () => {
    if (!name || !description) {
      toast.error('Completează toate câmpurile')
      return
    }

    // Validate permission name format (resource.action)
    if (!name.includes('.')) {
      toast.error('Numele trebuie să fie în formatul: resource.action (ex: athletes.view)')
      return
    }

    try {
      await apiClient.createPermission({ name, description, isActive })
      toast.success('Permisiune adăugată cu succes')
      setAddDialogOpen(false)
      resetForm()
      onRefresh()
    } catch (error) {
      console.error('Add permission error:', error)
      toast.error('Eroare la adăugarea permisiunii')
    }
  }

  const handleEdit = async () => {
    if (!selectedPermission || !description) {
      toast.error('Completează descrierea')
      return
    }

    try {
      await apiClient.updatePermission(selectedPermission.id, { description, isActive })
      toast.success('Permisiune actualizată cu succes')
      setEditDialogOpen(false)
      setSelectedPermission(null)
      resetForm()
      onRefresh()
    } catch (error) {
      console.error('Edit permission error:', error)
      toast.error('Eroare la actualizarea permisiunii')
    }
  }

  const handleDelete = async () => {
    if (!selectedPermission) return

    try {
      await apiClient.deletePermission(selectedPermission.id)
      toast.success('Permisiune ștearsă cu succes')
      setDeleteDialogOpen(false)
      setSelectedPermission(null)
      onRefresh()
    } catch (error) {
      console.error('Delete permission error:', error)
      toast.error('Eroare la ștergerea permisiunii')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Permissions Management</h2>
          <p className="text-sm text-muted-foreground">
            Gestionează permisiunile granulare ale sistemului ({permissions.length} total)
          </p>
        </div>
        <Button onClick={handleOpenAdd}>
          <Plus className="mr-2 h-4 w-4" /> Adaugă Permisiune
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Caută permisiuni..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Grouped Permissions */}
      <div className="space-y-4">
        {Object.entries(groupedPermissions).map(([resource, perms]) => (
          <Card key={resource}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 capitalize text-lg">
                <ShieldCheck className="h-5 w-5" />
                {resource}
                <Badge variant="secondary" className="ml-auto">
                  {perms.length}
                </Badge>
              </CardTitle>
              <CardDescription>
                Permisiuni pentru resursa {resource}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {perms.map(perm => (
                  <div
                    key={perm.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono font-semibold">
                          {perm.name}
                        </code>
                        <Badge variant={perm.isActive ? 'default' : 'secondary'}>
                          {perm.isActive ? 'Activ' : 'Inactiv'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {perm.description}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEdit(perm)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDelete(perm)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adaugă Permisiune Nouă</DialogTitle>
            <DialogDescription>
              Creează o permisiune granulară pentru sistem
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nume Permisiune</Label>
              <Input
                id="name"
                placeholder="Ex: athletes.view, users.create"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Format: resource.action (ex: athletes.view, results.edit)
              </p>
            </div>
            <div>
              <Label htmlFor="description">Descriere</Label>
              <Textarea
                id="description"
                placeholder="Descriere clară a permisiunii..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Permisiune Activă</Label>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Anulează
            </Button>
            <Button onClick={handleAdd}>Adaugă</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editează Permisiune</DialogTitle>
            <DialogDescription>
              Modifică descrierea și status-ul permisiunii
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nume Permisiune</Label>
              <Input value={name} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground mt-1">
                Numele permisiunii nu poate fi modificat
              </p>
            </div>
            <div>
              <Label htmlFor="edit-description">Descriere</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-isActive">Permisiune Activă</Label>
              <Switch
                id="edit-isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Anulează
            </Button>
            <Button onClick={handleEdit}>Salvează</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Șterge Permisiune</AlertDialogTitle>
            <AlertDialogDescription>
              Ești sigur că vrei să ștergi permisiunea <strong>{selectedPermission?.name}</strong>?
              <br /><br />
              Această acțiune va afecta toate rolurile și utilizatorii care au această permisiune.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              Anulează
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Șterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
