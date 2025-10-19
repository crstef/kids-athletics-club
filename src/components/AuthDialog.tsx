import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'
import type { User, UserRole } from '@/lib/types'

interface AuthDialogProps {
  open: boolean
  onClose: () => void
  onLogin: (user: User) => void
}

export function AuthDialog({ open, onClose, onLogin }: AuthDialogProps) {
  const [users, setUsers] = useKV<User[]>('users', [])
  
  const [loginEmail, setLoginEmail] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupFirstName, setSignupFirstName] = useState('')
  const [signupLastName, setSignupLastName] = useState('')
  const [signupRole, setSignupRole] = useState<UserRole>('parent')
  const [signupSpecialization, setSignupSpecialization] = useState('')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!loginEmail.trim()) {
      toast.error('Introdu adresa de email')
      return
    }

    const user = (users || []).find(u => u.email.toLowerCase() === loginEmail.toLowerCase().trim())
    
    if (user) {
      onLogin(user)
      toast.success(`Bine ai revenit, ${user.firstName}!`)
      onClose()
      resetForms()
    } else {
      toast.error('Cont inexistent. Înregistrează-te mai întâi.')
    }
  }

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!signupEmail.trim() || !signupFirstName.trim() || !signupLastName.trim()) {
      toast.error('Completează toate câmpurile obligatorii')
      return
    }

    const emailExists = (users || []).some(u => u.email.toLowerCase() === signupEmail.toLowerCase().trim())
    
    if (emailExists) {
      toast.error('Emailul este deja înregistrat')
      return
    }

    const newUser: User = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      email: signupEmail.trim(),
      firstName: signupFirstName.trim(),
      lastName: signupLastName.trim(),
      role: signupRole,
      createdAt: new Date().toISOString()
    }

    if (signupRole === 'coach' && signupSpecialization.trim()) {
      (newUser as any).specialization = signupSpecialization.trim()
    }

    setUsers((current) => [...(current || []), newUser])
    onLogin(newUser)
    toast.success(`Cont creat cu succes! Bine ai venit, ${newUser.firstName}!`)
    onClose()
    resetForms()
  }

  const resetForms = () => {
    setLoginEmail('')
    setSignupEmail('')
    setSignupFirstName('')
    setSignupLastName('')
    setSignupRole('parent')
    setSignupSpecialization('')
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Autentificare</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="login" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Autentificare</TabsTrigger>
            <TabsTrigger value="signup">Înregistrare</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="exemplu@email.ro"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Autentificare
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="exemplu@email.ro"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-firstName">Prenume</Label>
                  <Input
                    id="signup-firstName"
                    value={signupFirstName}
                    onChange={(e) => setSignupFirstName(e.target.value)}
                    placeholder="Ion"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-lastName">Nume</Label>
                  <Input
                    id="signup-lastName"
                    value={signupLastName}
                    onChange={(e) => setSignupLastName(e.target.value)}
                    placeholder="Popescu"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-role">Rol</Label>
                <Select value={signupRole} onValueChange={(v) => setSignupRole(v as UserRole)}>
                  <SelectTrigger id="signup-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent">Părinte</SelectItem>
                    <SelectItem value="coach">Antrenor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {signupRole === 'coach' && (
                <div className="space-y-2">
                  <Label htmlFor="signup-specialization">Specializare (opțional)</Label>
                  <Input
                    id="signup-specialization"
                    value={signupSpecialization}
                    onChange={(e) => setSignupSpecialization(e.target.value)}
                    placeholder="ex: Sprint, Sărituri, etc."
                  />
                </div>
              )}
              <Button type="submit" className="w-full">
                Înregistrare
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
