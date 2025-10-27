import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Plus, Pencil, Trash, ShieldCheck, Lock, UserGear, Layout } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Role, Permission, PermissionName, ResourceType } from '@/lib/types'
import { RoleDashboardWidgetsModal } from './RoleDashboardWidgetsModal'
import { useAuth } from '@/lib/auth-context'
import { apiClient } from '@/lib/api-client'

interface RoleManagementProps {
  roles: Role[]
  permissions: Permission[]
  currentUserId: string
  onAddRole: (roleData: Omit<Role, 'id' | 'createdAt' | 'createdBy'>) => void
  onUpdateRole: (roleId: string, updates: Partial<Role>) => void
  onDeleteRole: (roleId: string) => void
}

type WidgetGroupKey = 'general' | 'admin' | 'coach' | 'parent' | 'athlete'

interface WidgetPermissionEntry {
  componentId: string
  componentName: string
  displayName: string
  description?: string
  canView: boolean
  group: WidgetGroupKey
}

const PERMISSION_WIDGET_GROUP_MAP: Record<string, WidgetGroupKey> = {
  'dashboard.view': 'general',
  'dashboard.view.superadmin': 'admin',
  'dashboard.view.coach': 'coach',
  'dashboard.view.parent': 'parent',
  'dashboard.view.athlete': 'athlete'
}

const determineWidgetGroup = (name: string, displayName: string): WidgetGroupKey => {
  const key = `${name} ${displayName}`.toLowerCase()
  if (key.includes('coach')) return 'coach'
  if (key.includes('parent')) return 'parent'
  if (key.includes('athlete')) return 'athlete'
  if (key.includes('admin') || key.includes('super')) return 'admin'
  return 'general'
}

export function RoleManagement({ 
  roles, 
  permissions,
  currentUserId, 
  onAddRole, 
  onUpdateRole, 
  onDeleteRole 
}: RoleManagementProps) {
  const { currentUser, hasPermission } = useAuth()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null)
  const [widgetsModalOpen, setWidgetsModalOpen] = useState(false)
  const [widgetsRole, setWidgetsRole] = useState<Role | null>(null)
  const [widgetEntries, setWidgetEntries] = useState<WidgetPermissionEntry[]>([])
  const [widgetsLoading, setWidgetsLoading] = useState(false)
  const [widgetsDirty, setWidgetsDirty] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    isActive: true,
    permissions: [] as PermissionName[]
  })

  const canManageWidgets = (currentUser?.role === 'superadmin') || hasPermission('dashboards.assign')

  const groupedPermissions = permissions.reduce((acc, perm) => {
    const [resource] = perm.name.split('.') as [ResourceType, string]
    if (!acc[resource]) acc[resource] = []
    acc[resource].push(perm)
    return acc
  }, {} as Record<ResourceType, Permission[]>)

  useEffect(() => {
    if (!dialogOpen || !editingRole || !canManageWidgets) {
      setWidgetEntries([])
      setWidgetsDirty(false)
      return
    }

    let cancelled = false
    setWidgetsLoading(true)

    ;(async () => {
      try {
        const response = await apiClient.getRoleComponentPermissions(editingRole.id)
        const rawList = Array.isArray(response) ? response : response?.permissions ?? []
        
        // Ensure rawList is actually an array
        if (!Array.isArray(rawList)) {
          console.warn('getRoleComponentPermissions returned non-array data:', rawList)
          setWidgetEntries([])
          return
        }

        const normalized = rawList
          .map((component: any) => {
            const componentId = component.componentId ?? component.component_id ?? component.id
            if (!componentId) return null

            const componentName = component.componentName ?? component.component_name ?? component.name ?? ''
            const displayName = component.displayName ?? component.display_name ?? (componentName || 'Componentă')
            const rawType = (component.componentType ?? component.component_type ?? '').toString().toLowerCase()
            if (!rawType.includes('widget')) return null

            return {
              componentId,
              componentName,
              displayName,
              description: component.description ?? '',
              canView: Boolean(component.canView ?? component.can_view ?? component.isAssigned),
              group: determineWidgetGroup(componentName, displayName)
            } as WidgetPermissionEntry
          })
          .filter((entry): entry is WidgetPermissionEntry => entry !== null)

        if (!cancelled) {
          setWidgetEntries(normalized)
          setWidgetsDirty(false)
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load role widgets', error)
          toast.error('Eroare la încărcarea widget-urilor rolului')
          setWidgetEntries([])
        }
      } finally {
        if (!cancelled) {
          setWidgetsLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [dialogOpen, editingRole, canManageWidgets])

  const widgetGroups = useMemo(() => {
    const groups: Record<WidgetGroupKey, WidgetPermissionEntry[]> = {
      general: [],
      admin: [],
      coach: [],
      parent: [],
      athlete: []
    }

    // Safety check: ensure widgetEntries is an array
    if (!Array.isArray(widgetEntries)) {
      console.warn('widgetEntries is not an array:', widgetEntries)
      return groups
    }

    widgetEntries.forEach((entry) => {
      groups[entry.group].push(entry)
    })

    (Object.keys(groups) as WidgetGroupKey[]).forEach((key) => {
      groups[key] = groups[key].sort((a, b) => a.displayName.localeCompare(b.displayName))
    })

    return groups
  }, [widgetEntries])

  const handleOpenAdd = () => {
    setEditingRole(null)
    setFormData({
      name: '',
      displayName: '',
      description: '',
      isActive: true,
      permissions: []
    })
    setDialogOpen(true)
  }

  const handleOpenEdit = (role: Role) => {
    setEditingRole(role)
    setFormData({
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      isActive: role.isActive,
      permissions: role.permissions
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.displayName) {
      toast.error('Completează toate câmpurile obligatorii')
      return
    }

    try {
      if (editingRole) {
        const maybePromise = onUpdateRole(editingRole.id, {
          displayName: formData.displayName,
          description: formData.description,
          isActive: formData.isActive,
          permissions: formData.permissions,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUserId
        })

        await awaitIfPromise(maybePromise)

        if (canManageWidgets && widgetsDirty && widgetEntries.length > 0) {
          try {
            const payload = widgetEntries.map((entry) => ({
              componentId: entry.componentId,
              can_view: entry.canView,
              can_create: false,
              can_edit: false,
              can_delete: false,
              can_export: false
            }))

            await apiClient.updateRoleComponentPermissions(editingRole.id, payload)
            window.dispatchEvent(new CustomEvent('components:refresh'))
            toast.success('Widget-urile dashboard au fost actualizate')
          } catch (error) {
            console.error('Failed to save widget permissions', error)
            toast.error('Nu s-au putut salva widget-urile rolului')
            return
          }
        }
      } else {
        const normalizedName = formData.name.toLowerCase().replace(/\s+/g, '_')
        const nameExists = roles.some(r => r.name === normalizedName)
        if (nameExists) {
          toast.error('Există deja un rol cu acest nume')
          return
        }

        const maybePromise = onAddRole({
          name: normalizedName,
          displayName: formData.displayName,
          description: formData.description,
          isSystem: false,
          isActive: formData.isActive,
          permissions: formData.permissions
        })

        await awaitIfPromise(maybePromise)
      }

      setDialogOpen(false)
    } catch (error) {
      console.error('Failed to save role', error)
      toast.error('Eroare la salvarea rolului')
    }
  }

  const handleTogglePermission = (permName: PermissionName) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permName)
        ? prev.permissions.filter(p => p !== permName)
        : [...prev.permissions, permName]
    }))
  }

  const handleToggleWidgetPermission = (componentId: string) => {
    setWidgetEntries(prev => prev.map(entry =>
      entry.componentId === componentId
        ? { ...entry, canView: !entry.canView }
        : entry
    ))
    setWidgetsDirty(true)
  }

  const awaitIfPromise = async (maybePromise: any) => {
    if (maybePromise && typeof maybePromise.then === 'function') {
      await maybePromise
    }
  }

  const handleSelectAllInResource = (resource: ResourceType) => {
    const resourcePerms = groupedPermissions[resource]?.map(p => p.name) || []
    const allSelected = resourcePerms.every(p => formData.permissions.includes(p))
    
    setFormData(prev => ({
      ...prev,
      permissions: allSelected
        ? prev.permissions.filter(p => !resourcePerms.includes(p))
        : [...new Set([...prev.permissions, ...resourcePerms])]
    }))
  }

  const handleDelete = () => {
    if (!deleteRoleId) return
    
    const role = roles.find(r => r.id === deleteRoleId)
    if (role?.name === 'superadmin') {
      toast.error('Rolul SuperAdmin nu poate fi șters')
      setDeleteRoleId(null)
      return
    }
    
    onDeleteRole(deleteRoleId)
    setDeleteRoleId(null)
  }

  const deleteRole = roles.find(r => r.id === deleteRoleId)

  const resourceLabels: Record<string, string> = {
    athletes: 'Atleți',
    results: 'Rezultate',
    events: 'Probe',
    coaches: 'Antrenori',
    users: 'Utilizatori',
    permissions: 'Permisiuni',
    roles: 'Roluri',
    messages: 'Mesaje',
    access_requests: 'Cereri Acces',
    approvals: 'Aprobări',
    dashboard: 'Dashboard'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <UserGear size={28} weight="duotone" className="text-primary" />
            Management Roluri
          </h2>
          <p className="text-muted-foreground mt-1">
            Gestionează rolurile utilizatorilor și permisiunile asociate
          </p>
        </div>
        <Button onClick={handleOpenAdd}>
          <Plus size={18} className="mr-2" />
          Rol Nou
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <Card key={role.id} className={!role.isActive ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {role.isSystem && <Lock size={16} className="text-muted-foreground" />}
                    {role.displayName}
                  </CardTitle>
                  <CardDescription>{role.name}</CardDescription>
                </div>
                <Badge variant={role.isActive ? 'default' : 'secondary'}>
                  {role.isActive ? 'Activ' : 'Inactiv'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{role.description}</p>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">Permisiuni ({role.permissions.length})</div>
                <div className="flex flex-wrap gap-1">
                  {role.permissions.slice(0, 6).map((perm) => (
                    <Badge key={perm} variant="outline" className="text-xs">
                      {perm.split('.')[1]}
                    </Badge>
                  ))}
                  {role.permissions.length > 6 && (
                    <Badge variant="outline" className="text-xs">
                      +{role.permissions.length - 6} mai multe
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                {canManageWidgets && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setWidgetsRole(role)
                      setWidgetsModalOpen(true)
                    }}
                    className="flex-1"
                  >
                    <Layout size={14} className="mr-1" />
                    Widgets
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleOpenEdit(role)}
                  className="flex-1"
                >
                  <Pencil size={14} className="mr-1" />
                  Editează
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setDeleteRoleId(role.id)}
                  className="flex-1"
                >
                  <Trash size={14} className="mr-1" />
                  Șterge
                </Button>
              </div>
              
              {role.isSystem && (
                <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
                  <ShieldCheck size={14} />
                  Rol de sistem
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? 'Editare Rol' : 'Rol Nou'}
              {editingRole?.isSystem && (
                <Badge variant="outline" className="ml-2">
                  <ShieldCheck size={12} className="mr-1" />
                  Sistem
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {editingRole 
                ? (editingRole.isSystem 
                    ? 'Modifică setările și permisiunile acestui rol de sistem. Atenție: modificările ar putea afecta funcționalitatea aplicației.' 
                    : 'Modifică setările și permisiunile rolului')
                : 'Creează un rol nou cu permisiunile dorite'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nume Intern *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="ex: manager_atleți"
                  disabled={!!editingRole}
                />
                {editingRole && (
                  <p className="text-xs text-muted-foreground">
                    Numele intern nu poate fi modificat
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">Nume Afișat *</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="ex: Manager Atleți"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descriere</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrie responsabilitățile acestui rol..."
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label>Status Rol</Label>
                <div className="text-sm text-muted-foreground">
                  Rolul este {formData.isActive ? 'activ' : 'inactiv'}
                </div>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
            </div>

            <div className="space-y-3">
              <Label>Permisiuni</Label>
              <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
                {Object.entries(groupedPermissions).map(([resource, perms]) => {
                  const allSelected = perms.every(p => formData.permissions.includes(p.name))
                  const someSelected = perms.some(p => formData.permissions.includes(p.name))
                  
                  return (
                    <div key={resource} className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={allSelected}
                            onCheckedChange={() => handleSelectAllInResource(resource as ResourceType)}
                            className={someSelected && !allSelected ? 'opacity-50' : ''}
                          />
                          <Label className="font-semibold cursor-pointer">
                            {resourceLabels[resource as ResourceType] || resource}
                          </Label>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {perms.filter(p => formData.permissions.includes(p.name)).length}/{perms.length}
                        </Badge>
                      </div>
                      <div className={resource === 'dashboard' ? 'space-y-3 pl-6' : 'grid gap-2 pl-6 sm:grid-cols-2'}>
                        {perms.map((perm) => {
                          if (resource !== 'dashboard') {
                            return (
                              <div key={perm.id} className="flex items-start gap-2">
                                <Checkbox
                                  id={perm.id}
                                  checked={formData.permissions.includes(perm.name)}
                                  onCheckedChange={() => handleTogglePermission(perm.name)}
                                  disabled={!perm.isActive}
                                />
                                <Label 
                                  htmlFor={perm.id} 
                                  className="text-sm cursor-pointer leading-tight"
                                >
                                  {perm.description}
                                  {!perm.isActive && (
                                    <Badge variant="secondary" className="ml-2 text-xs">Inactiv</Badge>
                                  )}
                                </Label>
                              </div>
                            )
                          }

                          const isSelected = formData.permissions.includes(perm.name)
                          const widgetGroup = PERMISSION_WIDGET_GROUP_MAP[perm.name]
                          const groupWidgets = widgetGroup ? widgetGroups[widgetGroup] : []
                          const showWidgets = Boolean(editingRole && canManageWidgets && widgetGroup)

                          return (
                            <div key={perm.id} className="space-y-2">
                              <div className="flex items-start gap-2">
                                <Checkbox
                                  id={perm.id}
                                  checked={isSelected}
                                  onCheckedChange={() => handleTogglePermission(perm.name)}
                                  disabled={!perm.isActive}
                                />
                                <Label 
                                  htmlFor={perm.id} 
                                  className="text-sm cursor-pointer leading-tight"
                                >
                                  {perm.description}
                                  {!perm.isActive && (
                                    <Badge variant="secondary" className="ml-2 text-xs">Inactiv</Badge>
                                  )}
                                </Label>
                              </div>

                              {showWidgets && widgetGroup && (
                                <div className="ml-6 border-l pl-3 space-y-1">
                                  <div className="text-xs font-semibold text-muted-foreground">
                                    Widget-uri vizibile
                                  </div>
                                  {widgetsLoading ? (
                                    <div className="text-xs text-muted-foreground">
                                      Se încarcă widget-uri...
                                    </div>
                                  ) : groupWidgets.length > 0 ? (
                                    groupWidgets.map((widget) => (
                                      <label
                                        key={widget.componentId}
                                        className="flex items-center gap-2 text-xs cursor-pointer"
                                      >
                                        <Checkbox
                                          checked={widget.canView}
                                          onCheckedChange={() => handleToggleWidgetPermission(widget.componentId)}
                                          disabled={!isSelected}
                                        />
                                        <span>{widget.displayName}</span>
                                      </label>
                                    ))
                                  ) : (
                                    <div className="text-xs text-muted-foreground">
                                      {widgetGroup === 'general'
                                        ? 'Nu există widget-uri configurate pentru acest dashboard.'
                                        : 'Nu există widget-uri dedicate pentru acest dashboard. Configurează-le din lista pentru "Poate vizualiza dashboard".'}
                                    </div>
                                  )}

                                  {!isSelected && (
                                    <div className="text-xs text-muted-foreground">
                                      Activează permisiunea pentru a modifica widget-urile.
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="text-sm text-muted-foreground">
                Total: {formData.permissions.length} permisiuni selectate
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Anulează
            </Button>
            <Button onClick={handleSubmit}>
              {editingRole ? 'Actualizează' : 'Creează'} Rol
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteRoleId} onOpenChange={() => setDeleteRoleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmare ștergere</AlertDialogTitle>
            <AlertDialogDescription>
              Ești sigur că vrei să ștergi rolul <strong>{deleteRole?.displayName}</strong>?
              {deleteRole?.name === 'superadmin' ? (
                <span className="block mt-2 text-destructive font-semibold">
                  Atenție: Rolul SuperAdmin este esențial pentru funcționarea sistemului și nu poate fi șters.
                </span>
              ) : (
                <span className="block mt-2 text-muted-foreground">
                  Utilizatorii cu acest rol ar putea pierde accesul la anumite funcționalități.
                  {deleteRole?.isSystem && (
                    <span className="block mt-1 text-destructive">
                      Acesta este un rol de sistem și ștergerea lui ar putea afecta funcționalitatea aplicației.
                    </span>
                  )}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Șterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {widgetsRole && (
        <RoleDashboardWidgetsModal
          open={widgetsModalOpen}
          onClose={() => {
            setWidgetsModalOpen(false)
            setWidgetsRole(null)
          }}
          role={widgetsRole}
          onSave={() => {}}
        />
      )}
    </div>
  )
}
