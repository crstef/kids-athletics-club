import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { AGE_CATEGORIES } from '@/lib/constants'
import type { Athlete, AgeCategory, Gender, User } from '@/lib/types'

interface AddAthleteDialogProps {
  onAdd: (athlete: Omit<Athlete, 'id'>) => void
  coaches?: User[]
}

export function AddAthleteDialog({ onAdd, coaches = [] }: AddAthleteDialogProps) {
  const [open, setOpen] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [age, setAge] = useState('')
  const [category, setCategory] = useState<AgeCategory>('U10')
  const [gender, setGender] = useState<Gender>('M')
  const [coachId, setCoachId] = useState<string>('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!firstName.trim() || !lastName.trim() || !age) {
      toast.error('Completează toate câmpurile obligatorii')
      return
    }

    const athleteAge = parseInt(age)
    if (athleteAge < 6 || athleteAge > 18) {
      toast.error('Vârsta trebuie să fie între 6 și 18 ani')
      return
    }

    onAdd({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      age: athleteAge,
      category,
      gender,
      dateJoined: new Date().toISOString(),
      coachId: coachId || undefined
    })

    setFirstName('')
    setLastName('')
    setAge('')
    setCategory('U10')
    setGender('M')
    setCoachId('')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus size={20} weight="bold" />
          Adaugă Atlet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adaugă Atlet Nou</DialogTitle>
          <DialogDescription>
            Completează datele atletului pentru a-l adăuga în sistem
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">Prenume *</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="ex: Ion"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Nume *</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="ex: Popescu"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="age">Vârstă *</Label>
            <Input
              id="age"
              type="number"
              min="6"
              max="18"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="ex: 12"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Categorie *</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as AgeCategory)}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AGE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Gen *</Label>
            <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
              <SelectTrigger id="gender">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Masculin</SelectItem>
                <SelectItem value="F">Feminin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {coaches.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="coach">Antrenor (opțional)</Label>
              <Select value={coachId} onValueChange={setCoachId}>
                <SelectTrigger id="coach">
                  <SelectValue placeholder="Selectează antrenor..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Fără antrenor</SelectItem>
                  {coaches.map((coach) => (
                    <SelectItem key={coach.id} value={coach.id}>
                      {coach.firstName} {coach.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
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
