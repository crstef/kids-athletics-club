import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import type { Role, Permission } from '@/lib/types'

interface RolePermissionsDialogProps {
  role: Role | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
}

export default function RolePermissionsDialog({
  role,
  open,
  onOpenChange,
  onSave,
}: RolePermissionsDialogProps) {
  const [allPermissions, setAllPermissions] = useState<Permission[]>([])
  const [rolePermissions, setRolePermissions] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && role) {
      fetchData()
    }
  }, [open, role])

  const fetchData = async () => {
    if (!role) return
    
    try {
      setLoading(true)
      const [allPerms, rolePerms] = await Promise.all([
        apiClient.getPermissions() as Promise<Permission[]>,
        apiClient.getRolePermissions(role.id) as Promise<Permission[]>,
      ])
      setAllPermissions(allPerms)
      setRolePermissions(new Set(rolePerms.map(p => p.id)))
    } catch (_error) {
      toast.error('Eroare la încărcarea permisiunilor')
    } finally {
      setLoading(false)
    }
  }

  // Removed unused handleTogglePermission (inline handlers used below)

  const handleSave = async () => {
    if (!role) return

    try {
      setLoading(true)
      
      // Get current role permissions
      const current = await apiClient.getRolePermissions(role.id) as Permission[]
      const currentIds = new Set(current.map(p => p.id))
      
      // Remove unchecked permissions
      for (const perm of current) {
        if (!rolePermissions.has(perm.id)) {
          await apiClient.removeRolePermission(role.id, perm.id)
        }
      }
      
      // Add newly checked permissions
      for (const permId of rolePermissions) {
        if (!currentIds.has(permId)) {
          await apiClient.addRolePermission(role.id, permId)
        }
      }
      
      toast.success('Permisiuni actualizate cu succes!')
      onSave()
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error?.message || 'Eroare la salvare')
    } finally {
      setLoading(false)
    }
  }

  const filteredPermissions = allPermissions.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const groupedPermissions = filteredPermissions.reduce((acc, perm) => {
    const category = perm.name.split('.')[0]
    if (!acc[category]) acc[category] = []
    acc[category].push(perm)
    return acc
  }, {} as Record<string, Permission[]>)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Permisiuni - {role?.displayName}</DialogTitle>
          <DialogDescription>
            Selectează permisiunile disponibile pentru acest rol
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <Input
            placeholder="Caută permisiuni..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {Object.entries(groupedPermissions).map(([category, perms]) => (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between sticky top-0 bg-background py-2">
                    <h3 className="font-semibold text-sm uppercase text-muted-foreground">
                      {category}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {perms.filter(p => rolePermissions.has(p.id)).length} / {perms.length}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {perms.map((permission) => (
                      <div
                        key={permission.id}
                        className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent transition-colors"
                      >
                        <Checkbox
                          checked={rolePermissions.has(permission.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setRolePermissions(new Set([...rolePermissions, permission.id]))
                            } else {
                              const newSet = new Set(rolePermissions)
                              newSet.delete(permission.id)
                              setRolePermissions(newSet)
                            }
                          }}
                          disabled={role?.isSystem}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{permission.name}</p>
                          {permission.description && (
                            <p className="text-xs text-muted-foreground">
                              {permission.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {rolePermissions.size} / {allPermissions.length} selectate
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Anulează
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Salvare...' : 'Salvează'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
