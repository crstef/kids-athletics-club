import { useEffect, useMemo, useRef, useState } from 'react'
import * as d3 from 'd3'
import type { PerformanceData, Period } from '@/lib/types'
import { PeriodFilter, getFilteredResults, getFirstDataDate, getInitialDateRange } from './PeriodFilter'
import { formatResultValue, getUnitDisplayLabel, preferLowerValues, normalizeUnit } from '@/lib/units'

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

interface PerformanceChartProps {
  data: PerformanceData[]
  eventType: string
  unit?: string | null
  comparisons?: ComparisonSeries[]
}

export function PerformanceChart({ data, eventType, unit, comparisons = [] }: PerformanceChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
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

  useEffect(() => {
    if (!containerRef.current) return
    const element = containerRef.current
    const observer = new ResizeObserver(entries => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      setDimensions(prev => {
        if (prev.width === width && prev.height === height) {
          return prev
        }
        return { width, height }
      })
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

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

  const axisTickFormatter = useMemo(() => {
    const canonical = normalizeUnit(fallbackUnit ?? undefined)
    const rawUnit = fallbackUnit ? String(fallbackUnit).trim() : ''

    return (value: number) => {
      const formatted = formatResultValue(value, fallbackUnit ?? undefined)

      switch (canonical) {
        case 'meters':
          return formatted.replace(/\s*m$/i, '')
        case 'points':
          return formatted.replace(/\s*pct$/i, '')
        case 'seconds':
          return formatted.replace(/\s*sec(unde)?$/i, '')
        default:
          if (!rawUnit) return formatted
          const escapedUnit = rawUnit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          return formatted.replace(new RegExp(`\\s*${escapedUnit}$`, 'i'), '')
      }
    }
  }, [fallbackUnit])

  const baseSeries = useMemo<ChartSeries[]>(() => {
    const sortByDate = (points: PerformanceData[]) =>
      [...points].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )

    const primarySeries: ChartSeries = {
      key: 'primary',
      label: 'Serie principală',
      tooltipLabel: eventType || 'Serie principală',
      data: sortByDate(data),
      color: 'hsl(var(--primary))',
      isPrimary: true,
    }

    const comparisonSeries = comparisons.map((series, index): ChartSeries => ({
      key: `comparison-${index}`,
      label: series.label,
      tooltipLabel: series.label,
      data: sortByDate(series.data),
      color: series.color ?? COMPARISON_COLORS[index % COMPARISON_COLORS.length],
      isPrimary: false,
    }))

    return [primarySeries, ...comparisonSeries]
  }, [data, comparisons, eventType])

  const filteredSeries = useMemo(() => {
    return baseSeries.map(series => ({
      ...series,
      data: getFilteredResults(series.data, period, dateRange),
    }))
  }, [baseSeries, period, dateRange])

  const plottedSeries = useMemo(
    () => filteredSeries.filter(series => series.data.length > 0),
    [filteredSeries]
  )

  const activeRangeLabel = useMemo(() => {
    if (!dateRange || period === 'all') return null
    const formatter = new Intl.DateTimeFormat('ro-RO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    return `${formatter.format(dateRange.start)} – ${formatter.format(dateRange.end)}`
  }, [dateRange, period])

  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0 || dimensions.height === 0) {
      return
    }

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const container = containerRef.current
    if (!container) return
    d3.select(container).selectAll('.chart-tooltip').remove()

    if (plottedSeries.length === 0) {
      return
    }

  const margin = { top: 24, right: 36, bottom: 56, left: 68 }
    const width = Math.max(dimensions.width - margin.left - margin.right, 0)
    const height = Math.max(dimensions.height - margin.top - margin.bottom, 0)

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const allValues: number[] = []
    const allDates: Date[] = []

    plottedSeries.forEach(series => {
      series.data.forEach(point => {
        allValues.push(point.value)
        allDates.push(new Date(point.date))
      })
    })

    const minValue = d3.min(allValues) ?? 0
    const maxValue = d3.max(allValues) ?? 0
    const rawSpread = maxValue - minValue
    const safeSpread = rawSpread === 0 ? Math.max(Math.abs(maxValue), 1) * 0.25 : rawSpread
    const padding = safeSpread * 0.2

    const xDomain = ((): [Date, Date] => {
      const extent = d3.extent(allDates) as [Date | undefined, Date | undefined]
      const [minDate, maxDate] = extent
      if (!minDate || !maxDate) {
        const fallback = new Date()
        return [fallback, fallback]
      }
      if (minDate.getTime() === maxDate.getTime()) {
        const nextDay = new Date(maxDate)
        nextDay.setDate(nextDay.getDate() + 1)
        return [minDate, nextDay]
      }
      return [minDate, maxDate]
    })()

    const x = d3.scaleTime()
      .domain(xDomain)
      .range([0, width])

    const lowerBound = minValue - padding
    const upperBound = maxValue + padding
    const yDomain: [number, number] = lowerIsBetter
      ? [upperBound, Math.max(lowerBound, 0)]
      : [Math.min(lowerBound, 0), upperBound]

    const y = d3.scaleLinear()
      .domain(yDomain)
      .range([height, 0])
      .nice()

  const yTicks = y.ticks(6)

    const grid = g.append('g')
      .attr('class', 'chart-grid')
      .call(
        d3.axisLeft(y)
          .tickValues(yTicks)
          .tickSize(-width)
          .tickFormat(() => '')
      )

    grid
      .call(axis => axis.select('.domain').remove())
      .call(axis => axis.selectAll('line')
        .attr('stroke', 'rgba(15, 23, 42, 0.12)')
        .attr('stroke-dasharray', ''))

    const totalTimespan = xDomain[1].getTime() - xDomain[0].getTime()
    const dateTickFormat = totalTimespan > 1000 * 60 * 60 * 24 * 200
      ? d3.timeFormat('%b %Y')
      : d3.timeFormat('%d %b')

    const uniqueDateValues = Array.from(new Set(allDates.map(date => date.getTime())))
      .sort((a, b) => a - b)
      .map(timestamp => new Date(timestamp))

    const xAxisGroup = g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(
        d3.axisBottom(x)
          .tickValues(uniqueDateValues)
          .tickFormat(d => dateTickFormat(d as Date) as unknown as string)
      )
      .attr('font-size', '12px')

    xAxisGroup
      .call(axis => axis.select('.domain').attr('stroke', 'rgba(15, 23, 42, 0.16)'))
      .call(axis => axis.selectAll('text').attr('fill', 'hsl(var(--muted-foreground))'))
      .call(axis => axis.selectAll('line').attr('stroke', 'rgba(15, 23, 42, 0.16)'))

    const yAxisGroup = g.append('g')
      .call(
        d3.axisLeft(y)
          .tickValues(yTicks)
          .tickFormat(d => axisTickFormatter(d as number))
      )
      .attr('font-size', '12px')

    yAxisGroup
      .call(axis => axis.select('.domain').attr('stroke', 'rgba(15, 23, 42, 0.16)'))
      .call(axis => axis.selectAll('text').attr('fill', 'hsl(var(--muted-foreground))'))
      .call(axis => axis.selectAll('line').remove())

    g.append('text')
      .attr('transform', `translate(${-margin.left + 16}, ${height / 2}) rotate(-90)`)
      .attr('text-anchor', 'middle')
      .attr('fill', 'hsl(var(--muted-foreground))')
      .attr('font-size', '12px')
      .text(displayUnit)

    if (activeRangeLabel) {
      svg.append('text')
        .attr('x', margin.left)
        .attr('y', dimensions.height - 6)
        .attr('fill', 'hsl(var(--muted-foreground))')
        .attr('font-size', '12px')
        .text(activeRangeLabel)
    }

    const hoverMarkers: Record<string, d3.Selection<SVGCircleElement, unknown, null, undefined>> = {}

    const lineGenerator = d3.line<PerformanceData>()
      .x(d => x(new Date(d.date)))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX)

    plottedSeries.forEach(series => {
      g.append('path')
        .datum(series.data)
        .attr('fill', 'none')
        .attr('stroke', series.color)
        .attr('stroke-width', series.isPrimary ? 2.75 : 2)
        .attr('stroke-dasharray', series.isPrimary ? null : '6 4')
        .attr('opacity', series.isPrimary ? 1 : 0.9)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .attr('d', lineGenerator)

      g.selectAll(`circle.data-point-${series.key}`)
        .data(series.data)
        .enter()
        .append('circle')
        .attr('class', `data-point-${series.key}`)
        .attr('cx', d => x(new Date(d.date)))
        .attr('cy', d => y(d.value))
        .attr('r', series.isPrimary ? 5 : 4.25)
        .attr('fill', series.color)
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .attr('opacity', 0.95)

      hoverMarkers[series.key] = g.append('circle')
        .attr('class', `hover-circle-${series.key}`)
        .attr('r', series.isPrimary ? 6 : 5)
        .attr('fill', series.color)
        .attr('stroke', 'hsl(var(--background))')
        .attr('stroke-width', 2)
        .style('opacity', 0)
    })

    const tooltip = d3.select(container)
      .append('div')
      .attr('class', 'chart-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', '#ffffff')
      .style('color', '#0f172a')
      .style('border', '1px solid rgba(15, 23, 42, 0.08)')
      .style('border-radius', '0.75rem')
      .style('padding', '0.75rem 0.9rem')
      .style('font-size', '0.875rem')
      .style('box-shadow', '0 25px 45px rgba(15, 23, 42, 0.18)')
      .style('pointer-events', 'none')
      .style('z-index', '10')
      .style('transition', 'all 0.1s ease-out')

    const referenceSeries = plottedSeries.find(series => series.isPrimary) ?? plottedSeries[0]

    const hoverLine = g.append('line')
      .attr('class', 'hover-line')
      .attr('stroke', 'rgba(15, 23, 42, 0.35)')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4 4')
      .style('opacity', 0)

    g.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .on('mousemove', event => {
        const [mouseX] = d3.pointer(event)
        const date = x.invert(mouseX)

        const entries = plottedSeries.map(series => {
          const bisector = d3.bisector((d: PerformanceData) => new Date(d.date)).left
          const idx = bisector(series.data, date, 1)
          const prevPoint = series.data[idx - 1]
          const nextPoint = series.data[idx]
          const chosen = (() => {
            if (!prevPoint) return nextPoint
            if (!nextPoint) return prevPoint
            const prevDiff = Math.abs(date.getTime() - new Date(prevPoint.date).getTime())
            const nextDiff = Math.abs(new Date(nextPoint.date).getTime() - date.getTime())
            return nextDiff < prevDiff ? nextPoint : prevPoint
          })()

          if (!chosen) return null

          const xPos = x(new Date(chosen.date))
          const yPos = y(chosen.value)

          hoverMarkers[series.key]
            .attr('cx', xPos)
            .attr('cy', yPos)
            .style('opacity', 1)

          return {
            key: series.key,
            label: series.tooltipLabel,
            value: formatResultValue(chosen.value, fallbackUnit ?? undefined),
            date: new Date(chosen.date),
            color: series.color,
            rawValue: chosen.value,
          }
        }).filter((entry): entry is NonNullable<typeof entry> => entry !== null)

        if (entries.length === 0) {
          hoverLine.style('opacity', 0)
          tooltip.style('visibility', 'hidden')
          return
        }

  const referenceEntry = entries.find(entry => entry.key === referenceSeries.key) ?? entries[0]
        const refX = x(referenceEntry.date)

        hoverLine
          .attr('x1', refX)
          .attr('x2', refX)
          .attr('y1', 0)
          .attr('y2', height)
          .style('opacity', 1)

        const tooltipRows = entries.map(entry => `
          <div style="display:flex;justify-content:space-between;gap:1.5rem;align-items:center;">
            <div style="display:flex;align-items:center;gap:0.5rem;">
              <span style="display:inline-block;width:10px;height:10px;border-radius:9999px;background:${entry.color};"></span>
              <span style="font-size:0.78rem;font-weight:600;color:#1e293b;">${entry.label}</span>
            </div>
            <span style="font-size:0.82rem;font-weight:600;color:#0f172a;">${entry.value}</span>
          </div>
        `).join('')

        const headerDate = new Intl.DateTimeFormat('ro-RO', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }).format(referenceEntry.date)

        const tooltipWidth = 220
        const tooltipHeight = 80 + entries.length * 26
        const proposedLeft = refX + margin.left + 20
        const proposedTop = y(referenceEntry.rawValue) + margin.top - tooltipHeight / 2

        const left = Math.min(
          Math.max(proposedLeft, 0),
          width + margin.left - tooltipWidth
        )
        const top = Math.min(
          Math.max(proposedTop, 0),
          height + margin.top - tooltipHeight
        )

        tooltip
          .style('visibility', 'visible')
          .html(`
            <div style="display:flex;flex-direction:column;gap:0.5rem;min-width:200px;">
              <div style="font-size:0.75rem;color:#475569;">${headerDate}</div>
              ${tooltipRows}
            </div>
          `)
          .style('left', `${left}px`)
          .style('top', `${top}px`)
      })
      .on('mouseout', () => {
        hoverLine.style('opacity', 0)
        Object.values(hoverMarkers).forEach(marker => marker.style('opacity', 0))
        tooltip.style('visibility', 'hidden')
      })

    return () => {
      tooltip.remove()
    }
  }, [
    dimensions,
    plottedSeries,
    fallbackUnit,
    displayUnit,
    lowerIsBetter,
    axisTickFormatter,
    activeRangeLabel,
  ])

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="flex items-baseline gap-2">
          <h4 className="text-base font-semibold">{eventType}</h4>
          {displayUnit && (
            <span className="text-sm text-muted-foreground">• {displayUnit}</span>
          )}
        </div>
        <PeriodFilter
          period={period}
          setPeriod={setPeriod}
          dateRange={dateRange}
          setDateRange={setDateRange}
          firstDataDate={firstDataDate}
        />
      </div>
      <div
        ref={containerRef}
        className="relative w-full h-[320px] rounded-xl border border-border/60 bg-card/60 shadow-sm backdrop-blur-sm"
      >
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="absolute inset-0"
        />

        {plottedSeries.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-muted/30 text-sm text-muted-foreground">
            Nu sunt date disponibile pentru perioada selectată.
          </div>
        )}

        {plottedSeries.length > 0 && (
          <div className="absolute left-4 top-4 flex flex-wrap gap-2 text-xs">
            {plottedSeries.map(series => (
              <span
                key={series.key}
                className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/90 px-3 py-1 font-medium shadow-sm"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: series.color }}
                />
                <span className={series.isPrimary ? 'text-foreground' : 'text-muted-foreground'}>
                  {series.label}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
