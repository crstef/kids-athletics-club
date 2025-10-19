import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Eye, EyeSlash } from '@phosphor-icons/react'
import { hashPassword } from '@/lib/crypto'
import { toast } from 'sonner'
import type { Coach, CoachProbe } from '@/lib/types'

interface AddCoachDialogProps {
  probes: CoachProbe[]
  onAdd: (coach: Omit<Coach, 'id' | 'createdAt'>) => void
}

export function AddCoachDialog({ probes, onAdd }: AddCoachDialogProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [probeId, setProbeId] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  const activeProbes = probes.filter(p => p.isActive)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim() || !password || !firstName.trim() || !lastName.trim()) {
      toast.error('Completează toate câmpurile obligatorii')
      return
    }

    if (password.length < 6) {
      toast.error('Parola trebuie să aibă minim 6 caractere')
      return
    }

    const hashedPassword = await hashPassword(password)

    onAdd({
      email: email.trim(),
      password: hashedPassword,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role: 'coach',
      probeId: probeId || undefined,
      isActive: true,
      needsApproval: false
    })

    setEmail('')
    setPassword('')
    setFirstName('')
    setLastName('')
    setProbeId('')
    setShowPassword(false)
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
            <Label htmlFor="coach-password">Parolă</Label>
            <div className="relative">
              <Input
                id="coach-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minim 6 caractere"
                required
                minLength={6}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlash size={18} className="text-muted-foreground" />
                ) : (
                  <Eye size={18} className="text-muted-foreground" />
                )}
              </Button>
            </div>
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
            <Label htmlFor="coach-probe">Probă (opțional)</Label>
            <Select value={probeId} onValueChange={setProbeId}>
              <SelectTrigger id="coach-probe">
                <SelectValue placeholder="Selectează proba" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Fără probă</SelectItem>
                {activeProbes.map((probe) => (
                  <SelectItem key={probe.id} value={probe.id}>
                    {probe.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
