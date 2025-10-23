import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
// removed unused Select imports
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Eye, EyeSlash } from '@phosphor-icons/react'
import { hashPassword } from '@/lib/crypto'
import { toast } from 'sonner'
import type { Coach } from '@/lib/types'

interface AddCoachDialogProps {
  onAdd: (coach: Omit<Coach, 'id' | 'createdAt'>, requiresApproval: boolean) => void
}

export function AddCoachDialog({ onAdd }: AddCoachDialogProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [requiresApproval, setRequiresApproval] = useState(false)

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
      isActive: !requiresApproval,
      needsApproval: requiresApproval
    }, requiresApproval)

    setEmail('')
    setPassword('')
    setFirstName('')
    setLastName('')
    setShowPassword(false)
    setRequiresApproval(false)
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
          <div className="flex items-center space-x-2 py-2">
            <Checkbox
              id="coach-approval"
              checked={requiresApproval}
              onCheckedChange={(checked) => setRequiresApproval(checked as boolean)}
            />
            <label
              htmlFor="coach-approval"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Contul necesită aprobare
            </label>
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
