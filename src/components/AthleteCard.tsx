import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ChartLine, Trash, Trophy } from '@phosphor-icons/react'
import { getInitials, getAvatarColor } from '@/lib/constants'
import type { Athlete, Result } from '@/lib/types'

interface AthleteCardProps {
  athlete: Athlete
  resultsCount: number
  onViewDetails: (athlete: Athlete) => void
  onDelete: (id: string) => void
  hideDelete?: boolean
}

export function AthleteCard({ athlete, resultsCount, onViewDetails, onDelete, hideDelete }: AthleteCardProps) {
  const avatarColor = getAvatarColor(athlete.id)
  
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 cursor-pointer" onClick={() => onViewDetails(athlete)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-12 w-12 ring-2 ring-background group-hover:ring-primary/20 transition-all">
                <AvatarFallback className={`${avatarColor} text-white font-semibold`}>
                  {getInitials(athlete.firstName, athlete.lastName)}
                </AvatarFallback>
              </Avatar>
              {resultsCount > 0 && (
                <div className="absolute -bottom-1 -right-1 bg-accent text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ring-2 ring-background">
                  {resultsCount}
                </div>
              )}
            </div>
            <div className="flex-1">
              <CardTitle className="text-base group-hover:text-primary transition-colors">
                {athlete.firstName} {athlete.lastName}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">{athlete.age} ani</span>
                <span className="text-xs text-muted-foreground">•</span>
                <Badge variant="secondary" className="text-xs px-2 py-0">{athlete.category}</Badge>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {resultsCount === 0 ? 'Fără rezultate' : `${resultsCount} ${resultsCount === 1 ? 'rezultat' : 'rezultate'}`}
            </span>
          </div>
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                onViewDetails(athlete)
              }}
              className="gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChartLine size={16} />
              <span className="sr-only">Detalii</span>
            </Button>
            {!hideDelete && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(athlete.id)
                }}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash size={16} />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
