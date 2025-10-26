import { useRef, useEffect, useState, useMemo } from 'react'
import * as d3 from 'd3'
import { Period, PerformanceData } from '@/lib/types'
import { formatResult, EVENT_UNITS } from '@/lib/constants'
import { PeriodFilter, getInitialDateRange, getFilteredResults, getFirstDataDate } from './PeriodFilter'

interface PerformanceChartProps {
  data: PerformanceData[]
  eventType: string
}

export function PerformanceChart({ data, eventType }: PerformanceChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  
  const [period, setPeriod] = useState<Period>('all')
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>(() => 
    getInitialDateRange(data, 'all')
  )

  const firstDataDate = useMemo(() => getFirstDataDate(data), [data])
  const unit = useMemo(() => EVENT_UNITS[eventType as keyof typeof EVENT_UNITS] || 'points', [eventType])

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
        setDimensions({ width, height: 250 })
      }
    })

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => resizeObserver.disconnect()
  }, [])

  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0) {
      return
    }

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    if (filteredData.length === 0) {
      return
    }

    const margin = { top: 20, right: 40, bottom: 50, left: 60 }
    const width = dimensions.width - margin.left - margin.right
    const height = dimensions.height - margin.top - margin.bottom

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const x = d3.scaleTime()
      .domain(d3.extent(filteredData, d => new Date(d.date)) as [Date, Date])
      .range([0, width])

    const y = d3.scaleLinear()
      .domain(unit === 'seconds' 
        ? [d3.max(filteredData, d => d.value) as number * 1.05, (d3.min(filteredData, d => d.value) as number) * 0.95] 
        : [0, (d3.max(filteredData, d => d.value) as number) * 1.1])
      .range([height, 0])
      .nice()

    // Gradient
    const defs = svg.append('defs')
    const gradient = defs.append('linearGradient')
      .attr('id', 'line-gradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0).attr('y1', y(0))
      .attr('x2', 0).attr('y2', y(d3.max(filteredData, d => d.value) as number))
    
    gradient.append('stop').attr('offset', '0%').attr('stop-color', 'hsl(var(--primary))').attr('stop-opacity', 0.2)
    gradient.append('stop').attr('offset', '100%').attr('stop-color', 'hsl(var(--primary))').attr('stop-opacity', 0)

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('stroke', 'hsl(var(--border))')
      .attr('stroke-opacity', 0.7)
      .attr('stroke-dasharray', '2,2')
      .call(d3.axisLeft(y)
        .tickSize(-width)
        .tickFormat(() => '')
      )

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat('%b %d')))
      .attr('font-size', '12px')
      .select('.domain').remove()
    
    // Y axis
    g.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => formatResult(d as number, unit)))
      .attr('font-size', '12px')
      .select('.domain').remove()

    // Area
    const area = d3.area<PerformanceData>()
      .x(d => x(new Date(d.date)))
      .y0(height)
      .y1(d => y(d.value))
      .curve(d3.curveMonotoneX)

    g.append('path')
      .datum(filteredData)
      .attr('fill', 'url(#line-gradient)')
      .attr('d', area)

    // Line
    const line = d3.line<PerformanceData>()
      .x(d => x(new Date(d.date)))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX)

    g.append('path')
      .datum(filteredData)
      .attr('fill', 'none')
      .attr('stroke', 'hsl(var(--primary))')
      .attr('stroke-width', 2.5)
      .attr('d', line)

    // Tooltip
    const tooltip = d3.select(containerRef.current)
      .append('div')
      .attr('class', 'chart-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', 'hsl(var(--popover))')
      .style('color', 'hsl(var(--popover-foreground))')
      .style('border', '1px solid hsl(var(--border))')
      .style('border-radius', '0.5rem')
      .style('padding', '0.5rem 0.75rem')
      .style('font-size', '0.875rem')
      .style('box-shadow', 'hsl(var(--shadow))')
      .style('pointer-events', 'none')
      .style('z-index', '10')
      .style('transition', 'all 0.1s ease-out')

    const hoverLine = g.append('line')
      .attr('class', 'hover-line')
      .attr('stroke', 'hsl(var(--primary))')
      .attr('stroke-width', 1)
      .style('opacity', 0)

    const hoverCircle = g.append('circle')
      .attr('class', 'hover-circle')
      .attr('r', 6)
      .attr('fill', 'hsl(var(--primary))')
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
            .html(`
              <div class="font-semibold">${formatResult(d.value, unit)}</div>
              <div class="text-xs text-muted-foreground">${new Date(d.date).toLocaleDateString('ro-RO', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              ${d.notes ? `<div class="text-xs text-muted-foreground italic mt-1">"${d.notes}"</div>` : ''}
            `)
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
          <span className="text-sm text-muted-foreground">({unit})</span>
        </div>
        <PeriodFilter 
          period={period}
          setPeriod={setPeriod}
          dateRange={dateRange}
          setDateRange={setDateRange}
          firstDataDate={firstDataDate}
        />
      </div>
      <div ref={containerRef} className="relative w-full h-[300px]">
        <svg ref={svgRef} width={dimensions.width} height={dimensions.height} />
        {filteredData.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm bg-muted/30 rounded-lg">
            Nu sunt date disponibile pentru perioada selectată.
          </div>
        )}
      </div>
    </div>
  )
}
