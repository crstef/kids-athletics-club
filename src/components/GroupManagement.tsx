import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Plus, PencilSimple, Trash, Users } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { CoachGroup } from '@/lib/types'

interface GroupManagementProps {
  groups: CoachGroup[]
  currentUserId: string
  onAddGroup: (group: Omit<CoachGroup, 'id' | 'createdAt' | 'createdBy'>) => void
  onUpdateGroup: (groupId: string, updates: Partial<CoachGroup>) => void
  onDeleteGroup: (groupId: string) => void
}

export function GroupManagement({
  groups,
  currentUserId,
  onAddGroup,
  onUpdateGroup,
  onDeleteGroup
}: GroupManagementProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<CoachGroup | null>(null)
  
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDescription, setNewGroupDescription] = useState('')
  const [newGroupActive, setNewGroupActive] = useState(true)

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newGroupName.trim()) {
      toast.error('Introdu numele grupei')
      return
    }

    const existingGroup = groups.find(g => g.name.toLowerCase() === newGroupName.trim().toLowerCase())
    if (existingGroup) {
      toast.error('O grupă cu acest nume există deja')
      return
    }

    onAddGroup({
      name: newGroupName.trim(),
      description: newGroupDescription.trim() || undefined,
      isActive: newGroupActive
    })

    setNewGroupName('')
    setNewGroupDescription('')
    setNewGroupActive(true)
    setAddDialogOpen(false)
    toast.success('Grupă adăugată cu succes!')
  }

  const handleEditGroup = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedGroup) return

    if (!newGroupName.trim()) {
      toast.error('Introdu numele grupei')
      return
    }

    const existingGroup = groups.find(
      g => g.id !== selectedGroup.id && g.name.toLowerCase() === newGroupName.trim().toLowerCase()
    )
    if (existingGroup) {
      toast.error('O grupă cu acest nume există deja')
      return
    }

    onUpdateGroup(selectedGroup.id, {
      name: newGroupName.trim(),
      description: newGroupDescription.trim() || undefined,
      isActive: newGroupActive,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUserId
    })

    setSelectedGroup(null)
    setNewGroupName('')
    setNewGroupDescription('')
    setNewGroupActive(true)
    setEditDialogOpen(false)
    toast.success('Grupă actualizată cu succes!')
  }

  const openEditDialog = (group: CoachGroup) => {
    setSelectedGroup(group)
    setNewGroupName(group.name)
    setNewGroupDescription(group.description || '')
    setNewGroupActive(group.isActive)
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (group: CoachGroup) => {
    setSelectedGroup(group)
    setDeleteDialogOpen(true)
  }

  const handleDeleteGroup = () => {
    if (!selectedGroup) return
    
    onDeleteGroup(selectedGroup.id)
    setSelectedGroup(null)
    setDeleteDialogOpen(false)
    toast.success('Grupă ștearsă cu succes!')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Grupe Antrenori</h2>
          <p className="text-muted-foreground">Gestionează grupele de antrenori</p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus size={20} weight="bold" />
              Adaugă Grupă
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adaugă Grupă Nouă</DialogTitle>
              <DialogDescription>Creează o grupă nouă pentru organizarea antrenorilor</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddGroup} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="group-name">Nume Grupă</Label>
                <Input
                  id="group-name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="ex: Sprinters, Săritori"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="group-description">Descriere (opțional)</Label>
                <Textarea
                  id="group-description"
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="Descrierea grupei..."
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="group-active">Activă</Label>
                <Switch
                  id="group-active"
                  checked={newGroupActive}
                  onCheckedChange={setNewGroupActive}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Anulează
                </Button>
                <Button type="submit">Salvează</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users size={64} weight="duotone" className="text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Nu există grupe create încă
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card key={group.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {group.name}
                      {!group.isActive && (
                        <Badge variant="secondary" className="text-xs">Inactivă</Badge>
                      )}
                    </CardTitle>
                    {group.description && (
                      <CardDescription className="mt-2">{group.description}</CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(group)}
                    className="flex-1"
                  >
                    <PencilSimple size={16} className="mr-2" />
                    Editează
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDeleteDialog(group)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editează Grupa</DialogTitle>
            <DialogDescription>Modifică detaliile grupei</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditGroup} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-group-name">Nume Grupă</Label>
              <Input
                id="edit-group-name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-group-description">Descriere (opțional)</Label>
              <Textarea
                id="edit-group-description"
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-group-active">Activă</Label>
              <Switch
                id="edit-group-active"
                checked={newGroupActive}
                onCheckedChange={setNewGroupActive}
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
            <AlertDialogTitle>Confirmare ștergere</AlertDialogTitle>
            <AlertDialogDescription>
              Ești sigur că vrei să ștergi grupa <strong>{selectedGroup?.name}</strong>?
              Această acțiune nu poate fi anulată.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGroup} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Șterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
