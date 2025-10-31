import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'
import { ChartLine, SlidersHorizontal, Trash, Trophy } from '@phosphor-icons/react'
import { EditAthleteDialog } from './EditAthleteDialog'
import { getInitials, getAvatarColor } from '@/lib/constants'
import { resolveMediaUrl } from '@/lib/media'
import type { Athlete, User } from '@/lib/types'

interface AthleteCardProps {
  athlete: Athlete
  resultsCount: number
  parents?: User[]
  coaches?: User[]
  onViewDetails: (athlete: Athlete) => void
  onViewChart: (athlete: Athlete) => void
  onEdit?: (id: string, data: Partial<Athlete>) => void
  onUploadAvatar?: (id: string, file: File) => void
  onDelete: (id: string) => void
  hideDelete?: boolean
  hideEdit?: boolean
}

export function AthleteCard({ athlete, resultsCount, parents, coaches, onViewDetails, onViewChart, onEdit, onUploadAvatar, onDelete, hideDelete, hideEdit }: AthleteCardProps) {
  const avatarColor = getAvatarColor(athlete.id)
  const avatarSrc = resolveMediaUrl(athlete.avatar)
  const defaultAvatarSize = 72
  const minAvatarSize = 56
  const maxAvatarSize = 120
  const [avatarSize, setAvatarSize] = useState(defaultAvatarSize)
  const avatarDimension = Math.round(Math.min(Math.max(avatarSize, minAvatarSize), maxAvatarSize))
  const avatarScale = avatarDimension / defaultAvatarSize
  const badgeScale = Math.min(1.25, Math.max(0.8, avatarScale))
  
  const coachName = athlete.coachId && coaches && coaches.length > 0 
    ? `${coaches.find(c => c.id === athlete.coachId)?.firstName || ''} ${coaches.find(c => c.id === athlete.coachId)?.lastName || ''}`.trim()
    : null

  return (
    <Card
      className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 cursor-pointer"
      onClick={() => onViewDetails(athlete)}
    >
      <CardHeader className="pb-3 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="relative"
              style={{ width: avatarDimension, height: avatarDimension }}
            >
              <Avatar
                className="rounded-full ring-2 ring-background group-hover:ring-primary/20 transition-all overflow-hidden"
                style={{ width: avatarDimension, height: avatarDimension }}
              >
                {avatarSrc ? (
                  <AvatarImage
                    src={avatarSrc}
                    alt={`${athlete.firstName} ${athlete.lastName}`}
                    className="h-full w-full object-cover object-center"
                    onError={(event) => {
                      (event.currentTarget as HTMLImageElement).style.display = 'none'
                    }}
                  />
                ) : (
                  <AvatarFallback
                    className={`${avatarColor} text-white font-semibold`}
                    style={{ fontSize: Math.max(14, Math.min(24, 16 * avatarScale)) }}
                  >
                    {getInitials(athlete.firstName, athlete.lastName)}
                  </AvatarFallback>
                )}
              </Avatar>
              {resultsCount > 0 && (
                <div
                  className="absolute bg-accent text-white text-xs font-bold rounded-full flex items-center justify-center ring-2 ring-background"
                  style={{
                    bottom: -6 * badgeScale,
                    right: -6 * badgeScale,
                    width: 20 * badgeScale,
                    height: 20 * badgeScale,
                  }}
                >
                  {resultsCount}
                </div>
              )}
              <div
                className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2"
                onClick={(event) => event.stopPropagation()}
              >
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 rounded-full shadow-sm"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <SlidersHorizontal size={16} />
                      <span className="sr-only">Ajustează dimensiunea avatarului</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    className="w-60 space-y-3"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span>Dimensiune avatar</span>
                      <span>{avatarDimension}px</span>
                    </div>
                    <Slider
                      value={[avatarDimension]}
                      min={minAvatarSize}
                      max={maxAvatarSize}
                      step={2}
                      onValueChange={(values) => setAvatarSize(values[0] ?? defaultAvatarSize)}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Compact</span>
                      <span>Maxim</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAvatarSize(defaultAvatarSize)}
                    >
                      Resetare
                    </Button>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="flex-1">
              <CardTitle className="text-base group-hover:text-primary transition-colors">
                {athlete.firstName} {athlete.lastName}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs text-muted-foreground">{athlete.age} ani</span>
                <span className="text-xs text-muted-foreground">•</span>
                <Badge variant="secondary" className="text-xs px-2 py-0">{athlete.category}</Badge>
                <Badge variant={athlete.gender === 'M' ? 'default' : 'outline'} className="text-xs px-2 py-0">
                  {athlete.gender === 'M' ? 'Băiat' : 'Fată'}
                </Badge>
              </div>
            </div>
          </div>
          {coachName && (
            <div className="flex items-center gap-1 ml-2 whitespace-nowrap">
              <span className="text-[10px] text-muted-foreground">Antrenor:</span>
              <span className="text-xs font-medium">{coachName}</span>
            </div>
          )}
        </div>
        {athlete.notes?.trim() && (
          <p className="text-sm font-medium text-primary/80">
            Rezultate excepționale:
            <span className="ml-1 font-normal text-muted-foreground">{athlete.notes}</span>
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {resultsCount === 0 ? 'Fără rezultate' : `${resultsCount} ${resultsCount === 1 ? 'rezultat' : 'rezultate'}`}
            </span>
          </div>
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
              size="icon"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                onViewChart(athlete)
              }}
              className="h-9 w-9 rounded-full border-muted-foreground/20 text-muted-foreground hover:bg-primary/10 hover:text-primary"
              title="Vezi grafic evoluție"
            >
              <ChartLine size={16} />
              <span className="sr-only">Vezi grafic</span>
            </Button>
            {!hideEdit && onEdit && parents && (
              <div onClick={(e) => e.stopPropagation()}>
                <EditAthleteDialog 
                  athlete={athlete}
                  parents={parents}
                  coaches={coaches}
                  onEdit={onEdit}
                  onUploadAvatar={onUploadAvatar}
                  triggerClassName="rounded-full border border-muted-foreground/20 bg-background text-muted-foreground hover:bg-primary/10 hover:text-primary"
                />
              </div>
            )}
            {!hideDelete && (
              <Button
                size="icon"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(athlete.id)
                }}
                className="h-9 w-9 rounded-full border-destructive/30 text-destructive hover:bg-destructive/10"
                title="Șterge atlet"
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
