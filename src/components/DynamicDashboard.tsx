import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Gear } from '@phosphor-icons/react';
import { WIDGET_DEFINITIONS, userCanAccessWidget } from '@/lib/widget-definitions';
import type { User, Athlete, EventTypeCustom, Permission, Result, AccessRequest, Message } from '@/lib/types';
import { cn } from '@/lib/utils';

interface DynamicDashboardProps {
  currentUser: User;
  // Data for widgets
  users?: User[];
  athletes?: Athlete[];
  events?: EventTypeCustom[];
  permissions?: Permission[];
  results?: Result[];
  accessRequests?: AccessRequest[];
  messages?: Message[];
  // Handlers
  onNavigateToTab?: (tab: string) => void;
  onViewAthleteDetails?: (athlete: Athlete) => void;
  // Widget configuration
  initialWidgets?: string[];
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
    onNavigateToTab,
    onViewAthleteDetails,
    initialWidgets,
  } = props;

  const getDefaultWidgets = (): string[] => {
    return Object.keys(WIDGET_DEFINITIONS).filter(widgetId =>
      userCanAccessWidget(widgetId, currentUser.permissions || [])
    );
  };

  const [enabledWidgets, setEnabledWidgets] = useState<string[]>(
    initialWidgets || getDefaultWidgets()
  );
  const [customizeOpen, setCustomizeOpen] = useState(false);

  const toggleWidget = (widgetId: string) => {
    setEnabledWidgets(prev =>
      prev.includes(widgetId)
        ? prev.filter(id => id !== widgetId)
        : [...prev, widgetId]
    );
  };

  const buildWidgetProps = (widgetId: string): any => {
    const widgetDef = WIDGET_DEFINITIONS[widgetId];
    const onNavigate = () => {
      if (widgetId.startsWith('stats-')) {
        onNavigateToTab?.(widgetId.replace('stats-', ''));
      }
    };

    switch (widgetId) {
      case 'stats-users':
        return { icon: widgetDef.icon, title: widgetDef.name, value: users.length, description: `${users.length} activi`, onNavigate };
      case 'stats-athletes':
        return { icon: widgetDef.icon, title: widgetDef.name, value: athletes.length, description: `${athletes.length} în sistem`, onNavigate };
      case 'stats-events':
        return { icon: widgetDef.icon, title: widgetDef.name, value: events.length, description: `${events.length} configurate`, onNavigate };
      case 'recent-users':
        return { users, onNavigateToTab };
      case 'performance-evolution':
        return { athletes, results };
      case 'recent-results':
        return { athletes, results, onNavigateToTab };
      case 'pending-requests':
        return { requests: accessRequests, onNavigateToTab };
      default:
        return {};
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Dashboard</h2>
          <p className="text-muted-foreground">Bine ai revenit, {currentUser.firstName}!</p>
        </div>
        <Button variant="outline" onClick={() => setCustomizeOpen(true)}>
          <Gear size={16} className="mr-2" />
          Personalizează
        </Button>
      </div>

      {enabledWidgets.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[minmax(180px,auto)]">
          {enabledWidgets.map(widgetId => {
            const widgetConfig = WIDGET_DEFINITIONS[widgetId];
            if (!widgetConfig || !userCanAccessWidget(widgetId, currentUser.permissions || [])) {
              return null;
            }

            const WidgetComponent = widgetConfig.component;
            const widgetProps = buildWidgetProps(widgetId);
            const { fullWidth } = widgetConfig;

            return (
              <div
                key={widgetId}
                className={cn(
                  'col-span-1 sm:col-span-1',
                  fullWidth ? 'sm:col-span-2 md:col-span-3 lg:col-span-4' : 'md:col-span-1'
                )}
              >
                <WidgetComponent {...widgetProps} />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">Nu aveți widget-uri activate pe dashboard.</p>
          <Button onClick={() => setCustomizeOpen(true)}>
            <Gear size={16} className="mr-2" />
            Activează Widget-uri
          </Button>
        </div>
      )}

      <CustomizeDialog
        open={customizeOpen}
        onOpenChange={setCustomizeOpen}
        currentUser={currentUser}
        enabledWidgets={enabledWidgets}
        onToggleWidget={toggleWidget}
      />
    </div>
  );
}

// Separate dialog component for cleaner code
interface CustomizeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: User;
  enabledWidgets: string[];
  onToggleWidget: (widgetId: string) => void;
}

function CustomizeDialog({ open, onOpenChange, currentUser, enabledWidgets, onToggleWidget }: CustomizeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Personalizează Dashboard</DialogTitle>
          <DialogDescription>Activează sau dezactivează widget-urile de pe dashboard.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {Object.values(WIDGET_DEFINITIONS).map((widget) => {
            if (!userCanAccessWidget(widget.id, currentUser.permissions || [])) {
              return null;
            }
            
            return (
              <div key={widget.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50">
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
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
