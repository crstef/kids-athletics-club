import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import type { Role } from '@/lib/types'

interface Widget {
  componentId: string
  displayName: string
  description?: string
  icon?: string
  componentType: 'tab' | 'widget'
  canView: boolean
}

interface RoleDashboardWidgetsModalProps {
  open: boolean
  onClose: () => void
  role: Role
  onSave: () => void
}

export function RoleDashboardWidgetsModal({ open, onClose, role, onSave }: RoleDashboardWidgetsModalProps) {
  const [allWidgets, setAllWidgets] = useState<Widget[]>([])
  const [selectedWidgets, setSelectedWidgets] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Fetch widgets and role's widgets
  useEffect(() => {
    if (!open || !role) return

    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Get all components/widgets with permission flags
        const response = await apiClient.getRoleComponentPermissions(role.id) as any[]

        // Normalize components that can appear on dashboard (tabs + widgets)
        const widgets: Widget[] = response
          .map((component: any) => {
            const rawType = (component.componentType ?? component.component_type ?? '').toString().toLowerCase()
            let normalizedType: 'tab' | 'widget' | null = null

            if (rawType === 'tab' || rawType.endsWith('_tab')) {
              normalizedType = 'tab'
            } else if (rawType === 'widget' || rawType.includes('widget')) {
              normalizedType = 'widget'
            }

            if (!normalizedType) return null

            const componentId = component.componentId ?? component.component_id ?? component.id
            if (!componentId) return null

            return {
              componentId,
              displayName: component.displayName ?? component.display_name ?? component.componentName ?? component.name ?? 'Componentă',
              description: component.description ?? '',
              icon: component.icon ?? undefined,
              componentType: normalizedType,
              canView: Boolean(component.canView ?? component.can_view ?? component.isAssigned)
            } as Widget
          })
          .filter((component): component is Widget => component !== null)

        setAllWidgets(widgets)

        // Selected widgets correspond to those currently visible
        setSelectedWidgets(new Set(widgets.filter(widget => widget.canView).map(widget => widget.componentId)))
      } catch (error) {
        console.error('Error fetching widgets:', error)
        toast.error('Eroare la încărcarea widget-urilor')
        // Fallback: at least don't crash
        setAllWidgets([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [open, role])

  const handleToggleWidget = (componentId: string) => {
    const newSet = new Set(selectedWidgets)
    if (newSet.has(componentId)) {
      newSet.delete(componentId)
    } else {
      newSet.add(componentId)
    }
    setSelectedWidgets(newSet)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Update component permissions for this role
      const permissions = allWidgets.map(widget => ({
        componentId: widget.componentId,
        can_view: selectedWidgets.has(widget.componentId),
        can_create: false,
        can_edit: false,
        can_delete: false,
        can_export: false
      }))

      await apiClient.updateRoleComponentPermissions(role.id, permissions)

    toast.success('Widget-urile au fost actualizate!')
    // Trigger immediate components refresh for current user sessions
    window.dispatchEvent(new CustomEvent('components:refresh'))
      onSave()
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Eroare la salvarea widget-urilor')
      console.error('Error saving widgets:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Dashboard Widget-uri pentru: {role.displayName || role.name}</DialogTitle>
          <DialogDescription>
            Selectați widget-urile care vor fi disponibile în dashboard pentru această rol
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
          {/* Widgets List */}
          <ScrollArea className="flex-1 border rounded-lg p-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Se încarcă widget-uri...
              </div>
            ) : allWidgets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nu s-au găsit widget-uri disponibile
              </div>
            ) : (
              <div className="space-y-3">
                {allWidgets.map((widget) => (
                  <div key={widget.componentId} className="flex items-start space-x-3 p-2 hover:bg-accent rounded">
                    <Checkbox
                      id={widget.componentId}
                      checked={selectedWidgets.has(widget.componentId)}
                      onCheckedChange={() => handleToggleWidget(widget.componentId)}
                      className="mt-1"
                    />
                    <label
                      htmlFor={widget.componentId}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="font-medium text-sm">{widget.displayName}</div>
                      {widget.description && (
                        <div className="text-xs text-muted-foreground">{widget.description}</div>
                      )}
                      <div className="text-xs text-muted-foreground/70 mt-1">
                        Tip: {widget.componentType}
                      </div>
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
