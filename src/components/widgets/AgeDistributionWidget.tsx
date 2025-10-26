import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { AGE_CATEGORIES } from '@/lib/constants'
import type { Athlete } from '@/lib/types'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

interface AgeDistributionWidgetProps {
  athletes?: Athlete[]
}

export default function AgeDistributionWidget({ athletes = [] }: AgeDistributionWidgetProps) {
  const counts: Record<string, number> = {}
  AGE_CATEGORIES.forEach(c => { counts[c] = 0 })
  athletes.forEach(a => { counts[a.category] = (counts[a.category] || 0) + 1 })

  const data = AGE_CATEGORIES.map(cat => ({ category: cat, count: counts[cat] || 0 }))

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Distribuție pe Categorii de Vârstă</CardTitle>
      </CardHeader>
      <CardContent className="grow">
        <ChartContainer
          config={{ count: { label: 'Număr', color: 'hsl(var(--primary))' } }}
          className="aspect-16/8"
        >
          <BarChart data={data}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="category" tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={[4,4,0,0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
