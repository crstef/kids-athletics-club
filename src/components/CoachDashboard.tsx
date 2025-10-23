import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  ChartLine,
  Users,
  Trophy,
  ShieldCheck,
  Gear
} from '@phosphor-icons/react'
import { formatResult } from '@/lib/utils'
import { PerformanceChart } from './PerformanceChart'
import { PeriodFilter, getFilteredResults, getInitialDateRange, getFirstDataDate } from './PeriodFilter'
import { Period, Athlete, Result, AccountApprovalRequest } from '@/lib/types'

type WidgetSize = 'small' | 'medium' | 'large';

interface Widget {
  id: string;
  title: string;
  size: WidgetSize;
  component: React.ReactNode;
  enabled: boolean;
}

interface CoachDashboardProps {
  myAthletes: Athlete[];
  myResults: Result[];
  approvalRequests: AccountApprovalRequest[];
  onAddResult: (result: Omit<Result, 'id'>) => void;
  onUpdateResult: (resultId: string, updates: Partial<Result>) => void;
  onDeleteResult: (resultId: string) => void;
  onApproveRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string, reason?: string) => void;
}

const sizeClasses: Record<WidgetSize, string> = {
  small: 'col-span-1',
  medium: 'col-span-1 md:col-span-2',
  large: 'col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4',
};

export function CoachDashboard({
  myAthletes,
  myResults,
  approvalRequests,
}: CoachDashboardProps) {
  const [period, setPeriod] = useState<Period>('7days');
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>(() =>
    getInitialDateRange(myResults, '7days')
  );
  const [customizeOpen, setCustomizeOpen] = useState(false);

  useEffect(() => {
    setDateRange(getInitialDateRange(myResults, period));
  }, [period, myResults]);

  const filteredResults = useMemo(() => {
    return getFilteredResults(myResults, period, dateRange);
  }, [myResults, period, dateRange]);

  const firstDataDate = useMemo(() => getFirstDataDate(myResults), [myResults]);

  const initialWidgets: Widget[] = [
    {
      id: 'athletes',
      title: 'Sportivi Activi',
      size: 'small',
      enabled: true,
      component: (
        <CardContent>
          <div className="text-2xl font-bold">{myAthletes.length}</div>
        </CardContent>
      ),
    },
    {
      id: 'results',
      title: 'Rezultate Înregistrate',
      size: 'small',
      enabled: true,
      component: (
        <CardContent>
          <div className="text-2xl font-bold">{myResults.length}</div>
        </CardContent>
      ),
    },
    {
      id: 'approvals',
      title: 'Cereri de Aprobat',
      size: 'small',
      enabled: true,
      component: (
        <CardContent>
          <div className="text-2xl font-bold">{approvalRequests.length}</div>
        </CardContent>
      ),
    },
    {
      id: 'performance-chart',
      title: 'Evoluție Performanțe',
      size: 'large',
      enabled: true,
      component: <PerformanceChartWrapper myAthletes={myAthletes} myResults={myResults} />,
    },
    {
      id: 'recent-results',
      title: 'Rezultate Recente',
      size: 'medium',
      enabled: true,
      component: (
        <CardContent>
          <PeriodFilter
            period={period}
            setPeriod={setPeriod}
            dateRange={dateRange}
            setDateRange={setDateRange}
            firstDataDate={firstDataDate}
          />
          <ul className="space-y-2 mt-4">
            {filteredResults.slice(0, 5).map(result => {
              const athlete = myAthletes.find(a => a.id === result.athleteId);
              return (
                <li key={result.id} className="text-sm">
                  <strong>{athlete?.firstName} {athlete?.lastName}</strong>: {result.eventType} - {formatResult(result.value, result.unit)}
                </li>
              );
            })}
          </ul>
        </CardContent>
      ),
    },
    {
      id: 'pending-requests',
      title: 'Cereri în Așteptare',
      size: 'medium',
      enabled: true,
      component: (
        <CardContent>
          <ul className="space-y-2">
            {approvalRequests.map(request => (
              <li key={request.id} className="text-sm">
                Cerere de la {request.childName || 'utilizator nou'}
              </li>
            ))}
          </ul>
        </CardContent>
      ),
    },
  ];

  const [widgets, setWidgets] = useState(initialWidgets);

  // Keep widget metrics in sync with latest props
  useEffect(() => {
    setWidgets(initialWidgets);
  }, [myAthletes.length, myResults.length, approvalRequests.length]);

  const toggleWidget = (id: string) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w));
  };

  const changeWidgetSize = (id: string, size: WidgetSize) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, size } : w));
  };

  const moveWidget = (id: string, direction: 'up' | 'down') => {
    const index = widgets.findIndex(w => w.id === id);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= widgets.length) return;

    const newWidgets = [...widgets];
    const [movedWidget] = newWidgets.splice(index, 1);
    newWidgets.splice(newIndex, 0, movedWidget);
    setWidgets(newWidgets);
  };

  const renderWidget = (widget: Widget) => {
    if (!widget.enabled) return null;

    const iconMap: { [key: string]: React.ElementType } = {
      athletes: Users,
      results: Trophy,
      approvals: ShieldCheck,
      'performance-chart': ChartLine,
    };
    const Icon = iconMap[widget.id];

    return (
      <Card key={widget.id} className={sizeClasses[widget.size]}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
          {Icon && <Icon size={20} className="text-muted-foreground" />}
        </CardHeader>
        {widget.component}
      </Card>
    );
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button variant="outline" onClick={() => setCustomizeOpen(true)}>
          <Gear size={16} className="mr-2" />
          Personalizează Dashboard
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {widgets.map(renderWidget)}
      </div>
      <Dialog open={customizeOpen} onOpenChange={setCustomizeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Personalizează Dashboard</DialogTitle>
            <DialogDescription>
              Activează, dezactivează și rearanjează widget-urile.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {widgets.map((widget, index) => (
              <div key={widget.id} className="flex items-center justify-between p-2 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Checkbox
                    id={`widget-${widget.id}`}
                    checked={widget.enabled}
                    onCheckedChange={() => toggleWidget(widget.id)}
                  />
                  <Label htmlFor={`widget-${widget.id}`} className="text-base font-medium">
                    {widget.title}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={widget.size} onValueChange={(size) => changeWidgetSize(widget.id, size as Widget['size'])}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Mic</SelectItem>
                      <SelectItem value="medium">Mediu</SelectItem>
                      <SelectItem value="large">Mare</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" onClick={() => moveWidget(widget.id, 'up')} disabled={index === 0}>
                    ▲
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => moveWidget(widget.id, 'down')} disabled={index === widgets.length - 1}>
                    ▼
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


const PerformanceChartWrapper = ({ myAthletes, myResults }: { myAthletes: Athlete[], myResults: Result[] }) => {
  const eventTypes = [...new Set(myResults.map(r => r.eventType))];
  const [selectedEvent, setSelectedEvent] = useState<string | null>(eventTypes[0] || null);
  const athleteOptions = myAthletes.map(a => ({ value: a.id, label: `${a.firstName} ${a.lastName}` }));
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(myAthletes[0]?.id || null);

  const chartData = useMemo(() => {
    if (!selectedAthleteId || !selectedEvent) return [];
    return myResults
      .filter(r => r.athleteId === selectedAthleteId && r.eventType === selectedEvent)
      .map(r => ({ date: r.date, value: r.value }));
  }, [myResults, selectedAthleteId, selectedEvent]);

  const unit = useMemo(() => {
    return myResults.find(r => r.eventType === selectedEvent)?.unit || 'points';
  }, [myResults, selectedEvent]);

  const insufficientData = myAthletes.length === 0 || myResults.length === 0;

  return (
    <>
      {insufficientData ? (
        <CardContent><p>Nu sunt suficiente date pentru a afișa graficul.</p></CardContent>
      ) : (
        <>
          <CardHeader className="pt-0">
            <div className="flex gap-2 pt-2">
              <Select value={selectedAthleteId || ''} onValueChange={(val) => setSelectedAthleteId(val)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Selectează Atlet" />
                </SelectTrigger>
                <SelectContent>
                  {athleteOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedEvent || ''} onValueChange={(val) => setSelectedEvent(val)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Selectează Probă" />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map(event => <SelectItem key={event} value={event}>{event}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {selectedEvent ? (
              <PerformanceChart
                data={chartData}
                eventType={selectedEvent}
                unit={unit}
              />
            ) : (
              <p>Selectează o probă pentru a vedea graficul.</p>
            )}
          </CardContent>
        </>
      )}
    </>
  )
}
