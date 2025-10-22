import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { AGE_CATEGORIES } from '@/lib/constants'
import type { Athlete, AgeCategory, Gender, User } from '@/lib/types'

// Funcție pentru calcularea vârstei din data nașterii
function calculateAge(dateOfBirth: string): number {
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
}

// Funcție pentru determinarea categoriei pe bază de vârstă
function determineCategory(age: number): AgeCategory {
  if (age < 10) return 'U10'
  if (age < 12) return 'U12'
  if (age < 14) return 'U14'
  if (age < 16) return 'U16'
  return 'U18'
}

interface AddAthleteDialogProps {
  onAdd: (athlete: Omit<Athlete, 'id'>) => void
  coaches?: User[]
}

export function AddAthleteDialog({ onAdd, coaches = [] }: AddAthleteDialogProps) {
  const [open, setOpen] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [age, setAge] = useState<number | null>(null)
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [category, setCategory] = useState<AgeCategory>('U10')
  const [gender, setGender] = useState<Gender>('M')
  const [coachId, setCoachId] = useState<string>('')

  // Calculează automat vârsta și categoria când se schimbă data nașterii
  useEffect(() => {
    if (dateOfBirth) {
      const calculatedAge = calculateAge(dateOfBirth)
      setAge(calculatedAge)
      setCategory(determineCategory(calculatedAge))
    }
  }, [dateOfBirth])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!firstName.trim() || !lastName.trim() || !dateOfBirth || age === null) {
      toast.error('Completează toate câmpurile obligatorii')
      return
    }

    if (age < 6 || age > 18) {
      toast.error('Vârsta trebuie să fie între 6 și 18 ani')
      return
    }

    onAdd({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      age,
      dateOfBirth,
      category,
      gender,
      dateJoined: new Date().toISOString(),
      coachId: coachId || undefined
    })

    setFirstName('')
    setLastName('')
    setAge(null)
    setDateOfBirth('')
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
            <Label htmlFor="dateOfBirth">Data nașterii (dd/mm/yyyy) *</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
            />
          </div>
          {age !== null && (
            <>
              <div className="space-y-2">
                <Label>Vârstă (calculată automat)</Label>
                <Input
                  value={`${age} ani`}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>Categorie (calculată automat)</Label>
                <Input
                  value={category}
                  disabled
                  className="bg-muted"
                />
              </div>
            </>
          )}
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
              <Select value={coachId || 'none'} onValueChange={(val) => setCoachId(val === 'none' ? '' : val)}>
                <SelectTrigger id="coach">
                  <SelectValue placeholder="Selectează antrenor..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Fără antrenor</SelectItem>
                  {coaches.map((coach) => (
                    <SelectItem key={coach.id} value={coach.id}>
                      {`${coach.firstName} ${coach.lastName}`}
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
