import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ChartLine, Trash } from '@phosphor-icons/react'
import { getInitials, getAvatarColor } from '@/lib/constants'
import type { Athlete, Result } from '@/lib/types'

interface AthleteCardProps {
  athlete: Athlete
  resultsCount: number
  onViewDetails: (athlete: Athlete) => void
  onDelete: (id: string) => void
}

export function AthleteCard({ athlete, resultsCount, onViewDetails, onDelete }: AthleteCardProps) {
  const avatarColor = getAvatarColor(athlete.id)
  
  return (
    <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className={`${avatarColor} text-white font-semibold`}>
                {getInitials(athlete.firstName, athlete.lastName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">
                {athlete.firstName} {athlete.lastName}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{athlete.age} ani</p>
            </div>
          </div>
          <Badge variant="secondary">{athlete.category}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <span className="text-muted-foreground">Rezultate:</span>{' '}
            <span className="font-semibold">{resultsCount}</span>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewDetails(athlete)}
              className="gap-1.5"
            >
              <ChartLine size={16} />
              Detalii
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(athlete.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash size={16} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
