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
import { Plus, PencilSimple, Trash, Target } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { CoachProbe } from '@/lib/types'

interface ProbeManagementProps {
  probes: CoachProbe[]
  currentUserId: string
  onAddProbe: (probe: Omit<CoachProbe, 'id' | 'createdAt' | 'createdBy'>) => void
  onUpdateProbe: (probeId: string, updates: Partial<CoachProbe>) => void
  onDeleteProbe: (probeId: string) => void
}

export function ProbeManagement({
  probes,
  currentUserId,
  onAddProbe,
  onUpdateProbe,
  onDeleteProbe
}: ProbeManagementProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedProbe, setSelectedProbe] = useState<CoachProbe | null>(null)
  
  const [newProbeName, setNewProbeName] = useState('')
  const [newProbeDescription, setNewProbeDescription] = useState('')
  const [newProbeActive, setNewProbeActive] = useState(true)

  const handleAddProbe = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newProbeName.trim()) {
      toast.error('Introdu numele probei')
      return
    }

    const existingProbe = probes.find(p => p.name.toLowerCase() === newProbeName.trim().toLowerCase())
    if (existingProbe) {
      toast.error('O probă cu acest nume există deja')
      return
    }

    onAddProbe({
      name: newProbeName.trim(),
      description: newProbeDescription.trim() || undefined,
      isActive: newProbeActive
    })

    setNewProbeName('')
    setNewProbeDescription('')
    setNewProbeActive(true)
    setAddDialogOpen(false)
    toast.success('Probă adăugată cu succes!')
  }

  const handleEditProbe = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedProbe) return

    if (!newProbeName.trim()) {
      toast.error('Introdu numele probei')
      return
    }

    const existingProbe = probes.find(
      p => p.id !== selectedProbe.id && p.name.toLowerCase() === newProbeName.trim().toLowerCase()
    )
    if (existingProbe) {
      toast.error('O probă cu acest nume există deja')
      return
    }

    onUpdateProbe(selectedProbe.id, {
      name: newProbeName.trim(),
      description: newProbeDescription.trim() || undefined,
      isActive: newProbeActive,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUserId
    })

    setSelectedProbe(null)
    setNewProbeName('')
    setNewProbeDescription('')
    setNewProbeActive(true)
    setEditDialogOpen(false)
    toast.success('Probă actualizată cu succes!')
  }

  const openEditDialog = (probe: CoachProbe) => {
    setSelectedProbe(probe)
    setNewProbeName(probe.name)
    setNewProbeDescription(probe.description || '')
    setNewProbeActive(probe.isActive)
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (probe: CoachProbe) => {
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
          <h2 className="text-2xl font-bold">Probe Antrenori</h2>
          <p className="text-muted-foreground">Gestionează probele de specializare pentru antrenori</p>
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
              <DialogDescription>Creează o probă nouă pentru specializarea antrenorilor</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddProbe} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="probe-name">Nume Probă</Label>
                <Input
                  id="probe-name"
                  value={newProbeName}
                  onChange={(e) => setNewProbeName(e.target.value)}
                  placeholder="ex: Sprint, Sărituri, Alergări Lungi"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="probe-description">Descriere (opțional)</Label>
                <Textarea
                  id="probe-description"
                  value={newProbeDescription}
                  onChange={(e) => setNewProbeDescription(e.target.value)}
                  placeholder="Descrierea probei..."
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="probe-active">Activă</Label>
                <Switch
                  id="probe-active"
                  checked={newProbeActive}
                  onCheckedChange={setNewProbeActive}
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {probes.map((probe) => (
            <Card key={probe.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {probe.name}
                      {!probe.isActive && (
                        <Badge variant="secondary" className="text-xs">Inactivă</Badge>
                      )}
                    </CardTitle>
                    {probe.description && (
                      <CardDescription className="mt-2">{probe.description}</CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(probe)}
                    className="flex-1"
                  >
                    <PencilSimple size={16} className="mr-2" />
                    Editează
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDeleteDialog(probe)}
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
            <DialogTitle>Editează Proba</DialogTitle>
            <DialogDescription>Modifică detaliile probei</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditProbe} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-probe-name">Nume Probă</Label>
              <Input
                id="edit-probe-name"
                value={newProbeName}
                onChange={(e) => setNewProbeName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-probe-description">Descriere (opțional)</Label>
              <Textarea
                id="edit-probe-description"
                value={newProbeDescription}
                onChange={(e) => setNewProbeDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-probe-active">Activă</Label>
              <Switch
                id="edit-probe-active"
                checked={newProbeActive}
                onCheckedChange={setNewProbeActive}
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
