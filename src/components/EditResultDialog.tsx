import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { PencilSimple } from '@phosphor-icons/react'
import type { Result } from '@/lib/types'
import { useEvents } from '@/hooks/use-api'

interface EditResultDialogProps {
  result: Result
  athleteName?: string
  onUpdate: (id: string, updates: Partial<Result>) => void
}

export function EditResultDialog({ result, athleteName, onUpdate }: EditResultDialogProps) {
  const [open, setOpen] = useState(false)
  const [eventType, setEventType] = useState(result.eventType)
  const [value, setValue] = useState(String(result.value))
  const [date, setDate] = useState(result.date.split('T')[0] || result.date)
  const [notes, setNotes] = useState(result.notes || '')
  const [unit, setUnit] = useState<Result['unit']>(result.unit)

  const [probes, , loading, , refetchEvents] = useEvents()

  useEffect(() => {
    if (open) refetchEvents()
  }, [open, refetchEvents])

  useEffect(() => {
    // sync unit with selected event if found
    const probe = probes.find(p => p.name === eventType)
    if (probe && probe.unit !== unit) setUnit(probe.unit)
  }, [eventType, probes])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const numValue = parseFloat(value)
    if (!eventType || isNaN(numValue) || numValue <= 0 || !date) return
    onUpdate(result.id, {
      eventType,
      value: numValue,
      unit,
      date,
      notes: notes.trim() || undefined,
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Editează rezultat">
          <PencilSimple size={14} />
        </Button>
      </DialogTrigger>
  <DialogContent className="w-[min(92vw,360px)] sm:w-[360px]">
        <DialogHeader>
          <DialogTitle>Editează Rezultat{athleteName ? ` — ${athleteName}` : ''}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="edit-eventType">Probă</Label>
            <Select value={eventType} onValueChange={setEventType} disabled={loading}>
              <SelectTrigger id="edit-eventType">
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
            <Label htmlFor="edit-value">Rezultat ({unit === 'seconds' ? 'secunde' : unit === 'meters' ? 'metri' : 'puncte'})</Label>
            <Input
              id="edit-value"
              type="number"
              step="0.01"
              min="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-date">Data (dd/mm/yyyy)</Label>
            <Input
              id="edit-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notițe (opțional)</Label>
            <Textarea id="edit-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
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

export default EditResultDialog