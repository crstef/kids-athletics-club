import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Plus, PencilSimple, Trash, Target } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { EventTypeCustom } from '../lib/types'
import { useAuth } from '@/lib/auth-context'
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'

interface ProbeManagementProps {
  probes: EventTypeCustom[]
  currentUserId: string
  onAddProbe: (probe: Omit<EventTypeCustom, 'id' | 'createdAt' | 'createdBy'>) => Promise<void>
  onUpdateProbe: (probeId: string, updates: Partial<EventTypeCustom>) => Promise<void>
  onDeleteProbe: (probeId: string) => Promise<void>
}

export function ProbeManagement({
  probes,
  currentUserId: _currentUserId,
  onAddProbe,
  onUpdateProbe,
  onDeleteProbe
}: ProbeManagementProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedProbe, setSelectedProbe] = useState<EventTypeCustom | null>(null)
  
  const [newProbeName, setNewProbeName] = useState('')
  const [newProbeDescription, setNewProbeDescription] = useState('')
  const [newProbeUnit, setNewProbeUnit] = useState<string>('')
  const [newProbeCategory, setNewProbeCategory] = useState<string>('')

  const { hasPermission } = useAuth()
  const canCreate = hasPermission('events.create')
  const canEdit = hasPermission('events.edit')
  const canDelete = hasPermission('events.delete')


  const resetFormState = () => {
    setNewProbeName('')
    setNewProbeDescription('')
    setNewProbeUnit('')
    setNewProbeCategory('')
  }

  const handleAdd = async () => {
    if (!canCreate) {
      toast.error('Nu ai permisiunea de a adăuga probe.')
      return
    }
    if (!newProbeName.trim()) {
      toast.error('Numele probei nu poate fi gol.')
      return
    }
    if (!newProbeUnit.trim()) {
      toast.error('Unitatea de măsură este obligatorie.')
      return
    }
    if (!newProbeCategory.trim()) {
      toast.error('Categoria este obligatorie.')
      return
    }
    try {
      await onAddProbe({
        name: newProbeName.trim(),
        description: newProbeDescription.trim() || undefined,
        unit: newProbeUnit.trim() || undefined,
        category: newProbeCategory.trim() || undefined
      })
      resetFormState()
      setAddDialogOpen(false)
    } catch (error: any) {
      toast.error(error?.message ?? 'Nu am putut adăuga proba')
    }
  }

  const handleEdit = async () => {
    if (!canEdit) {
      toast.error('Nu ai permisiunea de a edita probe.')
      return
    }
    if (!selectedProbe || !newProbeName.trim()) {
      toast.error('Numele probei nu poate fi gol.')
      return
    }
    if (!newProbeUnit.trim()) {
      toast.error('Unitatea de măsură este obligatorie.')
      return
    }
    if (!newProbeCategory.trim()) {
      toast.error('Categoria este obligatorie.')
      return
    }
    try {
      await onUpdateProbe(selectedProbe.id, {
        name: newProbeName.trim(),
        description: newProbeDescription.trim() || undefined,
        unit: newProbeUnit.trim() || undefined,
        category: newProbeCategory.trim() || undefined
      })
      setEditDialogOpen(false)
      setSelectedProbe(null)
    } catch (error: any) {
      toast.error(error?.message ?? 'Nu am putut actualiza proba')
    }
  }

  const openEditDialog = (probe: EventTypeCustom) => {
    setSelectedProbe(probe)
    setNewProbeName(probe.name)
  setNewProbeDescription(probe.description || '')
  setNewProbeUnit(probe.unit || '')
  setNewProbeCategory(probe.category || '')
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (probe: EventTypeCustom) => {
    setSelectedProbe(probe)
    setDeleteDialogOpen(true)
  }

  const handleDeleteProbe = async () => {
    if (!canDelete) {
      toast.error('Nu ai permisiunea de a șterge probe.')
      return
    }
    if (!selectedProbe) return
    try {
      await onDeleteProbe(selectedProbe.id)
      setSelectedProbe(null)
      setDeleteDialogOpen(false)
    } catch (error: any) {
      toast.error(error?.message ?? 'Nu am putut șterge proba')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Probe</h2>
          <p className="text-muted-foreground">Gestionează probele atletice</p>
        </div>
        {canCreate && (
          <Dialog
            open={addDialogOpen}
            onOpenChange={(open) => {
              setAddDialogOpen(open)
              if (!open) {
                resetFormState()
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus size={20} weight="bold" />
                Adaugă Probă
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adaugă Probă Nouă</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Nume
                  </Label>
                  <Input id="name" value={newProbeName} onChange={(e) => setNewProbeName(e.target.value)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="unit" className="text-right">
                    Unitate
                  </Label>
                  <Input 
                    id="unit"
                    placeholder="ex: secunde, metri, puncte" 
                    value={newProbeUnit}
                    onChange={(e) => setNewProbeUnit(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">
                    Categorie
                  </Label>
                  <Input 
                    id="category"
                    placeholder="ex: Alergare, Aruncări, Sărituri" 
                    value={newProbeCategory}
                    onChange={(e) => setNewProbeCategory(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="description" className="text-right pt-2">
                    Descriere
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Detalii suplimentare (opțional)"
                    value={newProbeDescription}
                    onChange={(e) => setNewProbeDescription(e.target.value)}
                    className="col-span-3 min-h-[96px]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAdd}>Adaugă</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {probes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target size={64} weight="duotone" className="text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Nu există probe create încă
            </p>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>Nume</TableCell>
              <TableCell>Categorie</TableCell>
              <TableCell>Unitate</TableCell>
              <TableCell>Descriere</TableCell>
              <TableCell>Acțiuni</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {probes.map((probe) => (
              <TableRow key={probe.id}>
                <TableCell>{probe.name}</TableCell>
                <TableCell>{probe.category?.trim() ? probe.category : '—'}</TableCell>
                <TableCell>{probe.unit?.trim() ? probe.unit : '—'}</TableCell>
                <TableCell className="max-w-[280px] whitespace-pre-wrap">{probe.description?.trim() ? probe.description : '—'}</TableCell>
                <TableCell>
                  {(canEdit || canDelete) && (
                    <div className="flex items-center gap-2">
                      {canEdit && (
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(probe)}>
                          <PencilSimple size={16} />
                        </Button>
                      )}
                      {canDelete && (
                        <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(probe)}>
                          <Trash size={16} />
                        </Button>
                      )}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open)
          if (!open) {
            setSelectedProbe(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editează Probă</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name-edit" className="text-right">
                Nume
              </Label>
              <Input id="name-edit" value={newProbeName} onChange={(e) => setNewProbeName(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="unit-edit" className="text-right">
                Unitate
              </Label>
              <Input 
                id="unit-edit"
                placeholder="ex: secunde, metri, puncte" 
                value={newProbeUnit}
                onChange={(e) => setNewProbeUnit(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category-edit" className="text-right">
                Categorie
              </Label>
              <Input 
                id="category-edit"
                placeholder="ex: Alergare, Aruncări, Sărituri" 
                value={newProbeCategory}
                onChange={(e) => setNewProbeCategory(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description-edit" className="text-right pt-2">
                Descriere
              </Label>
              <Textarea
                id="description-edit"
                placeholder="Detalii suplimentare (opțional)"
                value={newProbeDescription}
                onChange={(e) => setNewProbeDescription(e.target.value)}
                className="col-span-3 min-h-[96px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEdit}>Salvează</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open)
          if (!open) {
            setSelectedProbe(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmare ștergere</AlertDialogTitle>
            <AlertDialogDescription>
              Ești sigur că vrei să ștergi proba <strong>{selectedProbe?.name}</strong>?
              Această acțiune nu poate fi anulată.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProbe} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Șterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
