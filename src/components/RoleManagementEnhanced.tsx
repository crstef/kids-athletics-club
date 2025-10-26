import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash, Shield, Layout, LockKey } from '@phosphor-icons/react'
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

export default function RoleManagementEnhanced({ roles, dashboards: _dashboards, onRefresh }: RoleManagementEnhancedProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false)
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false)
  const [isWidgetsModalOpen, setIsWidgetsModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  
  
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

  // Removed per-role dashboards assignment UI (kept permission and widgets controls)

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
                {/* Dashboards assignment removed per request */}
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

      {/* Per-role Dashboards assignment dialog removed */}

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
