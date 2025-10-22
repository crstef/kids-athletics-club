import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus } from '@phosphor-icons/react'
import type { Result, EventTypeCustom } from '@/lib/types'
import { useApi } from '@/hooks/use-api'

interface AddResultDialogProps {
  athleteId: string
  athleteName: string
  onAdd: (result: Omit<Result, 'id'>) => void
}

export function AddResultDialog({ athleteId, athleteName, onAdd }: AddResultDialogProps) {
  const [open, setOpen] = useState(false)
  const [eventType, setEventType] = useState('')
  const [value, setValue] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [unit, setUnit] = useState<'seconds' | 'meters' | 'points'>('seconds')

  const [probes, setProbes, loading] = useApi<EventTypeCustom[]>('/api/events', [], { autoFetch: true })

  // Set default event when probes load
  useEffect(() => {
    if (probes.length > 0 && !eventType) {
      setEventType(probes[0].name)
      setUnit(probes[0].unit)
    }
  }, [probes, eventType])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!value || !date || !eventType) {
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
      unit,
      date,
      notes: notes.trim() || undefined
    })

    setValue('')
    setNotes('')
    setOpen(false)
  }

  const handleProbeChange = (probeName: string) => {
    setEventType(probeName)
    // Find probe and set unit
    const probe = probes.find(p => p.name === probeName)
    if (probe) {
      setUnit(probe.unit)
    }
  }

  const getPlaceholder = () => {
    switch (unit) {
      case 'seconds': return 'ex: 12.45'
      case 'meters': return 'ex: 5.25'
      case 'points': return 'ex: 850'
      default: return 'ex: 10.00'
    }
  }

  const getUnitLabel = () => {
    switch (unit) {
      case 'seconds': return 'secunde'
      case 'meters': return 'metri'
      case 'points': return 'puncte'
      default: return unit
    }
  }

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
            <Select value={eventType} onValueChange={handleProbeChange} disabled={loading}>
              <SelectTrigger id="eventType">
                <SelectValue placeholder={loading ? 'Se încarcă...' : 'Selectează proba'} />
              </SelectTrigger>
              <SelectContent>
                {probes.map((probe) => (
                  <SelectItem key={probe.id} value={probe.name}>
                    {probe.description ? `${probe.name} - ${probe.description}` : probe.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="value">
              Rezultat ({getUnitLabel()})
            </Label>
            <Input
              id="value"
              type="number"
              step="0.01"
              min="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={getPlaceholder()}
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
            <Button type="submit" disabled={!eventType}>Salvează</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
