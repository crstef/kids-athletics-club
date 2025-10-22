import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus } from '@phosphor-icons/react'
import type { Result, CoachProbe } from '@/lib/types'
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
  const [unit, setUnit] = useState<'seconds' | 'meters'>('seconds')

  const [probes, setProbes, loading] = useApi<CoachProbe[]>('/api/coach-probes', [], { autoFetch: true })

  // Set default event when probes load
  useEffect(() => {
    if (probes.length > 0 && !eventType) {
      setEventType(probes[0].name)
      // Auto-detect unit based on probe name
      const probeName = probes[0].name.toLowerCase()
      setUnit(probeName.includes('m') && !probeName.includes('jump') ? 'seconds' : 'meters')
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
    // Auto-detect unit based on probe name
    const lowerName = probeName.toLowerCase()
    if (lowerName.includes('m') && !lowerName.includes('jump')) {
      setUnit('seconds')
    } else {
      setUnit('meters')
    }
  }

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
            <Select value={eventType} onValueChange={handleProbeChange} disabled={loading}>
              <SelectTrigger id="eventType">
                <SelectValue placeholder={loading ? 'Se încarcă...' : 'Selectează proba'} />
              </SelectTrigger>
              <SelectContent>
                {probes.filter(p => p.isActive).map((probe) => (
                  <SelectItem key={probe.id} value={probe.name}>
                    {probe.name}
                    {probe.description && <span className="text-xs text-muted-foreground ml-2">- {probe.description}</span>}
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
            <Button type="submit" disabled={!eventType}>Salvează</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
