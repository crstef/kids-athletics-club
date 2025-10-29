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
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table'

interface ProbeManagementProps {
  probes: EventTypeCustom[]
  currentUserId: string
  onAddProbe: (probe: Omit<EventTypeCustom, 'id' | 'createdAt' | 'createdBy'>) => void
  onUpdateProbe: (probeId: string, updates: Partial<EventTypeCustom>) => void
  onDeleteProbe: (probeId: string) => void
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
  const [newProbeUnit, setNewProbeUnit] = useState<string>('points')
  const [newProbeCategory, setNewProbeCategory] = useState<string>('other')


  const handleAdd = () => {
    if (!newProbeName.trim()) {
      toast.error('Numele probei nu poate fi gol.')
      return
    }
    onAddProbe({
      name: newProbeName.trim(),
      description: newProbeDescription.trim() || undefined,
      unit: newProbeUnit as 'seconds' | 'meters' | 'points',
      category: newProbeCategory as 'running' | 'jumping' | 'throwing' | 'other'
    })
    setAddDialogOpen(false)
  }

  const handleEdit = () => {
    if (!selectedProbe || !newProbeName.trim()) {
      toast.error('Numele probei nu poate fi gol.')
      return
    }
    onUpdateProbe(selectedProbe.id, {
      name: newProbeName.trim(),
      description: newProbeDescription.trim() || undefined,
      unit: newProbeUnit as 'seconds' | 'meters' | 'points',
      category: newProbeCategory as 'running' | 'jumping' | 'throwing' | 'other'
    })
    setEditDialogOpen(false)
    setSelectedProbe(null)
  }

  const openEditDialog = (probe: EventTypeCustom) => {
    setSelectedProbe(probe)
    setNewProbeName(probe.name)
    setNewProbeDescription(probe.description || '')
    setNewProbeUnit(probe.unit || 'points')
    setNewProbeCategory(probe.category || 'other')
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (probe: EventTypeCustom) => {
    setSelectedProbe(probe)
    setDeleteDialogOpen(true)
  }

  const handleDeleteProbe = () => {
    if (!selectedProbe) return
    
    onDeleteProbe(selectedProbe.id)
    setSelectedProbe(null)
    setDeleteDialogOpen(false)
    toast.success('Probă ștearsă cu succes!')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Probe</h2>
          <p className="text-muted-foreground">Gestionează probele atletice</p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
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
                  placeholder="ex: minute, seconds, meters, points" 
                  value={newProbeUnit}
                  onChange={(e) => setNewProbeUnit(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Categorie
                </Label>
                <Input 
                  id="category"
                  placeholder="ex: short track, long distance, speed" 
                  value={newProbeCategory}
                  onChange={(e) => setNewProbeCategory(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAdd}>Adaugă</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
              <TableCell>Unitate</TableCell>
              <TableCell>Acțiuni</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {probes.map((probe) => (
              <TableRow key={probe.id}>
                <TableCell>{probe.name}</TableCell>
                <TableCell>{probe.unit ?? '—'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(probe)}>
                      <PencilSimple size={16} />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(probe)}>
                      <Trash size={16} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
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
                placeholder="ex: minute, seconds, meters, points" 
                value={newProbeUnit}
                onChange={(e) => setNewProbeUnit(e.target.value)}
                className="col-span-3"
              />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category-edit" className="text-right">
                Categorie
              </Label>
              <Input 
                id="category-edit"
                placeholder="ex: short track, long distance, speed" 
                value={newProbeCategory}
                onChange={(e) => setNewProbeCategory(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEdit}>Salvează</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
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
