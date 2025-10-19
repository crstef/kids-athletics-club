import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus } from '@phosphor-icons/react'
import type { Coach } from '@/lib/types'

interface AddCoachDialogProps {
  onAdd: (coach: Omit<Coach, 'id' | 'createdAt'>) => void
}

export function AddCoachDialog({ onAdd }: AddCoachDialogProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [specialization, setSpecialization] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim() || !firstName.trim() || !lastName.trim()) {
      return
    }

    onAdd({
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role: 'coach',
      specialization: specialization.trim() || undefined
    })

    setEmail('')
    setFirstName('')
    setLastName('')
    setSpecialization('')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus size={20} weight="bold" />
          Adaugă Antrenor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adaugă Antrenor Nou</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="coach-email">Email</Label>
            <Input
              id="coach-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="antrenor@email.ro"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="coach-firstName">Prenume</Label>
            <Input
              id="coach-firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="ex: Ion"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="coach-lastName">Nume</Label>
            <Input
              id="coach-lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="ex: Popescu"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="coach-specialization">Specializare (opțional)</Label>
            <Input
              id="coach-specialization"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              placeholder="ex: Sprint, Sărituri"
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
