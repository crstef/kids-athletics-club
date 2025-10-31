import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus } from '@phosphor-icons/react'
import type { Result } from '@/lib/types'
import { useEvents } from '@/hooks/use-api'
import { DateSelector } from './DateSelector'

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
  const [unit, setUnit] = useState<Result['unit']>('seconds')
  const currentYear = new Date().getFullYear()

  const [probes, , loading, , refetchEvents] = useEvents()

  // Refetch probes when dialog opens
  useEffect(() => {
    if (open) {
      refetchEvents()
    }
  }, [open, refetchEvents])

  // Set default event when probes load
  useEffect(() => {
    if (probes.length > 0 && !eventType) {
      setEventType(probes[0].name)
      setUnit((probes[0].unit as Result['unit']) || 'seconds')
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
    setUnit((probe?.unit as Result['unit']) || 'seconds')
  }

  const normalizeUnitKey = (rawUnit?: string | null) => {
    if (!rawUnit) return 'seconds'
    return rawUnit
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[.,:+-]+/g, '_')
  }

  const deriveCanonicalUnit = (rawUnit?: string | null): 'seconds' | 'meters' | 'points' => {
    const key = normalizeUnitKey(rawUnit)
    if (['seconds', 'secunde'].includes(key)) return 'seconds'
    if (['meters', 'metri', 'metri_centimetri', 'metri-centimetri', 'metri,centimetri'].includes(key)) return 'meters'
    if (['points', 'puncte'].includes(key)) return 'points'
    return 'seconds'
  }

  const getUnitLabel = (rawUnit?: string | null) => {
    const key = normalizeUnitKey(rawUnit)
    switch (key) {
      case 'seconds':
      case 'secunde':
        return 'secunde'
      case 'meters':
      case 'metri':
      case 'metri_centimetri':
      case 'metri-centimetri':
      case 'metri,centimetri':
        return 'metri'
      case 'points':
      case 'puncte':
        return 'puncte'
      default:
        return rawUnit || 'secunde'
    }
  }

  const getPlaceholder = (rawUnit?: string | null) => {
    switch (deriveCanonicalUnit(rawUnit)) {
      case 'seconds':
        return 'ex: 12.45'
      case 'meters':
        return 'ex: 5.25'
      case 'points':
        return 'ex: 850'
      default:
        return 'ex: 10.00'
    }
  }

  const canonicalUnit = deriveCanonicalUnit(unit)

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
              <SelectTrigger id="eventType" className="w-full">
                <SelectValue placeholder={loading ? 'Se încarcă...' : 'Selectează proba'} />
              </SelectTrigger>
              <SelectContent>
                {probes.map((probe) => (
                  <SelectItem key={probe.id} value={probe.name}>
                    {probe.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="value">
              Rezultat ({getUnitLabel(unit)})
            </Label>
            <Input
              id="value"
              type={canonicalUnit === 'seconds' || canonicalUnit === 'meters' || canonicalUnit === 'points' ? 'number' : 'text'}
              step={canonicalUnit === 'points' ? '1' : '0.01'}
              min={canonicalUnit === 'points' ? '1' : '0.01'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={getPlaceholder(unit)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="result-date">Data rezultat (zi / lună / an)</Label>
            <DateSelector
              id="result-date"
              value={date}
              onChange={setDate}
              minYear={currentYear - 5}
              maxYear={currentYear}
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
