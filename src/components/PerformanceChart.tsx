import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { formatResult } from '@/lib/constants'
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

  useEffect(() => {
    if (!containerRef.current) return

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width } = entry.contentRect
        setDimensions({ width, height: 300 })
      }
    })

    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  useEffect(() => {
    if (!svgRef.current || data.length === 0 || dimensions.width === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const isMobile = dimensions.width < 640
    const margin = { 
      top: 20, 
      right: isMobile ? 10 : 30, 
      bottom: isMobile ? 60 : 40, 
      left: isMobile ? 45 : 60 
    }
    const width = dimensions.width - margin.left - margin.right
    const height = dimensions.height - margin.top - margin.bottom

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const x = d3.scaleTime()
      .domain(d3.extent(sortedData, d => new Date(d.date)) as [Date, Date])
      .range([0, width])

    const y = d3.scaleLinear()
      .domain([
        d3.min(sortedData, d => d.value)! * 0.95,
        d3.max(sortedData, d => d.value)! * 1.05
      ])
      .range([height, 0])

    const tickCount = isMobile ? Math.min(3, sortedData.length) : Math.min(5, sortedData.length)

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x)
        .ticks(tickCount)
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

  }, [data, unit, dimensions])

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm text-center px-4">
        Niciun rezultat înregistrat pentru această probă
      </div>
    )
  }

  return (
    <div ref={containerRef} className="w-full">
      <svg ref={svgRef} width="100%" height={dimensions.height || 300} />
    </div>
  )
}
