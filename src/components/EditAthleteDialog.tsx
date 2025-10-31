import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PencilSimple } from '@phosphor-icons/react'
import type { Athlete, User, AgeCategory } from '@/lib/types'
import { useAuth } from '@/lib/auth-context'
import { PermissionGate } from './PermissionGate'
import { Textarea } from '@/components/ui/textarea'
import { resolveMediaUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import { DateSelector } from './DateSelector'
import { AvatarUploadControl, type AvatarUploadChangePayload } from './AvatarUploadControl'

interface EditAthleteDialogProps {
  athlete: Athlete
  parents: User[]
  coaches?: User[]
  onEdit: (id: string, data: Partial<Athlete>) => void
  onUploadAvatar?: (id: string, file: File) => void
  triggerClassName?: string
  triggerVariant?: 'default' | 'icon'
}

export function EditAthleteDialog({ athlete, parents, coaches, onEdit, onUploadAvatar, triggerClassName, triggerVariant = 'default' }: EditAthleteDialogProps) {
  const { hasPermission } = useAuth()
  const currentYear = new Date().getFullYear()
  const normalizeDate = (val?: string | null) => {
    if (!val) return ''
    // Accept already-normalized YYYY-MM-DD or ISO strings; return YYYY-MM-DD
    const s = String(val)
    if (s.length >= 10) return s.slice(0, 10)
    try {
      return new Date(s).toISOString().slice(0, 10)
    } catch {
      return ''
    }
  }
  const [open, setOpen] = useState(false)
  const [firstName, setFirstName] = useState(athlete.firstName)
  const [lastName, setLastName] = useState(athlete.lastName)
  const [dateOfBirth, setDateOfBirth] = useState(normalizeDate(athlete.dateOfBirth))
  const [gender, setGender] = useState<'M' | 'F'>(athlete.gender)
  const parentIds = useMemo(() => new Set(parents.map((p) => p.id)), [parents])
  const [coachId, setCoachId] = useState(athlete.coachId || '')
  const [parentId, setParentId] = useState(parentIds.has(athlete.parentId || '') ? athlete.parentId || '' : '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(athlete.avatar || null)
  const [deleteAvatar, setDeleteAvatar] = useState(false)
  const [notes, setNotes] = useState(athlete.notes || '')

  // Calculate age and category from date of birth
  const calculatedAge = useMemo(() => {
    if (!dateOfBirth) return 0
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }, [dateOfBirth])

  const calculatedCategory = useMemo((): AgeCategory => {
    if (calculatedAge < 6) return 'U6'
    if (calculatedAge < 8) return 'U8'
    if (calculatedAge < 10) return 'U10'
    if (calculatedAge < 12) return 'U12'
    if (calculatedAge < 14) return 'U14'
    if (calculatedAge < 16) return 'U16'
    return 'U18'
  }, [calculatedAge])
  const avatarSrc = deleteAvatar ? null : (avatarPreview || resolveMediaUrl(athlete.avatar))

  // Reset form when dialog opens with athlete data
  useEffect(() => {
    if (open) {
      setFirstName(athlete.firstName)
      setLastName(athlete.lastName)
      setDateOfBirth(normalizeDate(athlete.dateOfBirth))
      setGender(athlete.gender)
      setCoachId(athlete.coachId || '')
      setParentId(parentIds.has(athlete.parentId || '') ? athlete.parentId || '' : '')
      setAvatarFile(null)
      setAvatarPreview(athlete.avatar ? resolveMediaUrl(athlete.avatar) : null)
      setDeleteAvatar(false)
      setNotes(athlete.notes || '')
    }
  }, [open, athlete, parentIds])

  const handleAvatarChange = ({ file, previewUrl }: AvatarUploadChangePayload) => {
    setAvatarFile(file)
    setAvatarPreview(previewUrl)
    setDeleteAvatar(!previewUrl)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!firstName.trim() || !lastName.trim() || !dateOfBirth || !gender) {
      return
    }

    const updateData: Partial<Athlete> = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dateOfBirth,
      age: calculatedAge,
      category: calculatedCategory,
      gender,
      coachId: coachId || undefined,
      parentId: parentId || undefined,
      notes: notes.trim() ? notes.trim() : null
    };
    
    if (deleteAvatar) {
      updateData.avatar = ''
    }
    
    onEdit(athlete.id, updateData)

    if (avatarFile && onUploadAvatar && hasPermission('athletes.avatar.upload')) {
      await onUploadAvatar(athlete.id, avatarFile)
    }

    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size={triggerVariant === 'icon' ? 'icon' : 'sm'}
          className={cn(
            'border border-muted-foreground/20 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary',
            triggerVariant === 'default' ? 'rounded-full px-4' : 'rounded-full',
            triggerClassName
          )}
        >
          <PencilSimple className={triggerVariant === 'icon' ? 'h-4 w-4' : 'h-4 w-4 mr-2'} />
          {triggerVariant === 'icon' ? <span className="sr-only">Editează</span> : 'Editează'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editează Sportiv</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <PermissionGate perm="athletes.avatar.upload">
            <AvatarUploadControl
              id={`edit-athlete-avatar-${athlete.id}`}
              label="Poză (opțional)"
              value={avatarSrc}
              onChange={handleAvatarChange}
              description="Reajustează încadrerea astfel încât fața să fie clar vizibilă."
              fallbackId={athlete.id}
            />
          </PermissionGate>
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
            <Label htmlFor="edit-dateOfBirth">Data nașterii (zi / lună / an)</Label>
            <DateSelector
              id="edit-dateOfBirth"
              value={dateOfBirth}
              onChange={setDateOfBirth}
              minYear={currentYear - 18}
              maxYear={currentYear - 4}
            />
          </div>
          <div className="space-y-2">
            <Label>Vârstă (calculată automat)</Label>
            <Input
              value={`${calculatedAge} ani`}
              disabled
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label>Categorie (calculată automat)</Label>
            <Input
              value={calculatedCategory}
              disabled
              className="bg-muted"
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
          <div className="grid gap-4 md:grid-cols-2">
            {coaches && coaches.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="edit-coachId">Antrenor (opțional)</Label>
                <Select value={coachId || 'none'} onValueChange={(val) => setCoachId(val === 'none' ? '' : val)}>
                  <SelectTrigger id="edit-coachId">
                    <SelectValue placeholder="Selectează antrenorul" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Fără antrenor</SelectItem>
                    {coaches.map((coach) => (
                      <SelectItem key={coach.id} value={coach.id}>
                        {coach.firstName} {coach.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className={`space-y-2 ${!(coaches && coaches.length > 0) ? 'md:col-span-2' : ''}`}>
              <Label htmlFor="edit-parentId">Părinte (opțional)</Label>
              <Select value={parentId || 'none'} onValueChange={(val) => setParentId(val === 'none' ? '' : val)}>
                <SelectTrigger id="edit-parentId">
                  <SelectValue placeholder="Selectează părintele" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Fără părinte</SelectItem>
                  {parents.map((parent) => (
                    <SelectItem key={parent.id} value={parent.id}>
                      {parent.firstName} {parent.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-notes">Rezultate excepționale (opțional)</Label>
            <Textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalii utile despre sportiv (ex: preferințe, obiective, accidentări)"
              rows={3}
            />
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
