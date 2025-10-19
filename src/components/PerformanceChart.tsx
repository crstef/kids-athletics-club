import { useEffect, useRef, useState, useMemo } from 'react'
import * as d3 from 'd3'
import { formatResult } from '@/lib/constants'
import { PeriodFilter, getFilteredResults, type Period } from './PeriodFilter'
import type { PerformanceData } from '@/lib/types'

interface PerformanceChartProps {
  data: PerformanceData[]
  eventType: string
  unit: 'seconds' | 'meters'
}

export function PerformanceChart({ data, eventType, unit }: PerformanceChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [period, setPeriod] = useState<Period>('all')

  const filteredData = useMemo(() => {
    return getFilteredResults(data, period)
  }, [data, period])

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
    if (!svgRef.current || dimensions.width === 0) return
    
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    if (filteredData.length === 0) return

    const isMobile = dimensions.width < 640
    const margin = { 
      top: 20, 
      right: isMobile ? 10 : 30, 
      bottom: isMobile ? 60 : 40, 
      left: isMobile ? 45 : 60 
    }
    const width = dimensions.width - margin.left - margin.right
    const height = dimensions.height - margin.top - margin.bottom

    if (width <= 0 || height <= 0) return

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const sortedData = [...filteredData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    let dateExtent = d3.extent(sortedData, d => new Date(d.date)) as [Date, Date]
    if (!dateExtent[0] || !dateExtent[1]) return

    if (sortedData.length === 1) {
      const singleDate = dateExtent[0]
      const dayBefore = new Date(singleDate)
      dayBefore.setDate(dayBefore.getDate() - 1)
      const dayAfter = new Date(singleDate)
      dayAfter.setDate(dayAfter.getDate() + 1)
      dateExtent = [dayBefore, dayAfter]
    }

    const x = d3.scaleTime()
      .domain(dateExtent)
      .range([0, width])

    const minValue = d3.min(sortedData, d => d.value)
    const maxValue = d3.max(sortedData, d => d.value)
    if (minValue === undefined || maxValue === undefined) return

    let yDomain: [number, number]
    if (minValue === maxValue) {
      yDomain = [minValue * 0.9, minValue * 1.1]
    } else {
      yDomain = [minValue * 0.95, maxValue * 1.05]
    }

    const y = d3.scaleLinear()
      .domain(yDomain)
      .range([height, 0])

    const actualDates = sortedData.map(d => new Date(d.date))
    
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x)
        .tickValues(actualDates)
        .tickFormat(d => d3.timeFormat(isMobile ? '%d/%m' : '%d/%m/%y')(d as Date))
      )
      .selectAll('text')
      .style('font-size', isMobile ? '10px' : '12px')
      .style('text-anchor', isMobile ? 'end' : 'middle')
      .attr('dx', isMobile ? '-0.5em' : '0')
      .attr('dy', isMobile ? '0.5em' : '0.71em')
      .attr('transform', isMobile ? 'rotate(-45)' : 'rotate(0)')

    g.append('g')
      .call(d3.axisLeft(y)
        .ticks(isMobile ? 4 : 6)
        .tickFormat(d => formatResult(d as number, unit))
      )
      .selectAll('text')
      .style('font-size', isMobile ? '10px' : '12px')

    const line = d3.line<PerformanceData>()
      .x(d => x(new Date(d.date)))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX)

    g.append('path')
      .datum(sortedData)
      .attr('fill', 'none')
      .attr('stroke', 'oklch(0.55 0.20 250)')
      .attr('stroke-width', isMobile ? 2 : 2.5)
      .attr('d', line)

    const dotSize = isMobile ? 4 : 5

    g.selectAll('.dot')
      .data(sortedData)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => x(new Date(d.date)))
      .attr('cy', d => y(d.value))
      .attr('r', dotSize)
      .attr('fill', 'oklch(0.68 0.19 40)')
      .attr('stroke', 'white')
      .attr('stroke-width', isMobile ? 1.5 : 2)
      .style('cursor', 'pointer')
      .on('mouseenter touchstart', function(event, d) {
        event.preventDefault()
        d3.select(this)
          .transition()
          .duration(150)
          .attr('r', dotSize + 2)

        const tooltip = g.append('g')
          .attr('class', 'tooltip')
          .attr('transform', `translate(${x(new Date(d.date))},${y(d.value) - 20})`)

        const tooltipWidth = isMobile ? 80 : 100
        const tooltipHeight = isMobile ? 22 : 25

        tooltip.append('rect')
          .attr('x', -tooltipWidth / 2)
          .attr('y', -tooltipHeight - 5)
          .attr('width', tooltipWidth)
          .attr('height', tooltipHeight)
          .attr('fill', 'oklch(0.20 0 0)')
          .attr('rx', 4)

        tooltip.append('text')
          .attr('text-anchor', 'middle')
          .attr('y', -tooltipHeight / 2 - 3)
          .attr('fill', 'white')
          .style('font-size', isMobile ? '11px' : '12px')
          .style('font-weight', '600')
          .text(formatResult(d.value, unit))
      })
      .on('mouseleave touchend', function() {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('r', dotSize)

        g.selectAll('.tooltip').remove()
      })

  }, [filteredData, unit, dimensions])

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm text-center px-4">
        Niciun rezultat înregistrat pentru această probă
      </div>
    )
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <PeriodFilter value={period} onChange={setPeriod} />
      {filteredData.length === 0 ? (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm text-center px-4">
          Niciun rezultat în perioada selectată
        </div>
      ) : (
        <div ref={containerRef} className="w-full">
          {dimensions.width > 0 ? (
            <svg ref={svgRef} width="100%" height={dimensions.height || 300} />
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <div className="animate-pulse text-muted-foreground text-sm">Se încarcă graficul...</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
