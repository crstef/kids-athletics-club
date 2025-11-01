import { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type LegendProps,
  type TooltipProps
} from 'recharts'
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent'
import type { PerformanceData, Period } from '@/lib/types'
import { PeriodFilter, getFilteredResults, getFirstDataDate, getInitialDateRange } from './PeriodFilter'
import { formatResultValue, getUnitDisplayLabel, normalizeUnit, preferLowerValues } from '@/lib/units'

const PRIMARY_COLOR = '#3DDC84'
const COMPARISON_COLORS = ['#0ea5e9', '#f97316', '#22c55e', '#a855f7', '#facc15', '#ec4899']

interface ComparisonSeries {
  label: string
  data: PerformanceData[]
  color?: string
}

interface ChartSeries {
  key: string
  label: string
  tooltipLabel: string
  data: PerformanceData[]
  color: string
  isPrimary: boolean
}

interface ChartDatum {
  timestamp: number
  dateLabel: string
  __raw: Record<string, PerformanceData | undefined>
  [key: string]: number | string | Record<string, PerformanceData | undefined>
}

interface PerformanceChartProps {
  data: PerformanceData[]
  eventType: string
  unit?: string | null
  comparisons?: ComparisonSeries[]
}

const formatDateLabel = (timestamp: number) =>
  new Intl.DateTimeFormat('ro-RO', {
    month: 'short',
    day: 'numeric'
  }).format(new Date(timestamp))

function buildChartData(series: ChartSeries[]): ChartDatum[] {
  const pointMap = new Map<number, ChartDatum>()

  for (const seriesEntry of series) {
    for (const point of seriesEntry.data) {
      const timestamp = new Date(point.date).getTime()
      if (!Number.isFinite(timestamp)) continue

      const existing = pointMap.get(timestamp) ?? {
        timestamp,
        dateLabel: formatDateLabel(timestamp),
        __raw: {}
      }

      existing[seriesEntry.key] = point.value
      existing.__raw[seriesEntry.key] = point

      pointMap.set(timestamp, existing)
    }
  }

  return Array.from(pointMap.values()).sort((a, b) => a.timestamp - b.timestamp)
}

function getAxisDomain(values: number[], paddingFactor = 0.12): [number, number] {
  if (values.length === 0) return [0, 1]
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const spread = maxValue - minValue
  const padding = spread === 0 ? Math.abs(maxValue || 1) * paddingFactor : spread * paddingFactor
  return [minValue - padding, maxValue + padding]
}

function getCanonicalTickFormatter(unit?: string | null) {
  const canonical = normalizeUnit(unit)
  const rawUnit = unit ? String(unit).trim() : ''

  return (value: number) => {
    const formatted = formatResultValue(value, unit ?? undefined)

    switch (canonical) {
      case 'meters':
        return formatted.replace(/\s*m$/i, '')
      case 'points':
        return formatted.replace(/\s*pct$/i, '')
      case 'seconds':
        return formatted.replace(/\s*sec(unde)?$/i, '')
      default: {
        if (!rawUnit) return formatted
        const escaped = rawUnit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        return formatted.replace(new RegExp(`\\s*${escaped}$`, 'i'), '')
      }
    }
  }
}

function CustomLegend({ payload }: LegendProps) {
  if (!payload) return null

  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {payload.map(item => (
        <span
          key={item.dataKey?.toString() ?? item.value?.toString()}
          className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/95 px-3 py-1 font-medium text-muted-foreground shadow-sm"
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: item.color ?? PRIMARY_COLOR }}
          />
          <span className="text-foreground">{item.value}</span>
        </span>
      ))}
    </div>
  )
}

interface CustomTooltipProps extends TooltipProps<ValueType, NameType> {
  fallbackUnit?: string | null
  seriesMap: Record<string, ChartSeries>
}

function CustomTooltip({ active, payload, label, fallbackUnit, seriesMap }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  const date = new Intl.DateTimeFormat('ro-RO', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(Number(label)))

  const rawMap = (payload[0].payload?.__raw as ChartDatum['__raw']) ?? {}

  const rows = payload
    .filter(entry => entry.value != null && seriesMap[entry.dataKey as string])
    .map(entry => {
      const key = entry.dataKey as string
      const series = seriesMap[key]
      const raw = rawMap[key]
      const formatted = typeof entry.value === 'number'
        ? formatResultValue(entry.value, raw?.unit ?? fallbackUnit ?? undefined)
        : entry.value

      return {
        key,
        color: series.color,
        label: series.tooltipLabel,
        value: formatted
      }
    })

  if (rows.length === 0) return null

  return (
    <div className="rounded-xl border border-border/70 bg-background/95 px-4 py-3 shadow-xl">
      <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
        {date}
      </div>
      <div className="flex flex-col gap-2 text-sm">
        {rows.map(row => (
          <div key={row.key} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-2 font-medium text-muted-foreground">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: row.color }}
              />
              {row.label}
            </span>
            <span className="font-semibold text-foreground">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function PerformanceChart({ data, eventType, unit, comparisons = [] }: PerformanceChartProps) {
  const [period, setPeriod] = useState<Period>('all')
  const [dateRange, setDateRange] = useState(() => getInitialDateRange(data, 'all'))

  const allSeriesData = useMemo(() => {
    const combined: PerformanceData[] = [...data]
    comparisons.forEach(series => {
      combined.push(...series.data)
    })
    return combined
  }, [data, comparisons])

  const firstDataDate = useMemo(() => getFirstDataDate(allSeriesData), [allSeriesData])

  useEffect(() => {
    setDateRange(getInitialDateRange(allSeriesData, period))
  }, [allSeriesData, period])

  const fallbackUnit = useMemo(() => {
    if (unit) return unit
    const primaryDetected = data.find(d => Boolean(d.unit))?.unit
    if (primaryDetected) return primaryDetected
    for (const series of comparisons) {
      const detected = series.data.find(d => Boolean(d.unit))?.unit
      if (detected) return detected
    }
    return null
  }, [unit, data, comparisons])

  const displayUnit = useMemo(
    () => getUnitDisplayLabel(fallbackUnit ?? undefined),
    [fallbackUnit]
  )

  const lowerIsBetter = useMemo(
    () => preferLowerValues(fallbackUnit ?? undefined),
    [fallbackUnit]
  )

  const seriesDefinitions = useMemo<ChartSeries[]>(() => {
    const sortByDate = (points: PerformanceData[]) =>
      [...points].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const primarySeries: ChartSeries = {
      key: 'primary',
      label: 'Serie principală',
      tooltipLabel: eventType || 'Serie principală',
      data: sortByDate(data),
      color: PRIMARY_COLOR,
      isPrimary: true
    }

    const comparisonSeries = comparisons.map((series, index): ChartSeries => ({
      key: `comparison-${index}`,
      label: series.label,
      tooltipLabel: series.label,
      data: sortByDate(series.data),
      color: series.color ?? COMPARISON_COLORS[index % COMPARISON_COLORS.length],
      isPrimary: false
    }))

    return [primarySeries, ...comparisonSeries]
  }, [data, comparisons, eventType])

  const filteredSeries = useMemo(
    () => seriesDefinitions.map(series => ({
      ...series,
      data: getFilteredResults(series.data, period, dateRange)
    })),
    [seriesDefinitions, period, dateRange]
  )

  const plottedSeries = useMemo(
    () => filteredSeries.filter(series => series.data.length > 0),
    [filteredSeries]
  )

  const chartData = useMemo(() => buildChartData(plottedSeries), [plottedSeries])

  const yValues = useMemo(() => {
    const vals: number[] = []
    plottedSeries.forEach(series => {
      series.data.forEach(point => {
        if (typeof point.value === 'number') {
          vals.push(point.value)
        }
      })
    })
    return vals
  }, [plottedSeries])

  const [yMin, yMax] = useMemo(() => getAxisDomain(yValues), [yValues])

  const [xMin, xMax] = useMemo(() => {
    if (chartData.length === 0) {
      const now = Date.now()
      return [now - 1000 * 60 * 60 * 24 * 7, now]
    }
    const timestamps = chartData.map(point => point.timestamp)
    return [Math.min(...timestamps), Math.max(...timestamps)]
  }, [chartData])

  const xTicks = useMemo(
    () => Array.from(new Set(chartData.map(point => point.timestamp))),
    [chartData]
  )

  const axisTickFormatter = useMemo(
    () => getCanonicalTickFormatter(fallbackUnit),
    [fallbackUnit]
  )

  const seriesMap = useMemo(
    () => plottedSeries.reduce<Record<string, ChartSeries>>((acc, series) => {
      acc[series.key] = series
      return acc
    }, {}),
    [plottedSeries]
  )

  const hasData = chartData.length > 0

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="flex items-baseline gap-2">
          <h4 className="text-base font-semibold">{eventType}</h4>
          {displayUnit && <span className="text-sm text-muted-foreground">• {displayUnit}</span>}
        </div>
        <PeriodFilter
          period={period}
          setPeriod={setPeriod}
          dateRange={dateRange}
          setDateRange={setDateRange}
          firstDataDate={firstDataDate}
        />
      </div>
      <div className="relative w-full h-[320px] rounded-xl border border-border/60 bg-card/60 shadow-sm backdrop-blur-sm p-4">
        {!hasData && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-muted/20 text-sm text-muted-foreground">
            Nu sunt date disponibile pentru perioada selectată.
          </div>
        )}
        {hasData && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 12, right: 24, bottom: 12, left: 12 }}>
              <CartesianGrid stroke="rgba(148, 163, 184, 0.18)" vertical={false} />
              <XAxis
                dataKey="timestamp"
                type="number"
                domain={[xMin, xMax]}
                ticks={xTicks}
                tickFormatter={value => formatDateLabel(Number(value))}
                stroke="rgba(148, 163, 184, 0.45)"
                tick={{ fill: 'rgba(71, 85, 105, 0.9)', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(148, 163, 184, 0.45)' }}
                tickLine={{ stroke: 'rgba(148, 163, 184, 0.45)' }}
              />
              <YAxis
                domain={[yMin, yMax]}
                tickFormatter={axisTickFormatter}
                stroke="rgba(148, 163, 184, 0.45)"
                tick={{ fill: 'rgba(71, 85, 105, 0.9)', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(148, 163, 184, 0.45)' }}
                tickLine={{ stroke: 'rgba(148, 163, 184, 0.45)' }}
                width={60}
                reversed={lowerIsBetter}
              />
              <Tooltip
                cursor={{ stroke: 'rgba(15, 23, 42, 0.25)', strokeDasharray: '4 4' }}
                content={<CustomTooltip fallbackUnit={fallbackUnit} seriesMap={seriesMap} />}
              />
              <Legend align="left" verticalAlign="top" content={<CustomLegend />} />
              {plottedSeries.map(series => (
                <Line
                  key={series.key}
                  type="monotone"
                  dataKey={series.key}
                  name={series.label}
                  stroke={series.color}
                  strokeWidth={series.isPrimary ? 3 : 2}
                  dot={{ r: series.isPrimary ? 4.5 : 4, strokeWidth: 2, stroke: '#ffffff', fill: series.color }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
