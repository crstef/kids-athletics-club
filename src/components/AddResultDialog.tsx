import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus } from '@phosphor-icons/react'
import { EVENT_CATEGORIES, EVENT_UNITS } from '@/lib/constants'
import type { Result, EventType } from '@/lib/types'

interface AddResultDialogProps {
  athleteId: string
  athleteName: string
  onAdd: (result: Omit<Result, 'id'>) => void
}

export function AddResultDialog({ athleteId, athleteName, onAdd }: AddResultDialogProps) {
  const [open, setOpen] = useState(false)
  const [eventType, setEventType] = useState<EventType>('100m')
  const [value, setValue] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!value || !date) {
      return
    }

    const numValue = parseFloat(value)
    if (isNaN(numValue) || numValue <= 0) {
      return
    }

    onAdd({
      athleteId,
      eventType,
      value: numValue,
      unit: EVENT_UNITS[eventType],
      date,
      notes: notes.trim() || undefined
    })

    setValue('')
    setNotes('')
    setOpen(false)
  }

  const allEvents = [
    ...EVENT_CATEGORIES.running,
    ...EVENT_CATEGORIES.jumping,
    ...EVENT_CATEGORIES.throwing
  ]

  const unit = EVENT_UNITS[eventType]
  const placeholder = unit === 'seconds' ? 'ex: 12.45' : 'ex: 5.25'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus size={20} weight="bold" />
          Adaugă Rezultat
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adaugă Rezultat pentru {athleteName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="eventType">Probă</Label>
            <Select value={eventType} onValueChange={(v) => setEventType(v as EventType)}>
              <SelectTrigger id="eventType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Alergare</div>
                {EVENT_CATEGORIES.running.map((event) => (
                  <SelectItem key={event} value={event}>
                    {event}
                  </SelectItem>
                ))}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Sărituri</div>
                {EVENT_CATEGORIES.jumping.map((event) => (
                  <SelectItem key={event} value={event}>
                    {event}
                  </SelectItem>
                ))}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Aruncări</div>
                {EVENT_CATEGORIES.throwing.map((event) => (
                  <SelectItem key={event} value={event}>
                    {event}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="value">
              Rezultat ({unit === 'seconds' ? 'secunde' : 'metri'})
            </Label>
            <Input
              id="value"
              type="number"
              step="0.01"
              min="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notițe (opțional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ex: Competiție locală"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Anulează
            </Button>
            <Button type="submit">Salvează</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
