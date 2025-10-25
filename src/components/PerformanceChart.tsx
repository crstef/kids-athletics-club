import { useRef, useEffect, useState, useMemo } from 'react'
import * as d3 from 'd3'
import { Period, PerformanceData } from '@/lib/types'
import { formatResult } from '@/lib/constants'
import { PeriodFilter, getInitialDateRange, getFilteredResults, getFirstDataDate } from './PeriodFilter'

interface PerformanceChartProps {
  data: PerformanceData[]
  eventType: string
  unit: 'seconds' | 'meters' | 'points'
}

export function PerformanceChart({ data, eventType, unit }: PerformanceChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  
  const [period, setPeriod] = useState<Period>('all')
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>(() => 
    getInitialDateRange(data, 'all')
  )

  const firstDataDate = useMemo(() => getFirstDataDate(data), [data])

  useEffect(() => {
    setDateRange(getInitialDateRange(data, period))
  }, [period, data])

  const filteredData = useMemo(() => {
    return getFilteredResults(data, period, dateRange)
  }, [data, period, dateRange])

  useEffect(() => {
    if (!containerRef.current) return

    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect()
        if (width > 0) {
          setDimensions({ width, height: 400 })
        }
      }
    }

    updateDimensions()
    
    setTimeout(updateDimensions, 100)

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width } = entry.contentRect
        if (width > 0) {
          setDimensions({ width, height: 400 })
        }
      }
    })

    resizeObserver.observe(containerRef.current)

    return () => resizeObserver.disconnect()
  }, [])

  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0 || filteredData.length === 0) {
      const svg = d3.select(svgRef.current)
      svg.selectAll('*').remove()
      return
    }

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 30, right: 50, bottom: 70, left: 70 }
    const width = dimensions.width - margin.left - margin.right
    const height = dimensions.height - margin.top - margin.bottom

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    // Sort data by date
    const sortedData = [...filteredData].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    const x = d3.scaleTime()
      .domain(d3.extent(sortedData, d => new Date(d.date)) as [Date, Date])
      .range([0, width])

    // For time-based events (seconds), reverse the scale so lower is better (higher on chart)
    const y = d3.scaleLinear()
      .domain(unit === 'seconds' 
        ? [d3.max(sortedData, d => d.value) * 1.1 || 0, d3.min(sortedData, d => d.value) * 0.9 || 0] 
        : [0, d3.max(sortedData, d => d.value) * 1.1 || 0])
      .range([height, 0])
      .nice()

    // Add grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .call(d3.axisLeft(y)
        .tickSize(-width)
        .tickFormat(() => '')
      )

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x)
        .ticks(Math.min(sortedData.length, 8))
        .tickFormat(d3.timeFormat('%d/%m/%y')))
      .selectAll('text')
      .style('text-anchor', 'end')
      .style('font-size', '12px')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)')

    // Y axis
    g.append('g')
      .call(d3.axisLeft(y)
        .ticks(8)
        .tickFormat(d => formatResult(d as number, unit)))
      .selectAll('text')
      .style('font-size', '12px')

    // Y axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left + 15)
      .attr('x', 0 - height / 2)
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', '600')
      .style('fill', 'hsl(var(--foreground))')
      .text(eventType)

    // Create line with curve
    const line = d3.line<PerformanceData>()
      .x(d => x(new Date(d.date)))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX)

    // Add area under the line (gradient effect)
    const area = d3.area<PerformanceData>()
      .x(d => x(new Date(d.date)))
      .y0(height)
      .y1(d => y(d.value))
      .curve(d3.curveMonotoneX)

    g.append('path')
      .datum(sortedData)
      .attr('fill', 'hsl(var(--primary) / 0.1)')
      .attr('d', area)

    // Draw the line
    g.append('path')
      .datum(sortedData)
      .attr('fill', 'none')
      .attr('stroke', 'hsl(var(--primary))')
      .attr('stroke-width', 3)
      .attr('d', line)

    // Create tooltip
    const tooltipContainer = d3.select(containerRef.current)
    
    let tooltip = tooltipContainer.select('.tooltip')
    if (tooltip.empty()) {
      tooltip = tooltipContainer
        .append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('visibility', 'hidden')
        .style('background', 'hsl(var(--popover))')
        .style('color', 'hsl(var(--popover-foreground))')
        .style('border', '1px solid hsl(var(--border))')
        .style('border-radius', '0.5rem')
        .style('padding', '0.75rem')
        .style('font-size', '0.875rem')
        .style('box-shadow', '0 4px 6px -1px rgb(0 0 0 / 0.1)')
        .style('pointer-events', 'none')
        .style('z-index', '50')
    }

    // Add hover line
    const hoverLine = g.append('line')
      .attr('class', 'hover-line')
      .attr('stroke', 'hsl(var(--muted-foreground))')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4')
      .style('opacity', 0)

    // Add circles for data points
    const circles = g.selectAll('circle')
      .data(sortedData)
      .enter()
      .append('circle')
      .attr('cx', d => x(new Date(d.date)))
      .attr('cy', d => y(d.value))
      .attr('r', 6)
      .attr('fill', 'hsl(var(--background))')
      .attr('stroke', 'hsl(var(--primary))')
      .attr('stroke-width', 3)
      .style('cursor', 'pointer')

    // Add interaction overlay
    g.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .on('mousemove', function(event) {
        const [mouseX] = d3.pointer(event)
        const x0 = x.invert(mouseX)
        
        // Find closest data point
        const bisect = d3.bisector((d: PerformanceData) => new Date(d.date)).left
        const index = bisect(sortedData, x0)
        const d0 = sortedData[index - 1]
        const d1 = sortedData[index]
        
        const d = d0 && d1 
          ? (x0.getTime() - new Date(d0.date).getTime() > new Date(d1.date).getTime() - x0.getTime() ? d1 : d0)
          : (d0 || d1)

        if (d) {
          const xPos = x(new Date(d.date))
          const yPos = y(d.value)

          // Update hover line
          hoverLine
            .attr('x1', xPos)
            .attr('x2', xPos)
            .attr('y1', 0)
            .attr('y2', height)
            .style('opacity', 1)

          // Highlight circle
          circles
            .attr('r', (dataPoint: PerformanceData) => dataPoint === d ? 8 : 6)
            .attr('stroke-width', (dataPoint: PerformanceData) => dataPoint === d ? 4 : 3)

          // Show tooltip
          tooltip
            .style('visibility', 'visible')
            .html(`
              <div style="font-weight: 600; margin-bottom: 4px;">${eventType}</div>
              <div style="margin-bottom: 2px;"><strong>Rezultat:</strong> ${formatResult(d.value, unit)}</div>
              <div style="color: hsl(var(--muted-foreground));"><strong>Data:</strong> ${new Date(d.date).toLocaleDateString('ro-RO', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric' 
              })}</div>
            `)
            .style('left', `${event.pageX + 15}px`)
            .style('top', `${event.pageY - 10}px`)
        }
      })
      .on('mouseout', () => {
        hoverLine.style('opacity', 0)
        circles.attr('r', 6).attr('stroke-width', 3)
        tooltip.style('visibility', 'hidden')
      })

  }, [filteredData, dimensions, unit, eventType])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium text-muted-foreground">Evoluție în timp</h4>
        <PeriodFilter 
          period={period}
          setPeriod={setPeriod}
          dateRange={dateRange}
          setDateRange={setDateRange}
          firstDataDate={firstDataDate}
        />
      </div>
      <div ref={containerRef} className="relative w-full h-[400px] border rounded-lg bg-card p-4">
        <svg ref={svgRef} width={dimensions.width} height={dimensions.height} />
        {filteredData.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
            Nu sunt date disponibile pentru perioada selectată.
          </div>
        )}
      </div>
    </div>
  )
}
