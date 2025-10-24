import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import type { Role, Permission } from '@/lib/types'

interface RolePermissionsModalProps {
  open: boolean
  onClose: () => void
  role: Role
  onSave: () => void
}

export function RolePermissionsModal({ open, onClose, role, onSave }: RolePermissionsModalProps) {
  const [allPermissions, setAllPermissions] = useState<Permission[]>([])
  const [rolePermissions, setRolePermissions] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Fetch all permissions and role's permissions
  useEffect(() => {
    if (!open || !role) return

    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Get all permissions
        const permsResponse = await apiClient.request('/permissions') as any
        const permissions = Array.isArray(permsResponse) ? permsResponse : permsResponse?.rows || []
        setAllPermissions(permissions)

        // Get role's current permissions
        const rolePermsResponse = await apiClient.request(`/roles/${role.id}/permissions`) as any
        const currentRolePerms = rolePermsResponse?.permissions || rolePermsResponse || []
        const permIds = new Set(currentRolePerms.map((p: any) => p.id || p.permissionId))
        setRolePermissions(permIds)
      } catch (error) {
        console.error('Error fetching permissions:', error)
        toast.error('Eroare la încărcarea permisiunilor')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [open, role])

  const handleTogglePermission = (permissionId: string) => {
    const newSet = new Set(rolePermissions)
    if (newSet.has(permissionId)) {
      newSet.delete(permissionId)
    } else {
      newSet.add(permissionId)
    }
    setRolePermissions(newSet)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Get permissions to add and remove
      const oldPerms = new Set(role.permissions?.map(p => typeof p === 'string' ? p : p.id) || [])
      const toAdd = Array.from(rolePermissions).filter(p => !oldPerms.has(p))
      const toRemove = Array.from(oldPerms).filter(p => !rolePermissions.has(p))

      // For simplicity, we'll just send the full new permission list
      // In production, you'd want to batch these operations
      for (const permId of toAdd) {
        await apiClient.request(`/roles/${role.id}/permissions`, {
          method: 'POST',
          body: JSON.stringify({ permissionId: permId })
        })
      }

      for (const permId of toRemove) {
        await apiClient.request(`/roles/${role.id}/permissions/${permId}`, {
          method: 'DELETE'
        })
      }

      toast.success('Permisiuni actualizate cu succes!')
      onSave()
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Eroare la salvarea permisiunilor')
      console.error('Error saving permissions:', error)
    } finally {
      setSaving(false)
    }
  }

  const filteredPermissions = allPermissions.filter(p =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Permisiuni pentru: {role.displayName || role.name}</DialogTitle>
          <DialogDescription>
            Selectați permisiunile pe care le poate face această rol
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
          {/* Search */}
          <Input
            placeholder="Cauta permisiuni..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9"
          />

          {/* Permissions List */}
          <ScrollArea className="flex-1 border rounded-lg p-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Se încarcă permisiuni...
              </div>
            ) : filteredPermissions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nu s-au găsit permisiuni
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPermissions.map((permission) => (
                  <div key={permission.id} className="flex items-start space-x-3 p-2 hover:bg-accent rounded">
                    <Checkbox
                      id={permission.id}
                      checked={rolePermissions.has(permission.id)}
                      onCheckedChange={() => handleTogglePermission(permission.id)}
                      className="mt-1"
                    />
                    <label
                      htmlFor={permission.id}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="font-medium text-sm">{permission.name}</div>
                      {permission.description && (
                        <div className="text-xs text-muted-foreground">{permission.description}</div>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Anulare
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? 'Se salvează...' : 'Salvare'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
