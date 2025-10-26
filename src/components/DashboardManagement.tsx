import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Pencil, Trash, Shield, Layout } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import type { Dashboard } from '@/lib/types'

interface DashboardManagementProps {
  dashboards: Dashboard[]
  onRefresh: () => void
}

export default function DashboardManagement({ dashboards, onRefresh }: DashboardManagementProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDashboard, setEditingDashboard] = useState<Dashboard | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    componentName: '',
    icon: '',
  })

  const handleAdd = () => {
    setEditingDashboard(null)
    setFormData({
      name: '',
      displayName: '',
      description: '',
      componentName: '',
      icon: '',
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (dashboard: Dashboard) => {
    setEditingDashboard(dashboard)
    setFormData({
      name: dashboard.name,
      displayName: dashboard.displayName,
      description: dashboard.description || '',
      componentName: dashboard.componentName,
      icon: dashboard.icon || '',
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      if (editingDashboard) {
        await apiClient.updateDashboard(editingDashboard.id, formData)
        toast.success('Dashboard actualizat cu succes!')
      } else {
        await apiClient.createDashboard(formData)
        toast.success('Dashboard creat cu succes!')
      }
      setIsDialogOpen(false)
      onRefresh()
    } catch (error: any) {
      toast.error(error?.message || 'Eroare la salvare')
    }
  }

  const handleDelete = async (dashboard: Dashboard) => {
    if (dashboard.isSystem) {
      toast.error('Nu poți șterge dashboards sistem!')
      return
    }

    if (!confirm(`Sigur vrei să ștergi dashboard-ul "${dashboard.displayName}"?`)) {
      return
    }

    try {
      await apiClient.deleteDashboard(dashboard.id)
      toast.success('Dashboard șters cu succes!')
      onRefresh()
    } catch (error: any) {
      toast.error(error?.message || 'Eroare la ștergere')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Dashboards</h2>
          <p className="text-sm text-muted-foreground">
            Gestionează dashboards disponibile în sistem
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Adaugă Dashboard
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {dashboards.map((dashboard) => (
          <div
            key={dashboard.id}
            className="border rounded-lg p-4 space-y-3 hover:border-primary transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Layout className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">{dashboard.displayName}</h3>
              </div>
              {dashboard.isSystem && (
                <div title="Dashboard sistem">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="space-y-1 text-sm">
              <p className="text-muted-foreground">
                <span className="font-medium">Nume:</span> {dashboard.name}
              </p>
              <p className="text-muted-foreground">
                <span className="font-medium">Componentă:</span> {dashboard.componentName}
              </p>
              {dashboard.description && (
                <p className="text-muted-foreground text-xs">{dashboard.description}</p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(dashboard)}
                className="flex-1"
              >
                <Pencil className="w-3 h-3 mr-1" />
                Editează
              </Button>
              {!dashboard.isSystem && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(dashboard)}
                >
                  <Trash className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingDashboard ? 'Editează Dashboard' : 'Dashboard Nou'}
            </DialogTitle>
            <DialogDescription>
              {editingDashboard
                ? 'Modifică proprietățile dashboard-ului'
                : 'Creează un dashboard nou care poate fi atribuit rolurilor'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nume (ID unic)</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="custom-dashboard"
                disabled={!!editingDashboard?.isSystem}
              />
            </div>

            <div>
              <Label htmlFor="displayName">Nume afișat</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="Dashboard Custom"
              />
            </div>

            <div>
              <Label htmlFor="description">Descriere</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descriere dashboard..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="componentName">Nume componentă React</Label>
              <Input
                id="componentName"
                value={formData.componentName}
                onChange={(e) => setFormData({ ...formData, componentName: e.target.value })}
                placeholder="CoachLayout"
                disabled={!!editingDashboard?.isSystem}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ex: SuperAdminLayout, CoachLayout, ParentLayout
              </p>
            </div>

            <div>
              <Label htmlFor="icon">Icon (opțional)</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="layout"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Anulează
              </Button>
              <Button onClick={handleSave}>
                {editingDashboard ? 'Salvează' : 'Creează'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
