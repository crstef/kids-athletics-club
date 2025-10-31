import { useRef, useEffect, useState, useMemo, useId } from 'react'
import * as d3 from 'd3'
import type { PerformanceData, Period } from '@/lib/types'
import { PeriodFilter, getInitialDateRange, getFilteredResults, getFirstDataDate } from './PeriodFilter'
import { getUnitDisplayLabel, formatResultValue, preferLowerValues } from '@/lib/units'

interface PerformanceChartProps {
  data: PerformanceData[]
  eventType: string
  unit?: string | null
}

export function PerformanceChart({ data, eventType, unit }: PerformanceChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  
  const [period, setPeriod] = useState<Period>('all')
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>(() => 
    getInitialDateRange(data, 'all')
  )

  const firstDataDate = useMemo(() => getFirstDataDate(data), [data])
  const fallbackUnit = useMemo(() => {
    if (unit) return unit
    const withUnit = data.find(point => point.unit)
    return withUnit?.unit ?? null
  }, [data, unit])
  const displayUnit = useMemo(() => getUnitDisplayLabel(fallbackUnit), [fallbackUnit])
  const lowerIsBetter = useMemo(() => preferLowerValues(fallbackUnit), [fallbackUnit])
  const gradientId = useId()

  useEffect(() => {
    setDateRange(getInitialDateRange(data, period))
  }, [period, data])

  const filteredData = useMemo(() => {
    return getFilteredResults(data, period, dateRange)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [data, period, dateRange])

  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0]) {
        const { width } = entries[0].contentRect
        setDimensions({ width, height: 280 })
      }
    })

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => resizeObserver.disconnect()
  }, [])

  const activeRangeLabel = useMemo(() => {
    if (filteredData.length === 0) return null
    const first = new Date(filteredData[0].date)
    const last = new Date(filteredData[filteredData.length - 1].date)
    const formatter = new Intl.DateTimeFormat('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' })
    return `${formatter.format(first)} – ${formatter.format(last)}`
  }, [filteredData])

  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0) {
      return
    }

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    if (filteredData.length === 0) {
      return
    }

    const margin = { top: 20, right: 48, bottom: 52, left: 72 }
    const width = dimensions.width - margin.left - margin.right
    const height = dimensions.height - margin.top - margin.bottom

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  const values = filteredData.map(d => d.value)
  const minValue = d3.min(values) as number
  const maxValue = d3.max(values) as number
  const valueSpread = Math.max(maxValue - minValue, 1)
  const padding = valueSpread * 0.08
  const primaryColor = 'var(--chart-primary, hsl(var(--primary)))'

    const x = d3.scaleTime()
      .domain(d3.extent(filteredData, d => new Date(d.date)) as [Date, Date])
      .range([0, width])

    const yDomain = (() => {
      if (lowerIsBetter) {
        return [maxValue + padding, Math.max(minValue - padding, 0)]
      }
      const lowerBound = Math.min(minValue - padding, 0)
      return [lowerBound, maxValue + padding]
    })()

    const y = d3.scaleLinear()
      .domain(yDomain as [number, number])
      .range([height, 0])
      .nice()

    // Gradient
    const defs = svg.append('defs')
    const gradient = defs.append('linearGradient')
      .attr('id', gradientId)
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0)
      .attr('y1', y(y.domain()[1]))
      .attr('x2', 0)
      .attr('y2', y(y.domain()[0]))
    
  gradient.append('stop').attr('offset', '0%').attr('stop-color', primaryColor).attr('stop-opacity', 0.25)
  gradient.append('stop').attr('offset', '100%').attr('stop-color', primaryColor).attr('stop-opacity', 0)

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('stroke', 'hsl(var(--border))')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-dasharray', '3,3')
      .call(d3.axisLeft(y)
        .tickSize(-width)
        .tickFormat(() => '')
      )

    // X axis
    const totalTimespan = filteredData.length > 1
      ? new Date(filteredData[filteredData.length - 1].date).getTime() - new Date(filteredData[0].date).getTime()
      : 0
    const tickFormat = totalTimespan > 1000 * 60 * 60 * 24 * 200
      ? d3.timeFormat('%b %Y')
      : d3.timeFormat('%d %b')

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(Math.min(8, filteredData.length)).tickFormat(tickFormat))
      .attr('font-size', '12px')
      .call(axis => axis.select('.domain').remove())
      .call(axis => axis.selectAll('text').attr('fill', 'hsl(var(--muted-foreground))'))
      .call(axis => axis.selectAll('line').attr('stroke', 'hsl(var(--border))'))
    
    // Y axis
    g.append('g')
      .call(d3.axisLeft(y)
        .ticks(6)
        .tickFormat(d => formatResultValue(d as number, fallbackUnit ?? undefined)))
      .attr('font-size', '12px')
      .call(axis => axis.select('.domain').remove())
      .call(axis => axis.selectAll('text').attr('fill', 'hsl(var(--muted-foreground))'))
      .call(axis => axis.selectAll('line').attr('stroke', 'hsl(var(--border))'))

    // Axis labels
    g.append('text')
      .attr('transform', `translate(-48, ${height / 2}) rotate(-90)`)
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

    // Area
    const area = d3.area<PerformanceData>()
      .x(d => x(new Date(d.date)))
      .y0(height)
      .y1(d => y(d.value))
      .curve(d3.curveMonotoneX)

    g.append('path')
      .datum(filteredData)
      .attr('fill', `url(#${gradientId})`)
      .attr('d', area)

    // Line
    const line = d3.line<PerformanceData>()
      .x(d => x(new Date(d.date)))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX)

    g.append('path')
      .datum(filteredData)
      .attr('fill', 'none')
      .attr('stroke', primaryColor)
      .attr('stroke-width', 2.5)
      .attr('d', line)

    g.selectAll('circle.data-point')
      .data(filteredData)
      .enter()
      .append('circle')
      .attr('class', 'data-point')
      .attr('cx', d => x(new Date(d.date)))
      .attr('cy', d => y(d.value))
      .attr('r', 4.5)
      .attr('fill', primaryColor)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.95)

    // Tooltip
    const tooltip = d3.select(containerRef.current)
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

    const hoverLine = g.append('line')
      .attr('class', 'hover-line')
      .attr('stroke', primaryColor)
      .attr('stroke-width', 1)
      .style('opacity', 0)

    const hoverCircle = g.append('circle')
      .attr('class', 'hover-circle')
      .attr('r', 6)
      .attr('fill', primaryColor)
      .attr('stroke', 'hsl(var(--background))')
      .attr('stroke-width', 2)
      .style('opacity', 0)

    // Interaction overlay
    g.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .on('mousemove', (event) => {
        const [mouseX] = d3.pointer(event)
        const date = x.invert(mouseX)
        
        const bisect = d3.bisector((d: PerformanceData) => new Date(d.date)).left
        const index = bisect(filteredData, date, 1)
        const d0 = filteredData[index - 1]
        const d1 = filteredData[index]
        const d = date.getTime() - new Date(d0.date).getTime() > new Date(d1?.date || 0).getTime() - date.getTime() ? d1 : d0

        if (d) {
          const xPos = x(new Date(d.date))
          const yPos = y(d.value)

          hoverLine
            .attr('x1', xPos)
            .attr('x2', xPos)
            .attr('y1', yPos)
            .attr('y2', height)
            .style('opacity', 1)

          hoverCircle
            .attr('cx', xPos)
            .attr('cy', yPos)
            .style('opacity', 1)

          tooltip
            .style('visibility', 'visible')
            .html(() => {
              const valueLabel = formatResultValue(d.value, fallbackUnit ?? undefined)
              const dateLabel = new Intl.DateTimeFormat('ro-RO', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }).format(new Date(d.date))
              const badge = `
                <div style="display:flex;align-items:center;gap:0.45rem;margin-bottom:0.4rem;">
                  <span style="display:inline-block;width:10px;height:10px;border-radius:9999px;background:${primaryColor};"></span>
                  <span style="font-size:0.72rem;font-weight:600;color:#1e293b;text-transform:uppercase;letter-spacing:0.08em;">${eventType}</span>
                </div>
              `
              const notesBlock = d.notes && d.notes.trim().length > 0
                ? `<div style="margin-top:0.4rem;font-size:0.72rem;color:#475569;font-style:italic;">${d.notes}</div>`
                : ''
              return `
                <div style="display:flex;flex-direction:column;gap:0.35rem;">
                  ${badge}
                  <div style="font-size:0.68rem;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;">Rezultat</div>
                  <div style="font-weight:600;font-size:1rem;color:#0f172a;">${valueLabel}</div>
                  <div style="font-size:0.75rem;color:#475569;">${dateLabel}</div>
                  ${notesBlock}
                </div>
              `
            })
            .style('left', `${xPos + margin.left + 15}px`)
            .style('top', `${yPos + margin.top - 15}px`)
        }
      })
      .on('mouseout', () => {
        hoverLine.style('opacity', 0)
        hoverCircle.style('opacity', 0)
        tooltip.style('visibility', 'hidden')
      })

    return () => {
      tooltip.remove()
    }

  }, [filteredData, dimensions, unit, eventType])

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="flex items-baseline gap-2">
          <h4 className="text-base font-semibold">{eventType}</h4>
          <span className="text-sm text-muted-foreground">({displayUnit})</span>
        </div>
        <PeriodFilter 
          period={period}
          setPeriod={setPeriod}
          dateRange={dateRange}
          setDateRange={setDateRange}
          firstDataDate={firstDataDate}
        />
      </div>
      <div ref={containerRef} className="relative w-full h-[320px] rounded-xl border border-border/60 bg-card/60 shadow-sm backdrop-blur-sm">
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="absolute inset-0"
        />
        {filteredData.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm bg-muted/30 rounded-lg">
            Nu sunt date disponibile pentru perioada selectată.
          </div>
        )}
      </div>
    </div>
  )
}
