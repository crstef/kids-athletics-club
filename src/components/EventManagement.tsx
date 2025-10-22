import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash, Timer, Ruler, Target } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { EventTypeCustom } from '@/lib/types'

interface EventManagementProps {
  events: EventTypeCustom[]
  onAddEvent: (event: Omit<EventTypeCustom, 'id' | 'createdAt'>) => void
  onDeleteEvent: (id: string) => void
}

export function EventManagement({ events, onAddEvent, onDeleteEvent }: EventManagementProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<'running' | 'jumping' | 'throwing' | 'other'>('running')
  const [unit, setUnit] = useState<'seconds' | 'meters' | 'points'>('seconds')
  const [description, setDescription] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Introdu numele probei')
      return
    }

    onAddEvent({
      name: name.trim(),
      category,
      unit,
      description: description.trim() || undefined
    })

    setOpen(false)
    resetForm()
  }

  const resetForm = () => {
    setName('')
    setCategory('running')
    setUnit('seconds')
    setDescription('')
  }

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'running': return <Timer size={20} />
      case 'jumping': return <Target size={20} />
      case 'throwing': return <Ruler size={20} />
      default: return <Target size={20} />
    }
  }

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'running': return 'Alergare'
      case 'jumping': return 'Sărituri'
      case 'throwing': return 'Aruncări'
      default: return 'Altele'
    }
  }

  const getUnitLabel = (u: string) => {
    switch (u) {
      case 'seconds': return 'secunde'
      case 'meters': return 'metri'
      case 'points': return 'puncte'
      default: return u
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Management Probe</h2>
          <p className="text-muted-foreground">Gestionează probele sportive disponibile</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={20} className="mr-2" />
              Adaugă Probă
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adaugă Probă Nouă</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="event-name">Nume Probă</Label>
                <Input
                  id="event-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: 60m Sprint"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-category">Categorie</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as any)}>
                  <SelectTrigger id="event-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="running">Alergare</SelectItem>
                    <SelectItem value="jumping">Sărituri</SelectItem>
                    <SelectItem value="throwing">Aruncări</SelectItem>
                    <SelectItem value="other">Altele</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-unit">Unitate Măsură</Label>
                <Select value={unit} onValueChange={(v) => setUnit(v as any)}>
                  <SelectTrigger id="event-unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seconds">Secunde</SelectItem>
                    <SelectItem value="meters">Metri</SelectItem>
                    <SelectItem value="points">Puncte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-description">Descriere (opțional)</Label>
                <Textarea
                  id="event-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descriere sau reguli probe..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Anulează
                </Button>
                <Button type="submit">Salvează</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Target size={64} weight="duotone" className="mx-auto mb-4 text-muted-foreground" />
          <p>Nicio probă adăugată încă</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Card key={event.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(event.category)}
                  <h3 className="font-semibold">{event.name}</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm(`Ștergi proba "${event.name}"?`)) {
                      onDeleteEvent(event.id)
                    }
                  }}
                >
                  <Trash size={16} />
                </Button>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary">{getCategoryLabel(event.category)}</Badge>
                <Badge variant="outline">{getUnitLabel(event.unit)}</Badge>
              </div>
              {event.description && (
                <p className="text-sm text-muted-foreground">{event.description}</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
