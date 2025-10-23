import { useRef, useEffect, useState, useMemo } from 'react'
import * as d3 from 'd3'
import { Period, PerformanceData } from '@/lib/types'
import { formatResult } from '@/lib/utils'
import { PeriodFilter, getInitialDateRange, getFilteredResults, getFirstDataDate } from './PeriodFilter'

interface PerformanceChartProps {
  data: PerformanceData[]
  eventType: string
  unit: 'seconds' | 'meters' | 'points'
}

export function PerformanceChart({ data, eventType: _eventType, unit }: PerformanceChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
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
          setDimensions({ width, height: 300 })
        }
      }
    }

    updateDimensions()
    
    setTimeout(updateDimensions, 100)

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width } = entry.contentRect
        if (width > 0) {
          setDimensions({ width, height: 300 })
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

    const margin = { top: 20, right: 40, bottom: 60, left: 50 }
    const width = dimensions.width - margin.left - margin.right
    const height = dimensions.height - margin.top - margin.bottom

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const x = d3.scaleTime()
      .domain(d3.extent(filteredData, d => new Date(d.date)) as [Date, Date])
      .range([0, width])

    const y = d3.scaleLinear()
      .domain(unit === 'seconds' 
        ? [d3.max(filteredData, d => d.value) || 0, d3.min(filteredData, d => d.value) || 0] 
        : [0, d3.max(filteredData, d => d.value) || 0])
      .range([height, 0])

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat('%d %b %y')))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)')

    g.append('g')
      .call(d3.axisLeft(y).tickFormat(d => formatResult(d as number, unit)))

    const line = d3.line<PerformanceData>()
      .x(d => x(new Date(d.date)))
      .y(d => y(d.value))

    g.append('path')
      .datum(filteredData)
      .attr('fill', 'none')
      .attr('stroke', 'hsl(var(--primary))')
      .attr('stroke-width', 2)
      .attr('d', line)

    const tooltipContainer = d3.select(containerRef.current)
    
    let tooltip = tooltipContainer.select('.tooltip')
    if (tooltip.empty()) {
      tooltip = tooltipContainer
        .append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('visibility', 'hidden')
        .style('background', 'hsl(var(--background))')
        .style('border', '1px solid hsl(var(--border))')
        .style('border-radius', '0.5rem')
        .style('padding', '0.5rem')
        .style('font-size', '0.875rem')
        .style('box-shadow', '0 4px 6px rgba(0,0,0,0.1)')
        .style('pointer-events', 'none')
        .style('z-index', '10')
    }


    g.selectAll('circle')
      .data(filteredData)
      .enter()
      .append('circle')
      .attr('cx', d => x(new Date(d.date)))
      .attr('cy', d => y(d.value))
      .attr('r', 5)
      .attr('fill', 'hsl(var(--primary))')
      .on('mouseover', (event, d) => {
        tooltip.style('visibility', 'visible')
          .html(`<strong>${formatResult(d.value, unit)}</strong><br/>${new Date(d.date).toLocaleDateString('ro-RO')}`)
      })
      .on('mousemove', (event) => {
        tooltip.style('top', (event.pageY - 10) + 'px').style('left', (event.pageX + 10) + 'px')
      })
      .on('mouseout', () => {
        tooltip.style('visibility', 'hidden')
      })

  }, [filteredData, dimensions, unit])

  return (
    <div className="space-y-4">
      <PeriodFilter 
        period={period}
        setPeriod={setPeriod}
        dateRange={dateRange}
        setDateRange={setDateRange}
        firstDataDate={firstDataDate}
      />
      <div ref={containerRef} className="relative w-full h-[300px]">
        <svg ref={svgRef} width={dimensions.width} height={dimensions.height} />
        {filteredData.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            Nu sunt date disponibile pentru perioada selectată.
          </div>
        )}
      </div>
    </div>
  )
}
