import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Gear } from '@phosphor-icons/react'
import { WIDGET_REGISTRY, userCanAccessWidget } from '@/lib/widgetRegistry'
import type { User, Athlete, EventTypeCustom, Permission, Result, AccessRequest, Message } from '@/lib/types'

interface DynamicDashboardProps {
  currentUser: User
  // Data for widgets
  users?: User[]
  athletes?: Athlete[]
  events?: EventTypeCustom[]
  permissions?: Permission[]
  results?: Result[]
  accessRequests?: AccessRequest[]
  messages?: Message[]
  // Handlers
  onNavigateToTab?: (tab: string) => void
  onViewAthleteDetails?: (athlete: Athlete) => void
  // Widget configuration (from database or localStorage)
  initialWidgets?: string[] // Array of widget IDs to display
}

export function DynamicDashboard(props: DynamicDashboardProps) {
  const {
    currentUser,
    users = [],
    athletes = [],
    events = [],
    permissions = [],
    results = [],
    accessRequests = [],
    messages = [],
    onNavigateToTab,
    onViewAthleteDetails,
    initialWidgets
  } = props

  // Get default widgets based on user permissions if none provided
  const getDefaultWidgets = (): string[] => {
    const allWidgets = Object.keys(WIDGET_REGISTRY)
    return allWidgets.filter(widgetId => 
      userCanAccessWidget(widgetId, currentUser.permissions || [])
    )
  }

  const [enabledWidgets, setEnabledWidgets] = useState<string[]>(
    initialWidgets || getDefaultWidgets()
  )
  const [customizeOpen, setCustomizeOpen] = useState(false)

  const toggleWidget = (widgetId: string) => {
    setEnabledWidgets(prev => 
      prev.includes(widgetId) 
        ? prev.filter(id => id !== widgetId)
        : [...prev, widgetId]
    )
  }

  // Build widget-specific props
  const buildWidgetProps = (widgetId: string): any => {
    const baseProps = {
      onNavigateToTab
    }

    switch (widgetId) {
      case 'stats-users':
        return { ...baseProps, users }
      
      case 'stats-athletes':
        return { 
          ...baseProps, 
          athletes,
          onViewAthleteDetails
        }
      
      case 'stats-events':
        return { ...baseProps, events }
      
      case 'stats-permissions':
        return { ...baseProps, permissions }
      
      case 'recent-users':
        return { users }
      
      case 'recent-events':
        return { events }
      
      case 'performance-chart':
        return { athletes, results }
      
      case 'recent-results':
        return { athletes, results }
      
      case 'pending-requests':
        return { requests: accessRequests }
      
      default:
        return baseProps
    }
  }

  // If no widgets enabled, show empty state
  if (enabledWidgets.length === 0) {
    return (
      <div className="space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-linear-to-r from-primary/10 via-primary/5 to-accent/10 blur-3xl -z-10" />
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2 bg-linear-to-r from-primary to-accent bg-clip-text text-transparent" style={{ fontFamily: 'Outfit', letterSpacing: '-0.02em' }}>
                Dashboard
              </h2>
              <p className="text-muted-foreground">
                Bine ai revenit, {currentUser.firstName}!
              </p>
            </div>
            <Button variant="outline" onClick={() => setCustomizeOpen(true)}>
              <Gear size={16} className="mr-2" />
              Personalizează
            </Button>
          </div>
        </div>

        <div className="text-center py-12 border border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">
            Nu aveți widget-uri activate pe dashboard
          </p>
          <Button onClick={() => setCustomizeOpen(true)}>
            <Gear size={16} className="mr-2" />
            Activează Widget-uri
          </Button>
        </div>

        <CustomizeDialog 
          open={customizeOpen}
          onOpenChange={setCustomizeOpen}
          currentUser={currentUser}
          enabledWidgets={enabledWidgets}
          onToggleWidget={toggleWidget}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <div className="absolute inset-0 bg-linear-to-r from-primary/10 via-primary/5 to-accent/10 blur-3xl -z-10" />
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2 bg-linear-to-r from-primary to-accent bg-clip-text text-transparent" style={{ fontFamily: 'Outfit', letterSpacing: '-0.02em' }}>
              Dashboard
            </h2>
            <p className="text-muted-foreground">
              Bine ai revenit, {currentUser.firstName}!
            </p>
          </div>
          <Button variant="outline" onClick={() => setCustomizeOpen(true)}>
            <Gear size={16} className="mr-2" />
            Personalizează
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-auto">
        {enabledWidgets.map(widgetId => {
          const widgetConfig = WIDGET_REGISTRY[widgetId]
          if (!widgetConfig) return null
          
          // Double-check permission
          if (!userCanAccessWidget(widgetId, currentUser.permissions || [])) {
            return null
          }

          const WidgetComponent = widgetConfig.component
          const widgetProps = buildWidgetProps(widgetId)
          
          return (
            <div key={widgetId} className="col-span-1">
              <WidgetComponent {...widgetProps} />
            </div>
          )
        })}
      </div>

      <CustomizeDialog 
        open={customizeOpen}
        onOpenChange={setCustomizeOpen}
        currentUser={currentUser}
        enabledWidgets={enabledWidgets}
        onToggleWidget={toggleWidget}
      />
    </div>
  )
}

// Separate dialog component for cleaner code
interface CustomizeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUser: User
  enabledWidgets: string[]
  onToggleWidget: (widgetId: string) => void
}

function CustomizeDialog({ open, onOpenChange, currentUser, enabledWidgets, onToggleWidget }: CustomizeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Personalizează Dashboard</DialogTitle>
          <DialogDescription>
            Activează sau dezactivează widget-urile pe dashboard
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {Object.values(WIDGET_REGISTRY).map((widget) => {
            // Only show widgets user has permission for
            if (!userCanAccessWidget(widget.id, currentUser.permissions || [])) {
              return null
            }
            
            return (
              <div key={widget.id} className="flex items-center gap-4 p-4 border rounded-lg">
                <Checkbox
                  id={`widget-${widget.id}`}
                  checked={enabledWidgets.includes(widget.id)}
                  onCheckedChange={() => onToggleWidget(widget.id)}
                />
                <Label htmlFor={`widget-${widget.id}`} className="flex-1 cursor-pointer">
                  <div className="font-medium">{widget.name}</div>
                  <div className="text-sm text-muted-foreground">{widget.description}</div>
                </Label>
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
