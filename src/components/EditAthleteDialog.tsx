import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PencilSimple } from '@phosphor-icons/react'
import type { Athlete, User } from '@/lib/types'

interface EditAthleteDialogProps {
  athlete: Athlete
  parents: User[]
  onEdit: (id: string, data: Partial<Athlete>) => void
}

export function EditAthleteDialog({ athlete, parents, onEdit }: EditAthleteDialogProps) {
  const [open, setOpen] = useState(false)
  const [firstName, setFirstName] = useState(athlete.firstName)
  const [lastName, setLastName] = useState(athlete.lastName)
  const [dateOfBirth, setDateOfBirth] = useState(athlete.dateOfBirth)
  const [gender, setGender] = useState<'M' | 'F'>(athlete.gender)
  const [parentId, setParentId] = useState(athlete.parentId || '')

  // Reset form when dialog opens with athlete data
  useEffect(() => {
    if (open) {
      setFirstName(athlete.firstName)
      setLastName(athlete.lastName)
      setDateOfBirth(athlete.dateOfBirth)
      setGender(athlete.gender)
      setParentId(athlete.parentId || '')
    }
  }, [open, athlete])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!firstName.trim() || !lastName.trim() || !dateOfBirth || !gender) {
      return
    }

    onEdit(athlete.id, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dateOfBirth,
      gender,
      parentId: parentId || undefined
    })

    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PencilSimple className="h-4 w-4 mr-2" />
          Editează
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editează Sportiv</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="edit-firstName">Prenume</Label>
            <Input
              id="edit-firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Prenume"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-lastName">Nume</Label>
            <Input
              id="edit-lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Nume"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-dateOfBirth">Data nașterii</Label>
            <Input
              id="edit-dateOfBirth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-gender">Gen</Label>
            <Select value={gender} onValueChange={(value: 'M' | 'F') => setGender(value)}>
              <SelectTrigger id="edit-gender">
                <SelectValue placeholder="Selectează genul" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Masculin</SelectItem>
                <SelectItem value="F">Feminin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-parentId">Părinte (opțional)</Label>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger id="edit-parentId">
                <SelectValue placeholder="Selectează părintele" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Fără părinte</SelectItem>
                {parents.map((parent) => (
                  <SelectItem key={parent.id} value={parent.id}>
                    {parent.firstName} {parent.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              Salvează
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Anulează
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
