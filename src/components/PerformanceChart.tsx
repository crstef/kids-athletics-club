import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatResult } from '@/lib/constants'
import type { PerformanceData } from '@/lib/types'

interface PerformanceChartProps {
  data: PerformanceData[]
  eventType: string
  unit: 'seconds' | 'meters'
}

export function PerformanceChart({ data, eventType, unit }: PerformanceChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 20, right: 30, bottom: 40, left: 60 }
    const width = svgRef.current.clientWidth - margin.left - margin.right
    const height = 300 - margin.top - margin.bottom

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

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d => d3.timeFormat('%d/%m/%y')(d as Date)))
      .selectAll('text')
      .style('font-size', '12px')

    g.append('g')
      .call(d3.axisLeft(y).ticks(6).tickFormat(d => formatResult(d as number, unit)))
      .selectAll('text')
      .style('font-size', '12px')

    const line = d3.line<PerformanceData>()
      .x(d => x(new Date(d.date)))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX)

    g.append('path')
      .datum(sortedData)
      .attr('fill', 'none')
      .attr('stroke', 'oklch(0.55 0.20 250)')
      .attr('stroke-width', 2.5)
      .attr('d', line)

    g.selectAll('.dot')
      .data(sortedData)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => x(new Date(d.date)))
      .attr('cy', d => y(d.value))
      .attr('r', 5)
      .attr('fill', 'oklch(0.68 0.19 40)')
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseenter', function(event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('r', 7)

        const tooltip = g.append('g')
          .attr('class', 'tooltip')
          .attr('transform', `translate(${x(new Date(d.date))},${y(d.value) - 20})`)

        tooltip.append('rect')
          .attr('x', -50)
          .attr('y', -30)
          .attr('width', 100)
          .attr('height', 25)
          .attr('fill', 'oklch(0.20 0 0)')
          .attr('rx', 4)

        tooltip.append('text')
          .attr('text-anchor', 'middle')
          .attr('y', -13)
          .attr('fill', 'white')
          .style('font-size', '12px')
          .style('font-weight', '600')
          .text(formatResult(d.value, unit))
      })
      .on('mouseleave', function() {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('r', 5)

        g.selectAll('.tooltip').remove()
      })

  }, [data, unit])

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evoluție {eventType}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Niciun rezultat înregistrat pentru această probă
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evoluție {eventType}</CardTitle>
      </CardHeader>
      <CardContent>
        <svg ref={svgRef} width="100%" height="300" />
      </CardContent>
    </Card>
  )
}
