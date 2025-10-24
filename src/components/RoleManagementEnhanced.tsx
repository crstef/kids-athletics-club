import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash, Shield, Layout, Check, LockKey } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import RolePermissionsDialog from './RolePermissionsDialog'
import { RolePermissionsModal } from './RolePermissionsModal'
import { RoleDashboardWidgetsModal } from './RoleDashboardWidgetsModal'
import type { Role, Dashboard } from '@/lib/types'

interface RoleManagementEnhancedProps {
  roles: Role[]
  dashboards: Dashboard[]
  onRefresh: () => void
}

export default function RoleManagementEnhanced({ roles, dashboards, onRefresh }: RoleManagementEnhancedProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDashboardDialogOpen, setIsDashboardDialogOpen] = useState(false)
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false)
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false)
  const [isWidgetsModalOpen, setIsWidgetsModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [roleDashboards, setRoleDashboards] = useState<Dashboard[]>([])
  const [selectedDashboards, setSelectedDashboards] = useState<Set<string>>(new Set())
  const [defaultDashboardId, setDefaultDashboardId] = useState<string>('')
  
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
  })

  const handleAdd = () => {
    setEditingRole(null)
    setFormData({
      name: '',
      displayName: '',
      description: '',
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (role: Role) => {
    setEditingRole(role)
    setFormData({
      name: role.name,
      displayName: role.displayName,
      description: role.description,
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      if (editingRole) {
        await apiClient.updateRole(editingRole.id, formData)
        toast.success('Rol actualizat cu succes!')
      } else {
        await apiClient.createRole(formData)
        toast.success('Rol creat cu succes!')
      }
      setIsDialogOpen(false)
      onRefresh()
    } catch (error: any) {
      toast.error(error?.message || 'Eroare la salvare')
    }
  }

  const handleDelete = async (role: Role) => {
    if (role.isSystem) {
      toast.error('Nu poți șterge roluri sistem!')
      return
    }

    if (!confirm(`Sigur vrei să ștergi rolul "${role.displayName}"?`)) {
      return
    }

    try {
      await apiClient.deleteRole(role.id)
      toast.success('Rol șters cu succes!')
      onRefresh()
    } catch (error: any) {
      toast.error(error?.message || 'Eroare la ștergere')
    }
  }

  const handleManageDashboards = async (role: Role) => {
    setSelectedRole(role)
    try {
      const response = await apiClient.getRoleDashboards(role.id) as Dashboard[]
      setRoleDashboards(response)
      setSelectedDashboards(new Set(response.map((d: Dashboard) => d.id)))
      const defaultDash = response.find((d: Dashboard) => d.isDefault)
      setDefaultDashboardId(defaultDash?.id || '')
      setIsDashboardDialogOpen(true)
    } catch (error: any) {
      toast.error('Eroare la încărcarea dashboards')
    }
  }

  const handleToggleDashboard = (dashboardId: string) => {
    const newSelected = new Set(selectedDashboards)
    if (newSelected.has(dashboardId)) {
      newSelected.delete(dashboardId)
      if (defaultDashboardId === dashboardId) {
        setDefaultDashboardId('')
      }
    } else {
      newSelected.add(dashboardId)
      if (newSelected.size === 1) {
        setDefaultDashboardId(dashboardId)
      }
    }
    setSelectedDashboards(newSelected)
  }

  const handleSaveDashboards = async () => {
    if (!selectedRole) return

    try {
      // Remove old assignments
      for (const dash of roleDashboards) {
        if (!selectedDashboards.has(dash.id)) {
          await apiClient.removeDashboardFromRole(selectedRole.id, dash.id)
        }
      }

      // Add new assignments
      for (const dashId of selectedDashboards) {
        await apiClient.assignDashboardToRole({
          roleId: selectedRole.id,
          dashboardId: dashId,
          isDefault: dashId === defaultDashboardId,
          sortOrder: 0,
        })
      }

      toast.success('Dashboards actualizate cu succes!')
      setIsDashboardDialogOpen(false)
      onRefresh()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Eroare la salvare')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Roluri</h2>
          <p className="text-sm text-muted-foreground">
            Gestionează rolurile și dashboards-urile asociate
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Adaugă Rol
        </Button>
      </div>

      <div className="grid gap-4">
        {roles.map((role) => (
          <div
            key={role.id}
            className="border rounded-lg p-4 space-y-3 hover:border-primary transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{role.displayName}</h3>
                  {role.isSystem && (
                    <Badge variant="secondary" className="text-xs">
                      <Shield className="w-3 h-3 mr-1" />
                      Sistem
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{role.description}</p>
                <p className="text-xs text-muted-foreground">ID: {role.name}</p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedRole(role)
                    setIsPermissionsModalOpen(true)
                  }}
                >
                  <LockKey className="w-3 h-3 mr-1" />
                  Permisiuni
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedRole(role)
                    setIsWidgetsModalOpen(true)
                  }}
                >
                  <Layout className="w-3 h-3 mr-1" />
                  Widgets Dashboard
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleManageDashboards(role)}
                >
                  <Layout className="w-3 h-3 mr-1" />
                  Dashboards
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(role)}
                >
                  <Pencil className="w-3 h-3 mr-1" />
                  Editează
                </Button>
                {!role.isSystem && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(role)}
                  >
                    <Trash className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Role Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? 'Editează Rol' : 'Rol Nou'}
            </DialogTitle>
            <DialogDescription>
              {editingRole
                ? 'Modifică proprietățile rolului'
                : 'Creează un rol nou care poate fi atribuit utilizatorilor'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nume (ID unic)</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="custom-role"
                disabled={!!editingRole?.isSystem}
              />
            </div>

            <div>
              <Label htmlFor="displayName">Nume afișat</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="Rol Custom"
              />
            </div>

            <div>
              <Label htmlFor="description">Descriere</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descriere rol..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Anulează
              </Button>
              <Button onClick={handleSave}>
                {editingRole ? 'Salvează' : 'Creează'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dashboard Assignment Dialog */}
      <Dialog open={isDashboardDialogOpen} onOpenChange={setIsDashboardDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Gestionează Dashboards - {selectedRole?.displayName}
            </DialogTitle>
            <DialogDescription>
              Selectează dashboards-urile disponibile pentru acest rol
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {dashboards.map((dashboard) => (
              <div
                key={dashboard.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedDashboards.has(dashboard.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        const newSelected = new Set(selectedDashboards)
                        newSelected.add(dashboard.id)
                        setSelectedDashboards(newSelected)
                        if (newSelected.size === 1) {
                          setDefaultDashboardId(dashboard.id)
                        }
                      } else {
                        const newSelected = new Set(selectedDashboards)
                        newSelected.delete(dashboard.id)
                        if (defaultDashboardId === dashboard.id) {
                          setDefaultDashboardId('')
                        }
                        setSelectedDashboards(newSelected)
                      }
                    }}
                  />
                  <div>
                    <p className="font-medium">{dashboard.displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      {dashboard.componentName}
                    </p>
                  </div>
                </div>
                {selectedDashboards.has(dashboard.id) && (
                  <Button
                    variant={defaultDashboardId === dashboard.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDefaultDashboardId(dashboard.id)}
                  >
                    {defaultDashboardId === dashboard.id && (
                      <Check className="w-3 h-3 mr-1" />
                    )}
                    Default
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDashboardDialogOpen(false)}>
              Anulează
            </Button>
            <Button onClick={handleSaveDashboards}>
              Salvează
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Role Permissions Modal */}
      {selectedRole && (
        <RolePermissionsModal
          role={selectedRole}
          open={isPermissionsModalOpen}
          onClose={() => setIsPermissionsModalOpen(false)}
          onSave={onRefresh}
        />
      )}

      {/* Role Widgets Modal */}
      {selectedRole && (
        <RoleDashboardWidgetsModal
          role={selectedRole}
          open={isWidgetsModalOpen}
          onClose={() => setIsWidgetsModalOpen(false)}
          onSave={onRefresh}
        />
      )}

      {/* Role Permissions Dialog (Legacy) */}
      {selectedRole && (
        <RolePermissionsDialog
          role={selectedRole}
          open={isPermissionsDialogOpen}
          onOpenChange={setIsPermissionsDialogOpen}
          onSave={onRefresh}
        />
      )}
    </div>
  )
}
